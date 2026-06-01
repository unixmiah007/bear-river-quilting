import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../api.js';
import { formatProductSizeLabel } from '../lib/productSizes.js';
import { labelForCustomQuiltStatus } from '../lib/orderStatuses.js';
import OrderTrackingDisplay from './OrderTrackingDisplay.jsx';

function formatPrice(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

function statusHint(status) {
  const v = String(status || '').toLowerCase();
  if (v === 'pending_payment') {
    return 'Complete payment using the link we emailed you, or contact the studio if you need a new link.';
  }
  if (v === 'paid' || v === 'processing') {
    return 'Payment received. Our designer will follow up within 2–3 business days with next steps.';
  }
  if (v === 'submitted' || v === 'new') {
    return 'Your request was received. We will contact you about payment and next steps.';
  }
  if (v === 'preparing_for_shipment' || v === 'fulfilled') {
    return 'Your quilt is being prepared for shipment.';
  }
  if (v === 'shipped') {
    return 'Your quilt has shipped. Use the tracking details below when available.';
  }
  if (v === 'complete') {
    return 'Your custom quilt request is complete. Thank you for choosing Bear River Quilting.';
  }
  if (v === 'on_hold') {
    return 'Your request is on hold. Contact the studio if you have questions.';
  }
  return null;
}

function readCustomDeepLink(searchParams) {
  const qEmail = searchParams.get('email')?.trim();
  const qRequest =
    searchParams.get('customRequest')?.trim() ||
    searchParams.get('requestNumber')?.trim() ||
    '';
  const email = qEmail || '';
  const requestNumber = qRequest.toUpperCase().startsWith('CQ') ? qRequest.toUpperCase() : qRequest;
  return { email, requestNumber, hasDeepLink: Boolean(email && requestNumber) };
}

export default function AccountCustomQuiltLookup({ email, onEmailChange, searchParams }) {
  const [customRequestNumber, setCustomRequestNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const { email: linkEmail, requestNumber, hasDeepLink } = readCustomDeepLink(searchParams);
    if (!hasDeepLink) return undefined;

    onEmailChange(linkEmail);
    setCustomRequestNumber(requestNumber);

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setDetail(null);
      setList([]);
      setMode(null);
      try {
        const data = await publicApi.customerCustomQuiltLookup({
          email: linkEmail,
          requestNumber,
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
  }, [searchParams, onEmailChange]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setDetail(null);
    setMode(null);
    setList([]);
    setLoading(true);
    try {
      const body = { email: email.trim() };
      const ref = customRequestNumber.trim();
      if (ref) body.requestNumber = ref.toUpperCase();
      const data = await publicApi.customerCustomQuiltLookup(body);
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

  async function openRequest(requestNumber) {
    setCustomRequestNumber(requestNumber);
    setError(null);
    setLoading(true);
    try {
      const data = await publicApi.customerCustomQuiltLookup({
        email: email.trim(),
        requestNumber,
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
    setCustomRequestNumber('');
    setMode('list');
  }

  const request = detail;

  return (
    <>
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Look up custom quilt requests</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Custom quilts ordered through our{' '}
          <Link to="/customize">customize studio</Link> use a request number starting with{' '}
          <strong>CQ</strong> (from your confirmation email).
        </p>
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="acct-custom-email">Email on your request</label>
            <input
              id="acct-custom-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="acct-custom-request">Request number (optional)</label>
            <input
              id="acct-custom-request"
              value={customRequestNumber}
              onChange={(e) => setCustomRequestNumber(e.target.value)}
              placeholder="e.g. CQ1A2B3C4D567"
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
              ? 'Loading…'
              : customRequestNumber.trim()
                ? 'View this request'
                : 'Show all my custom requests'}
          </button>
        </form>
      </section>

      {mode === 'list' && !detail ? (
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Your custom quilt requests</h2>
          {list.length === 0 ? (
            <p className="muted">No custom quilt requests found for that email yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Request #</th>
                    <th>Status</th>
                    <th>Design</th>
                    <th>Est. price</th>
                    <th>Submitted</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.request_number}</strong>
                      </td>
                      <td>{labelForCustomQuiltStatus(r.status)}</td>
                      <td>{r.design_name}</td>
                      <td>{formatPrice(r.estimated_price)}</td>
                      <td className="muted">{new Date(r.created_at).toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => openRequest(r.request_number)}
                        >
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

      {mode === 'detail' && request ? (
        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Request {request.request_number}</h2>
            {list.length > 0 ? (
              <button type="button" className="btn" onClick={backToList}>
                Back to list
              </button>
            ) : null}
          </div>
          <p className="muted" style={{ marginTop: '0.35rem' }}>
            <strong>Status:</strong> {labelForCustomQuiltStatus(request.status)} · Submitted{' '}
            {new Date(request.created_at).toLocaleString()}
          </p>
          {statusHint(request.status) ? (
            <p className="page-body" style={{ marginTop: '0.5rem' }}>
              {statusHint(request.status)}
            </p>
          ) : null}

          {request.tracking_number ? (
            <>
              <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Shipment tracking</h3>
              <OrderTrackingDisplay
                carrier={request.tracking_carrier}
                trackingNumber={request.tracking_number}
                notifiedAt={request.tracking_notified_at}
              />
            </>
          ) : null}

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Design</h3>
          <p className="muted" style={{ margin: 0 }}>
            {request.design_name}
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Your selections</h3>
          <ul className="account-custom-request__selections muted">
            <li>
              <strong>Size:</strong>{' '}
              {request.displaySize ||
                formatProductSizeLabel(request.product_size) ||
                request.product_size ||
                '—'}
            </li>
            <li>
              <strong>Color palette:</strong> {request.displayColor || request.color_palette || '—'}
            </li>
            <li>
              <strong>Batting:</strong> {request.displayBatting || request.batting || '—'}
            </li>
            {request.quilt_title ? (
              <li>
                <strong>Working title:</strong> {request.quilt_title}
              </li>
            ) : null}
          </ul>

          {request.notes ? (
            <>
              <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Notes for designer</h3>
              <p className="muted account-custom-request__notes">{request.notes}</p>
            </>
          ) : null}

          {request.own_design_image_url ? (
            <>
              <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Your design reference</h3>
              <img
                className="account-custom-request__reference-img"
                src={request.own_design_image_url}
                alt="Your uploaded design reference"
              />
            </>
          ) : null}

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Estimated price</h3>
          <p className="muted" style={{ margin: 0 }}>
            {formatPrice(request.estimated_price)}
            {(request.status === 'paid' || request.status === 'complete') ? ' (paid)' : ''}
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Contact</h3>
          <p className="muted" style={{ margin: 0 }}>
            {request.customer_name} · {request.customer_email}
            {request.customer_phone ? ` · ${request.customer_phone}` : ''}
          </p>
        </section>
      ) : null}
    </>
  );
}
