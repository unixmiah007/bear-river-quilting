/** Creates product_images table when missing (stores public URL paths, not BLOBs). */
export async function ensureProductImagesTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      product_id INT UNSIGNED NOT NULL,
      path VARCHAR(512) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_pi_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      KEY idx_pi_product_sort (product_id, sort_order)
    )`);
}

