import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import '../loadEnv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizedPassword(raw) {
  if (!raw || raw === 'your_password') return '';
  return raw;
}

async function main() {
  const sqlPath = path.join(__dirname, '..', '..', 'railway_prod.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Missing railway_prod.sql at project root.');
    process.exit(1);
  }

  const db = process.env.MYSQL_DATABASE ?? 'cms_store';
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? 'root',
    password: normalizedPassword(process.env.MYSQL_PASSWORD),
    multipleStatements: true,
  });

  console.log(`Replacing database "${db}" with railway_prod.sql…`);
  await conn.query(`DROP DATABASE IF EXISTS \`${db}\``);
  await conn.query(
    `CREATE DATABASE \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.query(`USE \`${db}\``);
  await conn.query('SET FOREIGN_KEY_CHECKS=0');
  await conn.query(sql);
  await conn.query('SET FOREIGN_KEY_CHECKS=1');

  const [tables] = await conn.query('SHOW TABLES');
  console.log(`Import complete. Tables in ${db}: ${tables.length}`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
