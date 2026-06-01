/** Shop order lifecycle statuses (stored on orders.status). */
export const ORDER_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'processing', label: 'Processing' },
  { value: 'paid', label: 'Paid' },
  { value: 'preparing_for_shipment', label: 'Preparing for shipment' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'return', label: 'Return' },
  { value: 'refunded', label: 'Refund' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'complete', label: 'Complete' },
];

/** Legacy values still allowed in the database. */
export const LEGACY_ORDER_STATUSES = ['pending'];

const ALLOWED = new Set([
  ...ORDER_STATUS_OPTIONS.map((o) => o.value),
  ...LEGACY_ORDER_STATUSES,
]);

export const ORDER_STATUS_CUSTOMER_MESSAGES = {
  new: 'We have received your order and will begin processing it soon.',
  processing: 'Your order is currently being processed.',
  paid: 'Payment has been received. Thank you for your purchase.',
  preparing_for_shipment: 'Your order is being prepared for shipment.',
  on_hold: 'Your order is on hold. We will contact you if we need anything from you.',
  cancelled: 'Your order has been cancelled.',
  return: 'Your order is being handled as a return.',
  refunded: 'A refund has been issued for your order.',
  fulfilled: 'Your order has been fulfilled.',
  shipped: 'Your order has shipped.',
  complete: 'Your order is complete. Thank you for shopping with Bear River Quilting.',
  pending: 'We have received your order and will begin processing it soon.',
};

export function isAllowedOrderStatus(status) {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  return ALLOWED.has(s);
}

export function labelForOrderStatus(status) {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  const match = ORDER_STATUS_OPTIONS.find((o) => o.value === s);
  if (match) return match.label;
  if (s === 'pending') return 'Pending';
  return status || '—';
}

export function customerMessageForOrderStatus(status) {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  return (
    ORDER_STATUS_CUSTOMER_MESSAGES[s] ||
    `Your order status is now: ${labelForOrderStatus(s)}.`
  );
}
