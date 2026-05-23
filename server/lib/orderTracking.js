import pool from '../db.js';
import { sendOrderTrackingEmail } from './mail.js';
import {
  buildTrackingUrl,
  getShippingCarrier,
  validateTrackingPayload,
} from './shippingCarriers.js';

export async function upsertOrderTracking(orderId, { carrierId, tracking, markNotified = false }) {
  const id = Number(orderId);
  const [[order]] = await pool.query('SELECT id, status FROM orders WHERE id = ?', [id]);
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  const nextStatus = order.status === 'paid' ? 'fulfilled' : order.status;

  if (markNotified) {
    await pool.query(
      `UPDATE orders SET
         tracking_carrier = ?,
         tracking_number = ?,
         tracking_notified_at = CURRENT_TIMESTAMP,
         status = ?
       WHERE id = ?`,
      [carrierId, tracking, nextStatus, id]
    );
  } else {
    await pool.query(
      `UPDATE orders SET
         tracking_carrier = ?,
         tracking_number = ?,
         status = ?
       WHERE id = ?`,
      [carrierId, tracking, nextStatus, id]
    );
  }

  return { ok: true, status: nextStatus };
}

export async function sendOrderTrackingNotification(orderId, { carrier, trackingNumber }) {
  const validated = validateTrackingPayload({ carrier, trackingNumber });
  if (!validated.ok) {
    return validated;
  }

  const id = Number(orderId);
  if (!id) {
    return { ok: false, status: 400, error: 'Invalid order id' };
  }

  const [[order]] = await pool.query(
    `SELECT id, order_number, status, customer_name, customer_email
     FROM orders WHERE id = ?`,
    [id]
  );
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  const carrierInfo = getShippingCarrier(validated.carrierId);
  const trackingUrl = buildTrackingUrl(validated.carrierId, validated.tracking);

  // Always persist tracking so /account can show it, even if email fails.
  const saved = await upsertOrderTracking(id, {
    carrierId: validated.carrierId,
    tracking: validated.tracking,
    markNotified: false,
  });
  if (!saved.ok) {
    return saved;
  }

  let emailSent = false;
  let emailError = null;
  try {
    await sendOrderTrackingEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      orderNumber: order.order_number,
      carrierLabel: carrierInfo.label,
      trackingNumber: validated.tracking,
      trackingUrl,
    });
    emailSent = true;
    await pool.query('UPDATE orders SET tracking_notified_at = CURRENT_TIMESTAMP WHERE id = ?', [
      id,
    ]);
  } catch (e) {
    emailError = e.message || 'Failed to send tracking email';
    console.error('[tracking] email failed (tracking still saved):', emailError);
  }

  return {
    ok: true,
    orderNumber: order.order_number,
    carrier: carrierInfo.label,
    trackingNumber: validated.tracking,
    trackingUrl,
    status: saved.status,
    emailSent,
    warning: emailSent
      ? null
      : emailError ||
        'Tracking was saved. Configure SendGrid in server/.env to email the customer automatically.',
  };
}
