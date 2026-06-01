import { resolveProductPrice } from './productSizes.js';
import { stripRichHtml } from './richText.js';
import { estimateCustomQuiltPrice, getDesignById } from './quiltDesignPalette.js';

export const PRODUCT_DESIGN_PREFIX = 'product-';

/** Flat deposit when the customer chooses their own design on /customize. */
export const OWN_DESIGN_ID = 'customer-own-design';

export const OWN_DESIGN_DEPOSIT_USD = 30;

export function isOwnDesignId(designId) {
  return String(designId ?? '').trim() === OWN_DESIGN_ID;
}

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
  if (isOwnDesignId(designId)) {
    return null;
  }
  const productId = parseProductDesignId(designId);
  if (productId != null) {
    const product = products.find((p) => Number(p.id) === productId);
    return product ? productToCustomizeDesign(product) : null;
  }
  return getDesignById(designId);
}

export function buildOwnDesignSelection(previewImageUrl) {
  return {
    id: OWN_DESIGN_ID,
    name: 'Your own design',
    description:
      'Custom quilt from your uploaded reference. Pay a design deposit today; our designer confirms final pricing before production.',
    image: previewImageUrl || null,
    basePrice: OWN_DESIGN_DEPOSIT_USD,
    isOwnDesign: true,
  };
}

export function estimateCustomizePrice(designId, productSize, products) {
  if (isOwnDesignId(designId)) {
    return OWN_DESIGN_DEPOSIT_USD;
  }
  const productId = parseProductDesignId(designId);
  if (productId != null) {
    const product = products.find((p) => Number(p.id) === productId);
    if (!product) return null;
    return resolveProductPrice(product, productSize);
  }
  return estimateCustomQuiltPrice(designId, productSize);
}

export function truncateCustomizeDescription(text, maxLen = 120) {
  const s = String(text ?? '').trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen).trim()}…`;
}
