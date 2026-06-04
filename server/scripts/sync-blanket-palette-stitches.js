import pool from '../db.js';
import { syncStitchBlanketPalettes } from '../lib/longArmBlanketPaletteSeeds.js';

await syncStitchBlanketPalettes(pool);
const [rows] = await pool.query(
  `SELECT id, title, image_url, is_published, sort_order
   FROM long_arm_blanket_palettes
   WHERE is_published = 1
   ORDER BY sort_order`
);
console.log(`Published stitch palettes: ${rows.length}`);
for (const row of rows) {
  console.log(`  ${row.sort_order}. ${row.title} → ${row.image_url}`);
}
await pool.end();
