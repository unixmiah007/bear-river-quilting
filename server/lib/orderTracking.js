import pool from '../db.js';
import { sendOrderTrackingEmail } from './mail.js';
import {
  buildTrackingUrl,
  getShippingCarrier,
  validateTrackingPayload,
} from './shippingCarriers.js';

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
    `SELECT id, order_number, status, customer_name, customer_email,
            tracking_carrier, tracking_number
     FROM orders WHERE id = ?`,
    [id]
  );
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  const carrierInfo = getShippingCarrier(validated.carrierId);
  const trackingUrl = buildTrackingUrl(validated.carrierId, validated.tracking);

  try {
    await sendOrderTrackingEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      orderNumber: order.order_number,
      carrierLabel: carrierInfo.label,
      trackingNumber: validated.tracking,
      trackingUrl,
    });
  } catch (e) {
    console.error('[tracking] email failed:', e?.message || e);
    return {
      ok: false,
      status: 502,
      error: e.message || 'Failed to send tracking email',
    };
  }

  const nextStatus = order.status === 'paid' ? 'fulfilled' : order.status;

  await pool.query(
    `UPDATE orders SET
       tracking_carrier = ?,
       tracking_number = ?,
       tracking_notified_at = CURRENT_TIMESTAMP,
       status = ?
     WHERE id = ?`,
    [validated.carrierId, validated.tracking, nextStatus, id]
  );

  return {
    ok: true,
    orderNumber: order.order_number,
    carrier: carrierInfo.label,
    trackingNumber: validated.tracking,
    trackingUrl,
    status: nextStatus,
  };
}
