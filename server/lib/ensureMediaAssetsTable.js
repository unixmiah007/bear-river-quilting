/** Central media library catalog for reusable site images under /uploads. */
export async function ensureMediaAssetsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      path VARCHAR(512) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      source VARCHAR(32) NOT NULL DEFAULT 'upload',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_media_path (path)
    )
  `);
}
