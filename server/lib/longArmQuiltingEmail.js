import pool from '../db.js';
import { parseOrderNotifyRecipients } from './mail.js';
import {
  isSendGridConfigured,
  resolveSendGridFromCustomer,
  resolveSendGridFromStaff,
  sendSendGridMail,
} from './sendgridMail.js';
import { siteLogoEmailHtml } from './emailBrand.js';
import { getClientOrigin } from './clientOrigin.js';
import { longArmQuiltSourceLabel, LONG_ARM_DEPOSIT_USD, parseSelectedServiceIds } from './longArmQuiltingRequest.js';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatUsd(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
}

function formatAddressBlock(name, line1, line2, city, state, postal, country) {
  return [
    name,
    line1,
    line2,
    [city, state, postal].filter(Boolean).join(', '),
    country,
  ]
    .filter((line) => line != null && String(line).trim() !== '')
    .join('\n');
}

async function loadRequestEmailContext(requestId) {
  const id = Number(requestId);
  const [[row]] = await pool.query('SELECT * FROM long_arm_quilting_requests WHERE id = ?', [id]);
  if (!row) return null;

  const serviceIds = parseSelectedServiceIds(row.selected_service_ids);

  let services = [];
  if (serviceIds.length > 0) {
    const [svcRows] = await pool.query(
      `SELECT id, name, hourly_rate, description FROM long_arm_quilting_services WHERE id IN (${serviceIds.map(() => '?').join(',')})`,
      serviceIds
    );
    services = svcRows;
  }

  let blanketPalette = null;
  if (row.blanket_palette_id) {
    const [[paletteRow]] = await pool.query(
      'SELECT id, title, price FROM long_arm_blanket_palettes WHERE id = ?',
      [row.blanket_palette_id]
    );
    if (paletteRow) {
      blanketPalette = {
        id: paletteRow.id,
        title: paletteRow.title,
        price: paletteRow.price != null ? Number(paletteRow.price) : null,
      };
    }
  }

  return { row, services, blanketPalette };
}

function buildServiceLines(services) {
  if (!services.length) return 'Services: (none listed)';
  return services
    .map((s) => {
      const rate =
        s.hourly_rate != null ? ` — ${formatUsd(s.hourly_rate)}/hr` : '';
      return `  • ${s.name}${rate}`;
    })
    .join('\n');
}

function buildDetailLines(row, services, blanketPalette) {
  return [
    `Request: ${row.request_number}`,
    `Deposit paid: ${formatUsd(row.deposit_amount ?? LONG_ARM_DEPOSIT_USD)}`,
    `Quilt source: ${longArmQuiltSourceLabel(row.quilt_source)}`,
    blanketPalette
      ? `Base quilt: ${blanketPalette.title} (${formatUsd(blanketPalette.price)})`
      : row.quilt_source === 'use_ours'
        ? 'Base quilt: (not recorded)'
        : null,
    '',
    'Services:',
    buildServiceLines(services),
    '',
    `Contact: ${row.customer_name}`,
    `Email: ${row.customer_email}`,
    row.customer_phone ? `Phone: ${row.customer_phone}` : null,
    '',
    'Shipping address:',
    formatAddressBlock(
      row.customer_name,
      row.shipping_address1,
      row.shipping_address2,
      row.shipping_city,
      row.shipping_state,
      row.shipping_postal_code,
      row.shipping_country
    ),
    '',
    'Billing address:',
    formatAddressBlock(
      row.billing_name,
      row.billing_address1,
      row.billing_address2,
      row.billing_city,
      row.billing_state,
      row.billing_postal_code,
      row.billing_country
    ),
    row.notes ? `\nProject notes:\n${row.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function sendLongArmDepositEmails(requestId) {
  if (!isSendGridConfigured()) {
    console.warn('[long-arm-mail] Skipping: SendGrid is not configured');
    return { customerOk: false, staffOk: false, skipped: true };
  }

  const ctx = await loadRequestEmailContext(requestId);
  if (!ctx) {
    return { customerOk: false, staffOk: false, error: 'Request not found' };
  }

  const { row, services, blanketPalette } = ctx;
  const fromCustomer = resolveSendGridFromCustomer();
  const fromStaff = resolveSendGridFromStaff();
  const staffTo = parseOrderNotifyRecipients();
  const detailLines = buildDetailLines(row, services, blanketPalette);
  const adminUrl = `${getClientOrigin()}/admin/service-requests`;
  const logoHtml = siteLogoEmailHtml();

  const tasks = [];

  if (fromCustomer) {
    tasks.push(
      sendSendGridMail({
        to: row.customer_email,
        from: fromCustomer,
        subject: `Long-arm quilting deposit received — ${row.request_number}`,
        text: [
          `Hi ${row.customer_name},`,
          '',
          'Thank you for your deposit. Someone from Bear River Quilting will contact you shortly with next steps.',
          '',
          detailLines,
          '',
          'When your quilt is finished, we will email you a secure link for the final payment.',
          '',
          '— Bear River Quilting',
        ].join('\n'),
        html: `${logoHtml}
<p>Hi ${escapeHtml(row.customer_name)},</p>
<p>Thank you for your deposit. <strong>Someone from Bear River Quilting will contact you shortly</strong> with next steps.</p>
<pre style="white-space:pre-wrap;font-family:inherit;background:#f9fafb;padding:1rem;border-radius:8px;border:1px solid #e5e7eb">${escapeHtml(detailLines)}</pre>
<p class="muted" style="color:#6b7280;font-size:0.95rem">When your quilt is finished, we will email you a secure link for the final payment.</p>
<p>— Bear River Quilting</p>`,
      })
    );
  }

  if (fromStaff && staffTo.length) {
    tasks.push(
      sendSendGridMail({
        to: staffTo,
        from: fromStaff,
        subject: `New long-arm service request ${row.request_number}`,
        text: [
          'A long-arm quilting service request deposit was paid.',
          '',
          `Customer: ${row.customer_name}`,
          `Email: ${row.customer_email}`,
          row.customer_phone ? `Phone: ${row.customer_phone}` : null,
          '',
          detailLines,
          '',
          `Admin: ${adminUrl}`,
        ]
          .filter(Boolean)
          .join('\n'),
        html: `${logoHtml}
<p><strong>New long-arm service request — deposit paid</strong></p>
<p>${escapeHtml(row.customer_name)}<br>
<a href="mailto:${escapeHtml(row.customer_email)}">${escapeHtml(row.customer_email)}</a>
${row.customer_phone ? `<br>${escapeHtml(row.customer_phone)}` : ''}</p>
<pre style="white-space:pre-wrap;font-family:inherit;background:#f9fafb;padding:1rem;border-radius:8px;border:1px solid #e5e7eb">${escapeHtml(detailLines)}</pre>
<p><a href="${escapeHtml(adminUrl)}">View in admin → Service requests</a></p>`,
      })
    );
  }

  if (tasks.length === 0) {
    return { customerOk: false, staffOk: false, skipped: true };
  }

  const results = await Promise.allSettled(tasks);
  const customerOk = results[0]?.status === 'fulfilled';
  const staffOk = results[1]?.status === 'fulfilled';

  if (results[0]?.status === 'rejected') {
    console.error('[long-arm-mail] customer email failed:', results[0].reason?.message ?? results[0].reason);
  }
  if (results[1]?.status === 'rejected') {
    console.error('[long-arm-mail] staff email failed:', results[1].reason?.message ?? results[1].reason);
  }

  return { customerOk, staffOk };
}
