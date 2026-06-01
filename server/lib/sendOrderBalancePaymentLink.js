import pool from '../db.js';
import { createCustomPayment } from './customOrderPayment.js';
import { orderIsPaid } from './orderLineItemProduct.js';

const MIN_PAYMENT_LINK_USD = 0.5;

/** Sum of paid custom payment links for this order. */
async function sumPaidCustomPayments(orderId) {
  try {
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS paid
       FROM order_custom_payments
       WHERE order_id = ? AND status IN ('paid', 'complete')`,
      [orderId]
    );
    return Number(rows[0]?.paid) || 0;
  } catch (e) {
    if (e.code === 'ER_NO_SUCH_TABLE') return 0;
    throw e;
  }
}

/**
 * Outstanding balance on a paid/adjusted order: current total minus checkout total and follow-up payments.
 */
export async function computeOrderOutstandingBalance(orderId) {
  const id = Number(orderId);
  const [[order]] = await pool.query(
    `SELECT id, total, original_total, stripe_payment_intent_id, status
     FROM orders WHERE id = ?`,
    [id]
  );
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  if (!orderIsPaid(order)) {
    return {
      ok: true,
      paid: false,
      amountDue: Math.max(0, Number(order.total) || 0),
      currentTotal: Number(order.total) || 0,
      baselinePaid: 0,
    };
  }

  const currentTotal = Number(order.total) || 0;
  const baselinePaid =
    order.original_total != null ? Number(order.original_total) : currentTotal;
  const paidViaLinks = await sumPaidCustomPayments(id);
  const amountDue = Number(Math.max(0, currentTotal - baselinePaid - paidViaLinks).toFixed(2));

  return {
    ok: true,
    paid: true,
    amountDue,
    currentTotal,
    baselinePaid,
    paidViaLinks,
  };
}

export async function sendOrderBalancePaymentLink({ orderId, amount, adminNote }) {
  const id = Number(orderId);
  if (!id) {
    return { ok: false, status: 400, error: 'Invalid order id' };
  }

  const [[order]] = await pool.query(
    'SELECT id, order_number, customer_email FROM orders WHERE id = ?',
    [id]
  );
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  let amountDue = amount != null ? Number(amount) : null;
  if (amountDue == null || !Number.isFinite(amountDue)) {
    const balance = await computeOrderOutstandingBalance(id);
    if (!balance.ok) return balance;
    amountDue = balance.amountDue;
  }

  if (amountDue < MIN_PAYMENT_LINK_USD) {
    return {
      ok: false,
      status: 400,
      error: `Nothing to collect (balance due is below $${MIN_PAYMENT_LINK_USD.toFixed(2)}). Add products or adjust the order first.`,
    };
  }

  const note =
    String(adminNote ?? '').trim() ||
    `Additional amount due for Bear River Quilting order ${order.order_number}.`;

  const paymentResult = await createCustomPayment({
    orderId: id,
    amount: amountDue,
    adminNote: note,
    sendEmail: true,
    paymentPurpose: 'order_balance_due',
  });

  if (!paymentResult.ok) {
    return {
      ok: false,
      status: paymentResult.status ?? 500,
      error: paymentResult.error || 'Failed to create payment link',
    };
  }

  return {
    ok: true,
    amountDue,
    paymentNumber: paymentResult.paymentNumber,
    checkoutUrl: paymentResult.checkoutUrl,
    emailSent: paymentResult.emailSent,
    emailError: paymentResult.emailError ?? null,
  };
}
