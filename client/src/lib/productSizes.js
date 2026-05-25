/** Values match server/lib/productSize.js PRODUCT_SIZE_VALUES */
export const PRODUCT_SIZE_OPTIONS = [
  { value: '', label: '— Not set —' },
  { value: 'small', label: 'Small' },
  { value: 'large', label: 'Large' },
  { value: 'x-large', label: 'X-Large' },
  { value: 'xx-large', label: 'XX-Large' },
  { value: 'xxx-large', label: 'XXX-Large' },
];

/** Sizes shoppers can pick on the product detail page (no empty option). */
export const CUSTOMER_SIZE_OPTIONS = PRODUCT_SIZE_OPTIONS.filter((o) => o.value !== '');

/** Size tiers for pricing (lowest → highest). Base product price is the Small price. */
export const SIZE_PRICE_STEP_ORDER = ['small', 'large', 'x-large', 'xx-large', 'xxx-large'];

export const SIZE_PRICE_INCREMENT = 30;

export function sizePriceStepIndex(size) {
  if (size == null || String(size).trim() === '') return 0;
  const key = String(size).trim().toLowerCase();
  const idx = SIZE_PRICE_STEP_ORDER.indexOf(key);
  return idx >= 0 ? idx : 0;
}

/** Base price is for Small; each step up the list adds $30. */
export function priceForProductSize(basePrice, size) {
  const base = Number(basePrice);
  if (!Number.isFinite(base)) return 0;
  const steps = sizePriceStepIndex(size);
  return Number((base + steps * SIZE_PRICE_INCREMENT).toFixed(2));
}

const LABELS = {
  small: 'Small',
  large: 'Large',
  'x-large': 'X-Large',
  'xx-large': 'XX-Large',
  'xxx-large': 'XXX-Large',
};

export function formatProductSizeLabel(value) {
  if (value == null || String(value).trim() === '') return null;
  const key = String(value).trim().toLowerCase();
  return LABELS[key] ?? value;
}
