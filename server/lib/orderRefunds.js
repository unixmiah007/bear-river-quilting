import pool from '../db.js';
import { getStripe } from './stripeCheckout.js';
import { sendOrderLineItemRefundEmail } from './mail.js';
import { loadUpdatedOrder } from './orderLineItemProduct.js';

export async function listOrderRefunds(orderId) {
  const oid = Number(orderId);
  if (!oid) return [];
  try {
    const [rows] = await pool.query(
      `SELECT id, order_id, order_item_id, amount, status, stripe_refund_id, reason, label,
              created_at, processed_at
       FROM order_refunds
       WHERE order_id = ?
       ORDER BY created_at ASC, id ASC`,
      [oid]
    );
    return rows;
  } catch (e) {
    if (e.code === 'ER_NO_SUCH_TABLE') return [];
    throw e;
  }
}

export async function createOrderRefund({
  orderId,
  orderItemId = null,
  amount,
  reason,
  label = null,
  status = 'pending',
  stripeRefundId = null,
}) {
  const oid = Number(orderId);
  const refundAmount = Number(amount);
  if (!oid || !Number.isFinite(refundAmount) || refundAmount < 0.01) {
    return { ok: false, status: 400, error: 'Invalid refund amount' };
  }

  const [result] = await pool.query(
    `INSERT INTO order_refunds
       (order_id, order_item_id, amount, status, stripe_refund_id, reason, label, processed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ${status === 'issued' ? 'CURRENT_TIMESTAMP' : 'NULL'})`,
    [
      oid,
      orderItemId ? Number(orderItemId) : null,
      refundAmount.toFixed(2),
      status,
      stripeRefundId,
      reason,
      label,
    ]
  );

  return {
    ok: true,
    refundId: result.insertId,
    amount: refundAmount,
    status,
    stripeRefundId,
  };
}

export async function recordManualOrderRefund({ refundRowId, stripeRefundId = null }) {
  const id = Number(refundRowId);
  if (!id) {
    return { ok: false, status: 400, error: 'Invalid refund id' };
  }

  const [[row]] = await pool.query(
    `SELECT id, order_id, amount, status, label FROM order_refunds WHERE id = ?`,
    [id]
  );
  if (!row) {
    return { ok: false, status: 404, error: 'Refund record not found' };
  }
  if (row.status === 'issued') {
    return { ok: false, status: 400, error: 'Refund is already marked as issued' };
  }

  const stripeId = String(stripeRefundId ?? '').trim() || null;
  if (stripeId) {
    const stripe = getStripe();
    if (stripe) {
      try {
        await stripe.refunds.retrieve(stripeId);
      } catch (e) {
        return { ok: false, status: 400, error: e.message || 'Stripe refund id could not be verified' };
      }
    }
  }

  await pool.query(
    `UPDATE order_refunds SET status = 'issued', stripe_refund_id = ?, processed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [stripeId, id]
  );

  const order = await loadUpdatedOrder(row.order_id);
  if (order) {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['refunded', row.order_id]);
    try {
      await sendOrderLineItemRefundEmail({
        to: order.customer_email,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        refundAmount: Number(row.amount),
        priorTotal: Number(order.original_total ?? order.total),
        newTotal: Number(order.total),
        productName: row.label || 'Order adjustment',
      });
    } catch (e) {
      console.error('[order-refund] manual refund email failed:', e);
    }
  }

  return {
    ok: true,
    orderId: row.order_id,
    refundId: id,
    amount: Number(row.amount),
    stripeRefundId: stripeId,
  };
}

export async function issueStripeRefundForOrder({
  order,
  amount,
  metadata = {},
}) {
  const refundAmount = Number(amount);
  if (!order?.stripe_payment_intent_id) {
    return {
      ok: false,
      status: 400,
      error: 'No Stripe payment on file — issue the refund manually in Stripe.',
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: false,
      status: 503,
      error: 'Stripe is not configured — issue the refund manually in Stripe.',
    };
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: Math.round(refundAmount * 100),
      metadata,
    });
    return { ok: true, refundId: refund.id, amount: refundAmount };
  } catch (e) {
    console.error('[order-refund] Stripe refund failed:', e);
    return { ok: false, status: 502, error: e.message || 'Stripe refund failed' };
  }
}
