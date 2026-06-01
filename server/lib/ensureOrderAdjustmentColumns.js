/** Original order snapshot + line-item refund columns for admin adjustments. */
export async function ensureOrderAdjustmentColumns(pool) {
  const dbName = process.env.MYSQL_DATABASE ?? 'cms_store';

  async function ensureColumn(table, columnName, definition) {
    const [tables] = await pool.query(
      `SELECT 1 FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbName, table]
    );
    if (!tables.length) return;

    const [rows] = await pool.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [dbName, table, columnName]
    );
    if (rows.length === 0) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
    }
  }

  await ensureColumn('order_items', 'line_refund_amount', 'line_refund_amount DECIMAL(10, 2) NULL');
  await ensureColumn('order_items', 'line_refund_status', 'line_refund_status VARCHAR(16) NULL');
  await ensureColumn('order_items', 'stripe_refund_id', 'stripe_refund_id VARCHAR(255) NULL');
  await ensureColumn('order_items', 'line_refund_at', 'line_refund_at TIMESTAMP NULL');
  await ensureColumn(
    'order_items',
    'original_product_id',
    'original_product_id INT UNSIGNED NULL'
  );
  await ensureColumn(
    'order_items',
    'original_product_name',
    'original_product_name VARCHAR(255) NULL'
  );
  await ensureColumn(
    'order_items',
    'original_unit_price',
    'original_unit_price DECIMAL(10, 2) NULL'
  );
  await ensureColumn(
    'order_items',
    'original_line_total',
    'original_line_total DECIMAL(10, 2) NULL'
  );

  await ensureColumn('orders', 'original_subtotal', 'original_subtotal DECIMAL(10, 2) NULL');
  await ensureColumn('orders', 'original_tax_amount', 'original_tax_amount DECIMAL(10, 2) NULL');
  await ensureColumn('orders', 'original_total', 'original_total DECIMAL(10, 2) NULL');
  await ensureColumn('orders', 'order_adjusted_at', 'order_adjusted_at TIMESTAMP NULL');
}
