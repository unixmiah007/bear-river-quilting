/** Product SKU prefix used for auto-generated inventory codes (matches demo seed). */
export const PRODUCT_SKU_PREFIX = 'BRQ-';

function skuNumericValue(sku) {
  const s = String(sku ?? '').trim();
  if (!s) return 0;
  const branded = s.match(new RegExp(`^${PRODUCT_SKU_PREFIX}(\\d+)$`, 'i'));
  if (branded) return Number(branded[1]) || 0;
  const trailing = s.match(/(\d+)$/);
  if (trailing) return Number(trailing[1]) || 0;
  return 0;
}

/** Next unique SKU from product ids and existing SKU numbers in the database. */
export async function generateNextProductSku(pool) {
  const [[{ maxId }]] = await pool.query('SELECT COALESCE(MAX(id), 0) AS maxId FROM products');
  const [skuRows] = await pool.query(
    "SELECT sku FROM products WHERE sku IS NOT NULL AND TRIM(sku) != ''"
  );

  let maxNum = Number(maxId) || 0;
  for (const row of skuRows) {
    maxNum = Math.max(maxNum, skuNumericValue(row.sku));
  }

  let candidate = maxNum + 1;
  let sku = `${PRODUCT_SKU_PREFIX}${candidate}`;

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const [[existing]] = await pool.query('SELECT id FROM products WHERE sku = ? LIMIT 1', [sku]);
    if (!existing) return sku;
    candidate += 1;
    sku = `${PRODUCT_SKU_PREFIX}${candidate}`;
  }

  throw new Error('Could not allocate a unique SKU');
}
