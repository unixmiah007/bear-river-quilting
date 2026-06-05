import { syncStitchBlanketPalettes } from './longArmBlanketPaletteSeeds.js';

async function columnExists(conn, table, column) {
  const db = process.env.MYSQL_DATABASE ?? 'cms_store';
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [db, table, column]
  );
  return Number(row.c) > 0;
}

const DEFAULT_SERVICES = [
  {
    name: 'Edge-to-edge (pantograph) quilting',
    slug: 'edge-to-edge-pantograph-quilting',
    description:
      'All-over quilting using a repeating pantograph pattern — a beautiful, economical option for finishing your quilt top.',
    hourly_rate: 35,
    sort_order: 1,
  },
  {
    name: 'Custom quilting',
    slug: 'custom-quilting',
    description:
      'One-of-a-kind quilting designs tailored to your quilt top, including motifs, feathers, and detailed custom work.',
    hourly_rate: 55,
    sort_order: 2,
  },
  {
    name: 'Semi-custom quilting',
    slug: 'semi-custom-quilting',
    description:
      'A blend of edge-to-edge and custom elements — accent areas with custom motifs while keeping overall cost manageable.',
    hourly_rate: 45,
    sort_order: 3,
  },
  {
    name: 'Quilt binding',
    slug: 'quilt-binding',
    description: 'Professional machine or hand binding to finish your quilt edges cleanly and durably.',
    hourly_rate: 25,
    sort_order: 4,
  },
  {
    name: 'Batting and backing supplies',
    slug: 'batting-and-backing-supplies',
    description: 'Quality batting and backing fabric available — we can help you choose the right materials for your project.',
    hourly_rate: null,
    sort_order: 5,
  },
  {
    name: 'Memory and T-shirt quilts',
    slug: 'memory-and-t-shirt-quilts',
    description:
      'Specialized long-arm quilting for memory quilts and T-shirt quilts — gentle handling of sentimental fabrics.',
    hourly_rate: 50,
    sort_order: 6,
  },
  {
    name: 'Mail-in quilting services',
    slug: 'mail-in-quilting-services',
    description:
      'Ship your quilt top to us from anywhere — we quilt it and return it to your door with careful packaging.',
    hourly_rate: null,
    sort_order: 7,
  },
  {
    name: 'Thread color selection',
    slug: 'thread-color-selection',
    description:
      'Expert guidance choosing thread colors that complement your quilt top — subtle blending or bold contrast.',
    hourly_rate: null,
    sort_order: 8,
  },
  {
    name: 'Quilt trimming and squaring',
    slug: 'quilt-trimming-and-squaring',
    description: 'Precise trimming and squaring so your finished quilt is perfectly straight and ready for binding.',
    hourly_rate: 20,
    sort_order: 9,
  },
];

/** Creates long-arm quilting tables and seeds default services when empty. */
export async function ensureLongArmQuiltingTables(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS long_arm_quilting_services (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(128) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      hourly_rate DECIMAL(10, 2) NULL,
      image_url VARCHAR(512) NULL,
      is_published TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_laqs_published (is_published, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS long_arm_quilting_requests (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      request_number VARCHAR(32) NOT NULL UNIQUE,
      status VARCHAR(32) NOT NULL DEFAULT 'pending_payment',
      acknowledged CHAR(1) NOT NULL DEFAULT 'N',
      selected_service_ids JSON NOT NULL,
      quilt_source VARCHAR(32) NULL,
      blanket_palette_id INT UNSIGNED NULL,
      notes TEXT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(64) NULL,
      shipping_address1 VARCHAR(255) NOT NULL,
      shipping_address2 VARCHAR(255) NULL,
      shipping_city VARCHAR(100) NOT NULL,
      shipping_state VARCHAR(64) NOT NULL,
      shipping_postal_code VARCHAR(32) NOT NULL,
      shipping_country VARCHAR(64) NOT NULL DEFAULT 'USA',
      billing_name VARCHAR(255) NOT NULL,
      billing_address1 VARCHAR(255) NOT NULL,
      billing_address2 VARCHAR(255) NULL,
      billing_city VARCHAR(100) NOT NULL,
      billing_state VARCHAR(64) NOT NULL,
      billing_postal_code VARCHAR(32) NOT NULL,
      billing_country VARCHAR(64) NOT NULL DEFAULT 'USA',
      deposit_amount DECIMAL(10, 2) NOT NULL DEFAULT 30.00,
      deposit_paid_at TIMESTAMP NULL,
      stripe_checkout_session_id VARCHAR(255) NULL,
      stripe_payment_intent_id VARCHAR(255) NULL,
      final_payment_amount DECIMAL(10, 2) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_laqr_status (status),
      KEY idx_laqr_created (created_at),
      KEY idx_laqr_email (customer_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await columnExists(pool, 'long_arm_quilting_requests', 'final_payment_amount'))) {
    await pool.query(
      'ALTER TABLE long_arm_quilting_requests ADD COLUMN final_payment_amount DECIMAL(10, 2) NULL AFTER stripe_payment_intent_id'
    );
  }
  if (!(await columnExists(pool, 'long_arm_quilting_requests', 'quilt_source'))) {
    await pool.query(
      "ALTER TABLE long_arm_quilting_requests ADD COLUMN quilt_source VARCHAR(32) NULL AFTER selected_service_ids"
    );
  }
  if (!(await columnExists(pool, 'long_arm_quilting_requests', 'blanket_palette_id'))) {
    await pool.query(
      'ALTER TABLE long_arm_quilting_requests ADD COLUMN blanket_palette_id INT UNSIGNED NULL AFTER quilt_source'
    );
  }
  if (!(await columnExists(pool, 'long_arm_quilting_requests', 'tracking_carrier'))) {
    await pool.query(
      "ALTER TABLE long_arm_quilting_requests ADD COLUMN tracking_carrier VARCHAR(32) NULL AFTER final_payment_amount"
    );
  }
  if (!(await columnExists(pool, 'long_arm_quilting_requests', 'tracking_number'))) {
    await pool.query(
      'ALTER TABLE long_arm_quilting_requests ADD COLUMN tracking_number VARCHAR(128) NULL AFTER tracking_carrier'
    );
  }
  if (!(await columnExists(pool, 'long_arm_quilting_requests', 'tracking_notified_at'))) {
    await pool.query(
      'ALTER TABLE long_arm_quilting_requests ADD COLUMN tracking_notified_at TIMESTAMP NULL AFTER tracking_number'
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS long_arm_blanket_palettes (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      image_url VARCHAR(512) NULL,
      is_published TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_labp_published (is_published, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [[countRow]] = await pool.query('SELECT COUNT(*) AS c FROM long_arm_quilting_services');
  if (Number(countRow.c) === 0) {
    for (const svc of DEFAULT_SERVICES) {
      await pool.query(
        `INSERT INTO long_arm_quilting_services (slug, name, description, hourly_rate, sort_order, is_published)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [svc.slug, svc.name, svc.description, svc.hourly_rate, svc.sort_order]
      );
    }
  }

  await syncStitchBlanketPalettes(pool);
}
