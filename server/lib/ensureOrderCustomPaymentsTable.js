async function columnExists(conn, table, column) {
  const db = process.env.MYSQL_DATABASE ?? 'cms_store';
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [db, table, column]
  );
  return Number(row.c) > 0;
}

/** Admin-initiated Stripe payment links tied to existing orders. */
export async function ensureOrderCustomPaymentsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_custom_payments (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      payment_number VARCHAR(32) NOT NULL UNIQUE,
      order_id INT UNSIGNED NOT NULL,
      order_number VARCHAR(32) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(8) NOT NULL DEFAULT 'usd',
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      admin_note TEXT NULL,
      stripe_checkout_session_id VARCHAR(255) NULL,
      stripe_payment_intent_id VARCHAR(255) NULL,
      checkout_url TEXT NULL,
      email_sent_at TIMESTAMP NULL,
      paid_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_ocp_order (order_id),
      KEY idx_ocp_email (customer_email),
      KEY idx_ocp_status (status),
      CONSTRAINT fk_ocp_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await columnExists(pool, 'order_custom_payments', 'checkout_url'))) {
    await pool.query('ALTER TABLE order_custom_payments ADD COLUMN checkout_url TEXT NULL AFTER stripe_payment_intent_id');
  }
}
