import { priceForProductSize } from './productSizes.js';
import { stripRichHtml } from './richText.js';
import { estimateCustomQuiltPrice, getDesignById } from './quiltDesignPalette.js';

export const PRODUCT_DESIGN_PREFIX = 'product-';

export function productDesignId(productId) {
  return `${PRODUCT_DESIGN_PREFIX}${productId}`;
}

export function parseProductDesignId(designId) {
  const raw = String(designId ?? '');
  if (!raw.startsWith(PRODUCT_DESIGN_PREFIX)) return null;
  const id = Number(raw.slice(PRODUCT_DESIGN_PREFIX.length));
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function productToCustomizeDesign(product) {
  const description = product.description ? stripRichHtml(product.description) : '';
  return {
    id: productDesignId(product.id),
    productId: product.id,
    name: product.name,
    description,
    image: product.image_url || null,
    basePrice: Number(product.price),
  };
}

export function findCustomizeDesign(designId, products) {
  const productId = parseProductDesignId(designId);
  if (productId != null) {
    const product = products.find((p) => Number(p.id) === productId);
    return product ? productToCustomizeDesign(product) : null;
  }
  return getDesignById(designId);
}

export function estimateCustomizePrice(designId, productSize, products) {
  const productId = parseProductDesignId(designId);
  if (productId != null) {
    const product = products.find((p) => Number(p.id) === productId);
    if (!product) return null;
    return priceForProductSize(product.price, productSize);
  }
  return estimateCustomQuiltPrice(designId, productSize);
}

export function truncateCustomizeDescription(text, maxLen = 120) {
  const s = String(text ?? '').trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen).trim()}…`;
}
