import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import pool from './db.js';

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
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

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

// --- Public ---

app.get('/api/pages', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, slug, title, updated_at FROM pages ORDER BY title ASC'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
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
      `SELECT p.id, p.name, p.description, p.price, p.image_url
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

app.get('/api/admin/products', authMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description, price, image_url, is_published, updated_at FROM products ORDER BY name ASC'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

app.post('/api/admin/products', authMiddleware, async (req, res) => {
  try {
    const { name, description, price, image_url, is_published } = req.body ?? {};
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, image_url, is_published) VALUES (?, ?, ?, ?, ?)',
      [
        name,
        description ?? null,
        Number(price) || 0,
        image_url ?? null,
        is_published ? 1 : 0,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/admin/products/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, price, image_url, is_published } = req.body ?? {};
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const [result] = await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, is_published = ? WHERE id = ?',
      [
        name,
        description ?? null,
        Number(price) || 0,
        image_url ?? null,
        is_published ? 1 : 0,
        id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/admin/products/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
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

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
