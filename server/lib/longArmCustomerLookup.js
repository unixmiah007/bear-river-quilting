import pool from '../db.js';
import { normalizeCustomerLookupEmail } from './customQuiltCustomerLookup.js';
import {
  longArmQuiltSourceLabel,
  parseSelectedServiceIds,
} from './longArmQuiltingRequest.js';

function mapBlanketPaletteFromRow(paletteRow) {
  if (!paletteRow) return null;
  return {
    id: paletteRow.id,
    title: paletteRow.title,
    price: paletteRow.price != null ? Number(paletteRow.price) : null,
    image_url: paletteRow.image_url,
  };
}

function mapCustomerRequestRow(row, services = [], blanketPalette = null) {
  return {
    request_number: row.request_number,
    status: row.status,
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      hourly_rate: s.hourly_rate != null ? Number(s.hourly_rate) : null,
      image_url: s.image_url ?? null,
    })),
    quilt_source: row.quilt_source ?? null,
    quilt_source_label: longArmQuiltSourceLabel(row.quilt_source),
    blanket_palette: blanketPalette,
    notes: row.notes,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    shipping_address1: row.shipping_address1,
    shipping_address2: row.shipping_address2,
    shipping_city: row.shipping_city,
    shipping_state: row.shipping_state,
    shipping_postal_code: row.shipping_postal_code,
    shipping_country: row.shipping_country,
    billing_name: row.billing_name,
    billing_address1: row.billing_address1,
    billing_address2: row.billing_address2,
    billing_city: row.billing_city,
    billing_state: row.billing_state,
    billing_postal_code: row.billing_postal_code,
    billing_country: row.billing_country,
    deposit_amount: Number(row.deposit_amount),
    deposit_paid_at: row.deposit_paid_at,
    final_payment_amount: row.final_payment_amount != null ? Number(row.final_payment_amount) : null,
    tracking_carrier: row.tracking_carrier ?? null,
    tracking_number: row.tracking_number ?? null,
    tracking_notified_at: row.tracking_notified_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function enrichRows(rows) {
  const allServiceIds = new Set();
  const paletteIds = new Set();
  for (const row of rows) {
    for (const id of parseSelectedServiceIds(row.selected_service_ids)) {
      allServiceIds.add(id);
    }
    if (row.blanket_palette_id) paletteIds.add(Number(row.blanket_palette_id));
  }

  let serviceMap = new Map();
  if (allServiceIds.size > 0) {
    const idList = [...allServiceIds];
    const [svcRows] = await pool.query(
      `SELECT id, name, hourly_rate, image_url FROM long_arm_quilting_services WHERE id IN (${idList.map(() => '?').join(',')})`,
      idList
    );
    serviceMap = new Map(svcRows.map((s) => [s.id, s]));
  }

  let paletteMap = new Map();
  if (paletteIds.size > 0) {
    const idList = [...paletteIds];
    const [paletteRows] = await pool.query(
      `SELECT id, title, price, image_url FROM long_arm_blanket_palettes WHERE id IN (${idList.map(() => '?').join(',')})`,
      idList
    );
    paletteMap = new Map(paletteRows.map((p) => [p.id, p]));
  }

  return rows.map((row) => {
    const ids = parseSelectedServiceIds(row.selected_service_ids);
    const services = ids.map((id) => serviceMap.get(Number(id))).filter(Boolean);
    const paletteRow = row.blanket_palette_id ? paletteMap.get(Number(row.blanket_palette_id)) : null;
    return mapCustomerRequestRow(row, services, mapBlanketPaletteFromRow(paletteRow));
  });
}

const CUSTOMER_REQUEST_COLUMNS = `
  id, request_number, status, selected_service_ids, quilt_source, blanket_palette_id, notes,
  customer_name, customer_email, customer_phone,
  shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
  billing_name, billing_address1, billing_address2, billing_city, billing_state, billing_postal_code, billing_country,
  deposit_amount, deposit_paid_at, final_payment_amount,
  tracking_carrier, tracking_number, tracking_notified_at,
  created_at, updated_at
`;

export async function lookupCustomerLongArmRequests(email, requestNumber) {
  const parsed = normalizeCustomerLookupEmail(email);
  if (!parsed.ok) return parsed;

  const ref = String(requestNumber ?? '').trim().toUpperCase();

  if (ref) {
    if (ref.length > 64) {
      return { ok: false, status: 400, error: 'Invalid request number.' };
    }
    const [[row]] = await pool.query(
      `SELECT ${CUSTOMER_REQUEST_COLUMNS}
       FROM long_arm_quilting_requests
       WHERE request_number = ? AND LOWER(TRIM(customer_email)) = ?`,
      [ref, parsed.email]
    );
    if (!row) {
      return {
        ok: false,
        status: 404,
        error: 'We could not find that long-arm service request for this email.',
        hint: 'Use the exact request number from your deposit confirmation (starts with LAQ) and the email you entered on the service request form.',
      };
    }
    const [request] = await enrichRows([row]);
    return { ok: true, mode: 'detail', request };
  }

  const [rows] = await pool.query(
    `SELECT ${CUSTOMER_REQUEST_COLUMNS}
     FROM long_arm_quilting_requests
     WHERE LOWER(TRIM(customer_email)) = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [parsed.email]
  );

  const requests = await enrichRows(rows);
  return {
    ok: true,
    mode: 'list',
    email: parsed.email,
    requests,
  };
}
