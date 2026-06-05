import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicApi } from '../api.js';
import OrderTrackingDisplay from '../components/OrderTrackingDisplay.jsx';
import ProductImage from '../components/ProductImage.jsx';
import PageLoading from '../components/PageLoading.jsx';
import { labelForLongArmStatus } from '../lib/orderStatuses.js';

function formatPrice(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

function formatWhen(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatAddressBlock(parts) {
  const lines = parts.filter((p) => p != null && String(p).trim() !== '');
  return lines.length ? lines.join('\n') : '—';
}

function statusHint(status) {
  const v = String(status || '').toLowerCase();
  if (v === 'pending_payment') {
    return 'Your deposit has not been received yet. Complete payment using the checkout link from your request, or contact the studio if you need help.';
  }
  if (v === 'deposit_paid') {
    return 'Your deposit is confirmed. Our team will contact you with next steps for your quilt project.';
  }
  if (v === 'in_progress') {
    return 'Your quilt is being finished on our long-arm machine. We will update you when it ships.';
  }
  if (v === 'completed') {
    return 'Your service request is complete. If tracking is available below, use the carrier link to follow your return shipment.';
  }
  if (v === 'cancelled') {
    return 'This service request was cancelled. Contact the studio if you have questions.';
  }
  return null;
}

function LongArmStatusBadge({ status }) {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_');
  return (
    <span className={`long-arm-track-status long-arm-track-status--${normalized || 'unknown'}`}>
      {labelForLongArmStatus(status)}
    </span>
  );
}

function readTrackDeepLink(searchParams) {
  const qEmail = searchParams.get('email')?.trim();
  const qRequest =
    searchParams.get('requestNumber')?.trim() ||
    searchParams.get('serviceRequest')?.trim() ||
    '';
  const email = qEmail || '';
  const requestNumber = qRequest.toUpperCase().startsWith('LAQ') ? qRequest.toUpperCase() : qRequest;
  return { email, requestNumber, hasDeepLink: Boolean(email && requestNumber) };
}

function LongArmRequestImages({ request }) {
  const items = [];
  for (const svc of request.services ?? []) {
    if (svc.image_url) {
      items.push({ key: `svc-${svc.id}`, label: svc.name, url: svc.image_url });
    }
  }
  if (request.blanket_palette?.image_url) {
    items.push({
      key: `palette-${request.blanket_palette.id}`,
      label: request.blanket_palette.title || 'Base quilt',
      url: request.blanket_palette.image_url,
    });
  }

  if (!items.length) return null;

  return (
    <section className="long-arm-track-detail__images">
      <h3>Images on file</h3>
      <div className="long-arm-track-detail__image-grid">
        {items.map((item) => (
          <figure key={item.key} className="long-arm-track-detail__image-card">
            <a href={item.url} target="_blank" rel="noreferrer" title={`Open ${item.label}`}>
              <ProductImage src={item.url} alt="" />
            </a>
            <figcaption>{item.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function LongArmRequestDetail({ request, list, onBackToList }) {
  const shipping = formatAddressBlock([
    request.shipping_address1,
    request.shipping_address2,
    [request.shipping_city, request.shipping_state, request.shipping_postal_code].filter(Boolean).join(', '),
    request.shipping_country,
  ]);
  const billing = formatAddressBlock([
    request.billing_name,
    request.billing_address1,
    request.billing_address2,
    [request.billing_city, request.billing_state, request.billing_postal_code].filter(Boolean).join(', '),
    request.billing_country,
  ]);
  const hint = statusHint(request.status);

  return (
    <section className="card long-arm-track-detail">
      <div className="row long-arm-track-detail__header">
        <div>
          <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>
            Service request
          </p>
          <h2 style={{ margin: 0 }}>{request.request_number}</h2>
          <p className="muted" style={{ margin: '0.35rem 0 0' }}>
            Submitted {formatWhen(request.created_at)}
          </p>
        </div>
        {list.length > 0 ? (
          <button type="button" className="btn" onClick={onBackToList}>
            Back to list
          </button>
        ) : null}
      </div>

      <div className="long-arm-track-status-panel" role="status" aria-live="polite">
        <p className="long-arm-track-status-panel__label">Current status</p>
        <LongArmStatusBadge status={request.status} />
        {hint ? <p className="long-arm-track-status-panel__hint">{hint}</p> : null}
      </div>

      {request.tracking_number ? (
        <section className="long-arm-track-detail__tracking">
          <h3>Return shipment tracking</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Click the tracking number to open your carrier&apos;s website.
          </p>
          <OrderTrackingDisplay
            carrier={request.tracking_carrier}
            trackingNumber={request.tracking_number}
            notifiedAt={request.tracking_notified_at}
          />
        </section>
      ) : null}

      <dl className="long-arm-track-detail__dl">
        <div>
          <dt>Service</dt>
          <dd>
            {(request.services ?? []).length
              ? (request.services ?? []).map((s) => (
                  <span key={s.id}>
                    {s.name}
                    {s.hourly_rate != null ? (
                      <span className="muted"> · {formatPrice(s.hourly_rate)}/hr</span>
                    ) : null}
                  </span>
                ))
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Quilt source</dt>
          <dd>{request.quilt_source_label || '—'}</dd>
        </div>
        <div>
          <dt>Base quilt</dt>
          <dd>
            {request.blanket_palette ? (
              <>
                {request.blanket_palette.title}
                <br />
                <span className="muted">{formatPrice(request.blanket_palette.price)}</span>
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd className="long-arm-track-detail__notes">{request.notes || '—'}</dd>
        </div>
        <div>
          <dt>Deposit</dt>
          <dd>
            {request.deposit_paid_at ? (
              <>
                {formatPrice(request.deposit_amount)} — paid {formatWhen(request.deposit_paid_at)}
              </>
            ) : (
              <span className="muted">Not yet paid</span>
            )}
          </dd>
        </div>
        {request.final_payment_amount != null ? (
          <div>
            <dt>Final payment</dt>
            <dd>{formatPrice(request.final_payment_amount)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Contact</dt>
          <dd>
            {request.customer_name}
            <br />
            {request.customer_email}
            {request.customer_phone ? (
              <>
                <br />
                {request.customer_phone}
              </>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Shipping address</dt>
          <dd className="long-arm-track-detail__notes">{shipping}</dd>
        </div>
        <div>
          <dt>Billing address</dt>
          <dd className="long-arm-track-detail__notes">{billing}</dd>
        </div>
      </dl>

      <LongArmRequestImages request={request} />
    </section>
  );
}

export default function TrackLongArmServiceOrder() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [requestNumber, setRequestNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const { email: linkEmail, requestNumber: ref, hasDeepLink } = readTrackDeepLink(searchParams);
    if (!hasDeepLink) return undefined;

    setEmail(linkEmail);
    setRequestNumber(ref);

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setDetail(null);
      setList([]);
      setMode(null);
      try {
        const data = await publicApi.customerLongArmLookup({
          email: linkEmail,
          requestNumber: ref,
        });
        if (cancelled) return;
        setMode('detail');
        setDetail(data.request);
      } catch (err) {
        if (!cancelled) {
          setError(
            [err.body?.error, err.body?.hint].filter(Boolean).join(' — ') ||
              err.message ||
              'Request failed.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setDetail(null);
    setMode(null);
    setList([]);
    setLoading(true);
    try {
      const body = { email: email.trim() };
      const ref = requestNumber.trim();
      if (ref) body.requestNumber = ref.toUpperCase();
      const data = await publicApi.customerLongArmLookup(body);
      setMode(data.mode);
      if (data.mode === 'list') {
        setList(Array.isArray(data.requests) ? data.requests : []);
      } else {
        setDetail(data.request);
      }
    } catch (err) {
      setError(
        [err.body?.error, err.body?.hint].filter(Boolean).join(' — ') ||
          err.message ||
          'Request failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function openRequest(ref) {
    setRequestNumber(ref);
    setError(null);
    setLoading(true);
    try {
      const data = await publicApi.customerLongArmLookup({
        email: email.trim(),
        requestNumber: ref,
      });
      setMode('detail');
      setDetail(data.request);
    } catch (err) {
      setError(
        [err.body?.error, err.body?.hint].filter(Boolean).join(' — ') ||
          err.message ||
          'Request failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  function backToList() {
    setDetail(null);
    setRequestNumber('');
    setMode('list');
  }

  return (
    <article className="long-arm-page long-arm-track-page">
      <header className="long-arm-track-page__intro">
        <p className="eyebrow">Long-arm services</p>
        <h1>Track service order</h1>
        <p className="page-body">
          Enter the email from your service request and the reference number from your deposit or
          final payment confirmation (starts with <strong>LAQ</strong>).
        </p>
        <p className="muted">
          <Link to="/long-arm-quilting">Back to long-arm services</Link>
        </p>
      </header>

      <section className="card">
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="long-arm-track-email">Email on your request</label>
            <input
              id="long-arm-track-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="long-arm-track-request">Request number</label>
            <input
              id="long-arm-track-request"
              value={requestNumber}
              onChange={(e) => setRequestNumber(e.target.value)}
              placeholder="e.g. LAQ1A2B3C4D567"
            />
            <p className="muted field-hint">
              Leave blank to list all long-arm requests for this email.
            </p>
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
              ? 'Loading…'
              : requestNumber.trim()
                ? 'View this request'
                : 'Show all my service requests'}
          </button>
        </form>
      </section>

      {loading && !detail && mode !== 'list' ? (
        <PageLoading active label="Looking up your service request…" />
      ) : null}

      {mode === 'list' && !detail ? (
        <section className="card" style={{ marginTop: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Your long-arm service requests</h2>
          {list.length === 0 ? (
            <p className="muted">No service requests found for that email yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Request #</th>
                    <th>Status</th>
                    <th>Service</th>
                    <th>Deposit</th>
                    <th>Submitted</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.request_number}>
                      <td>
                        <strong>{r.request_number}</strong>
                      </td>
                      <td>
                        <LongArmStatusBadge status={r.status} />
                      </td>
                      <td>{(r.services ?? [])[0]?.name ?? '—'}</td>
                      <td>
                        {r.deposit_paid_at ? formatPrice(r.deposit_amount) : <span className="muted">Unpaid</span>}
                      </td>
                      <td className="muted">{formatWhen(r.created_at)}</td>
                      <td>
                        <button type="button" className="btn" onClick={() => openRequest(r.request_number)}>
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {mode === 'detail' && detail ? (
        <LongArmRequestDetail request={detail} list={list} onBackToList={backToList} />
      ) : null}
    </article>
  );
}
