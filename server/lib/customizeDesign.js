import pool from '../db.js';
import { priceForProductSize } from './productSize.js';
import { hydrateProductRow, resolveProductPrice } from './productSizePrices.js';

export const PRODUCT_DESIGN_PREFIX = 'product-';

const LEGACY_DESIGN_IDS = new Set([
  'heritage-log-cabin',
  'modern-loft-stripe',
  'prairie-nine-patch',
  'sunset-flying-geese',
  'sage-basting',
  'misty-floral',
  'studio-medallion',
  'patchwork-heritage',
]);

const LEGACY_BASE_PRICES = {
  'heritage-log-cabin': 289,
  'modern-loft-stripe': 319,
  'prairie-nine-patch': 269,
  'sunset-flying-geese': 299,
  'sage-basting': 279,
  'misty-floral': 309,
  'studio-medallion': 349,
  'patchwork-heritage': 289,
};

const LEGACY_SIZE_MULTIPLIERS = {
  standard: 0.85,
  small: 0.85,
  large: 1,
  'x-large': 1.12,
  'xx-large': 1.22,
  'xxx-large': 1.32,
};

export function parseProductDesignId(designId) {
  const raw = String(designId ?? '');
  if (!raw.startsWith(PRODUCT_DESIGN_PREFIX)) return null;
  const id = Number(raw.slice(PRODUCT_DESIGN_PREFIX.length));
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function isProductDesignId(designId) {
  return parseProductDesignId(designId) != null;
}

export async function resolveCustomizeDesign(designId, designNameFromClient) {
  const id = String(designId ?? '').trim();
  const productId = parseProductDesignId(id);
  if (productId) {
    const [[row]] = await pool.query(
      `SELECT id, name, price, size_prices FROM products WHERE id = ? AND is_published = 1`,
      [productId]
    );
    if (!row) {
      return { ok: false, error: 'Select a published product to customize' };
    }
    const product = hydrateProductRow(row);
    return {
      ok: true,
      designId: id,
      designName: product.name,
      basePrice: Number(product.price),
      product,
    };
  }

  if (LEGACY_DESIGN_IDS.has(id)) {
    const name = String(designNameFromClient ?? '').trim();
    if (!name) {
      return { ok: false, error: 'Design name is required' };
    }
    return {
      ok: true,
      designId: id,
      designName: name,
      basePrice: LEGACY_BASE_PRICES[id] ?? null,
    };
  }

  return { ok: false, error: 'Select a product to customize' };
}

export function estimateCustomizePrice(designId, productSize, basePriceOrProduct) {
  const base = Number(
    typeof basePriceOrProduct === 'object' ? basePriceOrProduct?.price : basePriceOrProduct
  );
  if (!Number.isFinite(base) || base <= 0) return null;

  if (isProductDesignId(designId)) {
    const product =
      typeof basePriceOrProduct === 'object' && basePriceOrProduct != null
        ? basePriceOrProduct
        : { price: base };
    return resolveProductPrice(product, productSize);
  }

  const mult = LEGACY_SIZE_MULTIPLIERS[productSize] ?? 1;
  return Math.round(base * mult * 100) / 100;
}
