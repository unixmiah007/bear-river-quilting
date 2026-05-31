/** Allowed product_size values (stored lowercase with hyphens). */
export const PRODUCT_SIZE_VALUES = ['standard', 'small', 'large', 'x-large', 'xx-large', 'xxx-large'];

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

export const SIZE_PRICE_INCREMENT = 30;

const SIZE_PRICE_STEP_INDEX = {
  standard: 0,
  small: 0,
  large: 1,
  'x-large': 2,
  'xx-large': 3,
  'xxx-large': 4,
};

function sizePriceStepIndex(size) {
  if (!size) return 0;
  const key = String(size).trim().toLowerCase();
  if (Object.hasOwn(SIZE_PRICE_STEP_INDEX, key)) return SIZE_PRICE_STEP_INDEX[key];
  return 0;
}

/** Base DB price is Small; Standard shares the same tier; each larger size adds $30. */
export function priceForProductSize(basePrice, size) {
  const base = Number(basePrice);
  if (!Number.isFinite(base)) return 0;
  const steps = sizePriceStepIndex(size);
  return Number((base + steps * SIZE_PRICE_INCREMENT).toFixed(2));
}
