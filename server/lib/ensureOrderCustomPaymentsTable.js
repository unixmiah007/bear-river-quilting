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
      order_id INT UNSIGNED NULL,
      custom_quilt_request_id INT UNSIGNED NULL,
      reference_type VARCHAR(16) NOT NULL DEFAULT 'order',
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
      KEY idx_ocp_custom_quilt (custom_quilt_request_id),
      KEY idx_ocp_email (customer_email),
      KEY idx_ocp_status (status),
      CONSTRAINT fk_ocp_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      CONSTRAINT fk_ocp_custom_quilt FOREIGN KEY (custom_quilt_request_id) REFERENCES custom_quilt_requests (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await columnExists(pool, 'order_custom_payments', 'checkout_url'))) {
    await pool.query('ALTER TABLE order_custom_payments ADD COLUMN checkout_url TEXT NULL AFTER stripe_payment_intent_id');
  }
  if (!(await columnExists(pool, 'order_custom_payments', 'custom_quilt_request_id'))) {
    await pool.query(
      'ALTER TABLE order_custom_payments ADD COLUMN custom_quilt_request_id INT UNSIGNED NULL AFTER order_id'
    );
  }
  if (!(await columnExists(pool, 'order_custom_payments', 'reference_type'))) {
    await pool.query(
      "ALTER TABLE order_custom_payments ADD COLUMN reference_type VARCHAR(16) NOT NULL DEFAULT 'order' AFTER custom_quilt_request_id"
    );
  }
  const [[orderCol]] = await pool.query(
    `SELECT IS_NULLABLE AS nullable FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'order_custom_payments' AND COLUMN_NAME = 'order_id'`,
    [process.env.MYSQL_DATABASE ?? 'cms_store']
  );
  if (orderCol?.nullable === 'NO') {
    await pool.query('ALTER TABLE order_custom_payments MODIFY order_id INT UNSIGNED NULL');
  }
  if (!(await columnExists(pool, 'order_custom_payments', 'long_arm_request_id'))) {
    await pool.query(
      'ALTER TABLE order_custom_payments ADD COLUMN long_arm_request_id INT UNSIGNED NULL AFTER custom_quilt_request_id'
    );
    await pool.query(
      'ALTER TABLE order_custom_payments ADD KEY idx_ocp_long_arm (long_arm_request_id)'
    );
  }
}
