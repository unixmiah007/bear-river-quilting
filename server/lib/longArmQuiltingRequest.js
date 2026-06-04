import pool from '../db.js';
import { sendLongArmDepositEmails } from './longArmQuiltingEmail.js';
import { loadServicesByIds } from './longArmQuiltingService.js';
import { getPublishedLongArmBlanketPaletteById } from './longArmBlanketPalette.js';

export const LONG_ARM_DEPOSIT_USD = 30;

export const LONG_ARM_QUILT_SOURCES = new Set(['send_yours', 'use_ours']);

export function longArmQuiltSourceLabel(value) {
  if (value === 'send_yours') return 'Send us your quilt(s)';
  if (value === 'use_ours') return 'Use our quilt(s)';
  return '—';
}

export function longArmRequestNumber() {
  return `LAQ${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
}

function parseServiceIds(body) {
  const raw = body?.serviceIds ?? body?.selectedServiceIds ?? body?.service_ids;
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map(Number).filter((n) => n > 0))];
}

/** MySQL JSON columns may arrive as arrays or JSON strings depending on driver/settings. */
export function parseSelectedServiceIds(raw) {
  if (Array.isArray(raw)) {
    return raw.map(Number).filter((n) => n > 0);
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => n > 0);
      if (typeof parsed === 'number' && parsed > 0) return [parsed];
    } catch {
      /* ignore */
    }
  }
  if (typeof raw === 'number' && raw > 0) return [raw];
  return [];
}

function requiredAddress(value, label) {
  const s = String(value ?? '').trim();
  if (!s) return { ok: false, error: `${label} is required` };
  return { ok: true, value: s };
}

export async function validateLongArmRequestBody(body) {
  const serviceIds = parseServiceIds(body);
  if (serviceIds.length !== 1) {
    return { ok: false, status: 400, error: 'Select exactly one service' };
  }

  const services = await loadServicesByIds(serviceIds);
  if (services.length !== serviceIds.length) {
    return { ok: false, status: 400, error: 'One or more selected services are invalid or unavailable' };
  }

  const customerName = String(body?.customer?.name ?? body?.customerName ?? '').trim();
  const customerEmail = String(body?.customer?.email ?? body?.customerEmail ?? '').trim();
  const customerPhone = String(body?.customer?.phone ?? body?.customerPhone ?? '').trim() || null;
  const notes = String(body?.notes ?? '').trim() || null;
  const quiltSource = String(body?.quiltSource ?? body?.quilt_source ?? '').trim();
  const blanketPaletteIdRaw = body?.blanketPaletteId ?? body?.blanket_palette_id;
  const blanketPaletteId =
    blanketPaletteIdRaw == null || blanketPaletteIdRaw === ''
      ? null
      : Number(blanketPaletteIdRaw);

  if (!quiltSource || !LONG_ARM_QUILT_SOURCES.has(quiltSource)) {
    return { ok: false, status: 400, error: 'Select whether you are sending your quilt or using ours' };
  }

  let blanketPalette = null;
  if (quiltSource === 'use_ours') {
    if (!blanketPaletteId || !Number.isFinite(blanketPaletteId) || blanketPaletteId <= 0) {
      return { ok: false, status: 400, error: 'Select a base quilt from our palette' };
    }
    blanketPalette = await getPublishedLongArmBlanketPaletteById(blanketPaletteId);
    if (!blanketPalette) {
      return { ok: false, status: 400, error: 'Selected base quilt is invalid or unavailable' };
    }
  } else if (blanketPaletteId) {
    return { ok: false, status: 400, error: 'Base quilt selection is only required when using our quilt(s)' };
  }

  if (!customerName || !customerEmail) {
    return { ok: false, status: 400, error: 'Your name and email are required' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return { ok: false, status: 400, error: 'Enter a valid email address' };
  }

  const shipping = body?.shipping ?? {};
  const billing = body?.billing ?? {};

  const ship1 = requiredAddress(shipping.address1 ?? shipping.address_1, 'Shipping address');
  if (!ship1.ok) return { ok: false, status: 400, error: ship1.error };
  const shipCity = requiredAddress(shipping.city, 'Shipping city');
  if (!shipCity.ok) return { ok: false, status: 400, error: shipCity.error };
  const shipState = requiredAddress(shipping.state, 'Shipping state');
  if (!shipState.ok) return { ok: false, status: 400, error: shipState.error };
  const shipPostal = requiredAddress(shipping.postalCode ?? shipping.postal_code, 'Shipping postal code');
  if (!shipPostal.ok) return { ok: false, status: 400, error: shipPostal.error };
  const shipCountry = String(shipping.country ?? 'USA').trim() || 'USA';

  const billingName = requiredAddress(billing.name ?? customerName, 'Billing name');
  if (!billingName.ok) return { ok: false, status: 400, error: billingName.error };
  const bill1 = requiredAddress(billing.address1 ?? billing.address_1, 'Billing address');
  if (!bill1.ok) return { ok: false, status: 400, error: bill1.error };
  const billCity = requiredAddress(billing.city, 'Billing city');
  if (!billCity.ok) return { ok: false, status: 400, error: billCity.error };
  const billState = requiredAddress(billing.state, 'Billing state');
  if (!billState.ok) return { ok: false, status: 400, error: billState.error };
  const billPostal = requiredAddress(billing.postalCode ?? billing.postal_code, 'Billing postal code');
  if (!billPostal.ok) return { ok: false, status: 400, error: billPostal.error };
  const billCountry = String(billing.country ?? 'USA').trim() || 'USA';

  return {
    ok: true,
    data: {
      serviceIds,
      services,
      quiltSource,
      blanketPaletteId: blanketPalette?.id ?? null,
      blanketPalette,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      shipping: {
        address1: ship1.value,
        address2: String(shipping.address2 ?? shipping.address_2 ?? '').trim() || null,
        city: shipCity.value,
        state: shipState.value,
        postalCode: shipPostal.value,
        country: shipCountry,
      },
      billing: {
        name: billingName.value,
        address1: bill1.value,
        address2: String(billing.address2 ?? billing.address_2 ?? '').trim() || null,
        city: billCity.value,
        state: billState.value,
        postalCode: billPostal.value,
        country: billCountry,
      },
    },
  };
}

function mapRequestRow(row, services = [], blanketPalette = null) {
  const selectedServiceIds = parseSelectedServiceIds(row.selected_service_ids);
  return {
    id: row.id,
    request_number: row.request_number,
    status: row.status,
    acknowledged: row.acknowledged,
    selected_service_ids: selectedServiceIds,
    quilt_source: row.quilt_source ?? null,
    blanket_palette_id: row.blanket_palette_id != null ? Number(row.blanket_palette_id) : null,
    blanket_palette: blanketPalette,
    services,
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
    stripe_checkout_session_id: row.stripe_checkout_session_id,
    stripe_payment_intent_id: row.stripe_payment_intent_id,
    final_payment_amount: row.final_payment_amount != null ? Number(row.final_payment_amount) : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function insertPendingLongArmRequest(body) {
  const validated = await validateLongArmRequestBody(body);
  if (!validated.ok) return validated;

  const { data } = validated;
  const requestNumber = longArmRequestNumber();

  const [insert] = await pool.query(
    `INSERT INTO long_arm_quilting_requests (
       request_number, status, selected_service_ids, quilt_source, blanket_palette_id, notes,
       customer_name, customer_email, customer_phone,
       shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
       billing_name, billing_address1, billing_address2, billing_city, billing_state, billing_postal_code, billing_country,
       deposit_amount
     ) VALUES (?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      requestNumber,
      JSON.stringify(data.serviceIds),
      data.quiltSource,
      data.blanketPaletteId,
      data.notes,
      data.customerName,
      data.customerEmail,
      data.customerPhone,
      data.shipping.address1,
      data.shipping.address2,
      data.shipping.city,
      data.shipping.state,
      data.shipping.postalCode,
      data.shipping.country,
      data.billing.name,
      data.billing.address1,
      data.billing.address2,
      data.billing.city,
      data.billing.state,
      data.billing.postalCode,
      data.billing.country,
      LONG_ARM_DEPOSIT_USD.toFixed(2),
    ]
  );

  const requestId = insert.insertId;
  const [[row]] = await pool.query('SELECT * FROM long_arm_quilting_requests WHERE id = ?', [requestId]);

  return {
    ok: true,
    requestId,
    requestNumber,
    row,
    services: data.services,
  };
}

export async function fulfillLongArmRequestDeposit(requestId, { sessionId, paymentIntentId }) {
  const id = Number(requestId);
  const [[row]] = await pool.query('SELECT * FROM long_arm_quilting_requests WHERE id = ?', [id]);
  if (!row) {
    return { ok: false, status: 404, error: 'Long-arm request not found' };
  }

  if (row.status === 'deposit_paid' || row.deposit_paid_at) {
    return {
      ok: true,
      alreadyFulfilled: true,
      checkoutType: 'long_arm_quilting',
      requestId: id,
      requestNumber: row.request_number,
      customerEmail: row.customer_email,
    };
  }

  await pool.query(
    `UPDATE long_arm_quilting_requests SET
       status = 'deposit_paid',
       deposit_paid_at = CURRENT_TIMESTAMP,
       stripe_checkout_session_id = ?,
       stripe_payment_intent_id = ?
     WHERE id = ?`,
    [sessionId, paymentIntentId, id]
  );

  let mail = { customerOk: false, staffOk: false };
  try {
    mail = await sendLongArmDepositEmails(id);
  } catch (e) {
    console.error('[long-arm] deposit mail failed:', e?.message || e);
  }

  return {
    ok: true,
    checkoutType: 'long_arm_quilting',
    requestId: id,
    requestNumber: row.request_number,
    customerEmail: row.customer_email,
    mail,
  };
}

export async function listLongArmRequestsForAdmin() {
  const [rows] = await pool.query(
    `SELECT * FROM long_arm_quilting_requests ORDER BY created_at DESC LIMIT 500`
  );

  const allIds = new Set();
  const paletteIds = new Set();
  for (const row of rows) {
    for (const id of parseSelectedServiceIds(row.selected_service_ids)) {
      allIds.add(id);
    }
    if (row.blanket_palette_id) paletteIds.add(Number(row.blanket_palette_id));
  }

  let serviceMap = new Map();
  if (allIds.size > 0) {
    const idList = [...allIds];
    const [svcRows] = await pool.query(
      `SELECT id, name, hourly_rate FROM long_arm_quilting_services WHERE id IN (${idList.map(() => '?').join(',')})`,
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
    const blanketPalette = paletteRow
      ? {
          id: paletteRow.id,
          title: paletteRow.title,
          price: paletteRow.price != null ? Number(paletteRow.price) : null,
          image_url: paletteRow.image_url,
        }
      : null;
    return mapRequestRow(row, services, blanketPalette);
  });
}

export async function setLongArmRequestAcknowledged(id, acknowledged) {
  const requestId = Number(id);
  const flag = acknowledged ? 'Y' : 'N';
  const [result] = await pool.query(
    'UPDATE long_arm_quilting_requests SET acknowledged = ? WHERE id = ?',
    [flag, requestId]
  );
  if (result.affectedRows === 0) {
    return { ok: false, status: 404, error: 'Request not found' };
  }
  return { ok: true, acknowledged: flag };
}

export async function updateLongArmRequestStatus(id, status) {
  const allowed = new Set(['pending_payment', 'deposit_paid', 'in_progress', 'completed', 'cancelled']);
  const next = String(status ?? '').trim();
  if (!allowed.has(next)) {
    return { ok: false, status: 400, error: 'Invalid status' };
  }
  const requestId = Number(id);
  const [result] = await pool.query('UPDATE long_arm_quilting_requests SET status = ? WHERE id = ?', [
    next,
    requestId,
  ]);
  if (result.affectedRows === 0) {
    return { ok: false, status: 404, error: 'Request not found' };
  }
  return { ok: true, status: next };
}
