import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** PNG wordmark used in invoice PDFs (also served at /assets/bear-river-quilting-logo.png). */
export const BRAND_LOGO_PATH = path.join(__dirname, '../assets/bear-river-quilting-logo.png');

export function brandLogoExists() {
  return fs.existsSync(BRAND_LOGO_PATH);
}
