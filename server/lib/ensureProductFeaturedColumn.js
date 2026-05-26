async function columnExists(conn, table, column) {
  const db = process.env.MYSQL_DATABASE ?? 'cms_store';
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [db, table, column]
  );
  return Number(row.c) > 0;
}

/** Adds products.is_featured for catalog hero spotlight (published products only on storefront). */
export async function ensureProductFeaturedColumn(conn) {
  if (!(await columnExists(conn, 'products', 'is_featured'))) {
    await conn.query(
      'ALTER TABLE products ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER is_published'
    );
  }
}
