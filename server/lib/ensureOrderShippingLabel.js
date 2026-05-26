/** Ship-from overrides for printable shipping labels on orders. */
export async function ensureOrderShippingLabel(conn) {
  const cols = [
    ['label_from_name', 'label_from_name VARCHAR(255) NULL'],
    ['label_from_address1', 'label_from_address1 VARCHAR(255) NULL'],
    ['label_from_address2', 'label_from_address2 VARCHAR(255) NULL'],
    ['label_from_city', 'label_from_city VARCHAR(120) NULL'],
    ['label_from_state', 'label_from_state VARCHAR(120) NULL'],
    ['label_from_postal_code', 'label_from_postal_code VARCHAR(40) NULL'],
    ['label_from_country', 'label_from_country VARCHAR(120) NULL'],
    ['label_from_phone', 'label_from_phone VARCHAR(64) NULL'],
  ];

  const [existing] = await conn.query(
    `SELECT COLUMN_NAME AS name FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'orders'`
  );
  const names = new Set(existing.map((c) => c.name));

  for (const [col, ddl] of cols) {
    if (!names.has(col)) {
      await conn.query(`ALTER TABLE orders ADD COLUMN ${ddl}`);
    }
  }
}
