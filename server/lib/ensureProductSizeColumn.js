async function columnExists(conn, table, column) {
  const db = process.env.MYSQL_DATABASE ?? 'cms_store';
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [db, table, column]
  );
  return Number(row.c) > 0;
}

/** Adds products.product_size when missing (nullable enum-like string). */
export async function ensureProductSizeColumn(conn) {
  if (!(await columnExists(conn, 'products', 'product_size'))) {
    await conn.query(
      'ALTER TABLE products ADD COLUMN product_size VARCHAR(32) NULL DEFAULT NULL AFTER stock_quantity'
    );
  }
}
