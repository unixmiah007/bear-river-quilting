import Stripe from 'stripe';
import pool from '../db.js';
import { buildCheckoutFromBody, insertPendingOrder } from './orderCheckout.js';
import { sendOrderConfirmationEmail, sendOrderStaffNotificationEmail } from './mail.js';
import { fulfillCustomQuiltFromStripeSession } from './customQuiltStripeCheckout.js';
import { fulfillCustomOrderPaymentFromStripeSession } from './customOrderPayment.js';
import { clientOriginPath } from './clientOrigin.js';

let stripeClient = null;

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(secret);
  }
  return stripeClient;
}

export function getStripePublishableKey() {
  return process.env.STRIPE_PUBLISHABLE_KEY ?? null;
}

function lineItemsFromDraft(draft) {
  const rows = draft.normalizedItems.map((it) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: it.productName },
      unit_amount: Math.round(it.unitPrice * 100),
    },
    quantity: it.quantity,
  }));
  const shippingLabel =
    draft.shippingMethod === 'express'
      ? 'Express shipping'
      : draft.shippingMethod === 'pickup'
        ? 'Store pickup'
        : 'Standard shipping';
  rows.push({
    price_data: {
      currency: 'usd',
      product_data: { name: shippingLabel },
      unit_amount: Math.round(draft.shippingCost * 100),
    },
    quantity: 1,
  });
  if (draft.taxAmount > 0) {
    rows.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Sales tax (8.25%)' },
        unit_amount: Math.round(draft.taxAmount * 100),
      },
      quantity: 1,
    });
  }
  return rows;
}

export async function createStripeCheckoutSession(body) {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, status: 503, error: 'Stripe is not configured on the server' };
  }

  const conn = await pool.getConnection();
  try {
    const draft = await buildCheckoutFromBody(conn, body);
    if (!draft.ok) {
      return { ok: false, status: draft.status, error: draft.error };
    }

    await conn.beginTransaction();
    const { orderId, orderNumber: ordNo } = await insertPendingOrder(conn, draft, {
      paymentMethod: 'stripe',
      cardLast4: '----',
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: draft.customer.email,
      line_items: lineItemsFromDraft(draft),
      success_url: `${clientOriginPath('/checkout/success')}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientOriginPath('/cart')}?checkout=cancelled`,
      metadata: {
        order_id: String(orderId),
        order_number: ordNo,
      },
    });

    await conn.query(
      'UPDATE orders SET stripe_checkout_session_id = ? WHERE id = ?',
      [session.id, orderId]
    );
    await conn.commit();

    return {
      ok: true,
      url: session.url,
      sessionId: session.id,
      orderNumber: ordNo,
    };
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    console.error('[stripe] create session failed:', e);
    return { ok: false, status: 500, error: e.message || 'Failed to start Stripe checkout' };
  } finally {
    conn.release();
  }
}

async function loadOrderItems(orderId) {
  const [items] = await pool.query(
    `SELECT product_id AS productId, product_name AS productName, unit_price AS unitPrice, quantity, line_total AS lineTotal
     FROM order_items WHERE order_id = ?`,
    [orderId]
  );
  return items.map((row) => ({
    productId: row.productId,
    productName: row.productName,
    unitPrice: Number(row.unitPrice),
    quantity: row.quantity,
    lineTotal: Number(row.lineTotal),
  }));
}

async function sendOrderEmails(order, items) {
  const total = Number(order.total);
  const shipping = {
    address1: order.shipping_address1,
    address2: order.shipping_address2,
    city: order.shipping_city,
    state: order.shipping_state,
    postalCode: order.shipping_postal_code,
    country: order.shipping_country,
  };
  console.log('[mail] Sending order emails', {
    orderNumber: order.order_number,
    customerEmail: order.customer_email,
  });
  const mailResults = await Promise.allSettled([
    sendOrderConfirmationEmail({
      to: order.customer_email,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      total,
      items,
    }),
    sendOrderStaffNotificationEmail({
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      total,
      items,
      shipping,
      shippingMethod: order.shipping_method,
      shippingCost: Number(order.shipping_cost),
    }),
  ]);
  const [cust, staff] = mailResults;
  if (cust.status === 'rejected') {
    console.error('[mail] Customer confirmation failed:', cust.reason?.message ?? cust.reason);
  }
  if (staff.status === 'rejected') {
    console.error('[mail] Staff notification failed:', staff.reason?.message ?? staff.reason);
  }
  return {
    customerOk: cust.status === 'fulfilled',
    staffOk: staff.status === 'fulfilled',
  };
}

async function retrievePaidCheckoutSession(sessionId) {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, status: 503, error: 'Stripe is not configured' };
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  });

  if (session.payment_status !== 'paid') {
    return { ok: false, status: 400, error: 'Payment is not complete yet' };
  }

  return { ok: true, session };
}

/** Routes Stripe session to cart order or custom quilt fulfillment. */
export async function fulfillStripeCheckoutSession(sessionId) {
  const loaded = await retrievePaidCheckoutSession(sessionId);
  if (!loaded.ok) return loaded;

  const { session } = loaded;

  if (session.metadata?.checkout_type === 'custom_order_payment') {
    return fulfillCustomOrderPaymentFromStripeSession(session);
  }

  const customQuiltId = Number(session.metadata?.custom_quilt_request_id);
  if (customQuiltId) {
    return fulfillCustomQuiltFromStripeSession(session);
  }

  const orderId = Number(session.metadata?.order_id);
  if (orderId) {
    return fulfillOrderFromStripeSessionWithSession(session);
  }

  return { ok: false, status: 400, error: 'Unknown checkout session type' };
}

/** Marks order paid and sends emails once (idempotent). */
export async function fulfillOrderFromStripeSession(sessionId) {
  const loaded = await retrievePaidCheckoutSession(sessionId);
  if (!loaded.ok) return loaded;
  return fulfillOrderFromStripeSessionWithSession(loaded.session);
}

export async function fulfillOrderFromStripeSessionWithSession(session) {
  const orderId = Number(session.metadata?.order_id);
  if (!orderId) {
    return { ok: false, status: 400, error: 'Missing order reference on checkout session' };
  }

  const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  if (order.status === 'paid') {
    return {
      ok: true,
      checkoutType: 'order',
      alreadyFulfilled: true,
      orderId,
      orderNumber: order.order_number,
      customerEmail: order.customer_email,
    };
  }

  let cardLast4 = 'STRP';
  const pi = session.payment_intent;
  if (pi && typeof pi === 'object' && pi.charges?.data?.[0]?.payment_method_details?.card?.last4) {
    cardLast4 = pi.charges.data[0].payment_method_details.card.last4;
  }

  const paymentIntentId =
    typeof pi === 'string' ? pi : pi?.id ?? session.payment_intent ?? null;

  await pool.query(
    `UPDATE orders SET
       status = 'paid',
       card_last4 = ?,
       stripe_checkout_session_id = ?,
       stripe_payment_intent_id = ?
     WHERE id = ?`,
    [cardLast4, session.id, paymentIntentId, orderId]
  );

  const items = await loadOrderItems(orderId);
  const mail = await sendOrderEmails(order, items);

  return {
    ok: true,
    checkoutType: 'order',
    orderId,
    orderNumber: order.order_number,
    customerEmail: order.customer_email,
    mail,
  };
}

export async function handleStripeWebhook(rawBody, signature) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return { ok: false, status: 503, error: 'Stripe webhook is not configured' };
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe] webhook signature failed:', err.message);
    return { ok: false, status: 400, error: `Webhook Error: ${err.message}` };
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const result = await fulfillStripeCheckoutSession(session.id);
    if (!result.ok && result.status !== 400) {
      return { ok: false, status: result.status ?? 500, error: result.error };
    }
  }

  return { ok: true, received: true };
}
