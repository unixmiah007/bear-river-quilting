import mysql from 'mysql2/promise';
import 'dotenv/config';

function normalizedPassword(raw) {
  if (!raw || raw === 'your_password') return '';
  return raw;
}

const CURATED_QUILT_URLS = [
  'https://images.unsplash.com/photo-1616628182509-6f5b5c05463f?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1617104551722-3b2d51366443?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1617325247661-675ab4b64f64?auto=format&fit=crop&w=1600&q=80',
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? 'root',
    password: normalizedPassword(process.env.MYSQL_PASSWORD),
    database: process.env.MYSQL_DATABASE ?? 'cms_store',
  });

  const [rows] = await conn.query('SELECT id FROM products ORDER BY id ASC');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const url = CURATED_QUILT_URLS[i % CURATED_QUILT_URLS.length];
    await conn.query('UPDATE products SET image_url = ? WHERE id = ?', [url, row.id]);
  }

  await conn.end();
  console.log(`Updated ${rows.length} product images to handmade quilt theme.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
