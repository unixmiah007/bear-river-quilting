import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import CartIcon from '../components/CartIcon.jsx';
import { publicApi } from '../api.js';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

function statusLabel(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'pending') return 'Pending';
  if (v === 'paid') return 'Paid';
  if (v === 'fulfilled') return 'Fulfilled';
  if (v === 'cancelled') return 'Cancelled';
  return s || '—';
}

export default function Account() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [placedBanner, setPlacedBanner] = useState(false);
  const [mode, setMode] = useState(null);
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const st = location.state;
    if (!st?.email || !st?.orderNumber) return undefined;

    setEmail(st.email);
    setOrderNumber(st.orderNumber);
    if (st.placed) setPlacedBanner(true);

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await publicApi.customerOrdersLookup({
          email: String(st.email).trim(),
          orderNumber: String(st.orderNumber).trim(),
        });
        if (cancelled) return;
        setMode('detail');
        setDetail({ order: data.order, items: Array.isArray(data.items) ? data.items : [] });
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
  }, [location.state]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setDetail(null);
    setMode(null);
    setList([]);
    setLoading(true);
    try {
      const body = { email: email.trim() };
      const on = orderNumber.trim();
      if (on) body.orderNumber = on;
      const data = await publicApi.customerOrdersLookup(body);
      setMode(data.mode);
      if (data.mode === 'list') {
        setList(Array.isArray(data.orders) ? data.orders : []);
      } else {
        setDetail({ order: data.order, items: Array.isArray(data.items) ? data.items : [] });
      }
    } catch (err) {
      setError(
        [err.body?.error, err.body?.hint].filter(Boolean).join(' — ') || err.message || 'Request failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function openOrder(no) {
    setOrderNumber(no);
    setError(null);
    setLoading(true);
    try {
      const data = await publicApi.customerOrdersLookup({
        email: email.trim(),
        orderNumber: no,
      });
      setMode('detail');
      setDetail({ order: data.order, items: Array.isArray(data.items) ? data.items : [] });
    } catch (err) {
      setError(
        [err.body?.error, err.body?.hint].filter(Boolean).join(' — ') || err.message || 'Request failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  function backToList() {
    setDetail(null);
    setOrderNumber('');
    setMode('list');
  }

  const order = detail?.order;

  return (
    <>
      <h1>My account</h1>
      <p className="page-body">
        View order status, shipping and billing addresses, and the card on file (last four digits
        only—we never store your full card number). Enter the{' '}
        <strong>same email you used at checkout</strong>. To jump straight to one order, add its{' '}
        <strong>order number</strong> (from your confirmation screen or email).
      </p>
      <p className="muted" style={{ marginTop: '-0.5rem' }}>
        This page does not use a separate password. Anyone who knows your checkout email can request
        this list—use a private inbox for order confirmations in production.
      </p>

      {placedBanner ? (
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Thanks—your order was placed. Details below when available.
        </p>
      ) : null}

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Look up orders</h2>
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="acct-email">Checkout email</label>
            <input
              id="acct-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="acct-order">Order number (optional)</label>
            <input
              id="acct-order"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. Q1A2B3C4D567"
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading…' : orderNumber.trim() ? 'View this order' : 'Show all my orders'}
          </button>
        </form>
      </section>

      {mode === 'list' && !detail ? (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Your orders</h2>
          {list.length === 0 ? (
            <p className="muted">No orders found for that email yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Placed</th>
                    <th>Card</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.order_number}</strong>
                      </td>
                      <td>{statusLabel(o.status)}</td>
                      <td>{formatPrice(o.total)}</td>
                      <td className="muted">{new Date(o.created_at).toLocaleString()}</td>
                      <td className="muted">····{o.card_last4}</td>
                      <td>
                        <button type="button" className="btn" onClick={() => openOrder(o.order_number)}>
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

      {mode === 'detail' && order ? (
        <section className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Order {order.order_number}</h2>
            {list.length > 0 ? (
              <button type="button" className="btn" onClick={backToList}>
                Back to list
              </button>
            ) : null}
          </div>
          <p className="muted" style={{ marginTop: '0.35rem' }}>
            <strong>Status:</strong> {statusLabel(order.status)} · Placed{' '}
            {new Date(order.created_at).toLocaleString()}
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Contact</h3>
          <p className="muted" style={{ margin: 0 }}>
            {order.customer_name} · {order.customer_email}
            {order.customer_phone ? ` · ${order.customer_phone}` : ''}
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Payment</h3>
          <p className="muted" style={{ margin: 0 }}>
            Card ending in <strong>{order.card_last4}</strong> (full card number is not stored.)
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Shipping</h3>
          <p className="muted" style={{ margin: 0 }}>
            {order.shipping_method} · {formatPrice(order.shipping_cost)}
          </p>
          <p className="muted" style={{ margin: '0.35rem 0 0' }}>
            {order.shipping_address1}
            {order.shipping_address2 ? `, ${order.shipping_address2}` : ''}
            <br />
            {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
            <br />
            {order.shipping_country}
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Billing</h3>
          <p className="muted" style={{ margin: 0 }}>
            {order.billing_name}
            <br />
            {order.billing_address1}
            {order.billing_address2 ? `, ${order.billing_address2}` : ''}
            <br />
            {order.billing_city}, {order.billing_state} {order.billing_postal_code}
            <br />
            {order.billing_country}
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.35rem' }}>Items</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Line</th>
                </tr>
              </thead>
              <tbody>
                {(detail.items || []).map((it) => (
                  <tr key={it.id}>
                    <td>
                      <Link to={`/products/${it.product_id}`}>{it.product_name}</Link>
                    </td>
                    <td>{it.quantity}</td>
                    <td>{formatPrice(it.unit_price)}</td>
                    <td>{formatPrice(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginTop: '1rem' }}>
            Subtotal {formatPrice(order.subtotal)} · Tax {formatPrice(order.tax_amount)} · Shipping{' '}
            {formatPrice(order.shipping_cost)} · <strong>Total {formatPrice(order.total)}</strong>
          </p>
        </section>
      ) : null}

      <p className="muted" style={{ marginTop: '2rem' }}>
        <Link className="cart-inline-link" to="/cart">
          <CartIcon /> Return to cart
        </Link>{' '}
        · <Link to="/products">Continue shopping</Link>
      </p>
    </>
  );
}
