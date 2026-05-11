import sgMail from '@sendgrid/mail';

/**
 * Sends an email via the SendGrid HTTP API.
 * Requires SENDGRID_API_KEY to be set in the environment.
 *
 * @param {{ to: string, from: string, subject: string, text: string, html: string }} options
 * @returns {Promise<void>}
 */
async function sendEmail({ to, from, subject, text, html }) {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) {
    console.warn('[mail] Skipping email: SENDGRID_API_KEY is not set in the environment');
    return;
  }

  sgMail.setApiKey(apiKey);

  try {
    await sgMail.send({ to, from, subject, text, html });
    console.log('[mail] Email sent via SendGrid', { to, subject });
  } catch (err) {
    const detail = err?.response?.body?.errors ?? err?.message ?? err;
    console.error('[mail] SendGrid send failed:', detail);
    throw err;
  }
}

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
 * Sends a customer order confirmation email via SendGrid.
 * Requires SENDGRID_API_KEY to be set in the environment.
 */
export async function sendOrderConfirmationEmail({ to, orderNumber, customerName, total, items }) {
  if (!process.env.SENDGRID_API_KEY?.trim()) {
    console.warn('[mail] Skipping confirmation: SENDGRID_API_KEY is not set in the environment');
    return;
  }

  const fromName = process.env.MAIL_FROM_NAME?.trim() || 'Order confirmation';
  const fromAddress = process.env.MAIL_FROM_ADDRESS?.trim() || process.env.MAIL_FROM?.trim();
  const from = fromAddress ? `${fromName} <${fromAddress}>` : fromName;

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

  await sendEmail({ to, from, subject: `Order confirmation ${orderNumber}`, text, html });
  console.log('[mail] Sent customer confirmation', { orderNumber, to });
}

/**
 * Notifies internal recipients when a new order is placed via SendGrid.
 * Requires SENDGRID_API_KEY to be set in the environment.
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
  if (!process.env.SENDGRID_API_KEY?.trim()) {
    console.warn('[mail] Skipping staff notify: SENDGRID_API_KEY is not set in the environment');
    return;
  }

  const notifyTo = parseOrderNotifyRecipients();
  if (notifyTo.length === 0) return;

  const fromName = process.env.MAIL_STAFF_FROM_NAME?.trim() || 'New order';
  const fromAddress = process.env.MAIL_STAFF_FROM_ADDRESS?.trim() || process.env.MAIL_STAFF_FROM?.trim();
  const from = fromAddress ? `${fromName} <${fromAddress}>` : fromName;

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
      await sendEmail({ to: addr, from, subject: `New order ${orderNumber}`, text, html });
      staffSent += 1;
      console.log('[mail] Sent staff notify', orderNumber, '→', addr);
    } catch (e) {
      console.error('[mail] Staff notify failed for', addr, e?.message ?? e);
    }
  }
  if (staffSent === 0 && notifyTo.length > 0) {
    throw new Error(`Staff notify failed for all ${notifyTo.length} recipient(s)`);
  }
}
