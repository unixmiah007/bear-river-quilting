import { PRODUCT_SIZE_VALUES } from './productSize.js';
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HANDMADE_QUILT_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1617104551722-3b2d51366443?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1617325247661-675ab4b64f64?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1616526068431-355ac27d6e8e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1616486708452-2338d6e54e9c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1615529327251-d1276530a26e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1615876230354-265f7db5ba32?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce982949fee7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618222276118-a3eabd4fa4b2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1556910103-1c027dea358d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1631679706901-109c35e9ce97?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513694203102-789a794cbc21?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507652313514-d4f917a33393?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1556228454-1e0531650bc0?auto=format&fit=crop&w=1200&q=80',
];

const PATTERNS = [
  'Heritage Patchwork',
  'Hand-Stitched Bloom',
  'Cottage Stripe',
  'Artisan Diamond',
  'Soft Loom',
  'Prairie Weave',
  'Modern Heirloom',
  'Sunrise Patch',
  'Willow Stitch',
  'Cozy Loft',
  'Log Cabin',
  'Flying Geese',
  'Rail Fence',
  'Nine Patch',
  'Dresden Plate',
  'Double Wedding Ring',
  'Cathedral Window',
  'Irish Chain',
  'Bargello Waves',
  'Wholecloth Echo',
  'Appliqué Sampler',
  'Patchwork Star',
  'Honeycomb Hex',
  'Basketweave',
  'Garden Path',
  'Ocean Waves',
  'Midnight Star',
  'Autumn Leaf',
  'Winterberry',
  'Meadow Daisy',
  'Riverstone',
  'Summit Cross',
  'Linen Field',
  'Velvet Horizon',
  'Cotton Cloud',
];

const TONES = [
  'Ivory',
  'Sage',
  'Terracotta',
  'Indigo',
  'Sand',
  'Rosewood',
  'Oatmeal',
  'Stone',
  'Blush',
  'Amber',
  'Mist',
  'Clay',
  'Dusk',
  'Honey',
  'Spruce',
  'Pearl',
  'Copper',
  'Slate',
  'Cream',
  'Fig',
];

const SIZES = ['Twin', 'Full/Queen', 'King', 'Throw'];
const FILLS = ['cotton', 'bamboo', 'wool blend', 'microfiber', 'organic cotton'];
const WEIGHTS = ['lightweight', 'all-season', 'plush', 'medium loft'];

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length) % arr.length];
}

function makeProduct(id, idx) {
  const rand = mulberry32((id ^ 0x9e3779b9) + idx * 2654435761);
  const pattern = pick(rand, PATTERNS);
  const tone = pick(rand, TONES);
  const size = pick(rand, SIZES);
  const fill = pick(rand, FILLS);
  const weight = pick(rand, WEIGHTS);
  const accent = pick(rand, [
    'hand-bound edges',
    'echo quilting',
    'channel stitching',
    'cross-hatch quilting',
    'scalloped border',
    'minimal grid quilting',
  ]);
  const price = (89 + rand() * 360).toFixed(2);
  const stock_quantity = Math.floor(6 + rand() * 94);
  const sku = `BRQ-${id}`;
  const imageUrl = HANDMADE_QUILT_IMAGE_URLS[Math.floor(rand() * HANDMADE_QUILT_IMAGE_URLS.length)];

  return {
    id,
    sku,
    name: `${tone} ${pattern} Handmade Quilt`,
    description: `${size} ${weight} handmade quilt with ${fill} fill and ${accent}. Pieced and finished in small batches for Bear River Quilting.`,
    price,
    stock_quantity,
    imageUrl,
    product_size: PRODUCT_SIZE_VALUES[idx % PRODUCT_SIZE_VALUES.length],
  };
}

/**
 * Upsert demo quilt rows (ids 3001–3050) and refresh images for 2001–2004 when present.
 * Caller must ensure `sku` / `stock_quantity` columns exist (see ensureProductInventoryColumns).
 */
export async function seedDemoProducts(conn) {
  const baseIds = [2001, 2002, 2003, 2004];
  for (let i = 0; i < baseIds.length; i++) {
    const id = baseIds[i];
    const imageUrl = HANDMADE_QUILT_IMAGE_URLS[i % HANDMADE_QUILT_IMAGE_URLS.length];
    await conn.query('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, id]);
  }

  const products = Array.from({ length: 50 }, (_, i) => makeProduct(3001 + i, i));
  for (const p of products) {
    await conn.query(
      `INSERT INTO products (id, sku, name, description, price, stock_quantity, image_url, is_published, product_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE
         sku = VALUES(sku),
         stock_quantity = VALUES(stock_quantity),
         name = VALUES(name),
         description = VALUES(description),
         price = VALUES(price),
         image_url = VALUES(image_url),
         is_published = VALUES(is_published),
         product_size = VALUES(product_size)`,
      [p.id, p.sku, p.name, p.description, p.price, p.stock_quantity, p.imageUrl, p.product_size]
    );
  }

  return { placeholderCount: products.length, baseCatalogIds: baseIds };
}
