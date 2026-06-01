import pool from '../db.js';
import { sendCustomQuiltTrackingEmail } from './mail.js';
import {
  buildTrackingUrl,
  getShippingCarrier,
  validateTrackingPayload,
} from './shippingCarriers.js';

export async function upsertCustomQuiltTracking(requestId, { carrierId, tracking, markNotified = false }) {
  const id = Number(requestId);
  const [[row]] = await pool.query('SELECT id, status FROM custom_quilt_requests WHERE id = ?', [id]);
  if (!row) {
    return { ok: false, status: 404, error: 'Custom quilt request not found' };
  }

  let nextStatus = row.status;
  if (
    row.status === 'paid' ||
    row.status === 'pending_payment' ||
    row.status === 'submitted' ||
    row.status === 'preparing_for_shipment' ||
    row.status === 'fulfilled'
  ) {
    nextStatus = 'shipped';
  }

  if (markNotified) {
    await pool.query(
      `UPDATE custom_quilt_requests SET
         tracking_carrier = ?,
         tracking_number = ?,
         tracking_notified_at = CURRENT_TIMESTAMP,
         status = ?
       WHERE id = ?`,
      [carrierId, tracking, nextStatus, id]
    );
  } else {
    await pool.query(
      `UPDATE custom_quilt_requests SET
         tracking_carrier = ?,
         tracking_number = ?,
         status = ?
       WHERE id = ?`,
      [carrierId, tracking, nextStatus, id]
    );
  }

  return { ok: true, status: nextStatus };
}

export async function sendCustomQuiltTrackingNotification(requestId, { carrier, trackingNumber, sendEmail = true }) {
  const validated = validateTrackingPayload({ carrier, trackingNumber });
  if (!validated.ok) {
    return validated;
  }

  const id = Number(requestId);
  if (!id) {
    return { ok: false, status: 400, error: 'Invalid request id' };
  }

  const [[request]] = await pool.query(
    `SELECT id, request_number, status, customer_name, customer_email
     FROM custom_quilt_requests WHERE id = ?`,
    [id]
  );
  if (!request) {
    return { ok: false, status: 404, error: 'Custom quilt request not found' };
  }

  const carrierInfo = getShippingCarrier(validated.carrierId);
  const trackingUrl = buildTrackingUrl(validated.carrierId, validated.tracking);

  const saved = await upsertCustomQuiltTracking(id, {
    carrierId: validated.carrierId,
    tracking: validated.tracking,
    markNotified: false,
  });
  if (!saved.ok) {
    return saved;
  }

  let emailSent = false;
  let emailError = null;
  if (sendEmail) {
    try {
      await sendCustomQuiltTrackingEmail({
        to: request.customer_email,
        customerName: request.customer_name,
        requestNumber: request.request_number,
        carrierLabel: carrierInfo.label,
        trackingNumber: validated.tracking,
        trackingUrl,
      });
      emailSent = true;
      await pool.query(
        'UPDATE custom_quilt_requests SET tracking_notified_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (e) {
      emailError = e.message || 'Failed to send tracking email';
      console.error('[custom-quilt tracking] email failed (tracking still saved):', emailError);
    }
  }

  return {
    ok: true,
    requestNumber: request.request_number,
    carrier: carrierInfo.label,
    trackingNumber: validated.tracking,
    trackingUrl,
    status: saved.status,
    emailSent,
    warning: sendEmail
      ? emailSent
        ? null
        : emailError ||
          'Tracking was saved. Configure SendGrid in server/.env to email the customer automatically.'
      : 'Tracking was saved without emailing the customer.',
  };
}
