import mysql from 'mysql2/promise';
import 'dotenv/config';
import { ensureProductImagesTable } from '../lib/ensureProductImagesTable.js';

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
    await ensureProductImagesTable(conn);
  } finally {
    await conn.end();
  }
  console.log('product_images table ensured.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
