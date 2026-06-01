import pool from '../db.js';
import { getStripe } from './stripeCheckout.js';
import { hydrateProductRow, resolveProductPrice } from './productSizePrices.js';
import { normalizeProductSize } from './productSize.js';
import { createCustomPayment } from './customOrderPayment.js';
import { sendOrderLineItemRefundEmail } from './mail.js';

const SIZE_LABELS = {
  small: 'Small',
  large: 'Large',
  'x-large': 'X-Large',
  'xx-large': 'XX-Large',
  'xxx-large': 'XXX-Large',
};

const UNPAID_STATUSES = new Set(['pending', 'pending_payment']);

const MIN_PAYMENT_LINK_USD = 0.5;

function productNameWithSize(name, productSize) {
  if (!productSize) return name;
  const label = SIZE_LABELS[productSize] ?? productSize;
  return `${name} (${label})`;
}

function inferProductSizeFromName(productName) {
  const m = String(productName ?? '').match(/\(([^)]+)\)\s*$/);
  if (!m) return null;
  const captured = m[1].trim().toLowerCase();
  for (const [value, label] of Object.entries(SIZE_LABELS)) {
    if (label.toLowerCase() === captured || value === captured) {
      return value;
    }
  }
  return normalizeProductSize(captured);
}

export function orderIsPaid(order) {
  if (order?.stripe_payment_intent_id) return true;
  const status = String(order?.status ?? '')
    .trim()
    .toLowerCase();
  if (UNPAID_STATUSES.has(status) || status === 'new') return false;
  return true;
}

function computeOrderTotals(subtotal, shippingCost) {
  const ship = Number(shippingCost) || 0;
  const sub = Number(subtotal) || 0;
  const taxAmount = Number((sub * 0.0825).toFixed(2));
  const total = Number((sub + ship + taxAmount).toFixed(2));
  return {
    subtotal: Number(sub.toFixed(2)),
    taxAmount,
    total,
  };
}

const ORDER_ITEM_COLUMNS = `id, product_id, product_name, unit_price, quantity, line_total,
  line_refund_amount, line_refund_status, stripe_refund_id, line_refund_at,
  original_product_id, original_product_name, original_unit_price, original_line_total`;

async function snapshotOrderAdjustmentOriginals(conn, orderId, itemId, item, order) {
  await conn.query(
    `UPDATE order_items SET
       original_product_id = product_id,
       original_product_name = product_name,
       original_unit_price = unit_price,
       original_line_total = line_total
     WHERE id = ? AND original_product_id IS NULL`,
    [itemId]
  );
  await conn.query(
    `UPDATE orders SET
       original_subtotal = ?,
       original_tax_amount = ?,
       original_total = ?,
       order_adjusted_at = CURRENT_TIMESTAMP
     WHERE id = ? AND original_total IS NULL`,
    [
      Number(order.subtotal).toFixed(2),
      Number(order.tax_amount).toFixed(2),
      Number(order.total).toFixed(2),
      orderId,
    ]
  );
}

export async function loadOrderItems(orderId) {
  const [items] = await pool.query(
    `SELECT ${ORDER_ITEM_COLUMNS} FROM order_items WHERE order_id = ? ORDER BY id ASC`,
    [orderId]
  );
  return items;
}

export async function loadUpdatedOrder(orderId) {
  const [[row]] = await pool.query(
    `SELECT id, order_number, status, customer_name, customer_email, customer_phone,
            shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
            shipping_method, shipping_cost,
            billing_name, billing_address1, billing_address2, billing_city, billing_state, billing_postal_code, billing_country,
            card_last4, subtotal, tax_amount, total, created_at,
            original_subtotal, original_tax_amount, original_total, order_adjusted_at,
            tracking_carrier, tracking_number, tracking_notified_at, invoice_emailed_at,
            label_from_name, label_from_address1, label_from_address2,
            label_from_city, label_from_state, label_from_postal_code, label_from_country, label_from_phone,
            stripe_payment_intent_id
     FROM orders WHERE id = ?`,
    [orderId]
  );
  return row ?? null;
}

async function clearItemRefundMeta(itemId) {
  await pool.query(
    `UPDATE order_items SET
       line_refund_amount = NULL,
       line_refund_status = NULL,
       stripe_refund_id = NULL,
       line_refund_at = NULL
     WHERE id = ?`,
    [itemId]
  );
}

async function setItemRefundMeta(itemId, { amount, status, refundId = null }) {
  const issued = status === 'issued';
  await pool.query(
    `UPDATE order_items SET
       line_refund_amount = ?,
       line_refund_status = ?,
       stripe_refund_id = ?,
       line_refund_at = ${issued ? 'CURRENT_TIMESTAMP' : 'line_refund_at'}
     WHERE id = ?`,
    [amount != null ? Number(amount).toFixed(2) : null, status, refundId, itemId]
  );
}

async function recalculateAndSaveOrderTotals(conn, orderId, shippingCost) {
  const [rows] = await conn.query(
    `SELECT COALESCE(SUM(line_total), 0) AS subtotal FROM order_items WHERE order_id = ?`,
    [orderId]
  );
  const subtotal = Number(rows[0]?.subtotal) || 0;
  const { taxAmount, total } = computeOrderTotals(subtotal, shippingCost);
  await conn.query(
    `UPDATE orders SET subtotal = ?, tax_amount = ?, total = ? WHERE id = ?`,
    [subtotal.toFixed(2), taxAmount.toFixed(2), total.toFixed(2), orderId]
  );
  return { subtotal, taxAmount, total };
}

async function buildLineItemProductChange(conn, orderId, itemId, productId) {
  const oid = Number(orderId);
  const iid = Number(itemId);
  const pid = Number(productId);

  if (!oid || !iid || !pid) {
    return { ok: false, status: 400, error: 'Invalid order, line item, or product' };
  }

  const [[order]] = await conn.query(
    `SELECT id, order_number, status, customer_name, customer_email, shipping_cost, subtotal, tax_amount, total,
            stripe_payment_intent_id
     FROM orders WHERE id = ?`,
    [oid]
  );
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  const [[item]] = await conn.query(
    `SELECT id, order_id, product_id, product_name, unit_price, quantity, line_total
     FROM order_items WHERE id = ? AND order_id = ?`,
    [iid, oid]
  );
  if (!item) {
    return { ok: false, status: 404, error: 'Line item not found on this order' };
  }

  if (Number(item.product_id) === pid) {
    return { ok: false, status: 400, error: 'This line item already uses that product' };
  }

  const [[productRow]] = await conn.query(
    'SELECT id, name, price, size_prices FROM products WHERE id = ?',
    [pid]
  );
  if (!productRow) {
    return { ok: false, status: 404, error: 'Product not found' };
  }

  const product = hydrateProductRow(productRow);
  const size = inferProductSizeFromName(item.product_name);
  const unitPrice = resolveProductPrice(product, size);
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const lineTotal = Number((unitPrice * quantity).toFixed(2));
  const productName = productNameWithSize(product.name, size);

  const [siblingItems] = await conn.query(
    `SELECT id, line_total FROM order_items WHERE order_id = ?`,
    [oid]
  );
  let subtotal = 0;
  for (const row of siblingItems) {
    subtotal +=
      Number(row.id) === iid ? lineTotal : Number(row.line_total) || 0;
  }
  const newTotals = computeOrderTotals(subtotal, order.shipping_cost);
  const priorTotal = Number(order.total);
  const delta = Number((newTotals.total - priorTotal).toFixed(2));
  const paid = orderIsPaid(order);

  return {
    ok: true,
    oid,
    iid,
    pid,
    order,
    item,
    productName,
    unitPrice,
    lineTotal,
    quantity,
    priorTotal,
    paid,
    delta,
    newTotals,
  };
}

export async function previewOrderLineItemProductChange({ orderId, itemId, productId }) {
  const conn = await pool.getConnection();
  try {
    const built = await buildLineItemProductChange(conn, orderId, itemId, productId);
    if (!built.ok) return built;

    const { priorTotal, paid, delta, newTotals, productName, item } = built;
    const refundAmount = paid && delta < -0.01 ? Math.abs(delta) : 0;

    return {
      ok: true,
      requiresRefundConfirmation: refundAmount >= 0.01,
      preview: {
        itemId: built.iid,
        productId: built.pid,
        priorTotal,
        newTotal: newTotals.total,
        newSubtotal: newTotals.subtotal,
        newTaxAmount: newTotals.taxAmount,
        delta,
        refundAmount,
        paid,
        previousProductName: item.product_name,
        newProductName: productName,
      },
    };
  } finally {
    conn.release();
  }
}

export async function changeOrderLineItemProduct({ orderId, itemId, productId }) {
  const conn = await pool.getConnection();
  try {
    const built = await buildLineItemProductChange(conn, orderId, itemId, productId);
    if (!built.ok) return built;

    const {
      oid,
      iid,
      pid,
      order,
      item,
      productName,
      unitPrice,
      lineTotal,
      priorTotal,
      paid,
      delta,
      newTotals,
    } = built;

    await conn.beginTransaction();

    await snapshotOrderAdjustmentOriginals(conn, oid, iid, item, order);

    await conn.query(
      `UPDATE order_items SET product_id = ?, product_name = ?, unit_price = ?, line_total = ?
       WHERE id = ?`,
      [pid, productName, unitPrice.toFixed(2), lineTotal.toFixed(2), iid]
    );

    const totals = {
      subtotal: newTotals.subtotal,
      taxAmount: newTotals.taxAmount,
      total: newTotals.total,
    };
    await conn.query(
      `UPDATE orders SET subtotal = ?, tax_amount = ?, total = ? WHERE id = ?`,
      [
        totals.subtotal.toFixed(2),
        totals.taxAmount.toFixed(2),
        totals.total.toFixed(2),
        oid,
      ]
    );
    await conn.commit();

    const newTotal = totals.total;

    const adjustment = {
      itemId: iid,
      priorTotal,
      newTotal,
      delta,
      paid,
      type: 'none',
    };

    if (paid && Math.abs(delta) >= 0.01) {
      if (delta < 0) {
        const refundAmount = Math.abs(delta);
        adjustment.type = 'refund';
        adjustment.refundAmount = refundAmount;

        if (!order.stripe_payment_intent_id) {
          await setItemRefundMeta(iid, { amount: refundAmount, status: 'failed' });
          const itemsWithRefund = await loadOrderItems(oid);
          return {
            ok: true,
            order: await loadUpdatedOrder(oid),
            items: itemsWithRefund,
            adjustment: {
              ...adjustment,
              refundIssued: false,
              refundStatus: 'failed',
              warning:
                'Order totals were updated, but no Stripe payment is on file — issue the refund manually.',
            },
            previousProductName: item.product_name,
            newProductName: productName,
          };
        }

        const stripe = getStripe();
        if (!stripe) {
          await setItemRefundMeta(iid, { amount: refundAmount, status: 'failed' });
          const itemsWithRefund = await loadOrderItems(oid);
          return {
            ok: true,
            order: await loadUpdatedOrder(oid),
            items: itemsWithRefund,
            adjustment: {
              ...adjustment,
              refundIssued: false,
              refundStatus: 'failed',
              warning:
                'Order totals were updated, but Stripe is not configured — issue the refund manually.',
            },
            previousProductName: item.product_name,
            newProductName: productName,
          };
        }

        await setItemRefundMeta(iid, { amount: refundAmount, status: 'pending' });

        try {
          const refund = await stripe.refunds.create({
            payment_intent: order.stripe_payment_intent_id,
            amount: Math.round(refundAmount * 100),
            metadata: {
              order_id: String(oid),
              order_number: order.order_number,
              order_item_id: String(iid),
              reason: 'line_item_product_change',
            },
          });

          await setItemRefundMeta(iid, {
            amount: refundAmount,
            status: 'issued',
            refundId: refund.id,
          });

          await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['refunded', oid]);

          let emailSent = false;
          let emailError = null;
          try {
            await sendOrderLineItemRefundEmail({
              to: order.customer_email,
              customerName: order.customer_name,
              orderNumber: order.order_number,
              refundAmount,
              priorTotal,
              newTotal,
              productName,
            });
            emailSent = true;
          } catch (e) {
            emailError = e.message || 'Failed to send refund email';
            console.error('[order-line-item] refund email failed:', emailError);
          }

          adjustment.refundIssued = true;
          adjustment.refundStatus = 'issued';
          adjustment.refundId = refund.id;
          adjustment.emailSent = emailSent;
          adjustment.emailError = emailError;
        } catch (e) {
          console.error('[order-line-item] Stripe refund failed:', e);
          await setItemRefundMeta(iid, { amount: refundAmount, status: 'failed' });
          adjustment.refundIssued = false;
          adjustment.refundStatus = 'failed';
          adjustment.warning = e.message || 'Stripe refund failed';
        }
      } else if (delta >= MIN_PAYMENT_LINK_USD) {
        await clearItemRefundMeta(iid);
        const note = `Additional amount due after your order ${order.order_number} was updated (product change on line item).`;
        const paymentResult = await createCustomPayment({
          orderId: oid,
          amount: delta,
          adminNote: note,
          sendEmail: true,
          paymentPurpose: 'order_line_adjustment',
        });

        if (!paymentResult.ok) {
          adjustment.type = 'payment_due';
          adjustment.amountDue = delta;
          adjustment.paymentCreated = false;
          adjustment.warning = paymentResult.error || 'Failed to create payment link';
        } else {
          adjustment.type = 'payment_due';
          adjustment.amountDue = delta;
          adjustment.paymentCreated = true;
          adjustment.paymentNumber = paymentResult.paymentNumber;
          adjustment.checkoutUrl = paymentResult.checkoutUrl;
          adjustment.emailSent = paymentResult.emailSent;
          adjustment.emailError = paymentResult.emailError ?? null;
        }
      } else {
        await clearItemRefundMeta(iid);
        adjustment.type = 'payment_due';
        adjustment.amountDue = delta;
        adjustment.paymentCreated = false;
        adjustment.warning = `Balance due is ${delta.toFixed(2)} — below the $${MIN_PAYMENT_LINK_USD.toFixed(2)} minimum for a Stripe payment link. Collect manually or adjust the order again.`;
      }
    } else {
      await clearItemRefundMeta(iid);
    }

    const finalItems = await loadOrderItems(oid);

    return {
      ok: true,
      order: await loadUpdatedOrder(oid),
      items: finalItems,
      adjustment,
      previousProductName: item.product_name,
      newProductName: productName,
    };
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    console.error('[order-line-item] change failed:', e);
    return { ok: false, status: 500, error: e.message || 'Failed to update line item' };
  } finally {
    conn.release();
  }
}
