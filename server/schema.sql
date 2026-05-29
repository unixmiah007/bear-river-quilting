CREATE DATABASE IF NOT EXISTS cms_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cms_store;

CREATE TABLE IF NOT EXISTS pages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(191) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  body MEDIUMTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(64) NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  size_prices JSON NULL,
  stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  product_size VARCHAR(32) NULL,
  image_url VARCHAR(512) NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_products_sku (sku)
);

CREATE TABLE IF NOT EXISTS product_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  path VARCHAR(512) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pi_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  KEY idx_pi_product_sort (product_id, sort_order)
);

CREATE TABLE IF NOT EXISTS page_products (
  page_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (page_id, product_id),
  CONSTRAINT fk_pp_page FOREIGN KEY (page_id) REFERENCES pages (id) ON DELETE CASCADE,
  CONSTRAINT fk_pp_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX idx_page_products_sort ON page_products (page_id, sort_order);

CREATE TABLE IF NOT EXISTS product_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(191) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_category_products (
  category_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, product_id),
  CONSTRAINT fk_pcp_category FOREIGN KEY (category_id) REFERENCES product_categories (id) ON DELETE CASCADE,
  CONSTRAINT fk_pcp_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX idx_pcp_category_sort ON product_category_products (category_id, sort_order);

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(32) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(64) NULL,
  shipping_address1 VARCHAR(255) NOT NULL,
  shipping_address2 VARCHAR(255) NULL,
  shipping_city VARCHAR(120) NOT NULL,
  shipping_state VARCHAR(120) NOT NULL,
  shipping_postal_code VARCHAR(40) NOT NULL,
  shipping_country VARCHAR(120) NOT NULL,
  shipping_method VARCHAR(32) NOT NULL DEFAULT 'standard',
  shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  billing_name VARCHAR(255) NOT NULL,
  billing_address1 VARCHAR(255) NOT NULL,
  billing_address2 VARCHAR(255) NULL,
  billing_city VARCHAR(120) NOT NULL,
  billing_state VARCHAR(120) NOT NULL,
  billing_postal_code VARCHAR(40) NOT NULL,
  billing_country VARCHAR(120) NOT NULL,
  card_last4 VARCHAR(4) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
);

CREATE INDEX idx_orders_created ON orders (created_at);
CREATE INDEX idx_order_items_order ON order_items (order_id);

INSERT INTO pages (id, slug, title, body)
VALUES
  (
    1001,
    'heritage-quilts',
    'Heritage Quilts Collection',
    'A timeless lineup inspired by heirloom stitching, warm palettes, and hand-finished textures.'
  ),
  (
    1002,
    'modern-loft-quilts',
    'Modern Loft Quilts',
    'Clean geometry, bold contrast, and lightweight comfort for a modern bedroom.'
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  body = VALUES(body);

INSERT INTO products (id, sku, name, description, price, stock_quantity, product_size, image_url, is_published)
VALUES
  (
    2001,
    NULL,
    'Maple Patchwork Quilt',
    'Soft cotton layers with a deep amber and cream patchwork pattern.',
    249.00,
    0,
    'small',
    '/assets/improv-quilting-tutorial.jpg',
    1
  ),
  (
    2002,
    NULL,
    'Sage Meadow Quilt',
    'Breathable quilt with muted green tones and hand-stitched detail.',
    219.00,
    0,
    'x-large',
    '/assets/improv-quilt-basting.png',
    1
  ),
  (
    2003,
    NULL,
    'Mono Grid Loft Quilt',
    'Contemporary black and ivory grid design in a lightweight drape.',
    189.00,
    0,
    'xx-large',
    '/assets/improv-quilting-tutorial-010.jpg',
    1
  ),
  (
    2004,
    NULL,
    'Terracotta Lines Quilt',
    'Modern line-work quilting with earthy tones and plush fill.',
    205.00,
    0,
    'xxx-large',
    '/assets/improv-quilting-tutorial-020.jpg',
    1
  )
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  price = VALUES(price),
  stock_quantity = VALUES(stock_quantity),
  product_size = VALUES(product_size),
  image_url = VALUES(image_url),
  is_published = VALUES(is_published);

INSERT INTO page_products (page_id, product_id, sort_order)
VALUES
  (1001, 2001, 0),
  (1001, 2002, 1),
  (1002, 2003, 0),
  (1002, 2004, 1)
ON DUPLICATE KEY UPDATE
  sort_order = VALUES(sort_order);
