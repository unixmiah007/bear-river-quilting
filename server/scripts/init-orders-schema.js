import mysql from 'mysql2/promise';
import 'dotenv/config';

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
    multipleStatements: true,
  });

  const dbName = process.env.MYSQL_DATABASE ?? 'cms_store';

  await conn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(32) NOT NULL UNIQUE,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(64) NULL,
      shipping_address1 VARCHAR(255) NOT NULL,
      shipping_address2 VARCHAR(255) NULL,
      shipping_city VARCHAR(120) NOT NULL,
      shipping_state VARCHAR(120) NOT NULL,
      shipping_postal_code VARCHAR(40) NOT NULL,
      shipping_country VARCHAR(120) NOT NULL,
      shipping_method VARCHAR(32) NOT NULL DEFAULT 'standard',
      shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
      billing_name VARCHAR(255) NOT NULL,
      billing_address1 VARCHAR(255) NOT NULL DEFAULT '',
      billing_address2 VARCHAR(255) NULL,
      billing_city VARCHAR(120) NOT NULL DEFAULT '',
      billing_state VARCHAR(120) NOT NULL DEFAULT '',
      billing_postal_code VARCHAR(40) NOT NULL DEFAULT '',
      billing_country VARCHAR(120) NOT NULL DEFAULT '',
      card_last4 VARCHAR(4) NOT NULL,
      subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
      tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      total DECIMAL(10, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id INT UNSIGNED NOT NULL,
      product_id INT UNSIGNED NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      quantity INT UNSIGNED NOT NULL,
      line_total DECIMAL(10, 2) NOT NULL,
      CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    );

  `);
  async function ensureColumn(columnName, definition) {
    const [rows] = await conn.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = ?`,
      [dbName, columnName]
    );
    if (rows.length === 0) {
      await conn.query(`ALTER TABLE orders ADD COLUMN ${definition}`);
    }
  }

  await ensureColumn('shipping_method', "shipping_method VARCHAR(32) NOT NULL DEFAULT 'standard'");
  await ensureColumn('shipping_cost', 'shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0');
  await ensureColumn('billing_address1', "billing_address1 VARCHAR(255) NOT NULL DEFAULT ''");
  await ensureColumn('billing_address2', 'billing_address2 VARCHAR(255) NULL');
  await ensureColumn('billing_city', "billing_city VARCHAR(120) NOT NULL DEFAULT ''");
  await ensureColumn('billing_state', "billing_state VARCHAR(120) NOT NULL DEFAULT ''");
  await ensureColumn('billing_postal_code', "billing_postal_code VARCHAR(40) NOT NULL DEFAULT ''");
  await ensureColumn('billing_country', "billing_country VARCHAR(120) NOT NULL DEFAULT ''");
  await ensureColumn('tax_amount', 'tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0');
  await ensureColumn('total', 'total DECIMAL(10, 2) NOT NULL DEFAULT 0');
  try {
    await conn.query('CREATE INDEX idx_orders_created ON orders (created_at)');
  } catch (e) {
    if (e.code !== 'ER_DUP_KEYNAME') throw e;
  }
  try {
    await conn.query('CREATE INDEX idx_order_items_order ON order_items (order_id)');
  } catch (e) {
    if (e.code !== 'ER_DUP_KEYNAME') throw e;
  }
  await conn.end();
  console.log('Order schema applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
