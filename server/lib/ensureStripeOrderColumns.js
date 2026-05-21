/** Adds Stripe payment columns to orders when missing. */
export async function ensureStripeOrderColumns(pool) {
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

  await ensureColumn('payment_method', "payment_method VARCHAR(32) NOT NULL DEFAULT 'manual'");
  await ensureColumn('stripe_checkout_session_id', 'stripe_checkout_session_id VARCHAR(255) NULL');
  await ensureColumn('stripe_payment_intent_id', 'stripe_payment_intent_id VARCHAR(255) NULL');
}
