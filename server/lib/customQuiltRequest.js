import pool from '../db.js';
import { sendSendGridMail, resolveSendGridFromStaff, resolveSendGridFromCustomer } from './sendgridMail.js';
import { parseOrderNotifyRecipients } from './mail.js';
import { normalizeProductSize } from './productSize.js';
import { estimateCustomizePrice, resolveCustomizeDesign } from './customizeDesign.js';
import {
  getActiveSizeOptions,
  getAllowedBattingValues,
  getAllowedColorPaletteValues,
  loadCustomizeWizardConfig,
} from './customizeWizardConfig.js';

export function customQuiltRequestNumber() {
  return `CQ${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function validateCustomQuiltBody(body) {
  const designId = String(body?.designId ?? '').trim();
  const designName = String(body?.designName ?? '').trim();
  const customerName = String(body?.customer?.name ?? body?.customerName ?? '').trim();
  const customerEmail = String(body?.customer?.email ?? body?.customerEmail ?? '').trim();
  const customerPhone = String(body?.customer?.phone ?? body?.customerPhone ?? '').trim() || null;
  const productSize = normalizeProductSize(body?.productSize);
  const colorPalette = String(body?.colorPalette ?? '').trim();
  const batting = String(body?.batting ?? '').trim() || null;
  const quiltTitle = String(body?.quiltTitle ?? '').trim() || null;
  const notes = String(body?.notes ?? '').trim() || null;

  if (!designId) {
    return { ok: false, status: 400, error: 'Select a product to customize' };
  }

  const resolved = await resolveCustomizeDesign(designId, designName);
  if (!resolved.ok) {
    return { ok: false, status: 400, error: resolved.error };
  }

  const estimatedPrice = estimateCustomizePrice(
    resolved.designId,
    productSize,
    resolved.basePrice
  );
  if (estimatedPrice == null || estimatedPrice <= 0) {
    return { ok: false, status: 400, error: 'Could not calculate price for this design and size' };
  }

  if (!customerName || !customerEmail) {
    return { ok: false, status: 400, error: 'Your name and email are required' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return { ok: false, status: 400, error: 'Enter a valid email address' };
  }
  const wizardConfig = await loadCustomizeWizardConfig();
  const allowedSizes = new Set(getActiveSizeOptions(wizardConfig).map((o) => o.value));
  const allowedColors = getAllowedColorPaletteValues(wizardConfig);
  const allowedBatting = getAllowedBattingValues(wizardConfig);

  if (!productSize || !allowedSizes.has(productSize)) {
    return { ok: false, status: 400, error: 'Select a quilt size' };
  }
  if (!colorPalette || !allowedColors.has(colorPalette)) {
    return { ok: false, status: 400, error: 'Select a color palette' };
  }
  if (batting && !allowedBatting.has(batting)) {
    return { ok: false, status: 400, error: 'Invalid batting option' };
  }

  return {
    ok: true,
    data: {
      designId: resolved.designId,
      designName: resolved.designName,
      customerName,
      customerEmail,
      customerPhone,
      productSize,
      colorPalette,
      batting,
      quiltTitle,
      notes,
      estimatedPrice,
    },
  };
}

async function sendCustomQuiltEmails(row) {
  const fromCustomer = resolveSendGridFromCustomer();
  const fromStaff = resolveSendGridFromStaff();
  const staffTo = parseOrderNotifyRecipients();
  const priceLine =
    row.estimated_price != null
      ? `Estimated starting price: $${Number(row.estimated_price).toFixed(2)}`
      : 'Estimated price: to be confirmed by our designer';

  const detailLines = [
    `Request: ${row.request_number}`,
    `Design: ${row.design_name} (${row.design_id})`,
    `Size: ${row.product_size}`,
    `Color palette: ${row.color_palette}`,
    row.batting ? `Batting: ${row.batting}` : null,
    row.quilt_title ? `Working title: ${row.quilt_title}` : null,
    row.notes ? `Notes for designer:\n${row.notes}` : null,
    priceLine,
  ]
    .filter(Boolean)
    .join('\n');

  const tasks = [];

  if (fromCustomer) {
    tasks.push(
      sendSendGridMail({
        to: row.customer_email,
        from: fromCustomer,
        subject: `Custom quilt request received — ${row.request_number}`,
        text: [
          `Hi ${row.customer_name},`,
          '',
          'Thank you for your custom quilt request. Our designer will review your selections and follow up within 2–3 business days.',
          '',
          detailLines,
          '',
          '— Bear River Quilting',
        ].join('\n'),
        html: `<p>Hi ${escapeHtml(row.customer_name)},</p>
<p>Thank you for your custom quilt request. Our designer will review your selections and follow up within <strong>2–3 business days</strong>.</p>
<pre style="white-space:pre-wrap;font-family:inherit;background:#f9fafb;padding:1rem;border-radius:8px">${escapeHtml(detailLines)}</pre>
<p>— Bear River Quilting</p>`,
      })
    );
  }

  if (fromStaff && staffTo.length) {
    tasks.push(
      sendSendGridMail({
        to: staffTo,
        from: fromStaff,
        subject: `New custom quilt request ${row.request_number}`,
        text: [
          'A new custom quilt request was submitted.',
          '',
          `Customer: ${row.customer_name}`,
          `Email: ${row.customer_email}`,
          row.customer_phone ? `Phone: ${row.customer_phone}` : null,
          '',
          detailLines,
        ]
          .filter(Boolean)
          .join('\n'),
        html: `<p><strong>New custom quilt request</strong></p>
<p>${escapeHtml(row.customer_name)}<br>
<a href="mailto:${escapeHtml(row.customer_email)}">${escapeHtml(row.customer_email)}</a>
${row.customer_phone ? `<br>${escapeHtml(row.customer_phone)}` : ''}</p>
<pre style="white-space:pre-wrap;font-family:inherit;background:#f9fafb;padding:1rem;border-radius:8px">${escapeHtml(detailLines)}</pre>`,
      })
    );
  }

  if (tasks.length === 0) return { customerOk: false, staffOk: false };

  const results = await Promise.allSettled(tasks);
  return {
    customerOk: results[0]?.status === 'fulfilled',
    staffOk: results[1]?.status === 'fulfilled',
  };
}

function rowFromData(d, id, requestNumber) {
  return {
    id,
    request_number: requestNumber,
    design_id: d.designId,
    design_name: d.designName,
    product_size: d.productSize,
    color_palette: d.colorPalette,
    batting: d.batting,
    quilt_title: d.quiltTitle,
    notes: d.notes,
    customer_name: d.customerName,
    customer_email: d.customerEmail,
    customer_phone: d.customerPhone,
    estimated_price: d.estimatedPrice,
  };
}

/** Insert request before Stripe payment (no emails). */
export async function insertPendingCustomQuiltRequest(body) {
  const validated = await validateCustomQuiltBody(body);
  if (!validated.ok) {
    return validated;
  }

  const d = validated.data;
  const price = Number(d.estimatedPrice);
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, status: 400, error: 'A valid estimated price is required for checkout' };
  }

  const requestNumber = customQuiltRequestNumber();
  const [result] = await pool.query(
    `INSERT INTO custom_quilt_requests (
       request_number, status, design_id, design_name, product_size, color_palette,
       batting, quilt_title, notes, customer_name, customer_email, customer_phone, estimated_price
     ) VALUES (?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      requestNumber,
      d.designId,
      d.designName,
      d.productSize,
      d.colorPalette,
      d.batting,
      d.quiltTitle,
      d.notes,
      d.customerName,
      d.customerEmail,
      d.customerPhone,
      d.estimatedPrice,
    ]
  );

  return {
    ok: true,
    requestNumber,
    requestId: result.insertId,
    row: rowFromData(d, result.insertId, requestNumber),
  };
}

export async function fulfillCustomQuiltRequestPayment(requestId, { sessionId, paymentIntentId, cardLast4 }) {
  const id = Number(requestId);
  const [[existing]] = await pool.query(
    `SELECT id, request_number, status, design_id, design_name, product_size, color_palette,
            batting, quilt_title, notes, customer_name, customer_email, customer_phone, estimated_price
     FROM custom_quilt_requests WHERE id = ?`,
    [id]
  );
  if (!existing) {
    return { ok: false, status: 404, error: 'Custom quilt request not found' };
  }

  if (existing.status === 'paid') {
    return {
      ok: true,
      alreadyFulfilled: true,
      checkoutType: 'custom_quilt',
      requestId: id,
      requestNumber: existing.request_number,
      customerEmail: existing.customer_email,
    };
  }

  await pool.query(
    `UPDATE custom_quilt_requests SET
       status = 'paid',
       stripe_checkout_session_id = ?,
       stripe_payment_intent_id = ?
     WHERE id = ?`,
    [sessionId ?? null, paymentIntentId ?? null, id]
  );

  const row = { ...existing, status: 'paid' };
  let mail = { customerOk: false, staffOk: false };
  try {
    mail = await sendCustomQuiltEmails(row);
  } catch (e) {
    console.error('[custom-quilt] mail failed:', e?.message || e);
  }

  return {
    ok: true,
    checkoutType: 'custom_quilt',
    requestId: id,
    requestNumber: existing.request_number,
    customerEmail: existing.customer_email,
    mail,
  };
}

/** Free submit path (no Stripe) — kept for API compatibility. */
export async function createCustomQuiltRequest(body) {
  const validated = await validateCustomQuiltBody(body);
  if (!validated.ok) {
    return validated;
  }

  const d = validated.data;
  const requestNumber = customQuiltRequestNumber();

  const [result] = await pool.query(
    `INSERT INTO custom_quilt_requests (
       request_number, status, design_id, design_name, product_size, color_palette,
       batting, quilt_title, notes, customer_name, customer_email, customer_phone, estimated_price
     ) VALUES (?, 'submitted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      requestNumber,
      d.designId,
      d.designName,
      d.productSize,
      d.colorPalette,
      d.batting,
      d.quiltTitle,
      d.notes,
      d.customerName,
      d.customerEmail,
      d.customerPhone,
      d.estimatedPrice,
    ]
  );

  const row = rowFromData(d, result.insertId, requestNumber);

  let mail = { customerOk: false, staffOk: false };
  try {
    mail = await sendCustomQuiltEmails(row);
  } catch (e) {
    console.error('[custom-quilt] mail failed:', e?.message || e);
  }

  return {
    ok: true,
    requestNumber,
    requestId: row.id,
    mail,
  };
}

export async function listCustomQuiltRequestsForAdmin() {
  const [rows] = await pool.query(
    `SELECT id, request_number, status, acknowledged, design_name, product_size, color_palette,
            customer_name, customer_email, estimated_price, created_at
     FROM custom_quilt_requests
     ORDER BY created_at DESC
     LIMIT 200`
  );
  return rows;
}

export async function setCustomQuiltRequestAcknowledged(id, acknowledged) {
  const value = String(acknowledged ?? '')
    .trim()
    .toUpperCase();
  if (!['Y', 'N'].includes(value)) {
    return { ok: false, status: 400, error: 'acknowledged must be Y or N' };
  }
  const [result] = await pool.query(
    'UPDATE custom_quilt_requests SET acknowledged = ? WHERE id = ?',
    [value, Number(id)]
  );
  if (result.affectedRows === 0) {
    return { ok: false, status: 404, error: 'Request not found' };
  }
  return { ok: true, acknowledged: value };
}
