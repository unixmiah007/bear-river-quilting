/** Canonical stitch swatch palettes shown in the long-arm wizard (thumbnail images in /public). */
export const STITCH_BLANKET_PALETTES = [
  {
    title: 'Stipple meander',
    price: 89,
    sort_order: 1,
    image_url: '/images/long-arm-blanket-palettes/stipple-meander.svg',
  },
  {
    title: 'Edge-to-edge loops',
    price: 95,
    sort_order: 2,
    image_url: '/images/long-arm-blanket-palettes/edge-to-edge-loops.svg',
  },
  {
    title: 'Pantograph scroll',
    price: 99,
    sort_order: 3,
    image_url: '/images/long-arm-blanket-palettes/pantograph-scroll.svg',
  },
  {
    title: 'Feather wreath',
    price: 109,
    sort_order: 4,
    image_url: '/images/long-arm-blanket-palettes/feather-wreath.svg',
  },
  {
    title: 'Crosshatch grid',
    price: 99,
    sort_order: 5,
    image_url: '/images/long-arm-blanket-palettes/crosshatch-grid.svg',
  },
  {
    title: 'Baptist fan',
    price: 105,
    sort_order: 6,
    image_url: '/images/long-arm-blanket-palettes/baptist-fan.svg',
  },
  {
    title: 'Pebble fill',
    price: 89,
    sort_order: 7,
    image_url: '/images/long-arm-blanket-palettes/pebble-fill.svg',
  },
  {
    title: 'Echo channel',
    price: 115,
    sort_order: 8,
    image_url: '/images/long-arm-blanket-palettes/echo-channel.svg',
  },
  {
    title: 'Chevron vinyl',
    price: 99,
    sort_order: 9,
    image_url: '/images/long-arm-blanket-palettes/chevron-vinyl.svg',
  },
  {
    title: 'Leaf vine',
    price: 105,
    sort_order: 10,
    image_url: '/images/long-arm-blanket-palettes/leaf-vine.svg',
  },
];

const LEGACY_BLANKET_TITLES = [
  'Classic cotton quilt top',
  'Modern patchwork starter kit',
  'Heirloom charm quilt top',
  'King-size panel quilt top',
];

const CANONICAL_TITLES = STITCH_BLANKET_PALETTES.map((p) => p.title);

/** Upserts stitch palette rows and thumbnails; hides pre-stitch default titles. */
export async function syncStitchBlanketPalettes(pool) {
  if (LEGACY_BLANKET_TITLES.length > 0) {
    await pool.query(
      `UPDATE long_arm_blanket_palettes SET is_published = 0
       WHERE title IN (${LEGACY_BLANKET_TITLES.map(() => '?').join(',')})`,
      LEGACY_BLANKET_TITLES
    );
  }

  for (const item of STITCH_BLANKET_PALETTES) {
    const [matches] = await pool.query(
      'SELECT id FROM long_arm_blanket_palettes WHERE title = ? ORDER BY id ASC',
      [item.title]
    );
    const keepId = matches[0]?.id;
    const duplicateIds = matches.slice(1).map((r) => r.id);
    if (duplicateIds.length > 0) {
      await pool.query(
        `UPDATE long_arm_blanket_palettes SET is_published = 0 WHERE id IN (${duplicateIds.map(() => '?').join(',')})`,
        duplicateIds
      );
    }

    if (keepId) {
      await pool.query(
        `UPDATE long_arm_blanket_palettes
         SET price = ?, sort_order = ?, image_url = ?, is_published = 1
         WHERE id = ?`,
        [item.price, item.sort_order, item.image_url, keepId]
      );
    } else {
      await pool.query(
        `INSERT INTO long_arm_blanket_palettes (title, price, sort_order, is_published, image_url)
         VALUES (?, ?, ?, 1, ?)`,
        [item.title, item.price, item.sort_order, item.image_url]
      );
    }
  }

  if (CANONICAL_TITLES.length > 0) {
    await pool.query(
      `UPDATE long_arm_blanket_palettes SET is_published = 0
       WHERE is_published = 1 AND title NOT IN (${CANONICAL_TITLES.map(() => '?').join(',')})`,
      CANONICAL_TITLES
    );
  }
}
