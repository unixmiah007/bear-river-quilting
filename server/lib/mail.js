import nodemailer from 'nodemailer';
import { createGmailTransport } from './gmailTransport.js';

/**
 * Returns a nodemailer transport for Ethereal Email if ETHEREAL_USER and
 * ETHEREAL_PASSWORD are set, otherwise falls back to the Gmail transport.
 * Returns null when neither service is configured.
 */
function createTransport() {
  const etherealUser = process.env.ETHEREAL_USER?.trim();
  const etherealPass = process.env.ETHEREAL_PASSWORD?.trim();

  if (etherealUser && etherealPass) {
    console.log('[mail] Using Ethereal Email transport — view messages at https://ethereal.email/messages');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: etherealUser, pass: etherealPass },
    });
  }

  return createGmailTransport();
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
 * Sends a customer order confirmation when GMAIL_USER and GMAIL_APP_PASSWORD
 * are set (use a Google App Password, not your normal sign-in password).
 */
export async function sendOrderConfirmationEmail({ to, orderNumber, customerName, total, items }) {
  const transport = createTransport();
  if (!transport) {
    console.warn('[mail] Skipping confirmation: set ETHEREAL_USER/ETHEREAL_PASSWORD or GMAIL_USER/GMAIL_APP_PASSWORD in server/.env');
    return;
  }

  const senderUser = (process.env.ETHEREAL_USER ?? process.env.GMAIL_USER ?? '').trim();
  const fromName = process.env.MAIL_FROM_NAME?.trim() || 'Order confirmation';
  const from = process.env.MAIL_FROM?.trim() || `${fromName} <${senderUser}>`;

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

  await transport.sendMail({
    from,
    to,
    subject: `Order confirmation ${orderNumber}`,
    text,
    html,
  });
  console.log('[mail] Sent customer confirmation', { orderNumber, to });
}

/**
 * Notifies internal recipients when a new order is placed (same Gmail transport).
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
  const transport = createTransport();
  if (!transport) {
    console.warn('[mail] Skipping staff notify: set ETHEREAL_USER/ETHEREAL_PASSWORD or GMAIL_USER/GMAIL_APP_PASSWORD in server/.env');
    return;
  }

  const notifyTo = parseOrderNotifyRecipients();
  if (notifyTo.length === 0) return;

  const senderUser = (process.env.ETHEREAL_USER ?? process.env.GMAIL_USER ?? '').trim();
  const fromName = process.env.MAIL_STAFF_FROM_NAME?.trim() || 'New order';
  const from = process.env.MAIL_STAFF_FROM?.trim() || `${fromName} <${senderUser}>`;

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
      await transport.sendMail({
        from,
        to: addr,
        subject: `New order ${orderNumber}`,
        text,
        html,
      });
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
