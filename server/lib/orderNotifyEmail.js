import nodemailer from 'nodemailer';

/** Default recipients when ORDER_NOTIFY_EMAILS is unset. */
const DEFAULT_ORDER_NOTIFY_EMAILS = [
  'shaj.k.miah@gmail.com',
  'tracyalto@brqllc.com',
  'nadimamin101@gmail.com',
];

/** Cached Ethereal transport + account (one inbox per server process). */
let etherealSetupPromise = null;

function parseRecipients() {
  const raw = process.env.ORDER_NOTIFY_EMAILS?.trim();
  if (raw) {
    return raw
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [...DEFAULT_ORDER_NOTIFY_EMAILS];
}

function createSmtpTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function getEtherealMailer() {
  if (!etherealSetupPromise) {
    etherealSetupPromise = (async () => {
      const account = await nodemailer.createTestAccount();
      console.warn(
        `[orderNotify] Using Ethereal (free test SMTP). Web UI: ${account.web}  user: ${account.user}`
      );
      const transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      });
      return { transporter, account };
    })();
  }
  return etherealSetupPromise;
}

/**
 * @returns {{ transporter: import('nodemailer').Transporter, isEthereal: boolean }}
 */
async function resolveTransport() {
  const smtp = createSmtpTransport();
  if (smtp) {
    return { transporter: smtp, isEthereal: false };
  }
  const { transporter } = await getEtherealMailer();
  return { transporter, isEthereal: true };
}

function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

function buildBodies(payload) {
  const {
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    shippingMethod,
    subtotal,
    taxAmount,
    shippingCost,
    total,
    items,
  } = payload;

  const lines = items.map(
    (it) =>
      `  - ${it.productName} × ${it.quantity} @ ${money(it.unitPrice)} → ${money(it.lineTotal)}`
  );

  const text = [
    `A new order was placed on Bear River Quilting.`,
    ``,
    `Order number: ${orderNumber}`,
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    customerPhone ? `Phone: ${customerPhone}` : null,
    `Shipping: ${shippingMethod}`,
    ``,
    `Subtotal: ${money(subtotal)}`,
    `Tax: ${money(taxAmount)}`,
    `Shipping: ${money(shippingCost)}`,
    `Total: ${money(total)}`,
    ``,
    `Line items:`,
    ...lines,
  ]
    .filter(Boolean)
    .join('\n');

  const rows = items
    .map(
      (it) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${escapeHtml(
          it.productName
        )}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${it.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${money(
          it.lineTotal
        )}</td></tr>`
    )
    .join('');

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:15px;color:#111">
<p><strong>New order</strong> — Bear River Quilting</p>
<table style="border-collapse:collapse;margin:12px 0">
<tr><td style="padding:4px 8px"><strong>Order #</strong></td><td style="padding:4px 8px">${escapeHtml(orderNumber)}</td></tr>
<tr><td style="padding:4px 8px"><strong>Customer</strong></td><td style="padding:4px 8px">${escapeHtml(customerName)}</td></tr>
<tr><td style="padding:4px 8px"><strong>Email</strong></td><td style="padding:4px 8px">${escapeHtml(customerEmail)}</td></tr>
${
  customerPhone
    ? `<tr><td style="padding:4px 8px"><strong>Phone</strong></td><td style="padding:4px 8px">${escapeHtml(
        customerPhone
      )}</td></tr>`
    : ''
}
<tr><td style="padding:4px 8px"><strong>Shipping</strong></td><td style="padding:4px 8px">${escapeHtml(
    shippingMethod
  )}</td></tr>
<tr><td style="padding:4px 8px"><strong>Total</strong></td><td style="padding:4px 8px">${money(total)}</td></tr>
</table>
<table style="border-collapse:collapse;width:100%;max-width:520px">
<thead><tr><th align="left" style="padding:6px 8px;border-bottom:2px solid #ccc">Item</th><th style="padding:6px 8px;border-bottom:2px solid #ccc">Qty</th><th align="right" style="padding:6px 8px;border-bottom:2px solid #ccc">Line</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`;

  return { text, html };
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Sends order notification. Uses real SMTP if SMTP_HOST, SMTP_USER, and SMTP_PASS are set;
 * otherwise uses Ethereal (https://ethereal.email) — open the logged preview URL to read the message.
 * Ethereal does not deliver to real inboxes. Does not throw — logs on failure.
 */
export async function sendOrderPlacedEmail(payload) {
  const to = parseRecipients();
  if (to.length === 0) {
    console.warn('[orderNotify] No recipient addresses configured.');
    return;
  }

  let transporter;
  let isEthereal;
  try {
    const resolved = await resolveTransport();
    transporter = resolved.transporter;
    isEthereal = resolved.isEthereal;
  } catch (e) {
    console.error('[orderNotify] Could not create mail transport:', e?.message || e);
    return;
  }

  const from =
    process.env.SMTP_FROM?.trim() ||
    (isEthereal
      ? '"Bear River Quilting" <orders@example.com>'
      : process.env.SMTP_USER?.trim() || '"Bear River Quilting" <noreply@localhost>');

  const { text, html } = buildBodies(payload);
  const subject = `New order ${payload.orderNumber} — Bear River Quilting`;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    if (isEthereal && typeof nodemailer.getTestMessageUrl === 'function') {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        console.log('[orderNotify] Ethereal preview (open in browser):', preview);
      }
    }
  } catch (e) {
    console.error('[orderNotify] sendMail failed:', e?.message || e);
  }
}
