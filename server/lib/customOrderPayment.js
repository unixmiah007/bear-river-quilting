import pool from '../db.js';
import { getStripe } from './stripeCheckout.js';
import { clientOriginPath } from './clientOrigin.js';
import { sendSendGridMail, resolveSendGridFromCustomer } from './sendgridMail.js';
import { fulfillCustomQuiltRequestPayment } from './customQuiltRequest.js';
import { parseOrderNotifyRecipients } from './mail.js';

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

function normalizeSearchEmail(email) {
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase();
  if (normalized.length < 3) {
    return { ok: false, status: 400, error: 'Enter at least 3 characters of the customer email' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, status: 400, error: 'Enter a valid email address' };
  }
  return { ok: true, email: normalized };
}

/** @deprecated use searchCustomerPaymentsByEmail */
export async function searchOrdersByCustomerEmail(email) {
  const result = await searchCustomerPaymentsByEmail(email);
  if (!result.ok) return result;
  return { ok: true, email: result.email, orders: result.orders };
}

export async function searchCustomerPaymentsByEmail(email) {
  const parsed = normalizeSearchEmail(email);
  if (!parsed.ok) return parsed;

  const [orders] = await pool.query(
    `SELECT id, order_number, status, customer_name, customer_email, subtotal, tax_amount, shipping_cost, total,
            tracking_carrier, tracking_number, created_at
     FROM orders
     WHERE LOWER(TRIM(customer_email)) = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [parsed.email]
  );

  const [customRequests] = await pool.query(
    `SELECT id, request_number, status, design_name, product_size, color_palette, batting,
            customer_name, customer_email, estimated_price, tracking_carrier, tracking_number, created_at
     FROM custom_quilt_requests
     WHERE LOWER(TRIM(customer_email)) = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [parsed.email]
  );

  return {
    ok: true,
    email: parsed.email,
    orders,
    customRequests,
  };
}

export async function sendCustomPaymentLinkEmail({
  to,
  customerName,
  referenceType,
  referenceNumber,
  paymentNumber,
  amount,
  checkoutUrl,
  adminNote,
}) {
  const from = resolveSendGridFromCustomer();
  if (!from) {
    return { ok: false, error: 'SendGrid is not configured (MAIL_FROM_ADDRESS / SENDGRID_API_KEY)' };
  }

  const isCustomQuilt = referenceType === 'custom_quilt';
  const isLongArm = referenceType === 'long_arm';
  const subjectNoun = isLongArm
    ? 'long-arm quilting request'
    : isCustomQuilt
      ? 'custom quilt request'
      : 'order';
  const amountLine = formatUsd(amount);
  const noteBlock = adminNote ? `\n\nNote from our team:\n${adminNote}\n` : '';

  const text = [
    `Hi ${customerName || 'there'},`,
    '',
    `Please complete payment for your Bear River Quilting ${subjectNoun} ${referenceNumber}.`,
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
<p>Please complete payment for your Bear River Quilting ${escapeHtml(subjectNoun)} <strong>${escapeHtml(referenceNumber)}</strong>.</p>
<p><strong>Amount due:</strong> ${escapeHtml(amountLine)}<br>
<strong>Payment reference:</strong> ${escapeHtml(paymentNumber)}</p>
${noteHtml}
<p><a href="${escapeHtml(checkoutUrl)}" style="display:inline-block;padding:0.75rem 1.25rem;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Pay with Stripe</a></p>
<p class="muted" style="font-size:0.9rem">Or copy this link:<br><a href="${escapeHtml(checkoutUrl)}">${escapeHtml(checkoutUrl)}</a></p>
<p>— Bear River Quilting</p>`;

  const customerEmail = String(to ?? '')
    .trim()
    .toLowerCase();
  const cc = parseOrderNotifyRecipients().filter((addr) => addr !== customerEmail);

  await sendSendGridMail({
    to,
    from,
    ...(cc.length ? { cc } : {}),
    subject: `Payment link for ${subjectNoun} ${referenceNumber} — ${amountLine}`,
    text,
    html,
  });

  return { ok: true, ccCount: cc.length };
}

async function createStripePaymentSession({
  stripe,
  customerEmail,
  referenceNumber,
  referenceType,
  lineDescription,
  amountCents,
  paymentId,
  paymentNumber,
  orderId,
  customQuiltRequestId,
  longArmRequestId,
  adminNote,
  paymentPurpose,
}) {
  const metadata = {
    checkout_type: 'custom_order_payment',
    custom_payment_id: String(paymentId),
    payment_number: paymentNumber,
    reference_type: referenceType,
  };
  if (orderId) metadata.order_id = String(orderId);
  if (customQuiltRequestId) metadata.custom_quilt_request_id = String(customQuiltRequestId);
  if (longArmRequestId) metadata.long_arm_request_id = String(longArmRequestId);
  metadata.order_number = referenceNumber;
  if (paymentPurpose) metadata.payment_purpose = paymentPurpose;

  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name:
              referenceType === 'long_arm'
                ? `Long-arm quilting ${referenceNumber} — final payment`
                : referenceType === 'custom_quilt'
                  ? `Custom quilt ${referenceNumber} — payment`
                  : `Order ${referenceNumber} — payment`,
            description: lineDescription,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url:
      referenceType === 'long_arm'
        ? `${clientOriginPath('/long-arm-quilting/success')}?session_id={CHECKOUT_SESSION_ID}`
        : referenceType === 'custom_quilt'
          ? `${clientOriginPath('/customize/success')}?session_id={CHECKOUT_SESSION_ID}`
          : `${clientOriginPath('/checkout/success')}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:
      referenceType === 'long_arm'
        ? clientOriginPath('/long-arm-quilting')
        : referenceType === 'custom_quilt'
          ? clientOriginPath('/customize')
          : `${clientOriginPath('/account')}?email=${encodeURIComponent(customerEmail)}`,
    metadata,
  });
}

export async function createCustomOrderPayment({ orderId, amount, adminNote, sendEmail = true }) {
  return createCustomPayment({ orderId, amount, adminNote, sendEmail });
}

export async function createCustomPayment({
  orderId,
  customQuiltRequestId,
  longArmRequestId,
  amount,
  adminNote,
  sendEmail = true,
  paymentPurpose,
}) {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, status: 503, error: 'Stripe is not configured on the server' };
  }

  const hasOrder = orderId != null && Number(orderId) > 0;
  const hasCustomQuilt = customQuiltRequestId != null && Number(customQuiltRequestId) > 0;
  const hasLongArm = longArmRequestId != null && Number(longArmRequestId) > 0;
  const refCount = [hasOrder, hasCustomQuilt, hasLongArm].filter(Boolean).length;
  if (refCount !== 1) {
    return { ok: false, status: 400, error: 'Select exactly one shop order, custom quilt request, or long-arm request' };
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum < 0.5) {
    return { ok: false, status: 400, error: 'Enter a payment amount of at least $0.50' };
  }

  let referenceType;
  let referenceNumber;
  let customerName;
  let customerEmail;
  let sourceStatus;
  let resolvedOrderId = null;
  let resolvedCustomQuiltId = null;
  let resolvedLongArmId = null;

  if (hasOrder) {
    const id = Number(orderId);
    const [[order]] = await pool.query(
      `SELECT id, order_number, status, customer_name, customer_email, total
       FROM orders WHERE id = ?`,
      [id]
    );
    if (!order) {
      return { ok: false, status: 404, error: 'Order not found' };
    }
    referenceType = 'order';
    referenceNumber = order.order_number;
    customerName = order.customer_name;
    customerEmail = order.customer_email;
    sourceStatus = order.status;
    resolvedOrderId = order.id;
  } else if (hasCustomQuilt) {
    const id = Number(customQuiltRequestId);
    const [[request]] = await pool.query(
      `SELECT id, request_number, status, design_name, customer_name, customer_email, estimated_price
       FROM custom_quilt_requests WHERE id = ?`,
      [id]
    );
    if (!request) {
      return { ok: false, status: 404, error: 'Custom quilt request not found' };
    }
    referenceType = 'custom_quilt';
    referenceNumber = request.request_number;
    customerName = request.customer_name;
    customerEmail = request.customer_email;
    sourceStatus = request.status;
    resolvedCustomQuiltId = request.id;
  } else {
    const id = Number(longArmRequestId);
    const [[request]] = await pool.query(
      `SELECT id, request_number, status, customer_name, customer_email, deposit_amount, deposit_paid_at
       FROM long_arm_quilting_requests WHERE id = ?`,
      [id]
    );
    if (!request) {
      return { ok: false, status: 404, error: 'Long-arm quilting request not found' };
    }
    if (!request.deposit_paid_at) {
      return { ok: false, status: 400, error: 'Deposit has not been paid for this request yet' };
    }
    referenceType = 'long_arm';
    referenceNumber = request.request_number;
    customerName = request.customer_name;
    customerEmail = request.customer_email;
    sourceStatus = request.status;
    resolvedLongArmId = request.id;
  }

  const paymentNumber = customPaymentNumber();
  const amountCents = Math.round(amountNum * 100);
  const note = String(adminNote ?? '').trim() || null;

  const [insert] = await pool.query(
    `INSERT INTO order_custom_payments (
       payment_number, order_id, custom_quilt_request_id, long_arm_request_id, reference_type, order_number,
       customer_email, amount, admin_note, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      paymentNumber,
      resolvedOrderId,
      resolvedCustomQuiltId,
      resolvedLongArmId,
      referenceType,
      referenceNumber,
      customerEmail,
      amountNum.toFixed(2),
      note,
    ]
  );

  const paymentId = insert.insertId;
  const lineDescription =
    note ||
    (referenceType === 'long_arm'
      ? `Final payment for long-arm quilting request ${referenceNumber}`
      : referenceType === 'custom_quilt'
        ? `Payment for custom quilt request ${referenceNumber}`
        : `Payment for Bear River Quilting order ${referenceNumber}`);

  try {
    const session = await createStripePaymentSession({
      stripe,
      customerEmail,
      referenceNumber,
      referenceType,
      lineDescription: lineDescription.slice(0, 500),
      amountCents,
      paymentId,
      paymentNumber,
      orderId: resolvedOrderId,
      customQuiltRequestId: resolvedCustomQuiltId,
      longArmRequestId: resolvedLongArmId,
      adminNote: note,
      paymentPurpose,
    });

    await pool.query(
      `UPDATE order_custom_payments SET stripe_checkout_session_id = ?, checkout_url = ? WHERE id = ?`,
      [session.id, session.url, paymentId]
    );

    let mail = { ok: false };
    if (sendEmail) {
      try {
        mail = await sendCustomPaymentLinkEmail({
          to: customerEmail,
          customerName,
          referenceType,
          referenceNumber,
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
      referenceType,
      orderId: resolvedOrderId,
      customQuiltRequestId: resolvedCustomQuiltId,
      longArmRequestId: resolvedLongArmId,
      orderNumber: referenceNumber,
      requestNumber:
        referenceType === 'custom_quilt' || referenceType === 'long_arm' ? referenceNumber : null,
      amount: amountNum,
      checkoutUrl: session.url,
      sessionId: session.id,
      emailSent: !!mail.ok,
      emailError: mail.error ?? null,
      sourceStatus,
      customerEmail,
      customerName,
    };
  } catch (e) {
    await pool.query('DELETE FROM order_custom_payments WHERE id = ? AND status = ?', [paymentId, 'pending']);
    console.error('[custom-payment] Stripe session failed:', e);
    return { ok: false, status: 500, error: e.message || 'Failed to create Stripe payment link' };
  }
}

export async function fulfillCustomOrderPaymentFromStripeSession(session) {
  const paymentId = Number(session.metadata?.custom_payment_id);
  if (!paymentId) {
    return { ok: false, status: 400, error: 'Missing custom payment reference on checkout session' };
  }

  const [[payment]] = await pool.query('SELECT * FROM order_custom_payments WHERE id = ?', [paymentId]);
  if (!payment) {
    return { ok: false, status: 404, error: 'Custom payment record not found' };
  }

  if (payment.status === 'paid') {
    const base = {
      ok: true,
      alreadyFulfilled: true,
      checkoutType: 'custom_order_payment',
      customerEmail: payment.customer_email,
      paymentNumber: payment.payment_number,
      referenceType: payment.reference_type,
    };
    if (payment.custom_quilt_request_id) {
      return {
        ...base,
        checkoutType: 'custom_quilt',
        requestId: payment.custom_quilt_request_id,
        requestNumber: payment.order_number,
      };
    }
    if (payment.long_arm_request_id) {
      return {
        ...base,
        checkoutType: 'long_arm_quilting',
        requestId: payment.long_arm_request_id,
        requestNumber: payment.order_number,
      };
    }
    return {
      ...base,
      orderId: payment.order_id,
      orderNumber: payment.order_number,
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

  if (payment.custom_quilt_request_id) {
    await pool.query('UPDATE custom_quilt_requests SET estimated_price = ? WHERE id = ?', [
      Number(payment.amount).toFixed(2),
      payment.custom_quilt_request_id,
    ]);

    const quiltResult = await fulfillCustomQuiltRequestPayment(payment.custom_quilt_request_id, {
      sessionId: session.id,
      paymentIntentId,
      cardLast4,
    });

    return {
      ...quiltResult,
      checkoutType: 'custom_quilt',
      paymentNumber: payment.payment_number,
      customPaymentId: paymentId,
      referenceType: 'custom_quilt',
    };
  }

  if (payment.long_arm_request_id) {
    await pool.query(
      `UPDATE long_arm_quilting_requests SET
         final_payment_amount = ?,
         status = 'completed'
       WHERE id = ?`,
      [Number(payment.amount).toFixed(2), payment.long_arm_request_id]
    );

    const [[laRequest]] = await pool.query(
      'SELECT request_number, customer_email FROM long_arm_quilting_requests WHERE id = ?',
      [payment.long_arm_request_id]
    );

    return {
      ok: true,
      checkoutType: 'long_arm_quilting',
      requestId: payment.long_arm_request_id,
      requestNumber: laRequest?.request_number ?? payment.order_number,
      customerEmail: laRequest?.customer_email ?? payment.customer_email,
      paymentNumber: payment.payment_number,
      customPaymentId: paymentId,
      referenceType: 'long_arm',
      finalPayment: true,
    };
  }

  const orderId = Number(payment.order_id);
  if (!orderId) {
    return { ok: false, status: 400, error: 'Custom payment is not linked to an order or custom request' };
  }

  const isLineAdjustment = session.metadata?.payment_purpose === 'order_line_adjustment';

  if (!isLineAdjustment) {
    await pool.query(`UPDATE orders SET total = ?, card_last4 = ? WHERE id = ?`, [
      Number(payment.amount).toFixed(2),
      cardLast4,
      orderId,
    ]);
  } else {
    await pool.query('UPDATE orders SET card_last4 = ? WHERE id = ?', [cardLast4, orderId]);
  }

  let orderResult;
  if (isLineAdjustment) {
    const [[order]] = await pool.query(
      'SELECT id, order_number, customer_email, status FROM orders WHERE id = ?',
      [orderId]
    );
    orderResult = {
      ok: true,
      checkoutType: 'order',
      orderId,
      orderNumber: order?.order_number,
      customerEmail: order?.customer_email,
      lineAdjustmentPaid: true,
    };
  } else {
    const { fulfillOrderFromStripeSessionWithSession } = await import('./stripeCheckout.js');
    orderResult = await fulfillOrderFromStripeSessionWithSession({
      ...session,
      metadata: {
        ...session.metadata,
        order_id: String(orderId),
      },
    });
  }

  return {
    ...orderResult,
    checkoutType: 'custom_order_payment',
    paymentNumber: payment.payment_number,
    customPaymentId: paymentId,
    referenceType: 'order',
  };
}
