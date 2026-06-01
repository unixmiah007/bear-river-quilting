import { Link } from 'react-router-dom';
import OrderTotalProductLinks from './OrderTotalProductLinks.jsx';

function formatPrice(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number(n)
  );
}

export function orderIsAdjusted(order, items) {
  if (order?.original_total != null && order?.total != null) {
    return Math.abs(Number(order.original_total) - Number(order.total)) >= 0.01;
  }
  return (items || []).some((it) => it.original_product_name != null);
}

function issuedRefundTotal(items) {
  return (items || []).reduce((sum, it) => {
    if (it.line_refund_status === 'issued' && it.line_refund_amount != null) {
      return sum + Number(it.line_refund_amount);
    }
    return sum;
  }, 0);
}

export function lineItemWasChanged(it) {
  if (!it.original_product_name) return false;
  return (
    Number(it.original_product_id) !== Number(it.product_id) ||
    it.original_product_name !== it.product_name ||
    Math.abs(Number(it.original_line_total) - Number(it.line_total)) >= 0.01
  );
}

function AccountLineItemRefundNote({ item }) {
  const amount = item.line_refund_amount != null ? Number(item.line_refund_amount) : null;
  const status = item.line_refund_status;
  if (amount == null || !status) return null;

  if (status === 'issued') {
    const when = item.line_refund_at
      ? new Date(item.line_refund_at).toLocaleString()
      : null;
    return (
      <p className="account-order-item-refund account-order-item-refund--issued">
        Refund issued: <strong>{formatPrice(amount)}</strong>
        {when ? <span className="account-order-item-refund__when"> · {when}</span> : null}
      </p>
    );
  }

  if (status === 'pending') {
    return (
      <p className="account-order-item-refund account-order-item-refund--pending">
        Refund processing: <strong>{formatPrice(amount)}</strong>
      </p>
    );
  }

  if (status === 'failed') {
    return (
      <p className="account-order-item-refund account-order-item-refund--failed">
        Refund of <strong>{formatPrice(amount)}</strong> is being reviewed — contact us if you have questions.
      </p>
    );
  }

  return null;
}

export default function AccountOrderItems({ order, items }) {
  const adjusted = orderIsAdjusted(order, items);
  const refundTotal = issuedRefundTotal(items);
  const hasOriginalTotals = order.original_total != null;

  return (
    <>
      {adjusted ? (
        <div className="account-order-adjustment" role="note">
          <p className="account-order-adjustment__title">This order was updated after checkout</p>
          {order.order_adjusted_at ? (
            <p className="muted account-order-adjustment__when">
              Last change: {new Date(order.order_adjusted_at).toLocaleString()}
            </p>
          ) : null}
          <div className="account-order-adjustment__totals">
            {hasOriginalTotals ? (
              <div className="account-order-adjustment__row account-order-adjustment__row--with-links">
                <span className="account-order-adjustment__label">
                  Original order total
                  <OrderTotalProductLinks items={items} variant="original" />
                </span>
                <span className="account-order-adjustment__value muted">
                  {formatPrice(order.original_total)}
                </span>
              </div>
            ) : null}
            <div className="account-order-adjustment__row account-order-adjustment__row--with-links">
              <span className="account-order-adjustment__label">
                Current order total
                <OrderTotalProductLinks items={items} variant="current" />
              </span>
              <span className="account-order-adjustment__value">
                <strong>{formatPrice(order.total)}</strong>
              </span>
            </div>
            {refundTotal >= 0.01 ? (
              <div className="account-order-adjustment__row">
                <span className="account-order-adjustment__label">Refunded to your card</span>
                <span className="account-order-adjustment__value account-order-item-refund--issued">
                  <strong>{formatPrice(refundTotal)}</strong>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="account-order-items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Line</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((it) => {
              const changed = lineItemWasChanged(it);
              return (
                <tr key={it.id} className={changed ? 'account-order-item-row--changed' : undefined}>
                  <td>
                    <div className="account-order-item-current">
                      {changed ? (
                        <span className="account-order-item-tag">Current</span>
                      ) : null}
                      <Link to={`/products/${it.product_id}`}>{it.product_name}</Link>
                    </div>
                    {changed ? (
                      <div className="account-order-item-original">
                        <span className="account-order-item-tag account-order-item-tag--original">
                          Original order
                        </span>
                        <span className="account-order-item-original__name">
                          {it.original_product_name}
                        </span>
                        <span className="muted account-order-item-original__amounts">
                          {formatPrice(it.original_unit_price)} × {it.quantity} ={' '}
                          {formatPrice(it.original_line_total)}
                        </span>
                      </div>
                    ) : null}
                    <AccountLineItemRefundNote item={it} />
                  </td>
                  <td>{it.quantity}</td>
                  <td>{formatPrice(it.unit_price)}</td>
                  <td>{formatPrice(it.line_total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adjusted && hasOriginalTotals ? (
        <div className="account-order-totals-compare muted" style={{ marginTop: '1rem' }}>
          <p style={{ margin: '0 0 0.35rem' }}>
            <strong>Original:</strong> Subtotal {formatPrice(order.original_subtotal)} · Tax{' '}
            {formatPrice(order.original_tax_amount)} · Shipping {formatPrice(order.shipping_cost)}{' '}
            · Total {formatPrice(order.original_total)}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Current:</strong> Subtotal {formatPrice(order.subtotal)} · Tax{' '}
            {formatPrice(order.tax_amount)} · Shipping {formatPrice(order.shipping_cost)} · Total{' '}
            <strong>{formatPrice(order.total)}</strong>
          </p>
        </div>
      ) : (
        <p className="muted" style={{ marginTop: '1rem' }}>
          Subtotal {formatPrice(order.subtotal)} · Tax {formatPrice(order.tax_amount)} · Shipping{' '}
          {formatPrice(order.shipping_cost)} · <strong>Total {formatPrice(order.total)}</strong>
        </p>
      )}
    </>
  );
}

export function orderListShowsAdjustment(order) {
  return (
    order?.original_total != null &&
    Math.abs(Number(order.original_total) - Number(order.total)) >= 0.01
  );
}
