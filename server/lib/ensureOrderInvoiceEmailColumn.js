/** Records when a customer invoice PDF was emailed from admin. */
export async function ensureOrderInvoiceEmailColumn(pool) {
  const dbName = process.env.MYSQL_DATABASE ?? 'cms_store';
  const [tables] = await pool.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'`,
    [dbName]
  );
  if (!tables.length) return;

  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'invoice_emailed_at'`,
    [dbName]
  );
  if (rows.length === 0) {
    await pool.query('ALTER TABLE orders ADD COLUMN invoice_emailed_at TIMESTAMP NULL');
  }
}
