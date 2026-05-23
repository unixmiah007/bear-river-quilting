import {
  sendSendGridMail,
  resolveSendGridFromCustomer,
  resolveSendGridFromStaff,
  isSendGridConfigured,
} from './sendgridMail.js';

/** Comma-separated override via ORDER_NOTIFY_EMAILS in server/.env */
const DEFAULT_ORDER_NOTIFY_EMAILS =
  'shaj.k.miah@gmail.com,tracyalto@brqllc.com,nadimamin101@gmail.com';

export function parseOrderNotifyRecipients() {
  const raw = process.env.ORDER_NOTIFY_EMAILS?.trim();
  const src = raw || DEFAULT_ORDER_NOTIFY_EMAILS;
  const list = src
    .split(/[,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  return [...new Set(list)];
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Sends a customer order confirmation via SendGrid.
 * Requires SENDGRID_API_KEY and a verified sender (MAIL_FROM_ADDRESS or MAIL_FROM).
 */
export async function sendOrderConfirmationEmail({ to, orderNumber, customerName, total, items }) {
  const toAddr = String(to ?? '')
    .trim()
    .toLowerCase();
  if (!toAddr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toAddr)) {
    console.error('[mail] Invalid customer email for confirmation:', to);
    return;
  }

  if (!isSendGridConfigured()) {
    console.warn('[mail] Skipping confirmation: SENDGRID_API_KEY is not set in server/.env');
    return;
  }

  const from = resolveSendGridFromCustomer();
  if (!from) {
    console.error(
      '[mail] Skipping confirmation: set MAIL_FROM_ADDRESS or MAIL_FROM to a verified SendGrid sender (same as mail:test).'
    );
    return;
  }

  const lines = items.map(
    (it) => `  - ${it.productName} × ${it.quantity}  $${Number(it.lineTotal).toFixed(2)}`
  );

  const text = [
    `Hi ${customerName},`,
    '',
    `Thanks for your order. Your order number is ${orderNumber}.`,
    '',
    'Items:',
    ...lines,
    '',
    `Total: $${Number(total).toFixed(2)}`,
  ].join('\n');

  const html = `
<p>Hi ${escapeHtml(customerName)},</p>
<p>Thanks for your order. Your order number is <strong>${escapeHtml(orderNumber)}</strong>.</p>
<table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse">
<thead><tr><th>Item</th><th>Qty</th><th>Line</th></tr></thead><tbody>
${items
  .map(
    (it) =>
      `<tr><td>${escapeHtml(it.productName)}</td><td>${it.quantity}</td><td>$${Number(it.lineTotal).toFixed(2)}</td></tr>`
  )
  .join('')}
</tbody></table>
<p><strong>Total: $${Number(total).toFixed(2)}</strong></p>
`.trim();

  try {
    await sendSendGridMail({
      to: toAddr,
      from,
      subject: `Order confirmation ${orderNumber}`,
      text,
      html,
    });
    console.log('[mail] Sent customer confirmation', { orderNumber, to: toAddr });
  } catch (err) {
    const detail = err?.response?.body?.errors ?? err?.message ?? err;
    console.error('[mail] SendGrid confirmation failed:', detail);
    throw err;
  }
}

/**
 * Notifies internal recipients when a new order is placed (SendGrid).
 */
export async function sendOrderStaffNotificationEmail({
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  total,
  items,
  shipping,
  shippingMethod,
  shippingCost,
}) {
  if (!isSendGridConfigured()) {
    console.warn('[mail] Skipping staff notify: SENDGRID_API_KEY is not set in server/.env');
    return;
  }

  const from = resolveSendGridFromStaff();
  if (!from) {
    console.warn('[mail] Skipping staff notify: set MAIL_STAFF_FROM_ADDRESS or MAIL_FROM_ADDRESS / MAIL_FROM.');
    return;
  }

  const notifyTo = parseOrderNotifyRecipients();
  if (notifyTo.length === 0) return;

  const lines = items.map(
    (it) => `  - ${it.productName} × ${it.quantity}  $${Number(it.lineTotal).toFixed(2)}`
  );

  const shipLines = [
    `${shipping.address1}${shipping.address2 ? `, ${shipping.address2}` : ''}`,
    `${shipping.city}, ${shipping.state} ${shipping.postalCode}`,
    shipping.country,
    `Method: ${shippingMethod} ($${Number(shippingCost).toFixed(2)})`,
  ];

  const text = [
    `New order ${orderNumber}`,
    '',
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    customerPhone ? `Phone: ${customerPhone}` : null,
    '',
    'Ship to:',
    ...shipLines,
    '',
    'Items:',
    ...lines,
    '',
    `Total: $${Number(total).toFixed(2)}`,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
<p><strong>New order ${escapeHtml(orderNumber)}</strong></p>
<p>${escapeHtml(customerName)}<br>
<a href="mailto:${escapeHtml(customerEmail)}">${escapeHtml(customerEmail)}</a>
${customerPhone ? `<br>${escapeHtml(customerPhone)}` : ''}</p>
<p><strong>Ship to</strong><br>
${escapeHtml(shipping.address1)}${shipping.address2 ? `, ${escapeHtml(shipping.address2)}` : ''}<br>
${escapeHtml(shipping.city)}, ${escapeHtml(shipping.state)} ${escapeHtml(shipping.postalCode)}<br>
${escapeHtml(shipping.country)}<br>
Method: ${escapeHtml(shippingMethod)} ($${Number(shippingCost).toFixed(2)})</p>
<table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse">
<thead><tr><th>Item</th><th>Qty</th><th>Line</th></tr></thead><tbody>
${items
  .map(
    (it) =>
      `<tr><td>${escapeHtml(it.productName)}</td><td>${it.quantity}</td><td>$${Number(it.lineTotal).toFixed(2)}</td></tr>`
  )
  .join('')}
</tbody></table>
<p><strong>Total: $${Number(total).toFixed(2)}</strong></p>
`.trim();

  let staffSent = 0;
  for (const addr of notifyTo) {
    try {
      await sendSendGridMail({
        to: addr,
        from,
        subject: `New order ${orderNumber}`,
        text,
        html,
      });
      staffSent += 1;
      console.log('[mail] Sent staff notify', orderNumber, '→', addr);
    } catch (e) {
      const detail = e?.response?.body?.errors ?? e?.message ?? e;
      console.error('[mail] Staff notify failed for', addr, detail);
    }
  }
  if (staffSent === 0 && notifyTo.length > 0) {
    throw new Error(`Staff notify failed for all ${notifyTo.length} recipient(s)`);
  }
}

/**
 * Emails the customer their shipment tracking details.
 */
export async function sendOrderTrackingEmail({
  to,
  customerName,
  orderNumber,
  carrierLabel,
  trackingNumber,
  trackingUrl,
}) {
  const toAddr = String(to ?? '')
    .trim()
    .toLowerCase();
  if (!toAddr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toAddr)) {
    throw new Error('Invalid customer email on order');
  }

  if (!isSendGridConfigured()) {
    throw new Error('SendGrid is not configured — set SENDGRID_API_KEY in server/.env');
  }

  const from = resolveSendGridFromCustomer();
  if (!from) {
    throw new Error('Set MAIL_FROM_ADDRESS or MAIL_FROM to a verified SendGrid sender');
  }

  const trackLine = trackingUrl
    ? `Track your package: ${trackingUrl}`
    : `Tracking number: ${trackingNumber}`;

  const text = [
    `Hi ${customerName},`,
    '',
    `Good news — your Bear River Quilting order ${orderNumber} has shipped.`,
    '',
    `Carrier: ${carrierLabel}`,
    `Tracking number: ${trackingNumber}`,
    trackingUrl ? '' : null,
    trackingUrl ? trackLine : null,
    '',
    'Thank you for shopping with us.',
    '— Bear River Quilting',
  ]
    .filter((line) => line !== null)
    .join('\n');

  const trackHtml = trackingUrl
    ? `<p><a href="${escapeHtml(trackingUrl)}">Track your package</a></p>`
    : '';

  const html = `
<p>Hi ${escapeHtml(customerName)},</p>
<p>Good news — your Bear River Quilting order <strong>${escapeHtml(orderNumber)}</strong> has shipped.</p>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin:1rem 0">
<tbody>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Carrier</td><td><strong>${escapeHtml(carrierLabel)}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Tracking #</td><td><strong>${escapeHtml(trackingNumber)}</strong></td></tr>
</tbody>
</table>
${trackHtml}
<p>Thank you for shopping with us.<br>— Bear River Quilting</p>
`.trim();

  await sendSendGridMail({
    to: toAddr,
    from,
    subject: `Your order ${orderNumber} has shipped`,
    text,
    html,
  });

  console.log('[mail] Sent tracking email', { orderNumber, to: toAddr, carrier: carrierLabel });
}
