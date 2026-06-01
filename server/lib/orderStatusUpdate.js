import pool from '../db.js';
import { sendOrderStatusUpdateEmail } from './mail.js';
import {
  customerMessageForOrderStatus,
  isAllowedOrderStatus,
  labelForOrderStatus,
} from './orderStatuses.js';

export async function updateAdminOrderStatus(orderId, status) {
  const id = Number(orderId);
  const nextStatus = String(status ?? '')
    .trim()
    .toLowerCase();

  if (!id) {
    return { ok: false, status: 400, error: 'Invalid order id' };
  }
  if (!isAllowedOrderStatus(nextStatus)) {
    return { ok: false, status: 400, error: 'Invalid order status' };
  }

  const [[order]] = await pool.query(
    `SELECT id, order_number, status, customer_name, customer_email
     FROM orders WHERE id = ?`,
    [id]
  );
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  const statusLabel = labelForOrderStatus(nextStatus);
  const unchanged = String(order.status ?? '').toLowerCase() === nextStatus;

  if (!unchanged) {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [nextStatus, id]);
  }

  let emailSent = false;
  let emailError = null;
  try {
    await sendOrderStatusUpdateEmail({
      to: order.customer_email,
      customerName: order.customer_name,
      orderNumber: order.order_number,
      status: nextStatus,
      statusLabel,
      statusMessage: customerMessageForOrderStatus(nextStatus),
    });
    emailSent = true;
  } catch (e) {
    emailError = e.message || 'Failed to send status email';
    console.error('[order-status] email failed:', emailError);
  }

  return {
    ok: true,
    status: nextStatus,
    statusLabel,
    emailSent,
    emailError,
    unchanged,
    warning: emailSent
      ? null
      : emailError ||
        'Status saved. Configure SendGrid in server/.env to email the customer automatically.',
  };
}
