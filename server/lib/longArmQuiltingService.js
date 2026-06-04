import pool from '../db.js';

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapServiceRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    hourly_rate: row.hourly_rate != null ? Number(row.hourly_rate) : null,
    image_url: row.image_url,
    is_published: !!row.is_published,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listPublishedLongArmServices() {
  const [rows] = await pool.query(
    `SELECT id, slug, name, description, hourly_rate, image_url, sort_order, created_at, updated_at
     FROM long_arm_quilting_services
     WHERE is_published = 1
     ORDER BY sort_order ASC, name ASC`
  );
  return rows.map(mapServiceRow);
}

export async function listAllLongArmServices() {
  const [rows] = await pool.query(
    `SELECT id, slug, name, description, hourly_rate, image_url, is_published, sort_order, created_at, updated_at
     FROM long_arm_quilting_services
     ORDER BY sort_order ASC, name ASC`
  );
  return rows.map(mapServiceRow);
}

export async function getLongArmServiceById(id) {
  const [[row]] = await pool.query(
    `SELECT id, slug, name, description, hourly_rate, image_url, is_published, sort_order, created_at, updated_at
     FROM long_arm_quilting_services WHERE id = ?`,
    [id]
  );
  return mapServiceRow(row);
}

export async function createLongArmService(body) {
  const name = String(body?.name ?? '').trim();
  if (!name) {
    return { ok: false, status: 400, error: 'name is required' };
  }
  const slug = slugify(body?.slug || name);
  const description = String(body?.description ?? '').trim() || null;
  const hourlyRaw = body?.hourly_rate ?? body?.hourlyRate;
  const hourlyRate =
    hourlyRaw === '' || hourlyRaw == null ? null : Number.isFinite(Number(hourlyRaw)) ? Number(hourlyRaw) : null;
  const sortOrder = Number.isFinite(Number(body?.sort_order ?? body?.sortOrder))
    ? Number(body.sort_order ?? body.sortOrder)
    : 0;
  const isPublished = body?.is_published !== false && body?.isPublished !== false;

  try {
    const [result] = await pool.query(
      `INSERT INTO long_arm_quilting_services (slug, name, description, hourly_rate, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [slug, name, description, hourlyRate, sortOrder, isPublished ? 1 : 0]
    );
    return { ok: true, id: result.insertId, slug };
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return { ok: false, status: 409, error: 'Slug already exists' };
    }
    throw e;
  }
}

export async function updateLongArmService(id, body) {
  const serviceId = Number(id);
  if (!serviceId) {
    return { ok: false, status: 400, error: 'Invalid service id' };
  }
  const name = String(body?.name ?? '').trim();
  if (!name) {
    return { ok: false, status: 400, error: 'name is required' };
  }
  const slug = slugify(body?.slug || name);
  const description = String(body?.description ?? '').trim() || null;
  const hourlyRaw = body?.hourly_rate ?? body?.hourlyRate;
  const hourlyRate =
    hourlyRaw === '' || hourlyRaw == null ? null : Number.isFinite(Number(hourlyRaw)) ? Number(hourlyRaw) : null;
  const sortOrder = Number.isFinite(Number(body?.sort_order ?? body?.sortOrder))
    ? Number(body.sort_order ?? body.sortOrder)
    : 0;
  const isPublished = body?.is_published !== false && body?.isPublished !== false;

  try {
    const [result] = await pool.query(
      `UPDATE long_arm_quilting_services
       SET slug = ?, name = ?, description = ?, hourly_rate = ?, sort_order = ?, is_published = ?
       WHERE id = ?`,
      [slug, name, description, hourlyRate, sortOrder, isPublished ? 1 : 0, serviceId]
    );
    if (result.affectedRows === 0) {
      return { ok: false, status: 404, error: 'Service not found' };
    }
    return { ok: true, slug };
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return { ok: false, status: 409, error: 'Slug already exists' };
    }
    throw e;
  }
}

export async function deleteLongArmService(id) {
  const serviceId = Number(id);
  const [result] = await pool.query('DELETE FROM long_arm_quilting_services WHERE id = ?', [serviceId]);
  if (result.affectedRows === 0) {
    return { ok: false, status: 404, error: 'Service not found' };
  }
  return { ok: true };
}

export async function setLongArmServiceImage(id, imageUrl) {
  const serviceId = Number(id);
  const [result] = await pool.query('UPDATE long_arm_quilting_services SET image_url = ? WHERE id = ?', [
    imageUrl,
    serviceId,
  ]);
  if (result.affectedRows === 0) {
    return { ok: false, status: 404, error: 'Service not found' };
  }
  return { ok: true, image_url: imageUrl };
}

export async function setLongArmServiceVisibility(id, isPublished) {
  const serviceId = Number(id);
  const [result] = await pool.query('UPDATE long_arm_quilting_services SET is_published = ? WHERE id = ?', [
    isPublished ? 1 : 0,
    serviceId,
  ]);
  if (result.affectedRows === 0) {
    return { ok: false, status: 404, error: 'Service not found' };
  }
  return { ok: true };
}

export async function loadServicesByIds(ids) {
  const unique = [...new Set(ids.map(Number).filter((n) => n > 0))];
  if (unique.length === 0) return [];
  const [rows] = await pool.query(
    `SELECT id, slug, name, description, hourly_rate, image_url, is_published, sort_order
     FROM long_arm_quilting_services
     WHERE id IN (${unique.map(() => '?').join(',')}) AND is_published = 1`,
    unique
  );
  return rows.map(mapServiceRow);
}
