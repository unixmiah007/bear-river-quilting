import pool from '../db.js';
import { getStripe } from './stripeCheckout.js';
import { insertPendingLongArmRequest, fulfillLongArmRequestDeposit, LONG_ARM_DEPOSIT_USD } from './longArmQuiltingRequest.js';
import { clientOriginPath } from './clientOrigin.js';

export async function createLongArmQuiltingStripeCheckoutSession(body) {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, status: 503, error: 'Stripe is not configured on the server' };
  }

  const pending = await insertPendingLongArmRequest(body);
  if (!pending.ok) {
    return { ok: false, status: pending.status ?? 400, error: pending.error };
  }

  const { row, requestId, requestNumber, services } = pending;
  const amountCents = Math.round(LONG_ARM_DEPOSIT_USD * 100);
  const serviceNames = services.map((s) => s.name).join(', ');

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: row.customer_email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Long-arm quilting deposit — ${requestNumber}`,
              description: `Services: ${serviceNames.slice(0, 400)}. A final payment link will be sent when your job is finished.`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${clientOriginPath('/long-arm-quilting')}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientOriginPath('/long-arm-quilting')}?checkout=cancelled`,
      metadata: {
        checkout_type: 'long_arm_quilting',
        long_arm_request_id: String(requestId),
        request_number: requestNumber,
      },
    });

    await pool.query(
      'UPDATE long_arm_quilting_requests SET stripe_checkout_session_id = ? WHERE id = ?',
      [session.id, requestId]
    );

    return {
      ok: true,
      url: session.url,
      sessionId: session.id,
      requestNumber,
    };
  } catch (e) {
    await pool.query('DELETE FROM long_arm_quilting_requests WHERE id = ? AND status = ?', [
      requestId,
      'pending_payment',
    ]);
    console.error('[stripe] long-arm quilting session failed:', e);
    return { ok: false, status: 500, error: e.message || 'Failed to start Stripe checkout' };
  }
}

export async function fulfillLongArmFromStripeSession(session) {
  const requestId = Number(session.metadata?.long_arm_request_id);
  if (!requestId) {
    return { ok: false, status: 400, error: 'Missing long-arm request on checkout session' };
  }

  let paymentIntentId = null;
  const pi = session.payment_intent;
  paymentIntentId = typeof pi === 'string' ? pi : pi?.id ?? null;

  return fulfillLongArmRequestDeposit(requestId, {
    sessionId: session.id,
    paymentIntentId,
  });
}
