async function tableExists(conn, table) {
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [table]
  );
  return Number(row.c) > 0;
}

/** Product categories and category ↔ product assignments for storefront nav filtering. */
export async function ensureProductCategories(conn) {
  if (!(await tableExists(conn, 'product_categories'))) {
    await conn.query(`
      CREATE TABLE product_categories (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(191) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }

  if (!(await tableExists(conn, 'product_category_products'))) {
    await conn.query(`
      CREATE TABLE product_category_products (
        category_id INT UNSIGNED NOT NULL,
        product_id INT UNSIGNED NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        PRIMARY KEY (category_id, product_id),
        CONSTRAINT fk_pcp_category FOREIGN KEY (category_id) REFERENCES product_categories (id) ON DELETE CASCADE,
        CONSTRAINT fk_pcp_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      )
    `);
    await conn.query(
      'CREATE INDEX idx_pcp_category_sort ON product_category_products (category_id, sort_order)'
    );
  }
}
