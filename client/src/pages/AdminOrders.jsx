import { useEffect, useState } from 'react';
import { adminApi } from '../api.js';

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
    try {
      const data = await adminApi.orderById(id);
      setDetails(data);
    } catch (e) {
      setError(e.body?.error || e.message);
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
