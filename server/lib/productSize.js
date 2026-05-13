/** Allowed product_size values (stored lowercase with hyphens). */
export const PRODUCT_SIZE_VALUES = ['small', 'large', 'x-large', 'xx-large', 'xxx-large'];

const ALLOWED = new Set(PRODUCT_SIZE_VALUES);

/**
 * @param {unknown} raw
 * @returns {string|null} canonical value or null if empty / invalid
 */
export function normalizeProductSize(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (s === '' || s === 'none' || s === 'null' || s === '-') return null;
  if (ALLOWED.has(s)) return s;
  const compact = s.replace(/\s+/g, '');
  if (ALLOWED.has(compact)) return compact;
  return null;
}
