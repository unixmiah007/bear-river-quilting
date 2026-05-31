/** Size tiers for per-size pricing (display order). Standard and Small share the base tier. */
export const SIZE_PRICE_STEP_ORDER = ['standard', 'small', 'large', 'x-large', 'xx-large', 'xxx-large'];

const SIZE_PRICE_STEP_INDEX = {
  standard: 0,
  small: 0,
  large: 1,
  'x-large': 2,
  'xx-large': 3,
  'xxx-large': 4,
};

export const PRODUCT_SIZE_OPTIONS = [
  { value: '', label: '— Not set —' },
  { value: 'standard', label: 'Standard' },
  { value: 'small', label: 'Small' },
  { value: 'large', label: 'Large' },
  { value: 'x-large', label: 'X-Large' },
  { value: 'xx-large', label: 'XX-Large' },
  { value: 'xxx-large', label: 'XXX-Large' },
];

/** Sizes shoppers can pick on the product detail page. */
export const CUSTOMER_SIZE_OPTIONS = PRODUCT_SIZE_OPTIONS.filter((o) =>
  Object.hasOwn(SIZE_PRICE_STEP_INDEX, o.value)
);

export const SIZE_PRICE_INCREMENT = 30;

export function sizePriceStepIndex(size) {
  if (size == null || String(size).trim() === '') return 0;
  const key = String(size).trim().toLowerCase();
  if (Object.hasOwn(SIZE_PRICE_STEP_INDEX, key)) return SIZE_PRICE_STEP_INDEX[key];
  return 0;
}

/** Base price is Standard/Small tier; each step up adds $30. */
export function priceForProductSize(basePrice, size) {
  const base = Number(basePrice);
  if (!Number.isFinite(base)) return 0;
  const steps = sizePriceStepIndex(size);
  return Number((base + steps * SIZE_PRICE_INCREMENT).toFixed(2));
}

/** Uses DB size_prices when set; otherwise falls back to base price + $30 steps. */
export function resolveProductPrice(product, size) {
  const prices = product?.size_prices;
  const key =
    size == null || String(size).trim() === '' ? 'small' : String(size).trim().toLowerCase();
  if (prices && prices[key] != null && Number.isFinite(Number(prices[key]))) {
    return Number(Number(prices[key]).toFixed(2));
  }
  return priceForProductSize(product?.price ?? 0, key);
}

export function buildDefaultSizePricesFromBase(basePrice) {
  const base = Number(basePrice);
  if (!Number.isFinite(base) || base < 0) return null;
  const out = {};
  for (const size of SIZE_PRICE_STEP_ORDER) {
    out[size] = priceForProductSize(base, size);
  }
  return out;
}

export function sizePricesFromProduct(product) {
  if (product?.size_prices && typeof product.size_prices === 'object') {
    return product.size_prices;
  }
  return buildDefaultSizePricesFromBase(product?.price ?? 0);
}

export function formatProductPriceRange(product, formatPrice) {
  const prices = sizePricesFromProduct(product);
  const vals = SIZE_PRICE_STEP_ORDER.map((s) => prices?.[s]).filter((n) => Number.isFinite(Number(n)));
  if (!vals.length) return formatPrice(product?.price ?? 0);
  const nums = vals.map(Number);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}

export function emptySizePriceForm(basePrice = '0') {
  const prices = buildDefaultSizePricesFromBase(Number(basePrice) || 0) ?? {};
  return Object.fromEntries(
    SIZE_PRICE_STEP_ORDER.map((size) => [size, String(prices[size] ?? basePrice ?? '0')])
  );
}

export function sizePricesFormToPayload(sizePricesForm) {
  const size_prices = {};
  for (const size of SIZE_PRICE_STEP_ORDER) {
    size_prices[size] = Number(sizePricesForm[size]) || 0;
  }
  return {
    size_prices,
    price: size_prices.small,
  };
}

const LABELS = {
  standard: 'Standard',
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
