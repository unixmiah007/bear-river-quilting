import pool from '../db.js';

function mapPaletteRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    price: row.price != null ? Number(row.price) : null,
    image_url: row.image_url,
    is_published: !!row.is_published,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listPublishedLongArmBlanketPalettes() {
  const [rows] = await pool.query(
    `SELECT id, title, price, image_url, sort_order, created_at, updated_at
     FROM long_arm_blanket_palettes
     WHERE is_published = 1
     ORDER BY sort_order ASC, title ASC`
  );
  return rows.map(mapPaletteRow);
}

export async function listAllLongArmBlanketPalettes() {
  const [rows] = await pool.query(
    `SELECT id, title, price, image_url, is_published, sort_order, created_at, updated_at
     FROM long_arm_blanket_palettes
     ORDER BY sort_order ASC, title ASC`
  );
  return rows.map(mapPaletteRow);
}

export async function getLongArmBlanketPaletteById(id) {
  const [[row]] = await pool.query(
    `SELECT id, title, price, image_url, is_published, sort_order, created_at, updated_at
     FROM long_arm_blanket_palettes WHERE id = ?`,
    [id]
  );
  return mapPaletteRow(row);
}

export async function getPublishedLongArmBlanketPaletteById(id) {
  const paletteId = Number(id);
  if (!paletteId) return null;
  const [[row]] = await pool.query(
    `SELECT id, title, price, image_url, is_published, sort_order, created_at, updated_at
     FROM long_arm_blanket_palettes WHERE id = ? AND is_published = 1`,
    [paletteId]
  );
  return mapPaletteRow(row);
}

export async function createLongArmBlanketPalette(body) {
  const title = String(body?.title ?? '').trim();
  if (!title) {
    return { ok: false, status: 400, error: 'title is required' };
  }
  const priceRaw = body?.price ?? body?.base_price;
  const price = Number.isFinite(Number(priceRaw)) ? Number(priceRaw) : null;
  if (price == null || price < 0) {
    return { ok: false, status: 400, error: 'price is required and must be zero or greater' };
  }
  const sortOrder = Number.isFinite(Number(body?.sort_order ?? body?.sortOrder))
    ? Number(body.sort_order ?? body.sortOrder)
    : 0;
  const isPublished = body?.is_published !== false && body?.isPublished !== false;

  const [result] = await pool.query(
    `INSERT INTO long_arm_blanket_palettes (title, price, sort_order, is_published)
     VALUES (?, ?, ?, ?)`,
    [title, price, sortOrder, isPublished ? 1 : 0]
  );
  return { ok: true, id: result.insertId };
}

export async function updateLongArmBlanketPalette(id, body) {
  const paletteId = Number(id);
  if (!paletteId) {
    return { ok: false, status: 400, error: 'Invalid palette id' };
  }
  const title = String(body?.title ?? '').trim();
  if (!title) {
    return { ok: false, status: 400, error: 'title is required' };
  }
  const priceRaw = body?.price ?? body?.base_price;
  const price = Number.isFinite(Number(priceRaw)) ? Number(priceRaw) : null;
  if (price == null || price < 0) {
    return { ok: false, status: 400, error: 'price is required and must be zero or greater' };
  }
  const sortOrder = Number.isFinite(Number(body?.sort_order ?? body?.sortOrder))
    ? Number(body.sort_order ?? body.sortOrder)
    : 0;
  const isPublished = body?.is_published !== false && body?.isPublished !== false;

  const [result] = await pool.query(
    `UPDATE long_arm_blanket_palettes
     SET title = ?, price = ?, sort_order = ?, is_published = ?
     WHERE id = ?`,
    [title, price, sortOrder, isPublished ? 1 : 0, paletteId]
  );
  if (result.affectedRows === 0) {
    return { ok: false, status: 404, error: 'Palette item not found' };
  }
  return { ok: true };
}

export async function deleteLongArmBlanketPalette(id) {
  const paletteId = Number(id);
  const [result] = await pool.query('DELETE FROM long_arm_blanket_palettes WHERE id = ?', [paletteId]);
  if (result.affectedRows === 0) {
    return { ok: false, status: 404, error: 'Palette item not found' };
  }
  return { ok: true };
}

export async function setLongArmBlanketPaletteImage(id, imageUrl) {
  const paletteId = Number(id);
  const [result] = await pool.query('UPDATE long_arm_blanket_palettes SET image_url = ? WHERE id = ?', [
    imageUrl,
    paletteId,
  ]);
  if (result.affectedRows === 0) {
    return { ok: false, status: 404, error: 'Palette item not found' };
  }
  return { ok: true, image_url: imageUrl };
}

export async function setLongArmBlanketPaletteVisibility(id, isPublished) {
  const paletteId = Number(id);
  const [result] = await pool.query('UPDATE long_arm_blanket_palettes SET is_published = ? WHERE id = ?', [
    isPublished ? 1 : 0,
    paletteId,
  ]);
  if (result.affectedRows === 0) {
    return { ok: false, status: 404, error: 'Palette item not found' };
  }
  return { ok: true };
}
