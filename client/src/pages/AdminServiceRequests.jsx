import { useCallback, useEffect, useState } from 'react';
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

export default function AdminServiceRequests() {
  const [tab, setTab] = useState('services');
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [imageUploading, setImageUploading] = useState(null);
  const [finalPaymentRow, setFinalPaymentRow] = useState(null);
  const [finalAmount, setFinalAmount] = useState('');
  const [finalNote, setFinalNote] = useState('');
  const [finalBusy, setFinalBusy] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  const refreshServices = useCallback(async () => {
    const data = await adminApi.longArmServices();
    setServices(Array.isArray(data) ? data : []);
  }, []);

  const refreshRequests = useCallback(async () => {
    const data = await adminApi.longArmRequests();
    setRequests(Array.isArray(data) ? data : []);
  }, []);

  const refreshAll = useCallback(async () => {
    setError(null);
    await Promise.all([refreshServices(), refreshRequests()]);
  }, [refreshServices, refreshRequests]);

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

  async function onAcknowledge(req, value) {
    setError(null);
    try {
      await adminApi.setLongArmRequestAcknowledged(req.id, value);
      await refreshRequests();
    } catch (err) {
      setError(err.body?.error || err.message);
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
          Services
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
                        {svc.image_url ? (
                          <div className="admin-product-list-thumb">
                            <ProductImage src={svc.image_url} alt="" />
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <strong>{svc.name}</strong>
                        {svc.description ? (
                          <div className="muted" style={{ fontSize: '0.85rem', maxWidth: '24rem' }}>
                            {svc.description.slice(0, 120)}
                            {svc.description.length > 120 ? '…' : ''}
                          </div>
                        ) : null}
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

      {tab === 'requests' ? (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Customer</th>
                  <th>Services</th>
                  <th>Quilt source</th>
                  <th>Deposit</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="muted">
                      No customer requests yet.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <strong>{req.request_number}</strong>
                        <div className="muted" style={{ fontSize: '0.85rem' }}>
                          Ack:{' '}
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: '0.1rem 0.35rem', fontSize: '0.8rem' }}
                            onClick={() => onAcknowledge(req, req.acknowledged !== 'Y')}
                          >
                            {req.acknowledged === 'Y' ? 'Y' : 'N'}
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
                          <button type="button" className="btn btn-primary" onClick={() => openFinalPayment(req)}>
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
