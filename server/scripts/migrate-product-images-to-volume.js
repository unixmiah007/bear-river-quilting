/**
 * migrate-product-images-to-volume.js
 *
 * Fetches every product image referenced in the product_images table from the
 * live website and writes it to the persistent volume at
 * /app/server/uploads/products/{product_id}/{filename}.
 *
 * Safe to run multiple times — existing files are skipped unless they are
 * zero-length (indicating a previous partial write).
 *
 * Usage:
 *   node server/scripts/migrate-product-images-to-volume.js
 *   npm run migrate:product-images -w server
 *
 * Environment variables (same as the main server):
 *   MYSQL_PUBLIC_URL  — preferred; full connection string (mysql://user:pass@host:port/db)
 *   MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE  — fallback
 *
 * The live website base URL can be overridden with:
 *   LIVE_SITE_URL=https://bear-river-quilting-production-5ec2.up.railway.app
 */

import '../loadEnv.js';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import mysql from 'mysql2/promise';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const LIVE_SITE_URL =
  (process.env.LIVE_SITE_URL ?? 'https://bear-river-quilting-production-5ec2.up.railway.app')
    .replace(/\/$/, '');

// Use absolute path /app/server/uploads in production, or relative path for local dev
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.resolve(process.cwd(), 'server', 'uploads');

function normalizedPassword(raw) {
  if (!raw || raw === 'your_password') return '';
  return raw;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

/**
 * Download a URL to a local file path.
 * Returns a promise that resolves to { ok: true } or { ok: false, reason }.
 */
function downloadToFile(url, destPath) {
  return new Promise((resolve) => {
    const transport = url.startsWith('https://') ? https : http;

    const request = transport.get(url, { timeout: 30_000 }, (res) => {
      // Follow a single redirect (Railway / CDN may issue one).
      if (
        (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) &&
        res.headers.location
      ) {
        res.resume(); // drain the redirect body
        downloadToFile(res.headers.location, destPath).then(resolve);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        resolve({ ok: false, reason: `HTTP ${res.statusCode}` });
        return;
      }

      const tmp = destPath + '.tmp';
      const out = fs.createWriteStream(tmp);

      res.pipe(out);

      out.on('finish', () => {
        out.close(() => {
          try {
            fs.renameSync(tmp, destPath);
            resolve({ ok: true });
          } catch (e) {
            resolve({ ok: false, reason: `rename failed: ${e.message}` });
          }
        });
      });

      out.on('error', (e) => {
        fs.unlink(tmp, () => {});
        resolve({ ok: false, reason: `write error: ${e.message}` });
      });
    });

    request.on('error', (e) => {
      resolve({ ok: false, reason: `request error: ${e.message}` });
    });

    request.on('timeout', () => {
      request.destroy();
      resolve({ ok: false, reason: 'request timed out' });
    });
  });
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/**
 * Given a DB path like /uploads/products/3044/image.jpg, return:
 *   { productId: '3044', filename: 'image.jpg', normalizedPath: '/uploads/products/3044/image.jpg' }
 * Returns null if the path doesn't match the expected pattern.
 */
function parseImagePath(dbPath) {
  if (!dbPath || typeof dbPath !== 'string') return null;

  // Normalise: strip leading slash, split
  const clean = dbPath.replace(/^\/+/, '');
  const parts = clean.split('/');

  // Expected: uploads / products / {id} / {filename}
  if (parts.length < 4) return null;
  if (parts[0] !== 'uploads' || parts[1] !== 'products') return null;

  const productId = parts[2];
  const filename = parts.slice(3).join('/'); // handles any sub-path
  if (!productId || !filename) return null;

  return {
    productId,
    filename,
    normalizedPath: `/uploads/products/${productId}/${filename}`,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== migrate-product-images-to-volume ===');
  console.log(`Live site : ${LIVE_SITE_URL}`);
  console.log(`Upload root: ${UPLOAD_ROOT}`);
  console.log('');

  // -- DB connection --
  // Prefer MYSQL_PUBLIC_URL (TCP proxy) so the script works in the Railway
  // shell even when private DNS (mysql.railway.internal) is unavailable.
  let connConfig;
  if (process.env.MYSQL_PUBLIC_URL) {
    const u = new URL(process.env.MYSQL_PUBLIC_URL);
    connConfig = {
      host: u.hostname,
      port: Number(u.port) || 3306,
      user: decodeURIComponent(u.username),
      password: normalizedPassword(decodeURIComponent(u.password)),
      database: u.pathname.replace(/^\//, ''),
    };
    console.log(`DB: using MYSQL_PUBLIC_URL (${u.hostname}:${u.port})`);
  } else {
    connConfig = {
      host: process.env.MYSQL_HOST ?? '127.0.0.1',
      port: Number(process.env.MYSQL_PORT ?? 3306),
      user: process.env.MYSQL_USER ?? 'root',
      password: normalizedPassword(process.env.MYSQL_PASSWORD),
      database: process.env.MYSQL_DATABASE ?? 'cms_store',
    };
    console.log(`DB: using MYSQL_HOST (${connConfig.host}:${connConfig.port})`);
  }
  const conn = await mysql.createConnection(connConfig);

  let rows;
  try {
    [rows] = await conn.query(
      'SELECT id, product_id, path FROM product_images ORDER BY product_id ASC, id ASC'
    );
  } catch (e) {
    console.error('Failed to query product_images:', e.message);
    await conn.end();
    process.exit(1);
  }

  console.log(`Found ${rows.length} image row(s) in product_images.\n`);

  const stats = { total: rows.length, skipped: 0, migrated: 0, updated: 0, failed: 0 };

  for (const row of rows) {
    const parsed = parseImagePath(row.path);

    if (!parsed) {
      // Path doesn't look like a local upload — could be an external URL; skip.
      console.log(`[SKIP]  id=${row.id} — unrecognised path format: ${row.path}`);
      stats.skipped++;
      continue;
    }

    const { productId, filename, normalizedPath } = parsed;
    const destDir = path.join(UPLOAD_ROOT, 'products', productId);
    const destFile = path.join(destDir, filename);

    // Idempotency: skip if file already exists and is non-empty.
    if (fs.existsSync(destFile) && fs.statSync(destFile).size > 0) {
      console.log(`[SKIP]  id=${row.id} — already on disk: ${destFile}`);
      stats.skipped++;

      // Still fix the DB path if it differs from the canonical form.
      if (row.path !== normalizedPath) {
        await conn.query('UPDATE product_images SET path = ? WHERE id = ?', [normalizedPath, row.id]);
        console.log(`        ↳ DB path corrected: ${row.path} → ${normalizedPath}`);
        stats.updated++;
      }
      continue;
    }

    // Ensure the directory exists.
    fs.mkdirSync(destDir, { recursive: true });

    const fetchUrl = `${LIVE_SITE_URL}${normalizedPath}`;
    process.stdout.write(`[FETCH] id=${row.id} ${fetchUrl} … `);

    const result = await downloadToFile(fetchUrl, destFile);

    if (!result.ok) {
      console.log(`FAILED (${result.reason})`);
      stats.failed++;
      continue;
    }

    const bytes = fs.statSync(destFile).size;
    console.log(`OK (${bytes} bytes)`);
    stats.migrated++;

    // Update DB path to canonical form if it differs.
    if (row.path !== normalizedPath) {
      await conn.query('UPDATE product_images SET path = ? WHERE id = ?', [normalizedPath, row.id]);
      console.log(`        ↳ DB path corrected: ${row.path} → ${normalizedPath}`);
      stats.updated++;
    }
  }

  await conn.end();

  // -- Summary --
  console.log('');
  console.log('=== Summary ===');
  console.log(`Total images : ${stats.total}`);
  console.log(`Migrated     : ${stats.migrated}`);
  console.log(`Skipped      : ${stats.skipped}  (already on disk)`);
  console.log(`DB paths fixed: ${stats.updated}`);
  console.log(`Failed       : ${stats.failed}`);

  if (stats.failed > 0) {
    console.log('\nSome images could not be fetched. Check the log above for details.');
    console.log('You can re-run this script at any time — already-migrated files will be skipped.');
    process.exit(1);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
