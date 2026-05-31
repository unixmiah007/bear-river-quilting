import { useState } from 'react';
import { adminApi } from '../api.js';
import { formatProductSizeLabel } from '../lib/productSizes.js';
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

function selectionKey(type, id) {
  return `${type}:${id}`;
}

function parseSelectionKey(key) {
  if (!key) return null;
  const [type, id] = String(key).split(':');
  if (!type || !id) return null;
  return { type, id: Number(id) };
}

export default function AdminCustomPayment() {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [orders, setOrders] = useState([]);
  const [customRequests, setCustomRequests] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [amount, setAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const selection = parseSelectionKey(selectedKey);
  const selectedOrder =
    selection?.type === 'order' ? orders.find((o) => Number(o.id) === selection.id) : null;
  const selectedCustomRequest =
    selection?.type === 'custom_quilt'
      ? customRequests.find((r) => Number(r.id) === selection.id)
      : null;
  const selectedItem = selectedOrder ?? selectedCustomRequest;

  const hasResults = orders.length > 0 || customRequests.length > 0;

  async function handleSearch(e) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);
    setOrders([]);
    setCustomRequests([]);
    setSelectedKey('');
    setAmount('');
    setSearching(true);
    try {
      const data = await adminApi.searchOrdersForCustomPayment(email.trim());
      const orderList = Array.isArray(data.orders) ? data.orders : [];
      const requestList = Array.isArray(data.customRequests) ? data.customRequests : [];
      setOrders(orderList);
      setCustomRequests(requestList);
      setSearchEmail(data.email ?? email.trim().toLowerCase());
      if (orderList.length === 0 && requestList.length === 0) {
        setErr('No shop orders or custom quilt requests found for this email.');
      }
    } catch (ex) {
      setErr(ex.body?.error || ex.message);
    } finally {
      setSearching(false);
    }
  }

  function selectOrder(order) {
    setSelectedKey(selectionKey('order', order.id));
    setAmount(String(Number(order.total).toFixed(2)));
    setErr(null);
    setSuccess(null);
  }

  function selectCustomRequest(request) {
    setSelectedKey(selectionKey('custom_quilt', request.id));
    setAmount(String(Number(request.estimated_price ?? 0).toFixed(2)));
    setErr(null);
    setSuccess(null);
  }

  async function handleCreatePayment(e) {
    e.preventDefault();
    if (!selection) {
      setErr('Select a shop order or custom quilt request first.');
      return;
    }
    setErr(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const body = {
        amount: Number(amount),
        adminNote: adminNote.trim() || null,
        sendEmail,
      };
      if (selection.type === 'order') {
        body.orderId = selection.id;
      } else {
        body.customQuiltRequestId = selection.id;
      }
      const result = await adminApi.createCustomPayment(body);
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

  const referenceLabel = selectedCustomRequest
    ? `Custom request ${selectedCustomRequest.request_number}`
    : selectedOrder
      ? `Order ${selectedOrder.order_number}`
      : '';

  return (
    <>
      <h1>Custom payment</h1>
      <p className="muted">
        Find a customer by email, choose a shop order or custom quilt request, set the amount to
        collect, and send a Stripe payment link by email.
      </p>

      {err ? <p className="error">{err}</p> : null}

      <form className="form card admin-custom-payment__search" onSubmit={handleSearch}>
        <h2 className="admin-custom-payment__section-title">1. Find customer</h2>
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
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {searching ? <PageLoading active label="Searching…" inline /> : null}

      {hasResults ? (
        <section className="card admin-custom-payment__orders">
          <h2 className="admin-custom-payment__section-title">
            2. Select an order or custom request
            {searchEmail ? (
              <span className="muted admin-custom-payment__email"> — {searchEmail}</span>
            ) : null}
          </h2>

          {orders.length > 0 ? (
            <>
              <h3 className="admin-custom-payment__subsection">Shop orders</h3>
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
                      const key = selectionKey('order', order.id);
                      const selected = selectedKey === key;
                      return (
                        <tr
                          key={key}
                          className={selected ? 'admin-custom-payment__row--selected' : ''}
                        >
                          <td>
                            <input
                              type="radio"
                              name="custom-pay-selection"
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
            </>
          ) : null}

          {customRequests.length > 0 ? (
            <>
              <h3 className="admin-custom-payment__subsection">Custom quilt requests</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th scope="col" />
                      <th scope="col">Request #</th>
                      <th scope="col">Status</th>
                      <th scope="col">Design</th>
                      <th scope="col">Size</th>
                      <th scope="col">Est. price</th>
                      <th scope="col">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customRequests.map((request) => {
                      const key = selectionKey('custom_quilt', request.id);
                      const selected = selectedKey === key;
                      return (
                        <tr
                          key={key}
                          className={selected ? 'admin-custom-payment__row--selected' : ''}
                        >
                          <td>
                            <input
                              type="radio"
                              name="custom-pay-selection"
                              checked={selected}
                              onChange={() => selectCustomRequest(request)}
                              aria-label={`Select custom request ${request.request_number}`}
                            />
                          </td>
                          <td>{request.request_number}</td>
                          <td>
                            <span className={statusBadgeClass(request.status)}>{request.status}</span>
                          </td>
                          <td>{request.design_name}</td>
                          <td>
                            {formatProductSizeLabel(request.product_size) ?? request.product_size ?? '—'}
                          </td>
                          <td>{formatPrice(request.estimated_price)}</td>
                          <td className="muted">{formatWhen(request.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {selectedItem ? (
        <form className="form card admin-custom-payment__form" onSubmit={handleCreatePayment}>
          <h2 className="admin-custom-payment__section-title">3. Payment amount & email</h2>
          <p className="muted admin-custom-payment__selected-summary">
            {referenceLabel} — amount{' '}
            <strong>
              {formatPrice(
                selectedOrder?.total ?? selectedCustomRequest?.estimated_price
              )}
            </strong>{' '}
            ({selectedItem.status})
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
            Email Stripe payment link to {selectedItem.customer_email}
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
              <dt>Type</dt>
              <dd>
                {success.referenceType === 'custom_quilt' ? 'Custom quilt request' : 'Shop order'}
              </dd>
            </div>
            <div>
              <dt>Reference #</dt>
              <dd>{success.orderNumber ?? success.requestNumber}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{formatPrice(success.amount)}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                {success.emailSent
                  ? `Sent to ${success.customerEmail ?? selectedItem?.customer_email ?? 'customer'}`
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
