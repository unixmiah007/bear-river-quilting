import pool from '../db.js';
import {
  sendOrderCustomerMessageEmail,
  sendOrderCustomerReplyStaffEmail,
} from './mail.js';

export const MESSAGE_DIRECTION = {
  STAFF: 'staff_to_customer',
  CUSTOMER: 'customer_to_staff',
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function messageTextToHtml(bodyText) {
  return escapeHtml(String(bodyText ?? '').trim()).replace(/\r\n/g, '\n').replace(/\n/g, '<br>\n');
}

function previewText(bodyText, max = 120) {
  const flat = String(bodyText ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max)}…`;
}

export async function verifyCustomerOrderAccess(email, orderNumber) {
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase();
  const on = String(orderNumber ?? '').trim();
  if (!normalized || !on) return null;
  const [[order]] = await pool.query(
    `SELECT id, order_number, customer_name, customer_email
     FROM orders WHERE order_number = ? AND LOWER(TRIM(customer_email)) = ?`,
    [on, normalized]
  );
  return order ?? null;
}

export async function listOrderMessages(orderId, { ascending = false } = {}) {
  const id = Number(orderId);
  const sort = ascending ? 'ASC' : 'DESC';
  const [rows] = await pool.query(
    `SELECT id, order_id, direction, from_email, subject, to_email, email_sent, sent_at, created_at,
            admin_read_at,
            LEFT(body_text, 200) AS body_preview
     FROM order_messages
     WHERE order_id = ?
     ORDER BY created_at ${sort}, id ${sort}`,
    [id]
  );
  return rows.map((r) => ({
    ...r,
    body_preview: previewText(r.body_preview, 120),
    is_unread:
      r.direction === MESSAGE_DIRECTION.CUSTOMER && (r.admin_read_at == null || r.admin_read_at === ''),
  }));
}

export async function getOrderMessage(orderId, messageId) {
  const oid = Number(orderId);
  const mid = Number(messageId);
  const [[row]] = await pool.query(
    `SELECT id, order_id, direction, from_email, subject, body_text, body_html, to_email, email_sent, sent_at, created_at, admin_read_at
     FROM order_messages
     WHERE id = ? AND order_id = ?`,
    [mid, oid]
  );
  if (
    row &&
    row.direction === MESSAGE_DIRECTION.CUSTOMER &&
    (row.admin_read_at == null || row.admin_read_at === '')
  ) {
    await pool.query(
      'UPDATE order_messages SET admin_read_at = CURRENT_TIMESTAMP WHERE id = ? AND admin_read_at IS NULL',
      [mid]
    );
    row.admin_read_at = new Date();
  }
  return row ?? null;
}

export async function markOrderMessagesReadByAdmin(orderId) {
  const id = Number(orderId);
  if (!id) return { updated: 0 };
  const [result] = await pool.query(
    `UPDATE order_messages
     SET admin_read_at = CURRENT_TIMESTAMP
     WHERE order_id = ? AND direction = ? AND admin_read_at IS NULL`,
    [id, MESSAGE_DIRECTION.CUSTOMER]
  );
  return { updated: result.affectedRows ?? 0 };
}

export async function sendOrderCustomerMessage(orderId, { subject, body }) {
  const id = Number(orderId);
  if (!id) {
    return { ok: false, status: 400, error: 'Invalid order id' };
  }

  const subj = String(subject ?? '').trim();
  const bodyText = String(body ?? '').trim();
  if (!subj) {
    return { ok: false, status: 400, error: 'Subject is required' };
  }
  if (subj.length > 255) {
    return { ok: false, status: 400, error: 'Subject must be 255 characters or less' };
  }
  if (!bodyText) {
    return { ok: false, status: 400, error: 'Message is required' };
  }
  if (bodyText.length > 50000) {
    return { ok: false, status: 400, error: 'Message is too long' };
  }

  const [[order]] = await pool.query(
    `SELECT id, order_number, customer_name, customer_email
     FROM orders WHERE id = ?`,
    [id]
  );
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  const toEmail = String(order.customer_email ?? '')
    .trim()
    .toLowerCase();
  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return { ok: false, status: 400, error: 'Order has no valid customer email' };
  }

  const bodyHtml = messageTextToHtml(bodyText);
  const fromEmail = resolvePrimaryStaffFromEmail();

  const [insert] = await pool.query(
    `INSERT INTO order_messages (order_id, direction, from_email, subject, body_text, body_html, to_email, email_sent)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, MESSAGE_DIRECTION.STAFF, fromEmail, subj, bodyText, bodyHtml, toEmail]
  );
  const messageId = insert.insertId;

  let emailSent = false;
  let warning = null;
  try {
    await sendOrderCustomerMessageEmail({
      to: toEmail,
      customerName: order.customer_name,
      orderNumber: order.order_number,
      subject: subj,
      bodyText,
      bodyHtml,
    });
    emailSent = true;
    await pool.query(
      'UPDATE order_messages SET email_sent = 1, sent_at = CURRENT_TIMESTAMP WHERE id = ?',
      [messageId]
    );
  } catch (e) {
    warning =
      e.message ||
      'Message saved but email was not sent. Configure SendGrid in server/.env and try again.';
    console.error('[order-messages] email failed:', warning);
  }

  const message = await getOrderMessage(id, messageId);
  return {
    ok: true,
    message,
    emailSent,
    warning,
  };
}

function resolvePrimaryStaffFromEmail() {
  const email = process.env.MAIL_FROM_ADDRESS?.trim();
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return email;
  return 'shop@bearriverquilting.com';
}

export async function sendCustomerOrderReply({ email, orderNumber, body, subject }) {
  const order = await verifyCustomerOrderAccess(email, orderNumber);
  if (!order) {
    return {
      ok: false,
      status: 404,
      error: 'We could not find that order for this email.',
      hint: 'Use the exact order number from your confirmation and the checkout email address.',
    };
  }

  const bodyText = String(body ?? '').trim();
  if (!bodyText) {
    return { ok: false, status: 400, error: 'Message is required' };
  }
  if (bodyText.length > 50000) {
    return { ok: false, status: 400, error: 'Message is too long' };
  }

  const customerEmail = String(order.customer_email ?? '')
    .trim()
    .toLowerCase();
  const subj =
    String(subject ?? '').trim() || `Re: Order ${order.order_number}`;
  if (subj.length > 255) {
    return { ok: false, status: 400, error: 'Subject must be 255 characters or less' };
  }

  const bodyHtml = messageTextToHtml(bodyText);
  const staffInbox = resolvePrimaryStaffFromEmail();

  const [insert] = await pool.query(
    `INSERT INTO order_messages (order_id, direction, from_email, subject, body_text, body_html, to_email, email_sent)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      order.id,
      MESSAGE_DIRECTION.CUSTOMER,
      customerEmail,
      subj,
      bodyText,
      bodyHtml,
      staffInbox,
    ]
  );
  const messageId = insert.insertId;

  let emailSent = false;
  let warning = null;
  try {
    await sendOrderCustomerReplyStaffEmail({
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail,
      subject: subj,
      bodyText,
    });
    emailSent = true;
    await pool.query(
      'UPDATE order_messages SET email_sent = 1, sent_at = CURRENT_TIMESTAMP WHERE id = ?',
      [messageId]
    );
  } catch (e) {
    warning =
      e.message ||
      'Your reply was saved but we could not email the shop. We will still see it in our system.';
    console.error('[order-messages] staff notify failed:', warning);
  }

  const message = await getOrderMessage(order.id, messageId);
  return {
    ok: true,
    message,
    emailSent,
    warning,
  };
}
