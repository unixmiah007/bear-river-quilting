/** Adds shipment tracking columns to orders when missing. */
export async function ensureOrderTrackingColumns(pool) {
  const dbName = process.env.MYSQL_DATABASE ?? 'cms_store';
  const [tables] = await pool.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'`,
    [dbName]
  );
  if (!tables.length) return;

  async function ensureColumn(columnName, definition) {
    const [rows] = await pool.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = ?`,
      [dbName, columnName]
    );
    if (rows.length === 0) {
      await pool.query(`ALTER TABLE orders ADD COLUMN ${definition}`);
    }
  }

  await ensureColumn('tracking_carrier', 'tracking_carrier VARCHAR(32) NULL');
  await ensureColumn('tracking_number', 'tracking_number VARCHAR(64) NULL');
  await ensureColumn('tracking_notified_at', 'tracking_notified_at TIMESTAMP NULL');
}
