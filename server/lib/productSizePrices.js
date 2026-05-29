import { PRODUCT_SIZE_VALUES, normalizeProductSize, priceForProductSize } from './productSize.js';

async function columnExists(conn, table, column) {
  const db = process.env.MYSQL_DATABASE ?? 'cms_store';
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [db, table, column]
  );
  return Number(row.c) > 0;
}

/** Adds products.size_prices JSON for per-size pricing. */
export async function ensureProductSizePricesColumn(conn) {
  if (!(await columnExists(conn, 'products', 'size_prices'))) {
    await conn.query('ALTER TABLE products ADD COLUMN size_prices JSON NULL DEFAULT NULL AFTER price');
  }
}

export function parseSizePricesFromDb(raw) {
  if (raw == null) return null;
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const out = {};
  for (const size of PRODUCT_SIZE_VALUES) {
    const v = parsed[size];
    if (v == null || String(v).trim() === '') continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) continue;
    out[size] = Number(n.toFixed(2));
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function buildDefaultSizePricesFromBase(basePrice) {
  const base = Number(basePrice);
  if (!Number.isFinite(base) || base < 0) return null;
  const out = {};
  for (const size of PRODUCT_SIZE_VALUES) {
    out[size] = priceForProductSize(base, size);
  }
  return out;
}

export function parseSizePricesInput(raw) {
  if (raw == null) return { ok: true, value: null };
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'size_prices must be a JSON object' };
    }
  }
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return { ok: false, error: 'size_prices must be an object keyed by size' };
  }
  const out = {};
  for (const size of PRODUCT_SIZE_VALUES) {
    if (obj[size] == null || String(obj[size]).trim() === '') continue;
    const n = Number(String(obj[size]).replace(/[$,\s]/g, ''));
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, error: `Invalid price for size "${size}"` };
    }
    out[size] = Number(n.toFixed(2));
  }
  if (Object.keys(out).length === 0) return { ok: true, value: null };
  return { ok: true, value: out };
}

/** Validates admin create/update price payload; syncs products.price to Small. */
export function parseProductPriceInput(body) {
  const parsed = parseSizePricesInput(body?.size_prices ?? body?.sizePrices);
  if (!parsed.ok) return parsed;

  let sizePrices = parsed.value;
  const legacyPrice = Number(body?.price);

  if (!sizePrices) {
    if (!Number.isFinite(legacyPrice) || legacyPrice < 0) {
      return { ok: false, error: 'Enter a price for at least the Small size' };
    }
    sizePrices = buildDefaultSizePricesFromBase(legacyPrice);
  }

  if (sizePrices.small == null || !Number.isFinite(Number(sizePrices.small))) {
    if (Number.isFinite(legacyPrice) && legacyPrice >= 0) {
      sizePrices.small = Number(legacyPrice.toFixed(2));
    } else {
      return { ok: false, error: 'Small size price is required' };
    }
  }

  for (const size of PRODUCT_SIZE_VALUES) {
    if (sizePrices[size] == null) {
      sizePrices[size] = priceForProductSize(sizePrices.small, size);
    }
  }

  const normalized = {};
  for (const size of PRODUCT_SIZE_VALUES) {
    normalized[size] = Number(Number(sizePrices[size]).toFixed(2));
  }

  return {
    ok: true,
    price: normalized.small,
    sizePrices: normalized,
    sizePricesJson: JSON.stringify(normalized),
  };
}

export function hydrateProductRow(row) {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    size_prices: parseSizePricesFromDb(row.size_prices),
  };
}

export function hydrateProductRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(hydrateProductRow);
}

/** Uses DB size_prices when set; otherwise falls back to base price + $30 steps. */
export function resolveProductPrice(product, size) {
  const prices = product?.size_prices ?? parseSizePricesFromDb(product?.size_prices);
  const key = normalizeProductSize(size) ?? 'small';
  if (prices && prices[key] != null && Number.isFinite(Number(prices[key]))) {
    return Number(Number(prices[key]).toFixed(2));
  }
  return priceForProductSize(product?.price ?? 0, key);
}

export function productPriceSummary(product) {
  const prices = product?.size_prices ?? parseSizePricesFromDb(product?.size_prices);
  if (prices) {
    const vals = PRODUCT_SIZE_VALUES.map((s) => prices[s]).filter((n) => Number.isFinite(Number(n)));
    if (vals.length) {
      const nums = vals.map(Number);
      return { min: Math.min(...nums), max: Math.max(...nums), prices };
    }
  }
  const base = Number(product?.price) || 0;
  return { min: base, max: base, prices: buildDefaultSizePricesFromBase(base) };
}
