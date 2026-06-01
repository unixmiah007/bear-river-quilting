import {
  sendSendGridMail,
  resolveSendGridFromCustomer,
  resolveSendGridFromStaff,
  isSendGridConfigured,
} from './sendgridMail.js';
import { getClientOrigin } from './clientOrigin.js';

/** Comma-separated override via ORDER_NOTIFY_EMAILS in server/.env */
const DEFAULT_ORDER_NOTIFY_EMAILS =
  'shaj.k.miah@gmail.com,tracyalto@brqllc.com,nadimamin101@gmail.com';

/** Public account page deep link — opens order status when email + order match checkout. */
export function buildCustomerOrderAccountUrl(email, orderNumber) {
  const params = new URLSearchParams({
    email: String(email ?? '').trim().toLowerCase(),
    order: String(orderNumber ?? '').trim(),
  });
  return `${getClientOrigin()}/account?${params.toString()}`;
}

/** Admin orders page — opens order detail after sign-in when not authenticated. */
export function buildAdminOrderUrl(orderId) {
  const id = Number(orderId);
  if (!Number.isFinite(id) || id <= 0) {
    return `${getClientOrigin()}/admin/orders`;
  }
  const params = new URLSearchParams({ order: String(id) });
  return `${getClientOrigin()}/admin/orders?${params.toString()}`;
}

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

  const orderStatusUrl = buildCustomerOrderAccountUrl(toAddr, orderNumber);

  const lines = items.map(
    (it) => `  - ${it.productName} × ${it.quantity}  $${Number(it.lineTotal).toFixed(2)}`
  );

  const text = [
    `Hi ${customerName},`,
    '',
    `Thanks for your order. Your order number is ${orderNumber}.`,
    `View order status: ${orderStatusUrl}`,
    '',
    'Items:',
    ...lines,
    '',
    `Total: $${Number(total).toFixed(2)}`,
  ].join('\n');

  const html = `
<p>Hi ${escapeHtml(customerName)},</p>
<p>Thanks for your order. Your order number is <strong><a href="${escapeHtml(orderStatusUrl)}">${escapeHtml(orderNumber)}</a></strong>.</p>
<p><a href="${escapeHtml(orderStatusUrl)}">View order status and details</a></p>
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
  orderId,
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

  const adminOrderUrl = buildAdminOrderUrl(orderId);
  const orderNumberHtml = orderId
    ? `<a href="${escapeHtml(adminOrderUrl)}">${escapeHtml(orderNumber)}</a>`
    : escapeHtml(orderNumber);

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
    orderId ? `View in admin: ${adminOrderUrl}` : null,
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
<p><strong>New order ${orderNumberHtml}</strong></p>
${orderId ? `<p><a href="${escapeHtml(adminOrderUrl)}">View order in admin</a></p>` : ''}
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

/**
 * Emails the customer when an admin updates their order status.
 */
export async function sendOrderStatusUpdateEmail({
  to,
  customerName,
  orderNumber,
  status,
  statusLabel,
  statusMessage,
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

  const accountUrl = buildCustomerOrderAccountUrl(toAddr, orderNumber);
  const label = statusLabel || String(status ?? 'updated');
  const message =
    statusMessage || `Your order status is now: ${label}.`;

  const text = [
    `Hi ${customerName},`,
    '',
    `This is an update on your Bear River Quilting order ${orderNumber}.`,
    '',
    `Current status: ${label}`,
    message,
    '',
    `View your order details: ${accountUrl}`,
    '',
    'If you have questions, reply to this email.',
    '',
    '— Bear River Quilting',
  ].join('\n');

  const html = `
<p>Hi ${escapeHtml(customerName)},</p>
<p>This is an update on your Bear River Quilting order <strong>${escapeHtml(orderNumber)}</strong>.</p>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin:1rem 0">
<tbody>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Status</td><td><strong>${escapeHtml(label)}</strong></td></tr>
</tbody>
</table>
<p>${escapeHtml(message)}</p>
<p><a href="${escapeHtml(accountUrl)}" style="display:inline-block;padding:0.7rem 1.15rem;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View order status</a></p>
<p style="font-size:0.9rem;color:#6b7280">Or open this link:<br><a href="${escapeHtml(accountUrl)}">${escapeHtml(accountUrl)}</a></p>
<p>— Bear River Quilting</p>`.trim();

  await sendSendGridMail({
    to: toAddr,
    from,
    subject: `Order ${orderNumber} — status update: ${label}`,
    text,
    html,
  });

  console.log('[mail] Sent order status update', { orderNumber, status, to: toAddr });
}

/** Partial refund after admin changes a line item product on a paid order. */
export async function sendOrderLineItemRefundEmail({
  to,
  customerName,
  orderNumber,
  refundAmount,
  priorTotal,
  newTotal,
  productName,
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

  const refundFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(refundAmount)
  );
  const priorFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(priorTotal)
  );
  const newFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(newTotal)
  );
  const accountUrl = buildCustomerOrderAccountUrl(toAddr, orderNumber);

  const text = [
    `Hi ${customerName},`,
    '',
    `We updated an item on your Bear River Quilting order ${orderNumber}.`,
    productName ? `Updated line item: ${productName}` : null,
    '',
    `Previous order total: ${priorFmt}`,
    `Revised order total: ${newFmt}`,
    `Refund issued to your original payment method: ${refundFmt}`,
    '',
    `View your order: ${accountUrl}`,
    '',
    'Please allow a few business days for the refund to appear on your statement.',
    '',
    '— Bear River Quilting',
  ]
    .filter((line) => line !== null)
    .join('\n');

  const html = `
<p>Hi ${escapeHtml(customerName)},</p>
<p>We updated an item on your Bear River Quilting order <strong>${escapeHtml(orderNumber)}</strong>.</p>
${productName ? `<p><strong>Updated line item:</strong> ${escapeHtml(productName)}</p>` : ''}
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin:1rem 0">
<tbody>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Previous total</td><td>${escapeHtml(priorFmt)}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Revised total</td><td><strong>${escapeHtml(newFmt)}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Refund</td><td><strong>${escapeHtml(refundFmt)}</strong></td></tr>
</tbody>
</table>
<p>The refund was sent to your original payment method. It may take a few business days to appear on your statement.</p>
<p><a href="${escapeHtml(accountUrl)}" style="display:inline-block;padding:0.7rem 1.15rem;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View order</a></p>
<p>— Bear River Quilting</p>`.trim();

  await sendSendGridMail({
    to: toAddr,
    from,
    subject: `Refund for order ${orderNumber} — ${refundFmt}`,
    text,
    html,
  });

  console.log('[mail] Sent line-item refund notice', { orderNumber, to: toAddr, refundAmount });
}

/**
 * Emails the customer shipment tracking for a custom quilt request.
 */
export async function sendCustomQuiltTrackingEmail({
  to,
  customerName,
  requestNumber,
  carrierLabel,
  trackingNumber,
  trackingUrl,
}) {
  const toAddr = String(to ?? '')
    .trim()
    .toLowerCase();
  if (!toAddr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toAddr)) {
    throw new Error('Invalid customer email on custom quilt request');
  }

  if (!isSendGridConfigured()) {
    throw new Error('SendGrid is not configured — set SENDGRID_API_KEY in server/.env');
  }

  const from = resolveSendGridFromCustomer();
  if (!from) {
    throw new Error('Set MAIL_FROM_ADDRESS or MAIL_FROM to a verified SendGrid sender');
  }

  const accountUrl = `${getClientOrigin()}/account?${new URLSearchParams({
    email: toAddr,
    customRequest: String(requestNumber ?? '').trim(),
  }).toString()}`;

  const trackLine = trackingUrl
    ? `Track your package: ${trackingUrl}`
    : `Tracking number: ${trackingNumber}`;

  const text = [
    `Hi ${customerName},`,
    '',
    `Good news — your custom quilt request ${requestNumber} has shipped.`,
    '',
    `Carrier: ${carrierLabel}`,
    `Tracking number: ${trackingNumber}`,
    trackingUrl ? '' : null,
    trackingUrl ? trackLine : null,
    '',
    `View your request status: ${accountUrl}`,
    '',
    'Thank you for choosing Bear River Quilting.',
    '— Bear River Quilting',
  ]
    .filter((line) => line !== null)
    .join('\n');

  const trackHtml = trackingUrl
    ? `<p><a href="${escapeHtml(trackingUrl)}">Track your package</a></p>`
    : '';

  const html = `
<p>Hi ${escapeHtml(customerName)},</p>
<p>Good news — your custom quilt request <strong>${escapeHtml(requestNumber)}</strong> has shipped.</p>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin:1rem 0">
<tbody>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Carrier</td><td><strong>${escapeHtml(carrierLabel)}</strong></td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Tracking #</td><td><strong>${escapeHtml(trackingNumber)}</strong></td></tr>
</tbody>
</table>
${trackHtml}
<p><a href="${escapeHtml(accountUrl)}">View request status on our website</a></p>
<p>Thank you for choosing Bear River Quilting.<br>— Bear River Quilting</p>
`.trim();

  await sendSendGridMail({
    to: toAddr,
    from,
    subject: `Your custom quilt ${requestNumber} has shipped`,
    text,
    html,
  });

  console.log('[mail] Sent custom quilt tracking email', { requestNumber, to: toAddr, carrier: carrierLabel });
}

/**
 * Emails the customer their order invoice with PDF attached.
 */
export async function sendOrderInvoiceEmail({
  to,
  customerName,
  orderNumber,
  total,
  pdfBuffer,
  filename,
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

  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    throw new Error('Invoice PDF is missing');
  }

  const orderStatusUrl = buildCustomerOrderAccountUrl(toAddr, orderNumber);
  const subject = `Invoice — Order ${orderNumber}`;

  const text = [
    `Hi ${customerName},`,
    '',
    `Please find your invoice for Bear River Quilting order ${orderNumber} attached as a PDF.`,
    `Order total: $${Number(total).toFixed(2)}`,
    '',
    `View order status: ${orderStatusUrl}`,
    '',
    'Thank you for shopping with us.',
    '— Bear River Quilting',
  ].join('\n');

  const html = `
<p>Hi ${escapeHtml(customerName)},</p>
<p>Please find your invoice for Bear River Quilting order <strong>${escapeHtml(orderNumber)}</strong> attached as a PDF.</p>
<p>Order total: <strong>$${Number(total).toFixed(2)}</strong></p>
<p><a href="${escapeHtml(orderStatusUrl)}">View order status and details</a></p>
<p>Thank you for shopping with us.<br>— Bear River Quilting</p>
`.trim();

  await sendSendGridMail({
    to: toAddr,
    from,
    subject,
    text,
    html,
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: filename || `invoice-${orderNumber}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });

  console.log('[mail] Sent customer invoice', { orderNumber, to: toAddr });
}

/**
 * Custom message from staff to the customer about their order.
 */
export async function sendOrderCustomerMessageEmail({
  to,
  customerName,
  orderNumber,
  subject,
  bodyText,
  bodyHtml,
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

  const orderStatusUrl = buildCustomerOrderAccountUrl(toAddr, orderNumber);
  const htmlBody = bodyHtml || escapeHtml(bodyText).replace(/\n/g, '<br>\n');

  const text = [
    `Hi ${customerName},`,
    '',
    bodyText,
    '',
    `Order ${orderNumber}`,
    `View order status: ${orderStatusUrl}`,
    '',
    '— Bear River Quilting',
  ].join('\n');

  const html = `
<p>Hi ${escapeHtml(customerName)},</p>
<div style="margin:1rem 0;line-height:1.5">${htmlBody}</div>
<p class="muted" style="color:#6b7280;font-size:0.9em">Regarding order <strong>${escapeHtml(orderNumber)}</strong> · <a href="${escapeHtml(orderStatusUrl)}">View order status</a></p>
<p>— Bear River Quilting</p>
`.trim();

  await sendSendGridMail({
    to: toAddr,
    from,
    subject,
    text,
    html,
  });

  console.log('[mail] Sent order message to customer', { orderNumber, to: toAddr, subject });
}

/**
 * Notifies shop staff when a customer replies on /account.
 */
export async function sendOrderCustomerReplyStaffEmail({
  orderId,
  orderNumber,
  customerName,
  customerEmail,
  subject,
  bodyText,
}) {
  if (!isSendGridConfigured()) {
    throw new Error('SendGrid is not configured — set SENDGRID_API_KEY in server/.env');
  }

  const from = resolveSendGridFromStaff();
  if (!from) {
    throw new Error('Set MAIL_STAFF_FROM_ADDRESS or MAIL_FROM_ADDRESS for staff notifications');
  }

  const notifyTo = parseOrderNotifyRecipients();
  if (notifyTo.length === 0) {
    throw new Error('No staff notification emails configured (ORDER_NOTIFY_EMAILS)');
  }

  const adminOrderUrl = buildAdminOrderUrl(orderId);
  const text = [
    `Customer reply on order ${orderNumber}`,
    `From: ${customerName} <${customerEmail}>`,
    `Subject: ${subject}`,
    '',
    bodyText,
    '',
    `View in admin: ${adminOrderUrl}`,
  ].join('\n');

  const html = `
<p><strong>Customer reply on order <a href="${escapeHtml(adminOrderUrl)}">${escapeHtml(orderNumber)}</a></strong></p>
<p>${escapeHtml(customerName)} · <a href="mailto:${escapeHtml(customerEmail)}">${escapeHtml(customerEmail)}</a></p>
<p><strong>${escapeHtml(subject)}</strong></p>
<div style="margin:1rem 0;line-height:1.5;white-space:pre-wrap">${escapeHtml(bodyText)}</div>
<p><a href="${escapeHtml(adminOrderUrl)}">Open order in admin</a></p>
`.trim();

  let sent = 0;
  for (const addr of notifyTo) {
    try {
      await sendSendGridMail({
        to: addr,
        from,
        subject: `Customer reply: order ${orderNumber}`,
        text,
        html,
      });
      sent += 1;
    } catch (e) {
      console.error('[mail] Customer reply notify failed for', addr, e?.message || e);
    }
  }
  if (sent === 0) {
    throw new Error('Failed to notify staff by email');
  }
  console.log('[mail] Sent customer reply notify', { orderNumber, recipients: sent });
}
