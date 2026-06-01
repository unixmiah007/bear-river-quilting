/** Adds line-item refund tracking columns for admin product swaps on paid orders. */
export async function ensureOrderItemRefundColumns(pool) {
  const dbName = process.env.MYSQL_DATABASE ?? 'cms_store';
  const [tables] = await pool.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'order_items'`,
    [dbName]
  );
  if (!tables.length) return;

  async function ensureColumn(columnName, definition) {
    const [rows] = await pool.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'order_items' AND COLUMN_NAME = ?`,
      [dbName, columnName]
    );
    if (rows.length === 0) {
      await pool.query(`ALTER TABLE order_items ADD COLUMN ${definition}`);
    }
  }

  await ensureColumn('line_refund_amount', 'line_refund_amount DECIMAL(10, 2) NULL');
  await ensureColumn('line_refund_status', 'line_refund_status VARCHAR(16) NULL');
  await ensureColumn('stripe_refund_id', 'stripe_refund_id VARCHAR(255) NULL');
  await ensureColumn('line_refund_at', 'line_refund_at TIMESTAMP NULL');
}
