/** Single-row JSON config for the /customize wizard. */
export async function ensureCustomizeWizardConfigTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customize_wizard_config (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
      config_json JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT chk_customize_wizard_singleton CHECK (id = 1)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
