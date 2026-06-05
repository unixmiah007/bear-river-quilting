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

const LEGACY = new Set(['pending']);

export function normalizeOrderStatusForForm(status) {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  if (ORDER_STATUS_OPTIONS.some((o) => o.value === s)) return s;
  if (s === 'pending') return 'new';
  if (LEGACY.has(s)) return s;
  return 'new';
}

export function normalizeCustomQuiltStatusForForm(status) {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  if (ORDER_STATUS_OPTIONS.some((o) => o.value === s)) return s;
  if (s === 'pending_payment' || s === 'submitted') return 'new';
  if (s === 'cancelled') return 'cancelled';
  return normalizeOrderStatusForForm(status);
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

export function labelForCustomQuiltStatus(status) {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  if (s === 'pending_payment') return 'Payment pending';
  if (s === 'submitted') return 'Submitted';
  return labelForOrderStatus(status);
}

export const LONG_ARM_STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'deposit_paid', label: 'Deposit paid' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function labelForLongArmStatus(status) {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  const match = LONG_ARM_STATUS_OPTIONS.find((o) => o.value === s);
  if (match) return match.label;
  return status || '—';
}
