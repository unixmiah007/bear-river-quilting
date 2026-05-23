/** Creates custom_quilt_requests table when missing. */
export async function ensureCustomQuiltRequestsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS custom_quilt_requests (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      request_number VARCHAR(32) NOT NULL UNIQUE,
      status VARCHAR(32) NOT NULL DEFAULT 'submitted',
      design_id VARCHAR(64) NOT NULL,
      design_name VARCHAR(255) NOT NULL,
      product_size VARCHAR(32) NULL,
      color_palette VARCHAR(64) NULL,
      batting VARCHAR(64) NULL,
      quilt_title VARCHAR(255) NULL,
      notes TEXT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(64) NULL,
      estimated_price DECIMAL(10, 2) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_cqr_status (status),
      KEY idx_cqr_created (created_at),
      KEY idx_cqr_email (customer_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
