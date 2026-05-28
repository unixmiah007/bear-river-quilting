import { useEffect, useState } from 'react';
import { adminApi } from '../api.js';
import { formatProductSizeLabel } from '../lib/productSizes.js';

function formatWhen(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatPrice(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

export default function AdminCustomizeRequests() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    adminApi
      .customQuiltRequests()
      .then(setRows)
      .catch((e) => setErr(e.body?.error || e.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggleAcknowledged(row) {
    if (!row?.id) return;
    const next = String(row.acknowledged || 'N').toUpperCase() === 'Y' ? 'N' : 'Y';
    setErr(null);
    setSavingId(row.id);
    try {
      await adminApi.setCustomQuiltRequestAcknowledged(row.id, next);
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, acknowledged: next } : r))
      );
    } catch (e) {
      setErr(e.body?.error || e.message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <h1>Custom quilt requests</h1>
      <p className="muted">Design submissions from the Customize wizard (not paid orders).</p>
      {err ? <p className="error">{err}</p> : null}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="muted">No requests yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Request #</th>
                <th>Status</th>
                <th>Design</th>
                <th>Size</th>
                <th>Customer</th>
                <th>Est. price</th>
                <th>Acknowledged</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.request_number}</td>
                  <td>{r.status}</td>
                  <td>{r.design_name}</td>
                  <td>{formatProductSizeLabel(r.product_size) ?? r.product_size}</td>
                  <td>
                    {r.customer_name}
                    <br />
                    <span className="muted">{r.customer_email}</span>
                  </td>
                  <td>{formatPrice(r.estimated_price)}</td>
                  <td>
                    <button
                      type="button"
                      className={`btn ${String(r.acknowledged || 'N').toUpperCase() === 'Y' ? 'btn-primary' : ''}`}
                      onClick={() => toggleAcknowledged(r)}
                      disabled={savingId === r.id}
                    >
                      {savingId === r.id
                        ? 'Saving…'
                        : `Acknowledged: ${String(r.acknowledged || 'N').toUpperCase() === 'Y' ? 'Y' : 'N'}`}
                    </button>
                  </td>
                  <td>{formatWhen(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
