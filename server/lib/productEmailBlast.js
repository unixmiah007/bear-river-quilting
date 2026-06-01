import pool from '../db.js';
import { hydrateProductRow } from './productSizePrices.js';
import { parseEmailRecipients } from './parseEmailRecipients.js';
import { buildProductPromoEmail } from './productEmailContent.js';
import {
  isSendGridConfigured,
  resolveSendGridFromCustomer,
  sendSendGridMail,
} from './sendgridMail.js';

async function loadProductForBlast(productId) {
  const id = Number(productId);
  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, status: 400, error: 'Invalid product id.' };
  }

  const [[row]] = await pool.query(
    `SELECT id, name, description, price, image_url, is_published
     FROM products WHERE id = ?`,
    [id]
  );
  if (!row) {
    return { ok: false, status: 404, error: 'Product not found.' };
  }

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

  return { ok: true, product: hydrateProductRow(row), galleryPath, productId: id };
}

export async function listProductEmailBlasts(productId, limit = 10) {
  const id = Number(productId);
  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, status: 400, error: 'Invalid product id.' };
  }

  const [rows] = await pool.query(
    `SELECT id, product_id, subject, personal_message, recipient_count, sent_count, failed_count, created_at
     FROM product_email_blasts
     WHERE product_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [id, Math.min(Math.max(Number(limit) || 10, 1), 50)]
  );

  return { ok: true, blasts: rows };
}

export async function sendProductEmailBlast(productId, body) {
  const loaded = await loadProductForBlast(productId);
  if (!loaded.ok) return loaded;

  const { product, galleryPath } = loaded;
  const parsed = parseEmailRecipients(body?.recipients ?? body?.emails ?? '');
  const { emails, invalid, truncated } = parsed;

  if (emails.length === 0) {
    const hint =
      invalid.length > 0
        ? ` No valid addresses found (${invalid.length} invalid).`
        : ' Add one email per line.';
    return { ok: false, status: 400, error: `Enter at least one valid recipient email.${hint}` };
  }

  if (!isSendGridConfigured()) {
    return {
      ok: false,
      status: 503,
      error: 'Email is not configured. Set SENDGRID_API_KEY in server/.env.',
    };
  }

  const from = resolveSendGridFromCustomer();
  if (!from) {
    return {
      ok: false,
      status: 503,
      error: 'Set MAIL_FROM_ADDRESS (or MAIL_FROM) to a verified SendGrid sender.',
    };
  }

  const personalMessage = String(body?.message ?? body?.personalMessage ?? '').trim();
  const customSubject = String(body?.subject ?? '').trim();
  const introLine =
    String(body?.introLine ?? '').trim() ||
    'We wanted to share this handmade quilt from Bear River Quilting with you.';

  const mailContent = buildProductPromoEmail(product, {
    productId: loaded.productId,
    galleryPath,
    introLine,
    personalMessage,
    subject: customSubject || undefined,
  });

  const [blastResult] = await pool.query(
    `INSERT INTO product_email_blasts
      (product_id, subject, personal_message, recipient_count, sent_count, failed_count)
     VALUES (?, ?, ?, ?, 0, 0)`,
    [
      loaded.productId,
      mailContent.subject,
      personalMessage || null,
      emails.length,
    ]
  );
  const blastId = blastResult.insertId;

  let sentCount = 0;
  let failedCount = 0;
  const failures = [];

  const fromHeader = {
    ...from,
    name: process.env.MAIL_FROM_NAME?.trim() || 'Bear River Quilting',
  };

  for (const to of emails) {
    let status = 'sent';
    let errorMessage = null;
    try {
      await sendSendGridMail({
        to,
        from: fromHeader,
        subject: mailContent.subject,
        text: mailContent.text,
        html: mailContent.html,
      });
      sentCount += 1;
    } catch (err) {
      status = 'failed';
      failedCount += 1;
      errorMessage = String(
        err?.response?.body?.errors?.[0]?.message || err?.message || 'Send failed'
      ).slice(0, 500);
      failures.push({ email: to, error: errorMessage });
      console.error('[product-email-blast] send failed', to, errorMessage);
    }

    await pool.query(
      `INSERT INTO product_email_blast_recipients (blast_id, email, status, error_message, sent_at)
       VALUES (?, ?, ?, ?, ${status === 'sent' ? 'CURRENT_TIMESTAMP' : 'NULL'})`,
      [blastId, to, status, errorMessage]
    );
  }

  await pool.query(
    `UPDATE product_email_blasts SET sent_count = ?, failed_count = ? WHERE id = ?`,
    [sentCount, failedCount, blastId]
  );

  return {
    ok: true,
    blastId,
    productUrl: mailContent.productUrl,
    subject: mailContent.subject,
    recipientCount: emails.length,
    sentCount,
    failedCount,
    invalidCount: invalid.length,
    invalid: invalid.slice(0, 20),
    truncated,
    failures: failures.slice(0, 20),
  };
}
