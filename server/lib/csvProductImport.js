import { parse } from 'csv-parse/sync';

function normalizeHeaderKey(k) {
  return String(k ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

/** Flatten row keys to normalized snake_case for lookup */
function normalizeRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[normalizeHeaderKey(k)] = v;
  }
  return out;
}

function pickRaw(norm, keys) {
  for (const key of keys) {
    const nk = normalizeHeaderKey(key);
    if (norm[nk] === undefined || norm[nk] === null) continue;
    const s = String(norm[nk]).trim();
    if (s !== '') return s;
  }
  return '';
}

function parsePrice(v) {
  const n = Number(String(v).replace(/[$,\s]/g, ''));
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function parseStock(v) {
  const n = Math.floor(Number(String(v).replace(/,/g, '')));
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(n, 9999999);
}

function parsePublished(v) {
  const s = String(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'published', 'live', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'n', 'off', 'draft'].includes(s)) return false;
  const n = Number(s);
  if (!Number.isNaN(n)) return n !== 0;
  return false;
}

function normalizeProductRow(norm) {
  const name = pickRaw(norm, ['name', 'title', 'product_name', 'product']);
  if (!name) {
    return { error: 'Missing required column: name (aliases: title, product_name)' };
  }

  const idRaw = pickRaw(norm, ['id', 'product_id']);
  let id = null;
  if (idRaw) {
    const n = Number(idRaw);
    if (Number.isInteger(n) && n > 0) id = n;
  }

  const skuRaw = pickRaw(norm, ['sku', 'product_sku', 'item_sku', 'product_code', 'code']);
  const sku = skuRaw ? skuRaw.slice(0, 64) : null;

  const descriptionRaw = pickRaw(norm, ['description', 'desc', 'details', 'body']);
  const description = descriptionRaw ? descriptionRaw : null;

  const priceStr = pickRaw(norm, ['price', 'unit_price', 'amount', 'cost']);
  const price = priceStr ? parsePrice(priceStr) : 0;

  const image_url = pickRaw(norm, ['image_url', 'image', 'photo', 'imageurl', 'picture', 'img']) || null;

  const stockRaw = pickRaw(norm, [
    'stock_quantity',
    'stock',
    'qty',
    'quantity',
    'available',
    'inventory',
    'on_hand',
  ]);
  const stock_quantity = stockRaw ? parseStock(stockRaw) : 0;

  const pubRaw = pickRaw(norm, ['is_published', 'published', 'live', 'visible', 'status']);
  const is_published = pubRaw ? parsePublished(pubRaw) : false;

  return { id, sku, name, description, price, image_url, stock_quantity, is_published };
}

async function applyProductRow(pool, row) {
  const { id, sku, name, description, price, image_url, stock_quantity, is_published } = row;

  if (id) {
    const [[existing]] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (!existing) {
      throw new Error(`No product with id ${id}`);
    }
    await pool.query(
      `UPDATE products SET name=?, description=?, price=?, image_url=?, is_published=?, sku=?, stock_quantity=?
       WHERE id=?`,
      [
        name,
        description,
        price,
        image_url,
        is_published ? 1 : 0,
        sku,
        stock_quantity,
        id,
      ]
    );
    return 'updated';
  }

  if (sku) {
    const [[bySku]] = await pool.query('SELECT id FROM products WHERE sku = ?', [sku]);
    if (bySku) {
      await pool.query(
        `UPDATE products SET name=?, description=?, price=?, image_url=?, is_published=?, sku=?, stock_quantity=?
         WHERE id=?`,
        [
          name,
          description,
          price,
          image_url,
          is_published ? 1 : 0,
          sku,
          stock_quantity,
          bySku.id,
        ]
      );
      return 'updated';
    }
  }

  await pool.query(
    `INSERT INTO products (name, description, price, image_url, is_published, sku, stock_quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, description, price, image_url, is_published ? 1 : 0, sku, stock_quantity]
  );
  return 'created';
}

/**
 * Import products from CSV text. Header row required.
 * Upsert: numeric `id` updates that row; else non-empty `sku` matches existing SKU; else insert.
 */
export async function importProductsFromCsv(pool, csvText) {
  if (typeof csvText !== 'string' || !csvText.trim()) {
    return { created: 0, updated: 0, errors: [{ line: 0, message: 'CSV text is empty' }] };
  }

  let records;
  try {
    records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });
  } catch (e) {
    return {
      created: 0,
      updated: 0,
      errors: [{ line: 0, message: `CSV parse error: ${e.message}` }],
    };
  }

  if (!Array.isArray(records) || records.length === 0) {
    return { created: 0, updated: 0, errors: [{ line: 0, message: 'No data rows after header' }] };
  }

  const errors = [];
  let created = 0;
  let updated = 0;

  for (let i = 0; i < records.length; i++) {
    const lineNum = i + 2;
    const norm = normalizeRow(records[i]);
    const row = normalizeProductRow(norm);
    if (row.error) {
      errors.push({ line: lineNum, message: row.error });
      continue;
    }
    try {
      const r = await applyProductRow(pool, row);
      if (r === 'created') created += 1;
      else updated += 1;
    } catch (e) {
      const code = e.code;
      const msg =
        code === 'ER_DUP_ENTRY'
          ? 'Duplicate SKU (or SKU already used by another product)'
          : e.message || 'Database error';
      errors.push({ line: lineNum, message: msg, sku: row.sku ?? undefined });
    }
  }

  return { created, updated, errors };
}

export const PRODUCT_CSV_TEMPLATE = `sku,name,description,price,stock_quantity,image_url,is_published
BRQ-1001,Sample Heritage Quilt,Hand-stitched cotton quilt with warm tones.,249.00,15,https://example.com/quilt1.jpg,1
BRQ-1002,Sample Loft Quilt,Lightweight modern grid pattern.,189.00,8,https://example.com/quilt2.jpg,1
`;
