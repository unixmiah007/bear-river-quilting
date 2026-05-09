import mysql from 'mysql2/promise';
import 'dotenv/config';
import { seedDemoProducts } from '../lib/seedDemoProducts.js';

function normalizedPassword(raw) {
  if (!raw || raw === 'your_password') return '';
  return raw;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? 'root',
    password: normalizedPassword(process.env.MYSQL_PASSWORD),
    database: process.env.MYSQL_DATABASE ?? 'cms_store',
  });

  try {
    const { placeholderCount, baseCatalogIds } = await seedDemoProducts(conn);
    console.log(
      `Updated images for catalog ids ${baseCatalogIds.join(', ')} (if rows exist). Seeded ${placeholderCount} handmade quilt placeholders (ids 3001–3050).`
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
