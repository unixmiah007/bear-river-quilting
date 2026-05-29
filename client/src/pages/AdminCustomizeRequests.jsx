import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api.js';
import { formatProductSizeLabel } from '../lib/productSizes.js';

const SORTABLE_COLUMNS = [
  'request',
  'status',
  'design',
  'size',
  'customer',
  'price',
  'acknowledged',
  'created',
];

function formatWhen(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatPrice(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

function getSortValue(row, key) {
  switch (key) {
    case 'request':
      return (row.request_number ?? '').toLowerCase();
    case 'status':
      return (row.status ?? '').toLowerCase();
    case 'design':
      return (row.design_name ?? '').toLowerCase();
    case 'size':
      return (row.product_size ?? '').toLowerCase();
    case 'customer':
      return (row.customer_name ?? '').toLowerCase();
    case 'price':
      return Number(row.estimated_price) || 0;
    case 'acknowledged':
      return String(row.acknowledged || 'N').toUpperCase() === 'Y' ? 1 : 0;
    case 'created':
      return new Date(row.created_at).getTime() || 0;
    default:
      return '';
  }
}

function compareRows(a, b, key, dir) {
  const va = getSortValue(a, key);
  const vb = getSortValue(b, key);
  let cmp = 0;
  if (typeof va === 'number' && typeof vb === 'number') {
    cmp = va - vb;
  } else {
    cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
  }
  if (cmp === 0) cmp = Number(a.id) - Number(b.id);
  return dir === 'asc' ? cmp : -cmp;
}

function SortableTh({ label, column, sortKey, sortDir, onSort }) {
  const active = sortKey === column;
  return (
    <th scope="col">
      <button
        type="button"
        className={`admin-table-sort${active ? ' admin-table-sort--active' : ''}`}
        onClick={() => onSort(column)}
        aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <span>{label}</span>
        <span className="admin-table-sort__icon" aria-hidden="true">
          {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}

function acknowledgedLabel(value) {
  return String(value || 'N').toUpperCase() === 'Y' ? 'Y' : 'N';
}

export default function AdminCustomizeRequests() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [sortKey, setSortKey] = useState('created');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    adminApi
      .customQuiltRequests()
      .then(setRows)
      .catch((e) => setErr(e.body?.error || e.message))
      .finally(() => setLoading(false));
  }, []);

  const sortedRows = useMemo(() => {
    if (!SORTABLE_COLUMNS.includes(sortKey)) return rows;
    return [...rows].sort((a, b) => compareRows(a, b, sortKey, sortDir));
  }, [rows, sortKey, sortDir]);

  function handleSort(column) {
    if (sortKey === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column);
      setSortDir('asc');
    }
  }

  async function toggleAcknowledged(row) {
    if (!row?.id || savingId != null) return;
    const next = acknowledgedLabel(row.acknowledged) === 'Y' ? 'N' : 'Y';
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
      <p className="muted">
        Design submissions from the Customize wizard (not paid orders). Click a row to toggle
        acknowledged Y/N.
      </p>
      {err ? <p className="error">{err}</p> : null}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="muted">No requests yet.</p>
      ) : (
        <div className="table-wrap admin-customize-requests-table">
          <table>
            <thead>
              <tr>
                <SortableTh
                  label="Request #"
                  column="request"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Status"
                  column="status"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Design"
                  column="design"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Size"
                  column="size"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Customer"
                  column="customer"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Est. price"
                  column="price"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Acknowledged"
                  column="acknowledged"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Submitted"
                  column="created"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => {
                const ack = acknowledgedLabel(r.acknowledged);
                const busy = savingId === r.id;
                return (
                  <tr
                    key={r.id}
                    className="admin-customize-request-row--clickable"
                    tabIndex={0}
                    aria-label={`${r.request_number}: acknowledged ${ack}. Click to toggle.`}
                    onClick={() => toggleAcknowledged(r)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' && e.key !== ' ') return;
                      e.preventDefault();
                      toggleAcknowledged(r);
                    }}
                  >
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
                      <span
                        className={`badge ${ack === 'Y' ? 'badge-on' : 'badge-off'}`}
                        aria-live="polite"
                      >
                        {busy ? 'Saving…' : ack}
                      </span>
                    </td>
                    <td className="muted">{formatWhen(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
