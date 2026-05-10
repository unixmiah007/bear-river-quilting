import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import pool from './db.js';
import { importProductsFromCsv, PRODUCT_CSV_TEMPLATE } from './lib/csvProductImport.js';
import { ensureProductInventoryColumns } from './lib/ensureProductInventoryColumns.js';
import { ensureProductImagesTable } from './lib/ensureProductImagesTable.js';
import { ensurePagesTable } from './lib/ensurePagesTable.js';
import { seedDemoProducts } from './lib/seedDemoProducts.js';
import { sendOrderConfirmationEmail, sendOrderStaffNotificationEmail } from './lib/mail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirnameRoot = path.dirname(__filename);
const UPLOAD_ROOT = path.join(__dirnameRoot, 'uploads');

fs.mkdirSync(path.join(UPLOAD_ROOT, 'products'), { recursive: true });

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin';
const COOKIE_NAME = 'cms_token';

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_ROOT));

function authMiddleware(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function orderNumber() {
  return `Q${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
}

function isMissingProductColumnError(e) {
  return (
    e?.code === 'ER_BAD_FIELD_ERROR' ||
    String(e?.message || '').includes('Unknown column') ||
    String(e?.sqlMessage || '').includes('Unknown column')
  );
}

function sendProductSchemaMismatch(res) {
  res.status(500).json({
    error:
      'The products table is missing one or more expected columns (for example sku, stock_quantity, or updated_at).',
    hint:
      'Restart the API to apply automatic schema repair, or run: npm run db:bootstrap-products -w server, or npm run db:init -w server for a full reset.',
  });
}

const productImageUpload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      const id = String(req.params.id);
      const dir = path.join(UPLOAD_ROOT, 'products', id);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(_req, file, cb) {
      let ext = path.extname(file.originalname || '').toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) ext = '.jpg';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

async function loadProductImages(productId) {
  const [rows] = await pool.query(
    'SELECT id, path AS url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC',
    [productId]
  );
  return rows;
}

async function syncProductThumbnail(productId) {
  const [[first]] = await pool.query(
    'SELECT path FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1',
    [productId]
  );
  await pool.query('UPDATE products SET image_url = ? WHERE id = ?', [first?.path ?? null, productId]);
}

function deleteDiskPath(webPath) {
  if (!webPath || typeof webPath !== 'string' || !webPath.startsWith('/uploads/')) return;
  const rel = webPath.replace(/^\/uploads\/?/, '');
  const abs = path.join(UPLOAD_ROOT, rel);
  if (fs.existsSync(abs)) {
    try {
      fs.unlinkSync(abs);
    } catch (_) {
      /* ignore */
    }
  }
}

// --- Public ---

app.get('/api/pages', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, slug, title, updated_at FROM pages ORDER BY title ASC'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'Database is missing the pages table.',
        hint: 'Run: npm run db:init -w server (from project root) to apply schema.sql.',
      });
    }
    if (e.code === 'ER_BAD_FIELD_ERROR' || String(e.sqlMessage || '').includes('Unknown column')) {
      return res.status(500).json({
        error: 'The pages table is missing expected columns (for example updated_at).',
        hint: 'Run: npm run db:init -w server, or restart the API so it can run pages schema repair.',
      });
    }
    res.status(500).json({ error: 'Failed to list pages' });
  }
});

app.get('/api/pages/by-slug/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const [[page]] = await pool.query(
      'SELECT id, slug, title, body, updated_at FROM pages WHERE slug = ?',
      [slug]
    );
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    const [products] = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, p.stock_quantity
       FROM products p
       INNER JOIN page_products pp ON pp.product_id = p.id
       WHERE pp.page_id = ? AND p.is_published = 1
       ORDER BY pp.sort_order ASC, p.name ASC`,
      [page.id]
    );
    res.json({ page, products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load page' });
  }
});

app.get('/api/products', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, description, price, image_url, stock_quantity
       FROM products
       WHERE is_published = 1
       ORDER BY updated_at DESC, name ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'Database is missing the products table.',
        hint: 'Run: npm run db:init -w server (from project root) to apply schema.sql.',
      });
    }
    if (isMissingProductColumnError(e)) {
      return sendProductSchemaMismatch(res);
    }
    res.status(500).json({ error: 'Failed to list products' });
  }
});

/** Top published products by total units sold (order_items); max 10. Falls back to recent products if none. */
app.get('/api/products/best-sellers', async (_req, res) => {
  try {
    const [ranked] = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, p.stock_quantity,
              agg.units_sold AS units_sold
       FROM products p
       INNER JOIN (
         SELECT oi.product_id, SUM(oi.quantity) AS units_sold
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi.order_id
         GROUP BY oi.product_id
       ) agg ON agg.product_id = p.id
       WHERE p.is_published = 1
       ORDER BY agg.units_sold DESC, p.id ASC
       LIMIT 10`
    );
    if (ranked.length > 0) {
      return res.json(ranked);
    }
    const [fallback] = await pool.query(
      `SELECT id, name, description, price, image_url, stock_quantity, NULL AS units_sold
       FROM products
       WHERE is_published = 1
       ORDER BY updated_at DESC, name ASC
       LIMIT 10`
    );
    res.json(fallback);
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      try {
        const [rows] = await pool.query(
          `SELECT id, name, description, price, image_url, stock_quantity, NULL AS units_sold
           FROM products
           WHERE is_published = 1
           ORDER BY updated_at DESC, name ASC
           LIMIT 10`
        );
        return res.json(rows);
      } catch (e2) {
        console.error(e2);
        return res.json([]);
      }
    }
    if (isMissingProductColumnError(e)) {
      return sendProductSchemaMismatch(res);
    }
    res.status(500).json({ error: 'Failed to load best sellers' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const [[row]] = await pool.query(
      `SELECT id, name, description, price, image_url, stock_quantity, updated_at
       FROM products
       WHERE id = ? AND is_published = 1`,
      [id]
    );
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    let images = [];
    try {
      images = await loadProductImages(id);
    } catch (e) {
      if (e.code !== 'ER_NO_SUCH_TABLE') throw e;
    }
    res.json({ ...row, images });
  } catch (e) {
    console.error(e);
    if (isMissingProductColumnError(e)) {
      return sendProductSchemaMismatch(res);
    }
    res.status(500).json({ error: 'Failed to load product' });
  }
});

app.post('/api/orders', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { customer, shipping, billing, payment, items } = req.body ?? {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    if (!customer?.name || !customer?.email) {
      return res.status(400).json({ error: 'Customer name and email are required' });
    }
    if (!shipping?.address1 || !shipping?.city || !shipping?.state || !shipping?.postalCode || !shipping?.country) {
      return res.status(400).json({ error: 'Complete shipping address is required' });
    }
    if (
      !billing?.name ||
      !billing?.address1 ||
      !billing?.city ||
      !billing?.state ||
      !billing?.postalCode ||
      !billing?.country
    ) {
      return res.status(400).json({ error: 'Complete billing address is required' });
    }
    const cardDigits = String(payment?.cardNumber ?? '').replace(/\D/g, '');
    if (cardDigits.length < 12) {
      return res.status(400).json({ error: 'Valid card number is required' });
    }

    const productIds = items.map((it) => Number(it.productId)).filter(Boolean);
    if (productIds.length === 0) {
      return res.status(400).json({ error: 'Invalid cart items' });
    }

    const [products] = await conn.query(
      `SELECT id, name, price FROM products WHERE is_published = 1 AND id IN (${productIds
        .map(() => '?')
        .join(',')})`,
      productIds
    );
    const productMap = new Map(products.map((p) => [p.id, p]));

    const normalizedItems = [];
    for (const raw of items) {
      const productId = Number(raw.productId);
      const quantity = Math.max(1, Math.min(99, Number(raw.quantity) || 1));
      const product = productMap.get(productId);
      if (!product) continue;
      normalizedItems.push({
        productId,
        productName: product.name,
        unitPrice: Number(product.price),
        quantity,
        lineTotal: Number(product.price) * quantity,
      });
    }
    if (normalizedItems.length === 0) {
      return res.status(400).json({ error: 'No purchasable products found in cart' });
    }

    const subtotal = normalizedItems.reduce((sum, it) => sum + it.lineTotal, 0);
    const shippingMethod = String(shipping?.method ?? 'standard');
    const shippingCostMap = { standard: 9.99, express: 19.99, pickup: 0 };
    const shippingCost = shippingCostMap[shippingMethod] ?? 9.99;
    const taxAmount = Number((subtotal * 0.0825).toFixed(2));
    const total = Number((subtotal + shippingCost + taxAmount).toFixed(2));
    const ordNo = orderNumber();

    await conn.beginTransaction();
    const [orderInsert] = await conn.query(
      `INSERT INTO orders (
        order_number, status, customer_name, customer_email, customer_phone,
        shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
        shipping_method, shipping_cost,
        billing_name, billing_address1, billing_address2, billing_city, billing_state, billing_postal_code, billing_country,
        card_last4, subtotal, tax_amount, total
      ) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ordNo,
        customer.name,
        customer.email,
        customer.phone ?? null,
        shipping.address1,
        shipping.address2 ?? null,
        shipping.city,
        shipping.state,
        shipping.postalCode,
        shipping.country,
        shippingMethod,
        shippingCost.toFixed(2),
        billing.name,
        billing.address1,
        billing.address2 ?? null,
        billing.city,
        billing.state,
        billing.postalCode,
        billing.country,
        cardDigits.slice(-4),
        subtotal.toFixed(2),
        taxAmount.toFixed(2),
        total.toFixed(2),
      ]
    );
    const orderId = orderInsert.insertId;

    for (const item of normalizedItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.productName, item.unitPrice, item.quantity, item.lineTotal.toFixed(2)]
      );
    }
    await conn.commit();
    res.status(201).json({ ok: true, orderId, orderNumber: ordNo });
    void Promise.allSettled([
      sendOrderConfirmationEmail({
        to: customer.email,
        orderNumber: ordNo,
        customerName: customer.name,
        total,
        items: normalizedItems,
      }),
      sendOrderStaffNotificationEmail({
        orderNumber: ordNo,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone ?? null,
        total,
        items: normalizedItems,
        shipping,
        shippingMethod,
        shippingCost,
      }),
    ]).then((results) => {
      const [cust, staff] = results;
      if (cust.status === 'fulfilled') {
        console.log('[mail] Customer confirmation sent', ordNo, '→', customer.email);
      } else {
        console.error('[mail] Customer confirmation failed:', cust.reason?.message ?? cust.reason);
      }
      if (staff.status === 'fulfilled') {
        console.log('[mail] Staff notifications sent', ordNo);
      } else {
        console.error('[mail] Staff notification failed:', staff.reason?.message ?? staff.reason);
      }
    });
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    conn.release();
  }
});

function normalizeCustomerEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 255);
}

/** Public: list orders for checkout email, or full detail when email + order_number match. */
app.post('/api/customer/orders', async (req, res) => {
  try {
    const email = normalizeCustomerEmail(req.body?.email);
    const orderNumber = String(req.body?.orderNumber ?? '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter the same email you used at checkout.' });
    }
    if (orderNumber) {
      if (orderNumber.length > 64) {
        return res.status(400).json({ error: 'Invalid order number.' });
      }
      const [[order]] = await pool.query(
        `SELECT id, order_number, status, customer_name, customer_email, customer_phone,
                shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
                shipping_method, shipping_cost,
                billing_name, billing_address1, billing_address2, billing_city, billing_state, billing_postal_code, billing_country,
                card_last4, subtotal, tax_amount, total, created_at
         FROM orders WHERE order_number = ? AND LOWER(TRIM(customer_email)) = ?`,
        [orderNumber, email]
      );
      if (!order) {
        return res.status(404).json({
          error: 'We could not find that order for this email.',
          hint: 'Use the exact order number from your confirmation and the checkout email address.',
        });
      }
      const [items] = await pool.query(
        `SELECT id, product_id, product_name, unit_price, quantity, line_total
         FROM order_items WHERE order_id = ? ORDER BY id ASC`,
        [order.id]
      );
      return res.json({ mode: 'detail', order, items });
    }
    const [orders] = await pool.query(
      `SELECT id, order_number, status, customer_name, total, created_at, card_last4, shipping_method
       FROM orders WHERE LOWER(TRIM(customer_email)) = ?
       ORDER BY created_at DESC`,
      [email]
    );
    res.json({ mode: 'list', orders });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        error: 'Orders are not set up in the database yet.',
        hint: 'Run: npm run db:init-orders -w server',
      });
    }
    res.status(500).json({ error: 'Could not load orders.' });
  }
});

// --- Auth ---

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body ?? {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ ok: true });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { sameSite: 'lax' });
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.json({ authenticated: false });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    return res.json({ authenticated: true });
  } catch {
    return res.json({ authenticated: false });
  }
});

// --- Admin: pages ---

app.get('/api/admin/pages', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, slug, title, body, updated_at FROM pages ORDER BY title ASC'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list pages' });
  }
});

app.post('/api/admin/pages', authMiddleware, async (req, res) => {
  try {
    const { title, slug, body } = req.body ?? {};
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    const finalSlug = slugify(slug || title);
    const [result] = await pool.query(
      'INSERT INTO pages (slug, title, body) VALUES (?, ?, ?)',
      [finalSlug, title, body ?? null]
    );
    res.status(201).json({ id: result.insertId, slug: finalSlug });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to create page' });
  }
});

app.put('/api/admin/pages/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, slug, body } = req.body ?? {};
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    const finalSlug = slugify(slug || title);
    const [result] = await pool.query(
      'UPDATE pages SET title = ?, slug = ?, body = ? WHERE id = ?',
      [title, finalSlug, body ?? null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json({ ok: true, slug: finalSlug });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to update page' });
  }
});

app.delete('/api/admin/pages/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.query('DELETE FROM pages WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// --- Admin: products ---

app.post('/api/admin/products/seed-examples', authMiddleware, async (_req, res) => {
  const conn = await pool.getConnection();
  try {
    await ensureProductInventoryColumns(conn);
    await ensureProductImagesTable(conn);
    await seedDemoProducts(conn);
    const [[row]] = await conn.query('SELECT COUNT(*) AS cnt FROM products');
    res.json({ ok: true, productCount: Number(row.cnt) });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e.message || 'Failed to seed example products',
    });
  } finally {
    conn.release();
  }
});

app.get('/api/admin/products/csv-template', authMiddleware, (_req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="products-import-template.csv"');
  res.send(PRODUCT_CSV_TEMPLATE);
});

app.post('/api/admin/products/import', authMiddleware, async (req, res) => {
  try {
    const csv = req.body?.csv;
    if (typeof csv !== 'string') {
      return res.status(400).json({ error: 'JSON body must include a string field "csv"' });
    }
    const result = await importProductsFromCsv(pool, csv);
    res.json(result);
  } catch (e) {
    if (e.code === 'ER_BAD_FIELD_ERROR' || String(e.message || '').includes('Unknown column')) {
      return res.status(500).json({
        error: 'Database is missing sku/stock columns.',
        hint: 'Run: npm run db:bootstrap-products -w server',
      });
    }
    console.error(e);
    res.status(500).json({ error: 'Import failed' });
  }
});

app.get('/api/admin/products', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, sku, name, description, price, stock_quantity, image_url, is_published, updated_at FROM products ORDER BY name ASC'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    if (isMissingProductColumnError(e)) {
      return sendProductSchemaMismatch(res);
    }
    res.status(500).json({ error: 'Failed to list products' });
  }
});

app.get('/api/admin/products/by-id/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const [[product]] = await pool.query(
      `SELECT id, sku, name, description, price, stock_quantity, image_url, is_published, updated_at
       FROM products WHERE id = ?`,
      [id]
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    let images = [];
    try {
      images = await loadProductImages(id);
    } catch (e) {
      if (e.code !== 'ER_NO_SUCH_TABLE') throw e;
    }
    res.json({ ...product, images });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

app.post(
  '/api/admin/products/:id/images',
  authMiddleware,
  (req, res, next) => {
    productImageUpload.array('images', 16)(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
      next();
    });
  },
  async (req, res) => {
    const productId = Number(req.params.id);
    if (!productId) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const files = req.files;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No image files received (use field name "images")' });
    }
    try {
      const [[p]] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
      if (!p) {
        for (const f of files) {
          try {
            fs.unlinkSync(f.path);
          } catch (_) {
            /* ignore */
          }
        }
        return res.status(404).json({ error: 'Product not found' });
      }
      const [[rowMax]] = await pool.query(
        'SELECT COALESCE(MAX(sort_order), -1) AS mx FROM product_images WHERE product_id = ?',
        [productId]
      );
      let sortOrder = Number(rowMax.mx) + 1;
      for (const f of files) {
        const publicPath = `/uploads/products/${productId}/${f.filename}`;
        await pool.query('INSERT INTO product_images (product_id, path, sort_order) VALUES (?, ?, ?)', [
          productId,
          publicPath,
          sortOrder,
        ]);
        sortOrder += 1;
      }
      try {
        await syncProductThumbnail(productId);
      } catch (syncErr) {
        console.error('[syncProductThumbnail]', syncErr);
      }
      const images = await loadProductImages(productId);
      res.status(201).json({ ok: true, images });
    } catch (e) {
      console.error(e);
      for (const f of files) {
        try {
          fs.unlinkSync(f.path);
        } catch (_) {
          /* ignore */
        }
      }
      if (e.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          error: 'product_images table is missing.',
          hint: 'Run: npm run db:migrate-product-images -w server, or restart the API.',
        });
      }
      if (isMissingProductColumnError(e)) {
        return res.status(500).json({
          error: 'The products table is missing a column needed for image uploads (often image_url).',
          hint: 'Restart the API to apply automatic schema repair, or run: npm run db:init -w server',
          detail: e.sqlMessage || e.message,
        });
      }
      res.status(500).json({
        error: 'Failed to save uploads',
        detail: e.sqlMessage || e.message,
      });
    }
  }
);

app.delete(
  '/api/admin/products/:productId/images/:imageId',
  authMiddleware,
  async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const imageId = Number(req.params.imageId);
      if (!productId || !imageId) {
        return res.status(400).json({ error: 'Invalid id' });
      }
      const [[row]] = await pool.query(
        'SELECT path FROM product_images WHERE id = ? AND product_id = ?',
        [imageId, productId]
      );
      if (!row) {
        return res.status(404).json({ error: 'Image not found' });
      }
      deleteDiskPath(row.path);
      await pool.query('DELETE FROM product_images WHERE id = ?', [imageId]);
      await syncProductThumbnail(productId);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }
);

app.post('/api/admin/products', authMiddleware, async (req, res) => {
  try {
    const { name, description, price, image_url, is_published, sku, stock_quantity } = req.body ?? {};
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const skuVal = sku != null && String(sku).trim() !== '' ? String(sku).trim().slice(0, 64) : null;
    const stock = Math.max(0, Math.min(9999999, Math.floor(Number(stock_quantity) || 0)));
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, image_url, is_published, sku, stock_quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        description ?? null,
        Number(price) || 0,
        image_url ?? null,
        is_published ? 1 : 0,
        skuVal,
        stock,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'SKU already in use' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/admin/products/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, price, image_url, is_published, sku, stock_quantity } = req.body ?? {};
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const skuVal = sku != null && String(sku).trim() !== '' ? String(sku).trim().slice(0, 64) : null;
    const stock = Math.max(0, Math.min(9999999, Math.floor(Number(stock_quantity) || 0)));
    const [result] = await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, is_published = ?, sku = ?, stock_quantity = ? WHERE id = ?',
      [
        name,
        description ?? null,
        Number(price) || 0,
        image_url ?? null,
        is_published ? 1 : 0,
        skuVal,
        stock,
        id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    try {
      await syncProductThumbnail(id);
    } catch (_) {
      /* product_images table may be missing on old DBs */
    }
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'SKU already in use' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/admin/products/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    let imgs = [];
    try {
      const [rows] = await pool.query('SELECT path FROM product_images WHERE product_id = ?', [id]);
      imgs = rows;
    } catch (_) {
      /* product_images may not exist */
    }
    for (const im of imgs) {
      deleteDiskPath(im.path);
    }
    const dir = path.join(UPLOAD_ROOT, 'products', String(id));
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// --- Admin: assign products to page ---

app.get('/api/admin/pages/:id/products', authMiddleware, async (req, res) => {
  try {
    const pageId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.is_published, pp.sort_order
       FROM page_products pp
       INNER JOIN products p ON p.id = pp.product_id
       WHERE pp.page_id = ?
       ORDER BY pp.sort_order ASC, p.name ASC`,
      [pageId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load page products' });
  }
});

app.put('/api/admin/pages/:id/products', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const pageId = Number(req.params.id);
    const { productIds } = req.body ?? {};
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds must be an array' });
    }
    const [[page]] = await conn.query('SELECT id FROM pages WHERE id = ?', [pageId]);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    await conn.beginTransaction();
    await conn.query('DELETE FROM page_products WHERE page_id = ?', [pageId]);
    let sort = 0;
    for (const pid of productIds) {
      const id = Number(pid);
      if (!id) continue;
      await conn.query(
        'INSERT INTO page_products (page_id, product_id, sort_order) VALUES (?, ?, ?)',
        [pageId, id, sort++]
      );
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to save page products' });
  } finally {
    conn.release();
  }
});

// --- Admin: orders ---

app.get('/api/admin/orders', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, order_number, status, customer_name, customer_email, subtotal, tax_amount, shipping_cost, total, created_at
       FROM orders
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

app.get('/api/admin/orders/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [[order]] = await pool.query(
      `SELECT id, order_number, status, customer_name, customer_email, customer_phone,
              shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
              shipping_method, shipping_cost,
              billing_name, billing_address1, billing_address2, billing_city, billing_state, billing_postal_code, billing_country,
              card_last4, subtotal, tax_amount, total, created_at
       FROM orders WHERE id = ?`,
      [id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const [items] = await pool.query(
      `SELECT id, product_id, product_name, unit_price, quantity, line_total
       FROM order_items WHERE order_id = ? ORDER BY id ASC`,
      [id]
    );
    res.json({ order, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load order details' });
  }
});

app.put('/api/admin/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status ?? '').trim().toLowerCase();
    const allowed = new Set(['pending', 'paid', 'fulfilled', 'cancelled']);
    if (!allowed.has(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

async function startServer() {
  try {
    await ensurePagesTable(pool);
  } catch (e) {
    console.error('[ensurePagesTable]', e?.message || e);
  }
  try {
    await ensureProductInventoryColumns(pool);
  } catch (e) {
    console.error('[ensureProductInventoryColumns]', e?.message || e);
  }
  try {
    await ensureProductImagesTable(pool);
  } catch (e) {
    console.error('[ensureProductImagesTable]', e?.message || e);
  }
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

startServer();
