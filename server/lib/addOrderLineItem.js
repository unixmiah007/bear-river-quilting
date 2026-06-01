import pool from '../db.js';
import { hydrateProductRow, resolveProductPrice } from './productSizePrices.js';
import { normalizeProductSize } from './productSize.js';
import { createCustomPayment } from './customOrderPayment.js';
import {
  orderIsPaid,
  loadOrderItems,
  loadUpdatedOrder,
} from './orderLineItemProduct.js';

const SIZE_LABELS = {
  small: 'Small',
  large: 'Large',
  'x-large': 'X-Large',
  'xx-large': 'XX-Large',
  'xxx-large': 'XXX-Large',
};

const MIN_PAYMENT_LINK_USD = 0.5;

function productNameWithSize(name, productSize) {
  if (!productSize) return name;
  const label = SIZE_LABELS[productSize] ?? productSize;
  return `${name} (${label})`;
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

async function snapshotAllOrderAdjustmentOriginals(conn, orderId, order) {
  await conn.query(
    `UPDATE order_items SET
       original_product_id = product_id,
       original_product_name = product_name,
       original_unit_price = unit_price,
       original_line_total = line_total
     WHERE order_id = ? AND original_product_id IS NULL`,
    [orderId]
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
  await conn.query('UPDATE orders SET order_adjusted_at = CURRENT_TIMESTAMP WHERE id = ?', [
    orderId,
  ]);
}

async function buildAddLineItemContext(conn, orderId, productId, quantity, productSize) {
  const oid = Number(orderId);
  const pid = Number(productId);
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));

  if (!oid || !pid) {
    return { ok: false, status: 400, error: 'Invalid order or product' };
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

  const [[productRow]] = await conn.query(
    'SELECT id, name, price, size_prices, product_size FROM products WHERE id = ?',
    [pid]
  );
  if (!productRow) {
    return { ok: false, status: 404, error: 'Product not found' };
  }

  const product = hydrateProductRow(productRow);
  const size =
    normalizeProductSize(productSize) ||
    normalizeProductSize(product.product_size) ||
    'small';
  const unitPrice = resolveProductPrice(product, size);
  const lineTotal = Number((unitPrice * qty).toFixed(2));
  const productName = productNameWithSize(product.name, size);

  const [existingItems] = await conn.query(
    `SELECT COALESCE(SUM(line_total), 0) AS subtotal FROM order_items WHERE order_id = ?`,
    [oid]
  );
  const priorSubtotal = Number(existingItems[0]?.subtotal) || 0;
  const newSubtotal = Number((priorSubtotal + lineTotal).toFixed(2));
  const newTotals = computeOrderTotals(newSubtotal, order.shipping_cost);
  const priorTotal = Number(order.total);
  const delta = Number((newTotals.total - priorTotal).toFixed(2));
  const paid = orderIsPaid(order);

  return {
    ok: true,
    oid,
    pid,
    qty,
    size,
    order,
    productName,
    unitPrice,
    lineTotal,
    priorTotal,
    newTotals,
    delta,
    paid,
  };
}

async function applyBalanceDueAdjustment(order, oid, delta, productName, adjustment) {
  if (!adjustment.paid || Math.abs(delta) < 0.01) {
    adjustment.type = 'none';
    return;
  }

  if (delta < 0) {
    adjustment.type = 'none';
    adjustment.warning =
      'Order total decreased unexpectedly when adding a product. Review totals manually.';
    return;
  }

  if (delta >= MIN_PAYMENT_LINK_USD) {
    const note = `Additional amount due: product added to order ${order.order_number} — ${productName}.`;
    const paymentResult = await createCustomPayment({
      orderId: oid,
      amount: delta,
      adminNote: note,
      sendEmail: true,
      paymentPurpose: 'order_line_adjustment',
    });

    adjustment.type = 'payment_due';
    adjustment.amountDue = delta;

    if (!paymentResult.ok) {
      adjustment.paymentCreated = false;
      adjustment.warning = paymentResult.error || 'Failed to create payment link';
    } else {
      adjustment.paymentCreated = true;
      adjustment.paymentNumber = paymentResult.paymentNumber;
      adjustment.checkoutUrl = paymentResult.checkoutUrl;
      adjustment.emailSent = paymentResult.emailSent;
      adjustment.emailError = paymentResult.emailError ?? null;
    }
    return;
  }

  adjustment.type = 'payment_due';
  adjustment.amountDue = delta;
  adjustment.paymentCreated = false;
  adjustment.warning = `Balance due is ${delta.toFixed(2)} — below the $${MIN_PAYMENT_LINK_USD.toFixed(2)} minimum for a Stripe payment link. Collect manually.`;
}

export async function previewAddOrderLineItem({ orderId, productId, quantity = 1, productSize }) {
  const conn = await pool.getConnection();
  try {
    const built = await buildAddLineItemContext(conn, orderId, productId, quantity, productSize);
    if (!built.ok) return built;

    const { paid, delta, priorTotal, newTotals, productName, unitPrice, lineTotal, qty, pid } =
      built;
    const amountDue = paid && delta > 0 ? delta : 0;

    return {
      ok: true,
      requiresPaymentConfirmation: paid && amountDue >= MIN_PAYMENT_LINK_USD,
      preview: {
        productId: pid,
        productName,
        quantity: qty,
        unitPrice,
        lineTotal,
        priorTotal,
        newTotal: newTotals.total,
        newSubtotal: newTotals.subtotal,
        newTaxAmount: newTotals.taxAmount,
        delta,
        amountDue,
        paid,
      },
    };
  } finally {
    conn.release();
  }
}

export async function addOrderLineItem({ orderId, productId, quantity = 1, productSize }) {
  const conn = await pool.getConnection();
  try {
    const built = await buildAddLineItemContext(conn, orderId, productId, quantity, productSize);
    if (!built.ok) return built;

    const {
      oid,
      pid,
      qty,
      order,
      productName,
      unitPrice,
      lineTotal,
      priorTotal,
      newTotals,
      delta,
      paid,
    } = built;

    await conn.beginTransaction();
    await snapshotAllOrderAdjustmentOriginals(conn, oid, order);

    await conn.query(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [oid, pid, productName, unitPrice.toFixed(2), qty, lineTotal.toFixed(2)]
    );

    await conn.query(
      `UPDATE orders SET subtotal = ?, tax_amount = ?, total = ? WHERE id = ?`,
      [
        newTotals.subtotal.toFixed(2),
        newTotals.taxAmount.toFixed(2),
        newTotals.total.toFixed(2),
        oid,
      ]
    );
    await conn.commit();

    const adjustment = {
      priorTotal,
      newTotal: newTotals.total,
      delta,
      paid,
      type: 'none',
      addedProductName: productName,
      addedQuantity: qty,
      addedLineTotal: lineTotal,
    };

    await applyBalanceDueAdjustment(order, oid, delta, productName, adjustment);

    const finalItems = await loadOrderItems(oid);

    return {
      ok: true,
      order: await loadUpdatedOrder(oid),
      items: finalItems,
      adjustment,
      addedProductName: productName,
    };
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    console.error('[order-line-item] add failed:', e);
    return { ok: false, status: 500, error: e.message || 'Failed to add line item' };
  } finally {
    conn.release();
  }
}
