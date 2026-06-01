import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api.js';
import { formatProductSizeLabel } from '../lib/productSizes.js';
import PageLoading from '../components/PageLoading.jsx';

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

function formatWhenCompact(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPrice(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

function humanizeSlug(value) {
  if (value == null || String(value).trim() === '') return null;
  return String(value)
    .trim()
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayValue(value) {
  const s = value == null ? '' : String(value).trim();
  return s || '—';
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

function ownDesignDownloadFilename(row) {
  const url = String(row.own_design_image_url ?? '');
  const filePart = url.split('/').filter(Boolean).pop() || 'customer-design.png';
  const safeRequest = String(row.request_number ?? 'request').replace(/[^a-zA-Z0-9-_]+/g, '-');
  if (/\.[a-z0-9]+$/i.test(filePart)) {
    return `${safeRequest}-${filePart}`;
  }
  return `${safeRequest}-customer-design.png`;
}

async function downloadCustomerOwnDesign(row) {
  const url = row.own_design_image_url;
  if (!url) return;

  const filename = ownDesignDownloadFilename(row);
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Could not fetch the customer image');
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function CustomerOwnDesignPreview({ row }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const imageUrl =
    row.own_design_image_url != null && String(row.own_design_image_url).trim() !== ''
      ? String(row.own_design_image_url).trim()
      : null;

  async function handleDownload() {
    if (!imageUrl) return;
    setDownloadError(null);
    setDownloading(true);
    try {
      await downloadCustomerOwnDesign(row);
    } catch (e) {
      setDownloadError(e.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="admin-customize-detail-dialog__own-design">
      <h3 className="admin-customize-detail-dialog__own-heading">Customer design reference</h3>
      {imageUrl ? (
        <>
          <p className="muted admin-customize-detail-dialog__own-hint">
            Click the thumbnail to download the original image the customer uploaded.
          </p>
          <button
            type="button"
            className="admin-customize-detail-dialog__thumb-btn"
            onClick={handleDownload}
            disabled={downloading}
            title="Download original customer image"
          >
            <img
              className="admin-customize-detail-dialog__thumb"
              src={imageUrl}
              alt="Thumbnail of customer uploaded design"
            />
            <span className="admin-customize-detail-dialog__thumb-overlay" aria-hidden="true">
              {downloading ? 'Downloading…' : 'Download'}
            </span>
          </button>
          {downloadError ? (
            <p className="error admin-customize-detail-dialog__download-error">{downloadError}</p>
          ) : null}
          <button
            type="button"
            className="btn admin-customize-detail-dialog__download-btn"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Downloading…' : 'Download original image'}
          </button>
        </>
      ) : (
        <p className="muted admin-customize-detail-dialog__own-empty">
          No reference image was uploaded for this request. New checkouts that use &ldquo;Bring my own
          design&rdquo; on step 2 will show a thumbnail here.
        </p>
      )}
    </div>
  );
}

function CustomizeRequestDetailDialog({ row, savingId, onClose, onToggleAcknowledged }) {
  if (!row) return null;

  const ack = acknowledgedLabel(row.acknowledged);
  const busy = savingId === row.id;
  const sizeLabel = formatProductSizeLabel(row.product_size) ?? humanizeSlug(row.product_size);
  const colorLabel = humanizeSlug(row.color_palette);
  const battingLabel = humanizeSlug(row.batting);

  return (
    <div className="confirm-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="confirm-dialog admin-customize-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customize-request-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="customize-request-detail-title" className="confirm-dialog__title">
          {row.request_number}
        </h2>
        <p className="muted admin-customize-detail-dialog__meta">
          Submitted {formatWhen(row.created_at)}
          {row.updated_at && row.updated_at !== row.created_at
            ? ` · Updated ${formatWhen(row.updated_at)}`
            : ''}
        </p>

        <dl className="admin-customize-detail-dialog__dl">
          <div>
            <dt>Status</dt>
            <dd>{displayValue(row.status)}</dd>
          </div>
          <div>
            <dt>Acknowledged</dt>
            <dd>
              <span className={`badge ${ack === 'Y' ? 'badge-on' : 'badge-off'}`}>{ack}</span>
            </dd>
          </div>
          <div>
            <dt>Design</dt>
            <dd>
              {displayValue(row.design_name)}
              {row.design_id ? (
                <>
                  <br />
                  <span className="muted">ID: {row.design_id}</span>
                </>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{sizeLabel ?? '—'}</dd>
          </div>
          <div>
            <dt>Color palette</dt>
            <dd>{colorLabel ?? displayValue(row.color_palette)}</dd>
          </div>
          <div>
            <dt>Batting</dt>
            <dd>{battingLabel ?? displayValue(row.batting)}</dd>
          </div>
          <div>
            <dt>Working title</dt>
            <dd>{displayValue(row.quilt_title)}</dd>
          </div>
          <div>
            <dt>Notes for designer</dt>
            <dd className="admin-customize-detail-dialog__notes">
              {row.notes ? row.notes : '—'}
            </dd>
          </div>
          <div>
            <dt>Estimated price</dt>
            <dd>{formatPrice(row.estimated_price)}</dd>
          </div>
          <div>
            <dt>Customer</dt>
            <dd>
              {displayValue(row.customer_name)}
              <br />
              <a href={`mailto:${row.customer_email}`}>{displayValue(row.customer_email)}</a>
              {row.customer_phone ? (
                <>
                  <br />
                  <a href={`tel:${row.customer_phone}`}>{row.customer_phone}</a>
                </>
              ) : null}
            </dd>
          </div>
          {row.stripe_checkout_session_id ? (
            <div>
              <dt>Stripe checkout session</dt>
              <dd className="admin-customize-detail-dialog__mono">{row.stripe_checkout_session_id}</dd>
            </div>
          ) : null}
          {row.stripe_payment_intent_id ? (
            <div>
              <dt>Stripe payment intent</dt>
              <dd className="admin-customize-detail-dialog__mono">{row.stripe_payment_intent_id}</dd>
            </div>
          ) : null}
        </dl>

        <CustomerOwnDesignPreview row={row} />

        <div className="confirm-dialog__actions admin-customize-detail-dialog__actions">
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => onToggleAcknowledged(row)}
          >
            {busy ? 'Saving…' : ack === 'Y' ? 'Mark unacknowledged' : 'Mark acknowledged'}
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCustomizeRequests() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [sortKey, setSortKey] = useState('created');
  const [sortDir, setSortDir] = useState('desc');
  const [detailRow, setDetailRow] = useState(null);

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

  const detailFromRows = detailRow ? rows.find((r) => r.id === detailRow.id) ?? detailRow : null;

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
      setDetailRow((current) =>
        current?.id === row.id ? { ...current, acknowledged: next } : current
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
        Submissions from the Customize wizard. Click a row to toggle acknowledged Y/N, or use View
        details to see the full request.
      </p>
      {err ? <p className="error">{err}</p> : null}
      {loading ? (
        <PageLoading active label="Loading requests…" />
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
                  label="Price"
                  column="price"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Ack."
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
                <th scope="col" className="admin-customize-requests-table__actions-col">
                  Actions
                </th>
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
                    <td className="admin-customize-requests-table__clip" title={r.request_number}>
                      {r.request_number}
                    </td>
                    <td className="admin-customize-requests-table__clip" title={r.status}>
                      {r.status}
                    </td>
                    <td className="admin-customize-requests-table__clip" title={r.design_name}>
                      {r.design_name}
                    </td>
                    <td className="admin-customize-requests-table__clip">
                      {formatProductSizeLabel(r.product_size) ?? r.product_size}
                    </td>
                    <td className="admin-customize-requests-table__customer">
                      <span className="admin-customize-requests-table__clip-line" title={r.customer_name}>
                        {r.customer_name}
                      </span>
                      <span
                        className="muted admin-customize-requests-table__clip-line"
                        title={r.customer_email}
                      >
                        {r.customer_email}
                      </span>
                    </td>
                    <td>{formatPrice(r.estimated_price)}</td>
                    <td>
                      <span
                        className={`badge ${ack === 'Y' ? 'badge-on' : 'badge-off'}`}
                        aria-live="polite"
                      >
                        {busy ? '…' : ack}
                      </span>
                    </td>
                    <td className="muted admin-customize-requests-table__date" title={formatWhen(r.created_at)}>
                      {formatWhenCompact(r.created_at)}
                    </td>
                    <td className="admin-customize-requests-table__actions-col">
                      <button
                        type="button"
                        className="btn btn--compact"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailRow(r);
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CustomizeRequestDetailDialog
        row={detailFromRows}
        savingId={savingId}
        onClose={() => setDetailRow(null)}
        onToggleAcknowledged={toggleAcknowledged}
      />
    </>
  );
}
