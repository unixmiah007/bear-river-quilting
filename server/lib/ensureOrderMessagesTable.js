async function columnExists(conn, table, column) {
  const db = process.env.MYSQL_DATABASE ?? 'cms_store';
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [db, table, column]
  );
  return Number(row.c) > 0;
}

/** Customer correspondence log for admin order messaging. */
export async function ensureOrderMessagesTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS order_messages (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id INT UNSIGNED NOT NULL,
      direction VARCHAR(32) NOT NULL DEFAULT 'staff_to_customer',
      from_email VARCHAR(255) NULL,
      subject VARCHAR(255) NOT NULL,
      body_text TEXT NOT NULL,
      body_html MEDIUMTEXT NOT NULL,
      to_email VARCHAR(255) NOT NULL,
      email_sent TINYINT(1) NOT NULL DEFAULT 0,
      sent_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_order_messages_order (order_id, created_at)
    )
  `);

  if (!(await columnExists(conn, 'order_messages', 'direction'))) {
    await conn.query(
      `ALTER TABLE order_messages
       ADD COLUMN direction VARCHAR(32) NOT NULL DEFAULT 'staff_to_customer' AFTER order_id`
    );
  }
  if (!(await columnExists(conn, 'order_messages', 'from_email'))) {
    await conn.query(
      `ALTER TABLE order_messages ADD COLUMN from_email VARCHAR(255) NULL AFTER direction`
    );
  }
  if (!(await columnExists(conn, 'order_messages', 'admin_read_at'))) {
    await conn.query(
      `ALTER TABLE order_messages ADD COLUMN admin_read_at TIMESTAMP NULL DEFAULT NULL AFTER created_at`
    );
  }
}
