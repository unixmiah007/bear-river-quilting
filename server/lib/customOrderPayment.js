import pool from '../db.js';
import { getStripe } from './stripeCheckout.js';
import { clientOriginPath } from './clientOrigin.js';
import { sendSendGridMail, resolveSendGridFromCustomer } from './sendgridMail.js';

export function customPaymentNumber() {
  return `CP${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatUsd(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
}

export async function searchOrdersByCustomerEmail(email) {
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase();
  if (normalized.length < 3) {
    return { ok: false, status: 400, error: 'Enter at least 3 characters of the customer email' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, status: 400, error: 'Enter a valid email address' };
  }

  const [rows] = await pool.query(
    `SELECT id, order_number, status, customer_name, customer_email, subtotal, tax_amount, shipping_cost, total, created_at
     FROM orders
     WHERE LOWER(TRIM(customer_email)) = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [normalized]
  );

  return { ok: true, email: normalized, orders: rows };
}

export async function sendCustomPaymentLinkEmail({ to, customerName, orderNumber, paymentNumber, amount, checkoutUrl, adminNote }) {
  const from = resolveSendGridFromCustomer();
  if (!from) {
    return { ok: false, error: 'SendGrid is not configured (MAIL_FROM_ADDRESS / SENDGRID_API_KEY)' };
  }

  const amountLine = formatUsd(amount);
  const noteBlock = adminNote
    ? `\n\nNote from our team:\n${adminNote}\n`
    : '';
  const text = [
    `Hi ${customerName || 'there'},`,
    '',
    `Please complete payment for your Bear River Quilting order ${orderNumber}.`,
    '',
    `Amount due: ${amountLine}`,
    `Payment reference: ${paymentNumber}`,
    noteBlock,
    `Pay securely with Stripe:`,
    checkoutUrl,
    '',
    'If you have questions, reply to this email.',
    '',
    '— Bear River Quilting',
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  const noteHtml = adminNote
    ? `<p><strong>Note from our team:</strong><br>${escapeHtml(adminNote).replace(/\n/g, '<br>')}</p>`
    : '';

  const html = `<p>Hi ${escapeHtml(customerName || 'there')},</p>
<p>Please complete payment for your Bear River Quilting order <strong>${escapeHtml(orderNumber)}</strong>.</p>
<p><strong>Amount due:</strong> ${escapeHtml(amountLine)}<br>
<strong>Payment reference:</strong> ${escapeHtml(paymentNumber)}</p>
${noteHtml}
<p><a href="${escapeHtml(checkoutUrl)}" style="display:inline-block;padding:0.75rem 1.25rem;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Pay with Stripe</a></p>
<p class="muted" style="font-size:0.9rem">Or copy this link:<br><a href="${escapeHtml(checkoutUrl)}">${escapeHtml(checkoutUrl)}</a></p>
<p>— Bear River Quilting</p>`;

  await sendSendGridMail({
    to,
    from,
    subject: `Payment link for order ${orderNumber} — ${amountLine}`,
    text,
    html,
  });

  return { ok: true };
}

export async function createCustomOrderPayment({ orderId, amount, adminNote, sendEmail = true }) {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, status: 503, error: 'Stripe is not configured on the server' };
  }

  const id = Number(orderId);
  if (!id) {
    return { ok: false, status: 400, error: 'Select an order' };
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum < 0.5) {
    return { ok: false, status: 400, error: 'Enter a payment amount of at least $0.50' };
  }

  const [[order]] = await pool.query(
    `SELECT id, order_number, status, customer_name, customer_email, total
     FROM orders WHERE id = ?`,
    [id]
  );
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  const paymentNumber = customPaymentNumber();
  const amountCents = Math.round(amountNum * 100);
  const note = String(adminNote ?? '').trim() || null;

  const [insert] = await pool.query(
    `INSERT INTO order_custom_payments (
       payment_number, order_id, order_number, customer_email, amount, admin_note, status
     ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [paymentNumber, order.id, order.order_number, order.customer_email, amountNum.toFixed(2), note]
  );

  const paymentId = insert.insertId;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: order.customer_email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Order ${order.order_number} — payment`,
              description: note ? note.slice(0, 500) : `Payment for Bear River Quilting order ${order.order_number}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${clientOriginPath('/checkout/success')}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientOriginPath('/account')}?email=${encodeURIComponent(order.customer_email)}`,
      metadata: {
        checkout_type: 'custom_order_payment',
        custom_payment_id: String(paymentId),
        order_id: String(order.id),
        order_number: order.order_number,
        payment_number: paymentNumber,
      },
    });

    await pool.query(
      `UPDATE order_custom_payments SET
         stripe_checkout_session_id = ?,
         checkout_url = ?
       WHERE id = ?`,
      [session.id, session.url, paymentId]
    );

    let mail = { ok: false };
    if (sendEmail) {
      try {
        mail = await sendCustomPaymentLinkEmail({
          to: order.customer_email,
          customerName: order.customer_name,
          orderNumber: order.order_number,
          paymentNumber,
          amount: amountNum,
          checkoutUrl: session.url,
          adminNote: note,
        });
        if (mail.ok) {
          await pool.query('UPDATE order_custom_payments SET email_sent_at = CURRENT_TIMESTAMP WHERE id = ?', [
            paymentId,
          ]);
        }
      } catch (e) {
        console.error('[custom-payment] email failed:', e?.message || e);
        mail = { ok: false, error: e?.message || 'Failed to send email' };
      }
    }

    return {
      ok: true,
      paymentId,
      paymentNumber,
      orderId: order.id,
      orderNumber: order.order_number,
      amount: amountNum,
      checkoutUrl: session.url,
      sessionId: session.id,
      emailSent: !!mail.ok,
      emailError: mail.error ?? null,
      orderStatus: order.status,
    };
  } catch (e) {
    await pool.query('DELETE FROM order_custom_payments WHERE id = ? AND status = ?', [paymentId, 'pending']);
    console.error('[custom-payment] Stripe session failed:', e);
    return { ok: false, status: 500, error: e.message || 'Failed to create Stripe payment link' };
  }
}

export async function fulfillCustomOrderPaymentFromStripeSession(session) {
  const paymentId = Number(session.metadata?.custom_payment_id);
  const orderId = Number(session.metadata?.order_id);
  if (!paymentId || !orderId) {
    return { ok: false, status: 400, error: 'Missing custom payment reference on checkout session' };
  }

  const [[payment]] = await pool.query('SELECT * FROM order_custom_payments WHERE id = ?', [paymentId]);
  if (!payment) {
    return { ok: false, status: 404, error: 'Custom payment record not found' };
  }

  if (payment.status === 'paid') {
    return {
      ok: true,
      alreadyFulfilled: true,
      checkoutType: 'custom_order_payment',
      orderId,
      orderNumber: payment.order_number,
      customerEmail: payment.customer_email,
      paymentNumber: payment.payment_number,
    };
  }

  let cardLast4 = 'STRP';
  const pi = session.payment_intent;
  if (pi && typeof pi === 'object' && pi.charges?.data?.[0]?.payment_method_details?.card?.last4) {
    cardLast4 = pi.charges.data[0].payment_method_details.card.last4;
  }
  const paymentIntentId = typeof pi === 'string' ? pi : pi?.id ?? null;

  await pool.query(
    `UPDATE order_custom_payments SET
       status = 'paid',
       paid_at = CURRENT_TIMESTAMP,
       stripe_checkout_session_id = ?,
       stripe_payment_intent_id = ?
     WHERE id = ?`,
    [session.id, paymentIntentId, paymentId]
  );

  await pool.query(
    `UPDATE orders SET total = ?, card_last4 = ? WHERE id = ?`,
    [Number(payment.amount).toFixed(2), cardLast4, orderId]
  );

  const { fulfillOrderFromStripeSessionWithSession } = await import('./stripeCheckout.js');
  const orderResult = await fulfillOrderFromStripeSessionWithSession({
    ...session,
    metadata: {
      ...session.metadata,
      order_id: String(orderId),
    },
  });

  return {
    ...orderResult,
    checkoutType: 'custom_order_payment',
    paymentNumber: payment.payment_number,
    customPaymentId: paymentId,
  };
}
