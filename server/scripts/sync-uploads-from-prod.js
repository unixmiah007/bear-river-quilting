import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const PROD_ORIGIN = (
  process.env.PROD_ORIGIN ??
  process.env.RAILWAY_PUBLIC_URL ??
  'https://bear-river-quilting-production-5ec2.up.railway.app'
).replace(/\/$/, '');

function webPathToLocal(webPath) {
  if (!webPath || typeof webPath !== 'string') return null;
  if (!webPath.startsWith('/uploads/')) return null;
  const rel = webPath.replace(/^\/uploads\/?/, '');
  return path.join(UPLOAD_ROOT, rel);
}

async function collectPaths(conn) {
  const paths = new Set();
  const [products] = await conn.query(
    `SELECT image_url FROM products WHERE image_url LIKE '/uploads/%'`
  );
  for (const row of products) paths.add(row.image_url);
  const [images] = await conn.query(
    `SELECT path FROM product_images WHERE path LIKE '/uploads/%'`
  );
  for (const row of images) paths.add(row.path);
  return [...paths].sort();
}

async function downloadFile(webPath) {
  const url = `${PROD_ORIGIN}${webPath}`;
  const localPath = webPathToLocal(webPath);
  if (!localPath) return { webPath, ok: false, error: 'invalid path' };

  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  if (fs.existsSync(localPath)) {
    return { webPath, ok: true, skipped: true };
  }

  const res = await fetch(url);
  if (!res.ok) {
    return { webPath, ok: false, error: `${res.status} ${res.statusText}` };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(localPath, buf);
  return { webPath, ok: true, bytes: buf.length };
}

async function main() {
  const conn = await pool.getConnection();
  try {
    const paths = await collectPaths(conn);
    if (paths.length === 0) {
      console.log('No /uploads/ paths found in the database.');
      return;
    }

    console.log(`Downloading ${paths.length} file(s) from ${PROD_ORIGIN}…`);
    let ok = 0;
    let skipped = 0;
    let failed = 0;

    for (const webPath of paths) {
      try {
        const result = await downloadFile(webPath);
        if (result.ok && result.skipped) {
          skipped += 1;
          process.stdout.write('.');
        } else if (result.ok) {
          ok += 1;
          process.stdout.write('+');
        } else {
          failed += 1;
          console.error(`\n✗ ${webPath}: ${result.error}`);
        }
      } catch (e) {
        failed += 1;
        console.error(`\n✗ ${webPath}: ${e.message}`);
      }
    }

    console.log(`\nDone. ${ok} downloaded, ${skipped} already present, ${failed} failed.`);
    console.log(`Local uploads root: ${UPLOAD_ROOT}`);
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
