import { orderIsAdjusted } from '../AccountOrderItems.jsx';
import OrderTotalProductLinks from '../OrderTotalProductLinks.jsx';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

function issuedRefundTotal(items) {
  return (items || []).reduce((sum, it) => {
    if (it.line_refund_status === 'issued' && it.line_refund_amount != null) {
      return sum + Number(it.line_refund_amount);
    }
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

export default function AdminOrderAdjustmentHistory({ order, items, customPayments = [] }) {
  const adjusted = orderIsAdjusted(order, items);
  const refundTotal = issuedRefundTotal(items);
  const hasOriginalTotals = order?.original_total != null;
  const payments = Array.isArray(customPayments) ? customPayments : [];

  if (!adjusted && payments.length === 0) return null;

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
            {refundTotal >= 0.01 ? (
              <div className="admin-order-history__row">
                <span>Refunded to customer card</span>
                <strong className="admin-order-item-refund--issued">
                  {formatPrice(refundTotal)}
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
