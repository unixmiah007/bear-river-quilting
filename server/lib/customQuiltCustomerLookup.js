import pool from '../db.js';
import {
  labelForBattingFromConfig,
  labelForColorFromConfig,
  labelForSizeFromConfig,
  loadCustomizeWizardConfig,
} from './customizeWizardConfig.js';

export function normalizeCustomerLookupEmail(email) {
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 255);
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, status: 400, error: 'Enter the same email you used when placing your request.' };
  }
  return { ok: true, email: normalized };
}

function enrichRequestRow(row, config) {
  if (!row) return row;
  return {
    ...row,
    displaySize: labelForSizeFromConfig(config, row.product_size),
    displayColor: labelForColorFromConfig(config, row.color_palette),
    displayBatting: labelForBattingFromConfig(config, row.batting),
  };
}

export async function lookupCustomerCustomQuiltRequests(email, requestNumber) {
  const parsed = normalizeCustomerLookupEmail(email);
  if (!parsed.ok) return parsed;

  const config = await loadCustomizeWizardConfig();
  const ref = String(requestNumber ?? '').trim().toUpperCase();

  if (ref) {
    if (ref.length > 64) {
      return { ok: false, status: 400, error: 'Invalid request number.' };
    }
    const [[row]] = await pool.query(
      `SELECT id, request_number, status, design_id, design_name, product_size, color_palette, batting,
              quilt_title, notes, own_design_image_url, estimated_price, created_at, updated_at,
              customer_name, customer_email, customer_phone
       FROM custom_quilt_requests
       WHERE request_number = ? AND LOWER(TRIM(customer_email)) = ?`,
      [ref, parsed.email]
    );
    if (!row) {
      return {
        ok: false,
        status: 404,
        error: 'We could not find that custom quilt request for this email.',
        hint: 'Use the exact request number from your confirmation (starts with CQ) and the email you entered on the customize form.',
      };
    }
    return { ok: true, mode: 'detail', request: enrichRequestRow(row, config) };
  }

  const [requests] = await pool.query(
    `SELECT id, request_number, status, design_name, product_size, estimated_price, created_at
     FROM custom_quilt_requests
     WHERE LOWER(TRIM(customer_email)) = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [parsed.email]
  );

  return {
    ok: true,
    mode: 'list',
    email: parsed.email,
    requests: requests.map((r) => enrichRequestRow(r, config)),
  };
}
