import { ORDER_STATUS_OPTIONS } from './orderStatuses.js';

/** Legacy customize / payment statuses still stored on older rows. */
export const CUSTOM_QUILT_LEGACY_STATUSES = ['pending_payment', 'submitted', 'cancelled'];

const ALLOWED = new Set([
  ...ORDER_STATUS_OPTIONS.map((o) => o.value),
  ...CUSTOM_QUILT_LEGACY_STATUSES,
]);

export function isAllowedCustomQuiltRequestStatus(status) {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  return ALLOWED.has(s);
}

export { ORDER_STATUS_OPTIONS };
