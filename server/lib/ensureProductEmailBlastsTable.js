/**
 * Logs admin product email blasts and per-recipient delivery results.
 */
export async function ensureProductEmailBlastsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS product_email_blasts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      product_id INT UNSIGNED NOT NULL,
      subject VARCHAR(255) NOT NULL,
      personal_message TEXT NULL,
      recipient_count INT UNSIGNED NOT NULL DEFAULT 0,
      sent_count INT UNSIGNED NOT NULL DEFAULT 0,
      failed_count INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_product_email_blasts_product (product_id),
      INDEX idx_product_email_blasts_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS product_email_blast_recipients (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      blast_id INT UNSIGNED NOT NULL,
      email VARCHAR(255) NOT NULL,
      status ENUM('sent', 'failed') NOT NULL,
      error_message VARCHAR(500) NULL,
      sent_at TIMESTAMP NULL DEFAULT NULL,
      INDEX idx_blast_recipients_blast (blast_id),
      INDEX idx_blast_recipients_email (email),
      CONSTRAINT fk_blast_recipients_blast
        FOREIGN KEY (blast_id) REFERENCES product_email_blasts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
