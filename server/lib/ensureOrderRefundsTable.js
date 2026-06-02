/** Order-level refund audit rows (e.g. line item removed). */
export async function ensureOrderRefundsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_refunds (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      order_id INT UNSIGNED NOT NULL,
      order_item_id INT UNSIGNED NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'pending',
      stripe_refund_id VARCHAR(255) NULL,
      reason VARCHAR(64) NOT NULL,
      label VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP NULL,
      PRIMARY KEY (id),
      KEY idx_order_refunds_order (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}
