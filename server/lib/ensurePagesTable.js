/**
 * Align legacy `pages` tables with routes that expect timestamps and publish state.
 */
export async function ensurePagesTable(conn) {
  const [[{ cnt }]] = await conn.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'pages'`
  );
  if (!cnt) {
    return;
  }
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME AS name FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'pages'`
  );
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('created_at')) {
    await conn.query(
      'ALTER TABLE pages ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    );
  }
  if (!names.has('updated_at')) {
    await conn.query(
      'ALTER TABLE pages ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    );
  }
  if (!names.has('is_published')) {
    await conn.query(
      'ALTER TABLE pages ADD COLUMN is_published TINYINT(1) NOT NULL DEFAULT 1'
    );
  }
}
