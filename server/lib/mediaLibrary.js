import fs from 'node:fs';
import path from 'node:path';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export function isImageFilename(name) {
  return IMAGE_EXT.has(path.extname(String(name ?? '')).toLowerCase());
}

export function webPathFromAbs(uploadRoot, absPath) {
  const rel = path.relative(uploadRoot, absPath).split(path.sep).join('/');
  return `/uploads/${rel}`;
}

export function absPathFromWeb(uploadRoot, webPath) {
  if (!webPath || !String(webPath).startsWith('/uploads/')) return null;
  const rel = String(webPath).replace(/^\/uploads\/?/, '');
  return path.join(uploadRoot, rel);
}

function walkImages(dir, uploadRoot, out) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkImages(abs, uploadRoot, out);
    } else if (ent.isFile() && isImageFilename(ent.name)) {
      out.push({
        abs,
        webPath: webPathFromAbs(uploadRoot, abs),
        filename: ent.name,
      });
    }
  }
}

export async function listMediaAssets(pool) {
  const [rows] = await pool.query(
    `SELECT id, path, filename, source, created_at
     FROM media_assets
     ORDER BY created_at DESC, id DESC`
  );
  return rows;
}

export async function scanUploadsIntoMedia(pool, uploadRoot) {
  const found = [];
  walkImages(uploadRoot, uploadRoot, found);

  const [existing] = await pool.query('SELECT path FROM media_assets');
  const known = new Set(existing.map((r) => r.path));

  let added = 0;
  for (const file of found) {
    if (known.has(file.webPath)) continue;
    try {
      await pool.query(
        'INSERT INTO media_assets (path, filename, source) VALUES (?, ?, ?)',
        [file.webPath, file.filename, 'scan']
      );
      known.add(file.webPath);
      added += 1;
    } catch (e) {
      if (e.code !== 'ER_DUP_ENTRY') throw e;
    }
  }
  return { added, total: known.size };
}

export async function countMediaUsage(pool, webPath) {
  const [[pi]] = await pool.query('SELECT COUNT(*) AS c FROM product_images WHERE path = ?', [webPath]);
  const [[pr]] = await pool.query('SELECT COUNT(*) AS c FROM products WHERE image_url = ?', [webPath]);
  return Number(pi.c) + Number(pr.c);
}

export async function deleteMediaAsset(pool, uploadRoot, id) {
  const [[row]] = await pool.query('SELECT id, path FROM media_assets WHERE id = ?', [id]);
  if (!row) return { ok: false, status: 404, error: 'Media not found' };

  const usage = await countMediaUsage(pool, row.path);
  if (usage > 0) {
    return {
      ok: false,
      status: 409,
      error: 'This image is still used on a product. Remove it from products first, or only delete unused library files.',
    };
  }

  const abs = absPathFromWeb(uploadRoot, row.path);
  if (abs && fs.existsSync(abs)) {
    fs.unlinkSync(abs);
  }
  await pool.query('DELETE FROM media_assets WHERE id = ?', [id]);
  return { ok: true };
}

export async function copyMediaPathsToProduct(pool, uploadRoot, productId, paths) {
  const [[p]] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
  if (!p) return { ok: false, status: 404, error: 'Product not found' };

  const [[rowMax]] = await pool.query(
    'SELECT COALESCE(MAX(sort_order), -1) AS mx FROM product_images WHERE product_id = ?',
    [productId]
  );
  let sortOrder = Number(rowMax.mx) + 1;
  const productDir = path.join(uploadRoot, 'products', String(productId));
  fs.mkdirSync(productDir, { recursive: true });

  const added = [];
  for (const webPath of paths) {
    const srcAbs = absPathFromWeb(uploadRoot, webPath);
    if (!srcAbs || !fs.existsSync(srcAbs)) continue;

    const ext = path.extname(srcAbs).toLowerCase() || '.jpg';
    const destName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const destAbs = path.join(productDir, destName);
    fs.copyFileSync(srcAbs, destAbs);
    const publicPath = `/uploads/products/${productId}/${destName}`;
    const [result] = await pool.query(
      'INSERT INTO product_images (product_id, path, sort_order) VALUES (?, ?, ?)',
      [productId, publicPath, sortOrder]
    );
    sortOrder += 1;
    added.push({ id: result.insertId, url: publicPath, sort_order: sortOrder - 1 });
  }

  return { ok: true, added };
}

export async function copyMediaIdsToProduct(pool, uploadRoot, productId, mediaIds) {
  const ids = [...new Set(mediaIds.map((x) => Number(x)).filter((n) => n > 0))];
  if (!ids.length) return { ok: false, status: 400, error: 'No media selected' };
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT id, path FROM media_assets WHERE id IN (${placeholders})`,
    ids
  );
  const paths = rows.map((r) => r.path);
  if (!paths.length) return { ok: false, status: 404, error: 'Selected media not found' };
  return copyMediaPathsToProduct(pool, uploadRoot, productId, paths);
}
