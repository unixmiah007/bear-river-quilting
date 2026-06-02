import { useState } from 'react';
import { orderIsAdjusted } from '../AccountOrderItems.jsx';
import OrderTotalProductLinks from '../OrderTotalProductLinks.jsx';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

function refundStatusLabel(status) {
  const s = String(status ?? '').toLowerCase();
  if (s === 'issued') return 'Issued';
  if (s === 'failed') return 'Due — issue in Stripe';
  return 'Due — issue in Stripe';
}

function collectLineItemRefunds(items) {
  return (items || [])
    .filter((it) => it.line_refund_amount != null && Number(it.line_refund_amount) >= 0.01)
    .map((it) => ({
      key: `item-${it.id}`,
      kind: 'line_item',
      itemId: it.id,
      label: it.product_name,
      amount: Number(it.line_refund_amount),
      status: it.line_refund_status === 'failed' ? 'pending' : it.line_refund_status,
      stripeRefundId: it.stripe_refund_id,
      processedAt: it.line_refund_at,
    }));
}

function collectOrderRefunds(orderRefunds) {
  return (orderRefunds || []).map((r) => ({
    key: `refund-${r.id}`,
    kind: 'order_refund',
    refundId: r.id,
    label: r.label || r.reason || 'Order refund',
    amount: Number(r.amount),
    status: r.status === 'failed' ? 'pending' : r.status,
    stripeRefundId: r.stripe_refund_id,
    processedAt: r.processed_at,
    createdAt: r.created_at,
  }));
}

function issuedRefundTotal(refundEntries) {
  return refundEntries.reduce((sum, entry) => {
    if (entry.status === 'issued') return sum + entry.amount;
    return sum;
  }, 0);
}

function pendingRefundTotal(refundEntries) {
  return refundEntries.reduce((sum, entry) => {
    if (entry.status === 'pending') return sum + entry.amount;
    return sum;
  }, 0);
}

function paymentStatusLabel(status) {
  const s = String(status ?? '').toLowerCase();
  if (s === 'paid' || s === 'complete') return 'Paid';
  if (s === 'pending') return 'Pending';
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
  return status || '—';
}

function RefundProcessForm({ busy, onSubmit }) {
  const [stripeRefundId, setStripeRefundId] = useState('');

  return (
    <form
      className="admin-order-refund-process"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(stripeRefundId.trim() || undefined);
      }}
    >
      <label className="admin-order-refund-process__label">
        Stripe refund ID (optional)
        <input
          type="text"
          value={stripeRefundId}
          onChange={(e) => setStripeRefundId(e.target.value)}
          placeholder="re_…"
          disabled={busy}
        />
      </label>
      <button type="submit" className="btn btn--compact" disabled={busy}>
        {busy ? 'Saving…' : 'Mark refund processed'}
      </button>
    </form>
  );
}

export default function AdminOrderAdjustmentHistory({
  order,
  items,
  customPayments = [],
  orderRefunds = [],
  onRecordLineItemRefund,
  onRecordOrderRefund,
  recordRefundBusy = null,
}) {
  const adjusted = orderIsAdjusted(order, items);
  const refundEntries = [
    ...collectLineItemRefunds(items),
    ...collectOrderRefunds(orderRefunds),
  ];
  const issuedTotal = issuedRefundTotal(refundEntries);
  const pendingTotal = pendingRefundTotal(refundEntries);
  const hasOriginalTotals = order?.original_total != null;
  const payments = Array.isArray(customPayments) ? customPayments : [];

  if (!adjusted && payments.length === 0 && refundEntries.length === 0) return null;

  return (
    <section className="admin-order-history" aria-label="Order adjustment history">
      <h4 className="admin-order-history__title">Order history</h4>
      {adjusted ? (
        <>
          {order.order_adjusted_at ? (
            <p className="muted admin-order-history__when">
              Last line-item change: {new Date(order.order_adjusted_at).toLocaleString()}
            </p>
          ) : null}
          <div className="admin-order-history__totals">
            {hasOriginalTotals ? (
              <div className="admin-order-history__row admin-order-history__row--with-links">
                <span className="admin-order-history__row-label">
                  Original order total
                  <OrderTotalProductLinks items={items} variant="original" />
                </span>
                <span className="muted">{formatPrice(order.original_total)}</span>
              </div>
            ) : null}
            <div className="admin-order-history__row admin-order-history__row--with-links">
              <span className="admin-order-history__row-label">
                Current order total
                <OrderTotalProductLinks items={items} variant="current" />
              </span>
              <strong>{formatPrice(order.total)}</strong>
            </div>
            {issuedTotal >= 0.01 ? (
              <div className="admin-order-history__row">
                <span>Refunded to customer card</span>
                <strong className="admin-order-item-refund--issued">
                  {formatPrice(issuedTotal)}
                </strong>
              </div>
            ) : null}
            {pendingTotal >= 0.01 ? (
              <div className="admin-order-history__row">
                <span>Refund due (issue in Stripe)</span>
                <strong className="admin-order-item-refund--pending">
                  {formatPrice(pendingTotal)}
                </strong>
              </div>
            ) : null}
          </div>
          {hasOriginalTotals ? (
            <p className="muted admin-order-history__compare">
              Original: Subtotal {formatPrice(order.original_subtotal)} · Tax{' '}
              {formatPrice(order.original_tax_amount)} · Shipping {formatPrice(order.shipping_cost)}{' '}
              · Total {formatPrice(order.original_total)}
              <br />
              Current: Subtotal {formatPrice(order.subtotal)} · Tax {formatPrice(order.tax_amount)}{' '}
              · Shipping {formatPrice(order.shipping_cost)} · Total{' '}
              <strong>{formatPrice(order.total)}</strong>
            </p>
          ) : null}
        </>
      ) : null}

      {refundEntries.length > 0 ? (
        <div className="admin-order-history__refunds">
          <p className="admin-order-history__payments-heading">Refunds</p>
          <ul className="admin-order-history__payment-list">
            {refundEntries.map((entry) => {
              const busyKey =
                entry.kind === 'line_item'
                  ? `item-${entry.itemId}`
                  : `refund-${entry.refundId}`;
              const busy = recordRefundBusy === busyKey;

              return (
                <li key={entry.key} className="admin-order-history__payment">
                  <span className="admin-order-history__payment-ref">{entry.label}</span>
                  <span>
                    <strong>{formatPrice(entry.amount)}</strong>
                    {' · '}
                    {refundStatusLabel(entry.status)}
                  </span>
                  {entry.processedAt ? (
                    <span className="muted admin-order-history__payment-meta">
                      Processed {new Date(entry.processedAt).toLocaleString()}
                    </span>
                  ) : entry.createdAt ? (
                    <span className="muted admin-order-history__payment-meta">
                      Recorded {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  ) : null}
                  {entry.stripeRefundId ? (
                    <span className="muted admin-order-history__payment-meta">
                      Stripe {entry.stripeRefundId}
                    </span>
                  ) : null}
                  {entry.status === 'pending' ? (
                    <RefundProcessForm
                      busy={busy}
                      onSubmit={(stripeRefundId) => {
                        if (entry.kind === 'line_item') {
                          onRecordLineItemRefund?.(entry.itemId, { stripeRefundId });
                        } else {
                          onRecordOrderRefund?.(entry.refundId, { stripeRefundId });
                        }
                      }}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {payments.length > 0 ? (
        <div className="admin-order-history__payments">
          <p className="admin-order-history__payments-heading">Payment links sent</p>
          <ul className="admin-order-history__payment-list">
            {payments.map((p) => (
              <li key={p.id} className="admin-order-history__payment">
                <span className="admin-order-history__payment-ref">{p.payment_number}</span>
                <span>
                  <strong>{formatPrice(p.amount)}</strong>
                  {' · '}
                  {paymentStatusLabel(p.status)}
                </span>
                {p.email_sent_at ? (
                  <span className="muted admin-order-history__payment-meta">
                    Emailed {new Date(p.email_sent_at).toLocaleString()}
                  </span>
                ) : p.created_at ? (
                  <span className="muted admin-order-history__payment-meta">
                    Created {new Date(p.created_at).toLocaleString()}
                  </span>
                ) : null}
                {p.paid_at ? (
                  <span className="muted admin-order-history__payment-meta">
                    Paid {new Date(p.paid_at).toLocaleString()}
                  </span>
                ) : null}
                {p.admin_note ? (
                  <span className="muted admin-order-history__payment-note">{p.admin_note}</span>
                ) : null}
                {p.checkout_url && String(p.status).toLowerCase() === 'pending' ? (
                  <a
                    href={p.checkout_url}
                    className="admin-order-history__payment-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Stripe link
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
