import 'dotenv/config';

async function columnExists(conn, table, column) {
  const db = process.env.MYSQL_DATABASE ?? 'cms_store';
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [db, table, column]
  );
  return Number(row.c) > 0;
}

async function indexExists(conn, table, keyName) {
  const db = process.env.MYSQL_DATABASE ?? 'cms_store';
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [db, table, keyName]
  );
  return Number(row.c) > 0;
}

/** Adds sku, stock_quantity, image_url, is_published, unique index, and timestamp columns when missing. */
export async function ensureProductInventoryColumns(conn) {
  if (!(await columnExists(conn, 'products', 'sku'))) {
    await conn.query('ALTER TABLE products ADD COLUMN sku VARCHAR(64) NULL AFTER id');
  }
  if (!(await columnExists(conn, 'products', 'stock_quantity'))) {
    await conn.query(
      'ALTER TABLE products ADD COLUMN stock_quantity INT UNSIGNED NOT NULL DEFAULT 0 AFTER price'
    );
  }
  if (!(await columnExists(conn, 'products', 'image_url'))) {
    await conn.query('ALTER TABLE products ADD COLUMN image_url VARCHAR(512) NULL');
  }
  if (!(await columnExists(conn, 'products', 'is_published'))) {
    await conn.query(
      'ALTER TABLE products ADD COLUMN is_published TINYINT(1) NOT NULL DEFAULT 0'
    );
  }
  if (!(await indexExists(conn, 'products', 'uk_products_sku'))) {
    await conn.query('ALTER TABLE products ADD UNIQUE KEY uk_products_sku (sku)');
  }
  if (!(await columnExists(conn, 'products', 'created_at'))) {
    await conn.query(
      'ALTER TABLE products ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    );
  }
  if (!(await columnExists(conn, 'products', 'updated_at'))) {
    await conn.query(
      'ALTER TABLE products ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    );
  }
}
