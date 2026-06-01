import pool from '../db.js';
import { hydrateProductRow } from './productSizePrices.js';
import { normalizeEmail, isValidEmail } from './parseEmailRecipients.js';
import {
  buildProductPromoEmail,
} from './productEmailContent.js';
import {
  isSendGridConfigured,
  resolveSendGridFromCustomer,
  sendSendGridMail,
} from './sendgridMail.js';

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

  const senderLabel = senderName || 'Someone';
  const introLine = senderName
    ? `${senderName} thought you might like this quilt from Bear River Quilting.`
    : 'Someone thought you might like this quilt from Bear River Quilting.';

  const mailContent = buildProductPromoEmail(product, {
    productId: id,
    galleryPath,
    introLine,
    personalMessage,
    subject: `${senderLabel} thought you'd like this quilt — Bear River Quilting`,
  });

  const mailOpts = {
    to: recipientEmail,
    from: {
      ...from,
      name: process.env.MAIL_FROM_NAME?.trim() || 'Bear River Quilting',
    },
    subject: mailContent.subject,
    text: mailContent.text,
    html: mailContent.html,
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
