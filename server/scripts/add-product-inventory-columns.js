import mysql from 'mysql2/promise';
import 'dotenv/config';
import { ensureProductInventoryColumns } from '../lib/ensureProductInventoryColumns.js';

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
    await ensureProductInventoryColumns(conn);
  } catch (e) {
    console.error('Migration failed:', e.message);
    throw e;
  } finally {
    await conn.end();
  }
  console.log('Product inventory migration finished.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
