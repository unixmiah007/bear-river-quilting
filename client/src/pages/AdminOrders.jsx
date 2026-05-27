import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../api.js';
import ShippingLabelPanel from '../components/admin/ShippingLabelPanel.jsx';
import { labelForCarrier, SHIPPING_CARRIER_OPTIONS } from '../lib/shippingCarriers.js';

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 30, 'all'];
const SORTABLE_COLUMNS = ['order', 'customer', 'status', 'total', 'created'];

function getOrderSortValue(order, key) {
  switch (key) {
    case 'order':
      return (order.order_number ?? '').toLowerCase();
    case 'customer':
      return (order.customer_name ?? '').toLowerCase();
    case 'status':
      return (order.status ?? '').toLowerCase();
    case 'total':
      return Number(order.total) || 0;
    case 'created':
      return new Date(order.created_at).getTime() || 0;
    default:
      return '';
  }
}

function compareOrders(a, b, key, dir) {
  const va = getOrderSortValue(a, key);
  const vb = getOrderSortValue(b, key);
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

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

function orderSearchText(order) {
  const created = order.created_at ? new Date(order.created_at) : null;
  const parts = [
    order.order_number,
    order.customer_name,
    order.status,
    String(order.total ?? ''),
    formatPrice(order.total),
    created ? created.toLocaleString() : '',
    created ? created.toLocaleDateString() : '',
    created ? created.toISOString() : '',
  ];
  return parts
    .filter((p) => p != null && String(p).trim() !== '')
    .join(' ')
    .toLowerCase();
}

function orderMatchesSearch(order, term) {
  if (!term) return true;
  return orderSearchText(order).includes(term);
}

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [trackingMsg, setTrackingMsg] = useState(null);
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ carrier: 'usps', trackingNumber: '' });
  const orderDetailRef = useRef(null);
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('created');
  const [sortDir, setSortDir] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((o) => orderMatchesSearch(o, term));
  }, [orders, searchQuery]);

  const sortedOrders = useMemo(() => {
    if (!SORTABLE_COLUMNS.includes(sortKey)) return filteredOrders;
    return [...filteredOrders].sort((a, b) => compareOrders(a, b, sortKey, sortDir));
  }, [filteredOrders, sortKey, sortDir]);

  const totalPages = useMemo(() => {
    if (pageSize === 'all' || sortedOrders.length === 0) return 1;
    return Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  }, [sortedOrders.length, pageSize]);

  const paginatedOrders = useMemo(() => {
    if (sortedOrders.length === 0) return [];
    if (pageSize === 'all') return sortedOrders;
    const start = (page - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, page, pageSize]);

  const listRange = useMemo(() => {
    if (sortedOrders.length === 0) return { start: 0, end: 0 };
    if (pageSize === 'all') return { start: 1, end: sortedOrders.length };
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, sortedOrders.length);
    return { start, end };
  }, [sortedOrders.length, page, pageSize]);

  function handleSort(column) {
    setPage(1);
    if (sortKey === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column);
      setSortDir(column === 'created' ? 'desc' : 'asc');
    }
  }

  useEffect(() => {
    setPage(1);
  }, [pageSize, sortKey, sortDir, searchQuery]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function refresh() {
    setError(null);
    const rows = await adminApi.orders();
    setOrders(rows);
  }

  useEffect(() => {
    refresh()
      .catch((e) => setError(e.body?.error || e.message))
      .finally(() => setOrdersLoaded(true));
  }, []);

  useEffect(() => {
    if (!ordersLoaded) return undefined;
    const raw = searchParams.get('order');
    if (raw == null || String(raw).trim() === '') return undefined;
    const orderId = Number(raw);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      setSearchParams(
        (sp) => {
          const n = new URLSearchParams(sp);
          n.delete('order');
          return n;
        },
        { replace: true }
      );
      return undefined;
    }

    setSearchParams(
      (sp) => {
        const n = new URLSearchParams(sp);
        n.delete('order');
        return n;
      },
      { replace: true }
    );

    loadDetails(orderId);
    return undefined;
  }, [ordersLoaded, searchParams, setSearchParams, loadDetails]);

  useEffect(() => {
    if (!details) return undefined;
    const frame = requestAnimationFrame(() => {
      orderDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [details, selected]);

  async function loadDetails(id) {
    setSelected(id);
    setTrackingMsg(null);
    try {
      const data = await adminApi.orderById(id);
      setDetails(data);
      setTrackingForm({
        carrier: data.order.tracking_carrier || 'usps',
        trackingNumber: data.order.tracking_number || '',
      });
    } catch (e) {
      setError(e.body?.error || e.message);
    }
  }

  async function sendTrackingEmail(e) {
    e.preventDefault();
    if (!details?.order?.id) return;
    setTrackingBusy(true);
    setTrackingMsg(null);
    setError(null);
    try {
      const result = await adminApi.sendOrderTracking(details.order.id, {
        carrier: trackingForm.carrier,
        trackingNumber: trackingForm.trackingNumber.trim(),
      });
      if (result.emailSent) {
        setTrackingMsg(
          `Tracking saved and emailed to ${details.order.customer_email} (${result.carrier}: ${result.trackingNumber}).`
        );
      } else {
        setTrackingMsg(
          result.warning ||
            `Tracking saved (${result.carrier}: ${result.trackingNumber}). Email was not sent — check SendGrid in server/.env.`
        );
      }
      await refresh();
      await loadDetails(details.order.id);
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setTrackingBusy(false);
    }
  }

  async function setStatus(id, status) {
    try {
      await adminApi.updateOrderStatus(id, status);
      await refresh();
      if (selected === id) await loadDetails(id);
    } catch (e) {
      setError(e.body?.error || e.message);
    }
  }

  async function downloadInvoice() {
    if (!details?.order?.id) return;
    setInvoiceBusy(true);
    setError(null);
    try {
      await adminApi.downloadOrderInvoicePdf(details.order.id, details.order.order_number);
    } catch (e) {
      setError(e.body?.error || e.message);
    } finally {
      setInvoiceBusy(false);
    }
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Orders</h1>
      {error ? <p className="error">{error}</p> : null}

      {orders.length > 0 ? (
        <div className="field admin-orders-search" style={{ marginBottom: '1rem', maxWidth: '32rem' }}>
          <label htmlFor="admin-orders-search">Search</label>
          <input
            id="admin-orders-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Order, customer, status, total, created…"
            autoComplete="off"
          />
        </div>
      ) : null}

      {orders.length > 0 ? (
        <div className="admin-pagination">
          <div className="admin-pagination__size">
            <label htmlFor="admin-orders-page-size">Show</label>
            <select
              id="admin-orders-page-size"
              value={String(pageSize)}
              onChange={(e) => {
                const v = e.target.value;
                setPageSize(v === 'all' ? 'all' : Number(v));
              }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={String(n)}>
                  {n === 'all' ? 'All' : n}
                </option>
              ))}
            </select>
            <span className="muted">
              {searchQuery.trim() && filteredOrders.length !== orders.length
                ? `${filteredOrders.length} of ${orders.length} order${orders.length === 1 ? '' : 's'} match`
                : null}
              {searchQuery.trim() && filteredOrders.length !== orders.length ? ' · ' : null}
              {pageSize === 'all'
                ? sortedOrders.length === 0
                  ? 'No matching orders'
                  : `All ${sortedOrders.length} shown`
                : sortedOrders.length === 0
                  ? 'No matching orders'
                  : `Showing ${listRange.start}–${listRange.end} of ${sortedOrders.length}`}
            </span>
          </div>
          {pageSize !== 'all' && totalPages > 1 ? (
            <div className="admin-pagination__nav row">
              <button
                type="button"
                className="btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="muted admin-pagination__status">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="table-wrap" style={{ marginBottom: '1.25rem' }}>
        <table>
          <thead>
            <tr>
              <SortableTh
                label="Order"
                column="order"
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
                label="Status"
                column="status"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Total"
                column="total"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Created"
                column="created"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  {orders.length === 0
                    ? 'No orders yet.'
                    : searchQuery.trim()
                      ? 'No orders match your search.'
                      : 'No orders yet.'}
                </td>
              </tr>
            ) : (
              paginatedOrders.map((o) => (
              <tr key={o.id}>
                <td>{o.order_number}</td>
                <td>{o.customer_name}</td>
                <td>{o.status}</td>
                <td>{formatPrice(o.total)}</td>
                <td>{new Date(o.created_at).toLocaleString()}</td>
                <td>
                  <button className="btn" onClick={() => loadDetails(o.id)} type="button">
                    View
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {details ? (
        <div
          ref={orderDetailRef}
          id="admin-order-detail"
          className="card admin-order-detail-section"
          aria-labelledby="admin-order-detail-heading"
        >
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 id="admin-order-detail-heading" style={{ margin: 0 }}>
              Order {details.order.order_number}
            </h3>
            <button
              type="button"
              className="btn btn-primary"
              onClick={downloadInvoice}
              disabled={invoiceBusy}
            >
              {invoiceBusy ? 'Preparing…' : 'Download Invoice'}
            </button>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {details.order.customer_name} • {details.order.customer_email}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Ship to: {details.order.shipping_address1}
            {details.order.shipping_address2 ? `, ${details.order.shipping_address2}` : ''},{' '}
            {details.order.shipping_city}, {details.order.shipping_state} {details.order.shipping_postal_code},{' '}
            {details.order.shipping_country}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Shipping method: {details.order.shipping_method} • {formatPrice(details.order.shipping_cost)}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Billing: {details.order.billing_name}, {details.order.billing_address1}
            {details.order.billing_address2 ? `, ${details.order.billing_address2}` : ''},{' '}
            {details.order.billing_city}, {details.order.billing_state} {details.order.billing_postal_code},{' '}
            {details.order.billing_country} • Card ending {details.order.card_last4}
          </p>
          {details.order.tracking_number ? (
            <p className="muted" style={{ margin: '0.75rem 0 0' }}>
              Last tracking: {labelForCarrier(details.order.tracking_carrier)} ·{' '}
              <strong>{details.order.tracking_number}</strong>
              {details.order.tracking_notified_at
                ? ` · emailed ${new Date(details.order.tracking_notified_at).toLocaleString()}`
                : null}
            </p>
          ) : null}

          <ShippingLabelPanel
            orderId={details.order.id}
            orderNumber={details.order.order_number}
            tracking={
              details.order.tracking_number
                ? {
                    number: details.order.tracking_number,
                    carrierLabel: labelForCarrier(details.order.tracking_carrier),
                  }
                : null
            }
            onSaved={() => loadDetails(details.order.id)}
          />

          <form className="form admin-tracking-form" onSubmit={sendTrackingEmail}>
            <h4 className="admin-tracking-form__title">Email customer tracking</h4>
            <p className="muted admin-tracking-form__hint">
              Saves tracking on the order (visible on <strong>/account</strong>) and emails{' '}
              <strong>{details.order.customer_email}</strong> when SendGrid is configured. Orders
              marked <em>paid</em> are set to <em>fulfilled</em>.
            </p>
            <div className="row admin-tracking-form__fields">
              <div className="field" style={{ flex: 1, minWidth: '10rem' }}>
                <label htmlFor="tracking-carrier">Shipper</label>
                <select
                  id="tracking-carrier"
                  value={trackingForm.carrier}
                  onChange={(e) =>
                    setTrackingForm((f) => ({ ...f, carrier: e.target.value }))
                  }
                  required
                >
                  {SHIPPING_CARRIER_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: 2, minWidth: '12rem' }}>
                <label htmlFor="tracking-number">Tracking number</label>
                <input
                  id="tracking-number"
                  value={trackingForm.trackingNumber}
                  onChange={(e) =>
                    setTrackingForm((f) => ({ ...f, trackingNumber: e.target.value }))
                  }
                  placeholder="e.g. 9400111899223344556677"
                  required
                  autoComplete="off"
                />
              </div>
            </div>
            {trackingMsg ? <p className="page-body" style={{ color: '#065f46' }}>{trackingMsg}</p> : null}
            <button type="submit" className="btn btn-primary" disabled={trackingBusy}>
              {trackingBusy ? 'Saving…' : 'Save tracking & notify customer'}
            </button>
          </form>

          <div className="row">
            {['pending', 'paid', 'fulfilled', 'cancelled'].map((status) => (
              <button
                key={status}
                type="button"
                className={`btn${details.order.status === status ? ' btn-primary' : ''}`}
                onClick={() => setStatus(details.order.id, status)}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Line</th>
                </tr>
              </thead>
              <tbody>
                {details.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.product_name}</td>
                    <td>{it.quantity}</td>
                    <td>{formatPrice(it.unit_price)}</td>
                    <td>{formatPrice(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">Subtotal</span>
            <strong>{formatPrice(details.order.subtotal)}</strong>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">Tax</span>
            <strong>{formatPrice(details.order.tax_amount)}</strong>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">Shipping</span>
            <strong>{formatPrice(details.order.shipping_cost)}</strong>
          </div>
          <div className="price" style={{ textAlign: 'right' }}>
            {formatPrice(details.order.total)}
          </div>
        </div>
      ) : null}
    </>
  );
}
