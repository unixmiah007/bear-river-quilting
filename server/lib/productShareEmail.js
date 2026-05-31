import pool from '../db.js';
import { clientOriginPath } from './clientOrigin.js';
import {
  isSendGridConfigured,
  resolveSendGridFromCustomer,
  sendSendGridMail,
} from './sendgridMail.js';
import { hydrateProductRow } from './productSizePrices.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripRichHtml(html) {
  return String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(text, max = 220) {
  const s = String(text ?? '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trim()}…`;
}

function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 255);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function resolveProductImageUrl(productId, imageUrl, galleryPath) {
  let path = imageUrl || galleryPath;
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/')) {
    const filename = path.split('/').pop();
    if (!filename) return null;
    path = `/uploads/products/${productId}/${filename}`;
  }
  return clientOriginPath(path);
}

function formatUsd(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
}

export async function sendProductShareEmail(productId, body) {
  const id = Number(productId);
  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, status: 400, error: 'Invalid product id.' };
  }

  const recipientEmail = normalizeEmail(body?.recipientEmail ?? body?.to);
  if (!recipientEmail || !isValidEmail(recipientEmail)) {
    return { ok: false, status: 400, error: 'Enter a valid recipient email address.' };
  }

  const senderName = String(body?.senderName ?? '').trim().slice(0, 120);
  const senderEmail = normalizeEmail(body?.senderEmail);
  if (senderEmail && !isValidEmail(senderEmail)) {
    return { ok: false, status: 400, error: 'Enter a valid email for your address, or leave it blank.' };
  }

  const personalMessage = String(body?.message ?? body?.personalMessage ?? '').trim().slice(0, 1000);

  const [[row]] = await pool.query(
    `SELECT id, name, description, price, image_url
     FROM products
     WHERE id = ? AND is_published = 1`,
    [id]
  );
  if (!row) {
    return { ok: false, status: 404, error: 'Product not found.' };
  }

  const product = hydrateProductRow(row);
  let galleryPath = null;
  try {
    const [[imageRow]] = await pool.query(
      'SELECT path FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1',
      [id]
    );
    galleryPath = imageRow?.path ?? null;
  } catch (e) {
    if (e.code !== 'ER_NO_SUCH_TABLE') throw e;
  }

  if (!isSendGridConfigured()) {
    return {
      ok: false,
      status: 503,
      error: 'Email is not configured on the server yet. Please try again later or contact the studio.',
    };
  }

  const from = resolveSendGridFromCustomer();
  if (!from) {
    return {
      ok: false,
      status: 503,
      error: 'Email is not configured on the server yet. Please try again later or contact the studio.',
    };
  }

  const productUrl = clientOriginPath(`/products/${id}`);
  const imageUrl = resolveProductImageUrl(id, product.image_url, galleryPath);
  const briefDescription =
    truncateText(stripRichHtml(product.description)) ||
    'Handmade quilt from Bear River Quilting.';
  const priceLabel = formatUsd(product.price);
  const senderLabel = senderName || 'Someone';
  const subject = `${senderLabel} thought you'd like this quilt — Bear River Quilting`;

  const introLines = [
    senderName
      ? `${senderName} thought you might like this quilt from Bear River Quilting.`
      : 'Someone thought you might like this quilt from Bear River Quilting.',
  ];
  if (personalMessage) {
    introLines.push('', 'Personal message:', personalMessage);
  }
  introLines.push(
    '',
    product.name,
    briefDescription,
    `From ${priceLabel}`,
    '',
    `View on our website: ${productUrl}`,
    '',
    '— Bear River Quilting'
  );

  const personalHtml = personalMessage
    ? `<p style="margin:0 0 1rem;padding:0.85rem 1rem;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px"><strong>Personal message:</strong><br>${escapeHtml(personalMessage).replace(/\n/g, '<br>')}</p>`
    : '';

  const imageHtml = imageUrl
    ? `<a href="${escapeHtml(productUrl)}" style="display:block;margin:0 0 1rem"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" width="320" style="display:block;max-width:100%;height:auto;border-radius:10px;border:1px solid #e5e7eb" /></a>`
    : '';

  const html = `
<p>${escapeHtml(introLines[0])}</p>
${personalHtml}
<table cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
  <tr><td>
    ${imageHtml}
    <h2 style="margin:0 0 0.35rem;font-size:1.35rem;font-weight:600;color:#111">${escapeHtml(product.name)}</h2>
    <p style="margin:0 0 0.75rem;color:#4b5563;line-height:1.5">${escapeHtml(briefDescription)}</p>
    <p style="margin:0 0 1rem;font-size:1.05rem"><strong>From ${escapeHtml(priceLabel)}</strong></p>
    <p style="margin:0 0 1.25rem"><a href="${escapeHtml(productUrl)}" style="display:inline-block;padding:0.7rem 1.15rem;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View this quilt</a></p>
    <p style="margin:0;font-size:0.9rem;color:#6b7280">Or open this link: <a href="${escapeHtml(productUrl)}">${escapeHtml(productUrl)}</a></p>
  </td></tr>
</table>
<p style="margin:1.25rem 0 0">— Bear River Quilting</p>`.trim();

  const mailOpts = {
    to: recipientEmail,
    from: {
      ...from,
      name: process.env.MAIL_FROM_NAME?.trim() || 'Bear River Quilting',
    },
    subject,
    text: introLines.join('\n'),
    html,
  };

  if (senderEmail) {
    mailOpts.replyTo = senderName ? { email: senderEmail, name: senderName } : senderEmail;
  }

  try {
    await sendSendGridMail(mailOpts);
    return { ok: true, emailSent: true };
  } catch (err) {
    const detail = err?.response?.body?.errors?.[0]?.message || err?.message || 'Failed to send email';
    console.error('[product-share] email failed:', detail);
    return { ok: false, status: 500, error: 'Could not send the email. Please try again in a moment.' };
  }
}
