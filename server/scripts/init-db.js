import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import 'dotenv/config';
import { ensureProductInventoryColumns } from '../lib/ensureProductInventoryColumns.js';
import { ensureProductImagesTable } from '../lib/ensureProductImagesTable.js';
import { ensurePagesTable } from '../lib/ensurePagesTable.js';
import { seedDemoProducts } from '../lib/seedDemoProducts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizedPassword(raw) {
  if (!raw || raw === 'your_password') return '';
  return raw;
}

async function main() {
  const sqlPath = path.join(__dirname, '..', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? 'root',
    password: normalizedPassword(process.env.MYSQL_PASSWORD),
    multipleStatements: true,
  });

  await conn.query(sql);
  console.log('Database schema applied.');

  await ensurePagesTable(conn);
  console.log('Pages table columns ensured.');

  await ensureProductInventoryColumns(conn);
  console.log('Product inventory columns ensured.');

  await ensureProductImagesTable(conn);
  console.log('Product images table ensured.');

  await seedDemoProducts(conn);
  console.log('Demo quilt products seeded.');

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
