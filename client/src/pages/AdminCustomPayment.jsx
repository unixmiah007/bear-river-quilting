import { useState } from 'react';
import { adminApi } from '../api.js';
import PageLoading from '../components/PageLoading.jsx';

function formatWhen(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatPrice(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n));
}

function statusBadgeClass(status) {
  const s = String(status ?? '').toLowerCase();
  if (s === 'paid') return 'badge badge-on';
  if (s === 'pending_payment' || s === 'pending') return 'badge badge-off';
  return 'badge';
}

export default function AdminCustomPayment() {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [orders, setOrders] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedOrder = orders.find((o) => String(o.id) === String(selectedOrderId));

  async function handleSearch(e) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);
    setOrders([]);
    setSelectedOrderId('');
    setAmount('');
    setSearching(true);
    try {
      const data = await adminApi.searchOrdersForCustomPayment(email.trim());
      const list = Array.isArray(data.orders) ? data.orders : [];
      setOrders(list);
      setSearchEmail(data.email ?? email.trim().toLowerCase());
      if (list.length === 0) {
        setErr('No orders found for this email.');
      }
    } catch (ex) {
      setErr(ex.body?.error || ex.message);
    } finally {
      setSearching(false);
    }
  }

  function selectOrder(order) {
    setSelectedOrderId(String(order.id));
    setAmount(String(Number(order.total).toFixed(2)));
    setErr(null);
    setSuccess(null);
  }

  async function handleCreatePayment(e) {
    e.preventDefault();
    if (!selectedOrderId) {
      setErr('Select an order first.');
      return;
    }
    setErr(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const result = await adminApi.createCustomPayment({
        orderId: Number(selectedOrderId),
        amount: Number(amount),
        adminNote: adminNote.trim() || null,
        sendEmail,
      });
      setSuccess(result);
    } catch (ex) {
      setErr(ex.body?.error || ex.message);
    } finally {
      setSubmitting(false);
    }
  }

  function copyCheckoutUrl() {
    if (!success?.checkoutUrl) return;
    navigator.clipboard?.writeText(success.checkoutUrl).catch(() => {});
  }

  return (
    <>
      <h1>Custom payment</h1>
      <p className="muted">
        Find a customer by email, choose one of their orders, set the amount to collect, and send a
        Stripe payment link by email.
      </p>

      {err ? <p className="error">{err}</p> : null}

      <form className="form card admin-custom-payment__search" onSubmit={handleSearch}>
        <h2 className="admin-custom-payment__section-title">1. Find customer orders</h2>
        <div className="field">
          <label htmlFor="custom-pay-email">Customer email</label>
          <input
            id="custom-pay-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="customer@example.com"
            required
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={searching || !email.trim()}>
          {searching ? 'Searching…' : 'Search orders'}
        </button>
      </form>

      {searching ? <PageLoading active label="Searching orders…" inline /> : null}

      {orders.length > 0 ? (
        <section className="card admin-custom-payment__orders">
          <h2 className="admin-custom-payment__section-title">
            2. Select an order
            {searchEmail ? (
              <span className="muted admin-custom-payment__email"> — {searchEmail}</span>
            ) : null}
          </h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col" />
                  <th scope="col">Order #</th>
                  <th scope="col">Status</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Total</th>
                  <th scope="col">Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const selected = String(order.id) === String(selectedOrderId);
                  return (
                    <tr key={order.id} className={selected ? 'admin-custom-payment__row--selected' : ''}>
                      <td>
                        <input
                          type="radio"
                          name="custom-pay-order"
                          checked={selected}
                          onChange={() => selectOrder(order)}
                          aria-label={`Select order ${order.order_number}`}
                        />
                      </td>
                      <td>{order.order_number}</td>
                      <td>
                        <span className={statusBadgeClass(order.status)}>{order.status}</span>
                      </td>
                      <td>{order.customer_name}</td>
                      <td>{formatPrice(order.total)}</td>
                      <td className="muted">{formatWhen(order.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {selectedOrder ? (
        <form className="form card admin-custom-payment__form" onSubmit={handleCreatePayment}>
          <h2 className="admin-custom-payment__section-title">3. Payment amount & email</h2>
          <p className="muted admin-custom-payment__selected-summary">
            Order <strong>{selectedOrder.order_number}</strong> — original total{' '}
            <strong>{formatPrice(selectedOrder.total)}</strong> ({selectedOrder.status})
          </p>
          <div className="field">
            <label htmlFor="custom-pay-amount">Amount to charge (USD)</label>
            <input
              id="custom-pay-amount"
              type="number"
              min="0.5"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="custom-pay-note">Note for customer (optional)</label>
            <textarea
              id="custom-pay-note"
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="e.g. Adjusted balance after fabric change"
            />
          </div>
          <label className="admin-custom-payment__checkbox">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Email Stripe payment link to {selectedOrder.customer_email}
          </label>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting
              ? 'Creating link…'
              : sendEmail
                ? 'Create link & send email'
                : 'Create payment link only'}
          </button>
        </form>
      ) : null}

      {success ? (
        <section className="card admin-custom-payment__success">
          <h2 className="admin-custom-payment__section-title">Payment link created</h2>
          <dl className="admin-custom-payment__success-dl">
            <div>
              <dt>Payment reference</dt>
              <dd>{success.paymentNumber}</dd>
            </div>
            <div>
              <dt>Order</dt>
              <dd>{success.orderNumber}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{formatPrice(success.amount)}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                {success.emailSent
                  ? `Sent to ${selectedOrder?.customer_email ?? 'customer'}`
                  : success.emailError
                    ? `Not sent — ${success.emailError}`
                    : 'Not sent (checkbox was off)'}
              </dd>
            </div>
          </dl>
          {success.checkoutUrl ? (
            <div className="admin-custom-payment__link-row">
              <input
                type="text"
                className="admin-custom-payment__link-input"
                readOnly
                value={success.checkoutUrl}
                aria-label="Stripe checkout URL"
              />
              <button type="button" className="btn" onClick={copyCheckoutUrl}>
                Copy link
              </button>
              <a
                className="btn"
                href={success.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Stripe
              </a>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
