import pool from '../db.js';
import { getStripe } from './stripeCheckout.js';
import {
  insertPendingCustomQuiltRequest,
  fulfillCustomQuiltRequestPayment,
} from './customQuiltRequest.js';
import { clientOriginPath } from './clientOrigin.js';

const SIZE_LABELS = {
  small: 'Small',
  large: 'Large',
  'x-large': 'X-Large',
  'xx-large': 'XX-Large',
  'xxx-large': 'XXX-Large',
};

const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173').replace(/\/$/, '');

export async function createCustomQuiltStripeCheckoutSession(body) {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, status: 503, error: 'Stripe is not configured on the server' };
  }

  const pending = await insertPendingCustomQuiltRequest(body);
  if (!pending.ok) {
    return { ok: false, status: pending.status ?? 400, error: pending.error };
  }

  const { row, requestId, requestNumber } = pending;
  const amountCents = Math.round(Number(row.estimated_price) * 100);
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    await pool.query('DELETE FROM custom_quilt_requests WHERE id = ?', [requestId]);
    return { ok: false, status: 400, error: 'Estimated price is too low for checkout' };
  }

  const sizeLabel = SIZE_LABELS[row.product_size] ?? row.product_size;
  const productName = `Custom quilt — ${row.design_name}${sizeLabel ? ` (${sizeLabel})` : ''}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: row.customer_email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: row.quilt_title
                ? `Working title: ${row.quilt_title}`
                : 'Custom quilt design deposit',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${clientOriginPath('/customize/success')}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientOriginPath('/customize')}?checkout=cancelled`,
      metadata: {
        checkout_type: 'custom_quilt',
        custom_quilt_request_id: String(requestId),
        request_number: requestNumber,
      },
    });

    await pool.query(
      'UPDATE custom_quilt_requests SET stripe_checkout_session_id = ? WHERE id = ?',
      [session.id, requestId]
    );

    return {
      ok: true,
      url: session.url,
      sessionId: session.id,
      requestNumber,
    };
  } catch (e) {
    await pool.query('DELETE FROM custom_quilt_requests WHERE id = ? AND status = ?', [
      requestId,
      'pending_payment',
    ]);
    console.error('[stripe] custom quilt session failed:', e);
    return { ok: false, status: 500, error: e.message || 'Failed to start Stripe checkout' };
  }
}

export async function fulfillCustomQuiltFromStripeSession(session) {
  const requestId = Number(session.metadata?.custom_quilt_request_id);
  if (!requestId) {
    return { ok: false, status: 400, error: 'Missing custom quilt request on checkout session' };
  }

  let cardLast4 = 'STRP';
  const pi = session.payment_intent;
  if (pi && typeof pi === 'object' && pi.charges?.data?.[0]?.payment_method_details?.card?.last4) {
    cardLast4 = pi.charges.data[0].payment_method_details.card.last4;
  }
  const paymentIntentId = typeof pi === 'string' ? pi : pi?.id ?? null;

  return fulfillCustomQuiltRequestPayment(requestId, {
    sessionId: session.id,
    paymentIntentId,
    cardLast4,
  });
}
