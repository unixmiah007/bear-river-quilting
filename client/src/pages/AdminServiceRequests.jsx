import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api.js';
import PageLoading from '../components/PageLoading.jsx';
import ProductImage from '../components/ProductImage.jsx';

const emptyServiceForm = {
  name: '',
  slug: '',
  description: '',
  hourly_rate: '',
  sort_order: '0',
  is_published: true,
};

const emptyPaletteForm = {
  title: '',
  price: '',
  sort_order: '0',
  is_published: true,
};

const REQUEST_PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 30, 'all'];

function formatPrice(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

function formatWhen(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function quiltSourceLabel(value) {
  if (value === 'send_yours') return 'Send us your quilt(s)';
  if (value === 'use_ours') return 'Use our quilt(s)';
  return '—';
}

function displayValue(value) {
  const s = value == null ? '' : String(value).trim();
  return s || '—';
}

function acknowledgedLabel(value) {
  return String(value || 'N').toUpperCase() === 'Y' ? 'Y' : 'N';
}

function statusLabel(status) {
  const labels = {
    pending_payment: 'Pending payment',
    deposit_paid: 'Deposit paid',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] ?? displayValue(status);
}

function formatAddressBlock(parts) {
  const lines = parts.filter((p) => p != null && String(p).trim() !== '');
  return lines.length ? lines.join('\n') : '—';
}

function serviceImageUrl(servicesCatalog, serviceId) {
  const svc = servicesCatalog.find((s) => Number(s.id) === Number(serviceId));
  const url = svc?.image_url;
  return url != null && String(url).trim() !== '' ? String(url).trim() : null;
}

function requestSearchHaystack(req, servicesCatalog) {
  const enrichedServices = (req.services ?? [])
    .map((s) => {
      const full = servicesCatalog.find((c) => Number(c.id) === Number(s.id));
      return [s.name, s.hourly_rate != null ? String(s.hourly_rate) : '', full?.slug, full?.description]
        .filter(Boolean)
        .join(' ');
    })
    .join(' ');

  const parts = [
    req.request_number,
    req.customer_name,
    req.customer_email,
    req.customer_phone,
    enrichedServices,
    quiltSourceLabel(req.quilt_source),
    req.blanket_palette?.title,
    req.blanket_palette?.price != null ? String(req.blanket_palette.price) : '',
    req.notes,
    statusLabel(req.status),
    req.status,
    acknowledgedLabel(req.acknowledged),
    formatPrice(req.deposit_amount),
    formatPrice(req.final_payment_amount),
    formatWhen(req.created_at),
    formatWhen(req.updated_at),
    formatWhen(req.deposit_paid_at),
    req.shipping_address1,
    req.shipping_address2,
    req.shipping_city,
    req.shipping_state,
    req.shipping_postal_code,
    req.shipping_country,
    req.billing_name,
    req.billing_address1,
    req.billing_address2,
    req.billing_city,
    req.billing_state,
    req.billing_postal_code,
    req.billing_country,
    req.stripe_checkout_session_id,
    req.stripe_payment_intent_id,
  ];

  return parts
    .filter((v) => v != null && String(v).trim() !== '' && String(v) !== '—')
    .join(' ')
    .toLowerCase();
}

function requestMatchesSearch(req, query, servicesCatalog) {
  if (!query) return true;
  return requestSearchHaystack(req, servicesCatalog).includes(query.toLowerCase());
}

function LongArmRequestImages({ req, servicesCatalog }) {
  const items = [];
  for (const svc of req.services ?? []) {
    const url = serviceImageUrl(servicesCatalog, svc.id);
    if (url) {
      items.push({ key: `svc-${svc.id}`, label: svc.name, url });
    }
  }
  if (req.blanket_palette?.image_url) {
    const url = String(req.blanket_palette.image_url).trim();
    if (url) {
      items.push({
        key: `palette-${req.blanket_palette.id}`,
        label: req.blanket_palette.title || 'Base quilt',
        url,
      });
    }
  }

  if (!items.length) {
    return (
      <p className="muted admin-long-arm-detail-dialog__images-empty">
        No images on file for this request.
      </p>
    );
  }

  return (
    <div className="admin-long-arm-detail-dialog__images">
      {items.map((item) => (
        <figure key={item.key} className="admin-long-arm-detail-dialog__image-card">
          <a href={item.url} target="_blank" rel="noreferrer" title={`Open ${item.label} in a new tab`}>
            <img src={item.url} alt="" />
          </a>
          <figcaption>{item.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function LongArmRequestDetailDialog({
  req,
  servicesCatalog,
  ackBusy,
  onClose,
  onToggleAck,
  onOpenFinalPayment,
}) {
  if (!req) return null;

  const ack = acknowledgedLabel(req.acknowledged);
  const shipping = formatAddressBlock([
    req.shipping_address1,
    req.shipping_address2,
    [req.shipping_city, req.shipping_state, req.shipping_postal_code].filter(Boolean).join(', '),
    req.shipping_country,
  ]);
  const billing = formatAddressBlock([
    req.billing_name,
    req.billing_address1,
    req.billing_address2,
    [req.billing_city, req.billing_state, req.billing_postal_code].filter(Boolean).join(', '),
    req.billing_country,
  ]);

  return (
    <div className="confirm-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="confirm-dialog admin-customize-detail-dialog admin-long-arm-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="long-arm-request-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="long-arm-request-detail-title" className="confirm-dialog__title">
          {req.request_number}
        </h2>
        <p className="muted admin-customize-detail-dialog__meta">
          Submitted {formatWhen(req.created_at)}
          {req.updated_at && req.updated_at !== req.created_at
            ? ` · Updated ${formatWhen(req.updated_at)}`
            : ''}
        </p>

        <dl className="admin-customize-detail-dialog__dl">
          <div>
            <dt>Status</dt>
            <dd>{statusLabel(req.status)}</dd>
          </div>
          <div>
            <dt>Acknowledged</dt>
            <dd>
              <span className={`badge ${ack === 'Y' ? 'badge-on' : 'badge-off'}`}>{ack}</span>
            </dd>
          </div>
          <div>
            <dt>Service</dt>
            <dd>
              {(req.services ?? []).length
                ? (req.services ?? []).map((s) => (
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
            <dd>{quiltSourceLabel(req.quilt_source)}</dd>
          </div>
          <div>
            <dt>Base quilt</dt>
            <dd>
              {req.blanket_palette ? (
                <>
                  {req.blanket_palette.title}
                  <br />
                  <span className="muted">{formatPrice(req.blanket_palette.price)}</span>
                </>
              ) : req.quilt_source === 'use_ours' ? (
                <span className="muted">Not recorded</span>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd className="admin-customize-detail-dialog__notes">{req.notes ? req.notes : '—'}</dd>
          </div>
          <div>
            <dt>Deposit</dt>
            <dd>
              {req.deposit_paid_at ? (
                <>
                  {formatPrice(req.deposit_amount)} — paid {formatWhen(req.deposit_paid_at)}
                </>
              ) : (
                <span className="badge badge-off">Unpaid</span>
              )}
            </dd>
          </div>
          {req.final_payment_amount != null ? (
            <div>
              <dt>Final payment</dt>
              <dd>{formatPrice(req.final_payment_amount)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Customer</dt>
            <dd>
              {displayValue(req.customer_name)}
              <br />
              <a href={`mailto:${req.customer_email}`}>{displayValue(req.customer_email)}</a>
              {req.customer_phone ? (
                <>
                  <br />
                  <a href={`tel:${req.customer_phone}`}>{req.customer_phone}</a>
                </>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd className="admin-customize-detail-dialog__notes">{shipping}</dd>
          </div>
          <div>
            <dt>Billing</dt>
            <dd className="admin-customize-detail-dialog__notes">{billing}</dd>
          </div>
          {req.stripe_checkout_session_id ? (
            <div>
              <dt>Stripe checkout session</dt>
              <dd className="admin-customize-detail-dialog__mono">{req.stripe_checkout_session_id}</dd>
            </div>
          ) : null}
          {req.stripe_payment_intent_id ? (
            <div>
              <dt>Stripe payment intent</dt>
              <dd className="admin-customize-detail-dialog__mono">{req.stripe_payment_intent_id}</dd>
            </div>
          ) : null}
        </dl>

        <section className="admin-long-arm-detail-dialog__images-section">
          <h3 className="admin-long-arm-detail-dialog__images-heading">Images</h3>
          <LongArmRequestImages req={req} servicesCatalog={servicesCatalog} />
        </section>

        <div className="confirm-dialog__actions admin-customize-detail-dialog__actions">
          <button
            type="button"
            className="btn"
            disabled={ackBusy}
            onClick={() => onToggleAck(req, ack !== 'Y')}
          >
            {ackBusy ? 'Saving…' : ack === 'Y' ? 'Mark not acknowledged' : 'Mark acknowledged'}
          </button>
          {req.deposit_paid_at ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onOpenFinalPayment(req);
                onClose();
              }}
            >
              Final payment
            </button>
          ) : null}
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminServiceRequests() {
  const [tab, setTab] = useState('services');
  const [services, setServices] = useState([]);
  const [palettes, setPalettes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [paletteForm, setPaletteForm] = useState(emptyPaletteForm);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingPaletteId, setEditingPaletteId] = useState(null);
  const [imageUploading, setImageUploading] = useState(null);
  const [paletteImageUploading, setPaletteImageUploading] = useState(null);
  const [finalPaymentRow, setFinalPaymentRow] = useState(null);
  const [finalAmount, setFinalAmount] = useState('');
  const [finalNote, setFinalNote] = useState('');
  const [finalBusy, setFinalBusy] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [requestSearch, setRequestSearch] = useState('');
  const [detailRequest, setDetailRequest] = useState(null);
  const [ackSavingId, setAckSavingId] = useState(null);
  const [requestPageSize, setRequestPageSize] = useState(5);
  const [requestPage, setRequestPage] = useState(1);

  const filteredRequests = useMemo(() => {
    const q = requestSearch.trim();
    if (!q) return requests;
    return requests.filter((req) => requestMatchesSearch(req, q, services));
  }, [requests, requestSearch, services]);

  const requestTotalPages = useMemo(() => {
    if (requestPageSize === 'all' || filteredRequests.length === 0) return 1;
    return Math.max(1, Math.ceil(filteredRequests.length / requestPageSize));
  }, [filteredRequests.length, requestPageSize]);

  const paginatedRequests = useMemo(() => {
    if (filteredRequests.length === 0) return [];
    if (requestPageSize === 'all') return filteredRequests;
    const start = (requestPage - 1) * requestPageSize;
    return filteredRequests.slice(start, start + requestPageSize);
  }, [filteredRequests, requestPage, requestPageSize]);

  const requestListRange = useMemo(() => {
    if (filteredRequests.length === 0) return { start: 0, end: 0 };
    if (requestPageSize === 'all') return { start: 1, end: filteredRequests.length };
    const start = (requestPage - 1) * requestPageSize + 1;
    const end = Math.min(requestPage * requestPageSize, filteredRequests.length);
    return { start, end };
  }, [filteredRequests.length, requestPage, requestPageSize]);

  useEffect(() => {
    setRequestPage(1);
  }, [requestPageSize, requestSearch]);

  useEffect(() => {
    if (requestPage > requestTotalPages) setRequestPage(requestTotalPages);
  }, [requestPage, requestTotalPages]);

  const detailFromList = useMemo(() => {
    if (!detailRequest) return null;
    return requests.find((r) => r.id === detailRequest.id) ?? detailRequest;
  }, [requests, detailRequest]);

  const refreshServices = useCallback(async () => {
    const data = await adminApi.longArmServices();
    setServices(Array.isArray(data) ? data : []);
  }, []);

  const refreshPalettes = useCallback(async () => {
    const data = await adminApi.longArmBlanketPalettes();
    setPalettes(Array.isArray(data) ? data : []);
  }, []);

  const refreshRequests = useCallback(async () => {
    const data = await adminApi.longArmRequests();
    setRequests(Array.isArray(data) ? data : []);
  }, []);

  const refreshAll = useCallback(async () => {
    setError(null);
    await Promise.all([refreshServices(), refreshPalettes(), refreshRequests()]);
  }, [refreshServices, refreshPalettes, refreshRequests]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshAll();
      } catch (e) {
        if (!cancelled) setError(e.body?.error || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshAll]);

  async function onCreateService(e) {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.createLongArmService({
        ...serviceForm,
        hourly_rate: serviceForm.hourly_rate === '' ? null : Number(serviceForm.hourly_rate),
        sort_order: Number(serviceForm.sort_order) || 0,
      });
      setServiceForm(emptyServiceForm);
      await refreshServices();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  function startEditService(svc) {
    setEditingServiceId(svc.id);
    setServiceForm({
      name: svc.name,
      slug: svc.slug,
      description: svc.description ?? '',
      hourly_rate: svc.hourly_rate != null ? String(svc.hourly_rate) : '',
      sort_order: String(svc.sort_order ?? 0),
      is_published: !!svc.is_published,
    });
  }

  async function onUpdateService(e) {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.updateLongArmService(editingServiceId, {
        ...serviceForm,
        hourly_rate: serviceForm.hourly_rate === '' ? null : Number(serviceForm.hourly_rate),
        sort_order: Number(serviceForm.sort_order) || 0,
      });
      setEditingServiceId(null);
      setServiceForm(emptyServiceForm);
      await refreshServices();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function onDeleteService(id) {
    if (!window.confirm('Delete this service?')) return;
    setError(null);
    try {
      await adminApi.deleteLongArmService(id);
      if (editingServiceId === id) {
        setEditingServiceId(null);
        setServiceForm(emptyServiceForm);
      }
      await refreshServices();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function onTogglePublished(svc) {
    setError(null);
    try {
      await adminApi.setLongArmServiceVisibility(svc.id, !svc.is_published);
      await refreshServices();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function onUploadImage(serviceId, file) {
    if (!file) return;
    setImageUploading(serviceId);
    setError(null);
    try {
      await adminApi.uploadLongArmServiceImage(serviceId, file);
      await refreshServices();
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setImageUploading(null);
    }
  }

  async function onCreatePalette(e) {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.createLongArmBlanketPalette({
        ...paletteForm,
        price: Number(paletteForm.price),
        sort_order: Number(paletteForm.sort_order) || 0,
      });
      setPaletteForm(emptyPaletteForm);
      await refreshPalettes();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  function startEditPalette(item) {
    setEditingPaletteId(item.id);
    setPaletteForm({
      title: item.title,
      price: item.price != null ? String(item.price) : '',
      sort_order: String(item.sort_order ?? 0),
      is_published: !!item.is_published,
    });
  }

  async function onUpdatePalette(e) {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.updateLongArmBlanketPalette(editingPaletteId, {
        ...paletteForm,
        price: Number(paletteForm.price),
        sort_order: Number(paletteForm.sort_order) || 0,
      });
      setEditingPaletteId(null);
      setPaletteForm(emptyPaletteForm);
      await refreshPalettes();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function onDeletePalette(id) {
    if (!window.confirm('Delete this palette item?')) return;
    setError(null);
    try {
      await adminApi.deleteLongArmBlanketPalette(id);
      if (editingPaletteId === id) {
        setEditingPaletteId(null);
        setPaletteForm(emptyPaletteForm);
      }
      await refreshPalettes();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function onTogglePalettePublished(item) {
    setError(null);
    try {
      await adminApi.setLongArmBlanketPaletteVisibility(item.id, !item.is_published);
      await refreshPalettes();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  async function onUploadPaletteImage(paletteId, file) {
    if (!file) return;
    setPaletteImageUploading(paletteId);
    setError(null);
    try {
      await adminApi.uploadLongArmBlanketPaletteImage(paletteId, file);
      await refreshPalettes();
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setPaletteImageUploading(null);
    }
  }

  async function onAcknowledge(req, value) {
    if (!req?.id || ackSavingId != null) return;
    setError(null);
    setAckSavingId(req.id);
    try {
      await adminApi.setLongArmRequestAcknowledged(req.id, value);
      await refreshRequests();
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setAckSavingId(null);
    }
  }

  async function onStatusChange(req, status) {
    setError(null);
    try {
      await adminApi.updateLongArmRequestStatus(req.id, status);
      await refreshRequests();
    } catch (err) {
      setError(err.body?.error || err.message);
    }
  }

  function openFinalPayment(req) {
    setFinalPaymentRow(req);
    setFinalAmount('');
    setFinalNote('');
    setFinalResult(null);
  }

  async function sendFinalPayment(e) {
    e.preventDefault();
    if (!finalPaymentRow) return;
    const amount = Number(finalAmount);
    if (!Number.isFinite(amount) || amount < 0.5) {
      setError('Enter a final payment amount of at least $0.50');
      return;
    }
    setFinalBusy(true);
    setError(null);
    setFinalResult(null);
    try {
      const result = await adminApi.sendLongArmFinalPayment(finalPaymentRow.id, {
        amount,
        adminNote: finalNote,
      });
      setFinalResult(result);
      await refreshRequests();
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setFinalBusy(false);
    }
  }

  if (loading) {
    return <PageLoading active label="Loading service requests…" />;
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Service requests</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Manage long-arm quilting services shown on the public site, review customer requests, and
        send final payment links after work is complete.
      </p>
      {error ? <p className="error">{error}</p> : null}

      <div className="row" style={{ marginBottom: '1.25rem', gap: '0.5rem' }}>
        <button
          type="button"
          className={`btn${tab === 'services' ? ' btn-primary' : ''}`}
          onClick={() => setTab('services')}
        >
          Long-Arm quilting services management
        </button>
        <button
          type="button"
          className={`btn${tab === 'palettes' ? ' btn-primary' : ''}`}
          onClick={() => setTab('palettes')}
        >
          Blanket palette ({palettes.length})
        </button>
        <button
          type="button"
          className={`btn${tab === 'requests' ? ' btn-primary' : ''}`}
          onClick={() => setTab('requests')}
        >
          Customer requests ({requests.length})
        </button>
      </div>

      {tab === 'services' ? (
        <>
          <div className="table-wrap" style={{ marginBottom: '2rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Hourly rate</th>
                  <th>Published</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      No services yet.
                    </td>
                  </tr>
                ) : (
                  services.map((svc) => (
                    <tr key={svc.id}>
                      <td>
                        <a
                          href="/long-arm-quilting"
                          target="_blank"
                          rel="noreferrer"
                          className="admin-service-public-link admin-service-public-link--image"
                          title="View on long-arm quilting page"
                        >
                          {svc.image_url ? (
                            <div className="admin-product-list-thumb">
                              <ProductImage src={svc.image_url} alt="" />
                            </div>
                          ) : (
                            <span className="muted">View page</span>
                          )}
                        </a>
                      </td>
                      <td>
                        <a
                          href="/long-arm-quilting"
                          target="_blank"
                          rel="noreferrer"
                          className="admin-service-public-link admin-service-public-link--name"
                          title="View on long-arm quilting page"
                        >
                          <strong>{svc.name}</strong>
                          {svc.description ? (
                            <div className="muted" style={{ fontSize: '0.85rem', maxWidth: '24rem' }}>
                              {svc.description.slice(0, 120)}
                              {svc.description.length > 120 ? '…' : ''}
                            </div>
                          ) : null}
                        </a>
                      </td>
                      <td>{formatPrice(svc.hourly_rate)}</td>
                      <td>
                        <button type="button" className="btn" onClick={() => onTogglePublished(svc)}>
                          {svc.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="muted">{formatWhen(svc.updated_at)}</td>
                      <td>
                        <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <label className="btn" style={{ cursor: 'pointer' }}>
                            {imageUploading === svc.id ? 'Uploading…' : 'Image'}
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              disabled={imageUploading === svc.id}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = '';
                                onUploadImage(svc.id, f);
                              }}
                            />
                          </label>
                          <button type="button" className="btn" onClick={() => startEditService(svc)}>
                            Edit
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => onDeleteService(svc.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2>{editingServiceId ? 'Edit service' : 'New service'}</h2>
          <form className="form" onSubmit={editingServiceId ? onUpdateService : onCreateService}>
            <div className="field">
              <label htmlFor="svc-name">Name</label>
              <input
                id="svc-name"
                value={serviceForm.name}
                onChange={(e) => setServiceForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="svc-slug">Slug (optional)</label>
              <input
                id="svc-slug"
                value={serviceForm.slug}
                onChange={(e) => setServiceForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="svc-desc">Description</label>
              <textarea
                id="svc-desc"
                rows={3}
                value={serviceForm.description}
                onChange={(e) => setServiceForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="svc-rate">Hourly rate (USD, optional)</label>
              <input
                id="svc-rate"
                type="number"
                min="0"
                step="0.01"
                value={serviceForm.hourly_rate}
                onChange={(e) => setServiceForm((f) => ({ ...f, hourly_rate: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="svc-sort">Sort order</label>
              <input
                id="svc-sort"
                type="number"
                value={serviceForm.sort_order}
                onChange={(e) => setServiceForm((f) => ({ ...f, sort_order: e.target.value }))}
              />
            </div>
            <div className="field row">
              <input
                id="svc-pub"
                type="checkbox"
                checked={serviceForm.is_published}
                onChange={(e) => setServiceForm((f) => ({ ...f, is_published: e.target.checked }))}
              />
              <label htmlFor="svc-pub" style={{ margin: 0, textTransform: 'none', letterSpacing: 'normal' }}>
                Published on website
              </label>
            </div>
            <div className="row">
              {editingServiceId ? (
                <>
                  <button type="submit" className="btn btn-primary">
                    Save changes
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setEditingServiceId(null);
                      setServiceForm(emptyServiceForm);
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button type="submit" className="btn btn-primary">
                  Create service
                </button>
              )}
            </div>
          </form>
        </>
      ) : null}

      {tab === 'palettes' ? (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Manage base quilt options shown when customers choose &ldquo;Use our quilt(s)&rdquo; on the
            long-arm quilting request form.
          </p>
          <div className="table-wrap" style={{ marginBottom: '2rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Base price</th>
                  <th>Published</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {palettes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      No palette items yet.
                    </td>
                  </tr>
                ) : (
                  palettes.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.image_url ? (
                          <div className="admin-product-list-thumb">
                            <ProductImage src={item.image_url} alt="" />
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <strong>{item.title}</strong>
                      </td>
                      <td>{formatPrice(item.price)}</td>
                      <td>
                        <button type="button" className="btn" onClick={() => onTogglePalettePublished(item)}>
                          {item.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="muted">{formatWhen(item.updated_at)}</td>
                      <td>
                        <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <label className="btn" style={{ cursor: 'pointer' }}>
                            {paletteImageUploading === item.id ? 'Uploading…' : 'Image'}
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              disabled={paletteImageUploading === item.id}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = '';
                                onUploadPaletteImage(item.id, f);
                              }}
                            />
                          </label>
                          <button type="button" className="btn" onClick={() => startEditPalette(item)}>
                            Edit
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => onDeletePalette(item.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2>{editingPaletteId ? 'Edit palette item' : 'New palette item'}</h2>
          <form className="form" onSubmit={editingPaletteId ? onUpdatePalette : onCreatePalette}>
            <div className="field">
              <label htmlFor="palette-title">Title</label>
              <input
                id="palette-title"
                value={paletteForm.title}
                onChange={(e) => setPaletteForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="palette-price">Base price (USD)</label>
              <input
                id="palette-price"
                type="number"
                min="0"
                step="0.01"
                value={paletteForm.price}
                onChange={(e) => setPaletteForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="palette-sort">Sort order</label>
              <input
                id="palette-sort"
                type="number"
                value={paletteForm.sort_order}
                onChange={(e) => setPaletteForm((f) => ({ ...f, sort_order: e.target.value }))}
              />
            </div>
            <div className="field row">
              <input
                id="palette-pub"
                type="checkbox"
                checked={paletteForm.is_published}
                onChange={(e) => setPaletteForm((f) => ({ ...f, is_published: e.target.checked }))}
              />
              <label htmlFor="palette-pub" style={{ margin: 0, textTransform: 'none', letterSpacing: 'normal' }}>
                Published on website
              </label>
            </div>
            <div className="row">
              {editingPaletteId ? (
                <>
                  <button type="submit" className="btn btn-primary">
                    Save changes
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setEditingPaletteId(null);
                      setPaletteForm(emptyPaletteForm);
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button type="submit" className="btn btn-primary">
                  Create palette item
                </button>
              )}
            </div>
          </form>
        </>
      ) : null}

      {tab === 'requests' ? (
        <>
          <p className="muted" style={{ marginTop: 0 }}>
            Click a row to view the full request, including service and base quilt images.
          </p>
          <div className="field admin-long-arm-requests-search">
            <label htmlFor="long-arm-request-search">Search requests</label>
            <input
              id="long-arm-request-search"
              type="search"
              placeholder="Request #, customer, service, status, notes, addresses…"
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
              autoComplete="off"
            />
            {requestSearch.trim() ? (
              <p className="muted admin-long-arm-requests-search__hint">
                {filteredRequests.length} of {requests.length} matching
              </p>
            ) : null}
          </div>
          {requests.length > 0 ? (
            <div className="admin-pagination">
              <div className="admin-pagination__size">
                <label htmlFor="long-arm-requests-page-size">Show</label>
                <select
                  id="long-arm-requests-page-size"
                  value={String(requestPageSize)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRequestPageSize(v === 'all' ? 'all' : Number(v));
                  }}
                >
                  {REQUEST_PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={String(n)}>
                      {n === 'all' ? 'All' : n}
                    </option>
                  ))}
                </select>
                <span className="muted">
                  {requestPageSize === 'all'
                    ? `All ${filteredRequests.length} shown`
                    : `Showing ${requestListRange.start}–${requestListRange.end} of ${filteredRequests.length}`}
                </span>
              </div>
              {requestPageSize !== 'all' && requestTotalPages > 1 ? (
                <div className="admin-pagination__nav row">
                  <button
                    type="button"
                    className="btn"
                    disabled={requestPage <= 1}
                    onClick={() => setRequestPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="muted admin-pagination__status">
                    Page {requestPage} of {requestTotalPages}
                  </span>
                  <button
                    type="button"
                    className="btn"
                    disabled={requestPage >= requestTotalPages}
                    onClick={() => setRequestPage((p) => Math.min(requestTotalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="table-wrap admin-service-requests-table">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Customer</th>
                  <th>Services</th>
                  <th>Quilt source</th>
                  <th>Base quilt</th>
                  <th>Deposit</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="muted">
                      No customer requests yet.
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="muted">
                      No requests match your search.
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="admin-long-arm-request-row--clickable"
                      tabIndex={0}
                      aria-label={`${req.request_number}: view details`}
                      onClick={() => setDetailRequest(req)}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        setDetailRequest(req);
                      }}
                    >
                      <td>
                        <strong>{req.request_number}</strong>
                        <div className="muted" style={{ fontSize: '0.85rem' }}>
                          Ack:{' '}
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: '0.1rem 0.35rem', fontSize: '0.8rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAcknowledge(req, req.acknowledged !== 'Y');
                            }}
                          >
                            {ackSavingId === req.id ? '…' : req.acknowledged === 'Y' ? 'Y' : 'N'}
                          </button>
                        </div>
                      </td>
                      <td>
                        {req.customer_name}
                        <div className="muted" style={{ fontSize: '0.85rem' }}>
                          {req.customer_email}
                        </div>
                      </td>
                      <td style={{ maxWidth: '14rem' }}>
                        {(req.services ?? []).map((s) => s.name).join(', ') || '—'}
                      </td>
                      <td>{quiltSourceLabel(req.quilt_source)}</td>
                      <td style={{ maxWidth: '12rem' }}>
                        {req.blanket_palette ? (
                          <>
                            <strong>{req.blanket_palette.title}</strong>
                            <div className="muted" style={{ fontSize: '0.85rem' }}>
                              {formatPrice(req.blanket_palette.price)}
                            </div>
                          </>
                        ) : req.quilt_source === 'use_ours' ? (
                          <span className="muted">Not recorded</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {req.deposit_paid_at ? (
                          <>
                            <span className="badge badge-on">{formatPrice(req.deposit_amount)}</span>
                            <div className="muted" style={{ fontSize: '0.8rem' }}>
                              {formatWhen(req.deposit_paid_at)}
                            </div>
                          </>
                        ) : (
                          <span className="badge badge-off">Unpaid</span>
                        )}
                        {req.final_payment_amount != null ? (
                          <div className="muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            Final: {formatPrice(req.final_payment_amount)}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <select
                          value={req.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onStatusChange(req, e.target.value)}
                          aria-label={`Status for ${req.request_number}`}
                        >
                          <option value="pending_payment">Pending payment</option>
                          <option value="deposit_paid">Deposit paid</option>
                          <option value="in_progress">In progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="muted">{formatWhen(req.created_at)}</td>
                      <td>
                        {req.deposit_paid_at ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openFinalPayment(req);
                            }}
                          >
                            Final payment
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <LongArmRequestDetailDialog
            req={detailFromList}
            servicesCatalog={services}
            ackBusy={detailFromList != null && ackSavingId === detailFromList.id}
            onClose={() => setDetailRequest(null)}
            onToggleAck={onAcknowledge}
            onOpenFinalPayment={openFinalPayment}
          />

          {finalPaymentRow ? (
            <section className="card" style={{ marginTop: '1.5rem' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>
                  Send final payment — {finalPaymentRow.request_number}
                </h2>
                <button type="button" className="btn" onClick={() => setFinalPaymentRow(null)}>
                  Close
                </button>
              </div>
              <p className="muted">
                Customer: {finalPaymentRow.customer_name} ({finalPaymentRow.customer_email})
                <br />
                Deposit received: {formatPrice(finalPaymentRow.deposit_amount)} on{' '}
                {formatWhen(finalPaymentRow.deposit_paid_at)}
              </p>
              <form className="form" onSubmit={sendFinalPayment}>
                <div className="field">
                  <label htmlFor="final-amt">Final payment amount (USD)</label>
                  <input
                    id="final-amt"
                    type="number"
                    min="0.5"
                    step="0.01"
                    value={finalAmount}
                    onChange={(e) => setFinalAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="final-note">Note to customer (optional)</label>
                  <textarea
                    id="final-note"
                    rows={2}
                    value={finalNote}
                    onChange={(e) => setFinalNote(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={finalBusy}>
                  {finalBusy ? 'Sending…' : 'Create payment link & email customer'}
                </button>
              </form>
              {finalResult?.checkoutUrl ? (
                <p className="muted" style={{ marginTop: '1rem', wordBreak: 'break-all' }}>
                  Payment link:{' '}
                  <a href={finalResult.checkoutUrl} target="_blank" rel="noreferrer">
                    {finalResult.checkoutUrl}
                  </a>
                  {finalResult.emailSent ? ' (email sent)' : finalResult.emailError ? ` (email failed: ${finalResult.emailError})` : ''}
                </p>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}
    </>
  );
}
