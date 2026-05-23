import { useEffect, useState } from 'react';
import { adminApi } from '../api.js';
import { labelForCarrier, SHIPPING_CARRIER_OPTIONS } from '../lib/shippingCarriers.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [trackingMsg, setTrackingMsg] = useState(null);
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ carrier: 'usps', trackingNumber: '' });

  async function refresh() {
    setError(null);
    const rows = await adminApi.orders();
    setOrders(rows);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.body?.error || e.message));
  }, []);

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
      setTrackingMsg(
        `Tracking email sent to ${details.order.customer_email} (${result.carrier}: ${result.trackingNumber}).`
      );
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

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Orders</h1>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrap" style={{ marginBottom: '1.25rem' }}>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
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
            ))}
          </tbody>
        </table>
      </div>
      {details ? (
        <div className="card">
          <h3 style={{ margin: 0 }}>Order {details.order.order_number}</h3>
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

          <form className="form admin-tracking-form" onSubmit={sendTrackingEmail}>
            <h4 className="admin-tracking-form__title">Email customer tracking</h4>
            <p className="muted admin-tracking-form__hint">
              Sends a shipment notification to <strong>{details.order.customer_email}</strong>.
              Orders marked <em>paid</em> are set to <em>fulfilled</em> when tracking is sent.
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
              {trackingBusy ? 'Sending…' : 'Email tracking to customer'}
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
