import mysql from 'mysql2/promise';
import 'dotenv/config';

function normalizedPassword(raw) {
  // Treat scaffolding placeholder as "no password" for local MySQL defaults.
  if (!raw || raw === 'your_password') return '';
  return raw;
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? 'root',
  password: normalizedPassword(process.env.MYSQL_PASSWORD),
  database: process.env.MYSQL_DATABASE ?? 'cms_store',
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
