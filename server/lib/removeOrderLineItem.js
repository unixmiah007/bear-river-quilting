import pool from '../db.js';
import {
  loadOrderItems,
  loadUpdatedOrder,
  orderIsPaid,
} from './orderLineItemProduct.js';
import {
  createOrderRefund,
  issueStripeRefundForOrder,
  listOrderRefunds,
} from './orderRefunds.js';

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

async function buildRemoveLineItemContext(conn, orderId, itemId) {
  const oid = Number(orderId);
  const iid = Number(itemId);
  if (!oid || !iid) {
    return { ok: false, status: 400, error: 'Invalid order or line item' };
  }

  const [[order]] = await conn.query(
    `SELECT id, order_number, status, customer_name, customer_email, subtotal, tax_amount, total, shipping_cost,
            stripe_payment_intent_id
     FROM orders WHERE id = ?`,
    [oid]
  );
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  const [[item]] = await conn.query(
    'SELECT id, product_name, line_total FROM order_items WHERE id = ? AND order_id = ?',
    [iid, oid]
  );
  if (!item) {
    return { ok: false, status: 404, error: 'Line item not found' };
  }

  const [rows] = await conn.query(
    `SELECT COALESCE(SUM(line_total), 0) AS subtotal FROM order_items WHERE order_id = ? AND id != ?`,
    [oid, iid]
  );
  const subtotal = Number(rows[0]?.subtotal) || 0;
  const newTotals = computeOrderTotals(subtotal, order.shipping_cost);
  const priorTotal = Number(order.total);
  const delta = Number((newTotals.total - priorTotal).toFixed(2));
  const paid = orderIsPaid(order);
  const refundAmount = paid && delta < -0.01 ? Math.abs(delta) : 0;

  return {
    ok: true,
    oid,
    iid,
    order,
    item,
    priorTotal,
    newTotals,
    delta,
    paid,
    refundAmount,
  };
}

export async function previewRemoveOrderLineItem({ orderId, itemId }) {
  const conn = await pool.getConnection();
  try {
    const built = await buildRemoveLineItemContext(conn, orderId, itemId);
    if (!built.ok) return built;

    return {
      ok: true,
      requiresRefundConfirmation: built.refundAmount >= 0.01,
      preview: {
        itemId: built.iid,
        productName: built.item.product_name,
        priorTotal: built.priorTotal,
        newTotal: built.newTotals.total,
        delta: built.delta,
        refundAmount: built.refundAmount,
        paid: built.paid,
      },
    };
  } finally {
    conn.release();
  }
}

async function applyRemoveRefund({ order, oid, refundAmount, productName, skipAutoRefund }) {
  const adjustment = {
    type: 'refund',
    refundAmount,
    paid: true,
    priorTotal: Number(order.total),
    delta: -refundAmount,
  };

  if (skipAutoRefund) {
    await createOrderRefund({
      orderId: oid,
      amount: refundAmount,
      reason: 'line_item_removed',
      label: productName,
      status: 'pending',
    });
    adjustment.refundStatus = 'pending';
    adjustment.manualRequired = true;
    adjustment.warning = `Refund of $${refundAmount.toFixed(2)} is due after removing ${productName}. Issue it in Stripe, then mark it processed in order history.`;
    return adjustment;
  }

  const stripeResult = await issueStripeRefundForOrder({
    order,
    amount: refundAmount,
    metadata: {
      order_id: String(oid),
      order_number: order.order_number,
      reason: 'line_item_removed',
    },
  });

  if (!stripeResult.ok) {
    await createOrderRefund({
      orderId: oid,
      amount: refundAmount,
      reason: 'line_item_removed',
      label: productName,
      status: 'pending',
    });
    adjustment.refundStatus = 'pending';
    adjustment.manualRequired = true;
    adjustment.warning = `${stripeResult.error} Mark the refund processed in order history after issuing it in Stripe.`;
    return adjustment;
  }

  await createOrderRefund({
    orderId: oid,
    amount: refundAmount,
    reason: 'line_item_removed',
    label: productName,
    status: 'issued',
    stripeRefundId: stripeResult.refundId,
  });
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['refunded', oid]);
  adjustment.refundIssued = true;
  adjustment.refundStatus = 'issued';
  adjustment.refundId = stripeResult.refundId;
  return adjustment;
}

export async function removeOrderLineItem({ orderId, itemId, skipAutoRefund = false }) {
  const oid = Number(orderId);
  const iid = Number(itemId);
  if (!oid || !iid) {
    return { ok: false, status: 400, error: 'Invalid order or line item' };
  }

  const conn = await pool.getConnection();
  try {
    const built = await buildRemoveLineItemContext(conn, orderId, itemId);
    if (!built.ok) return built;

    const { order, item, priorTotal, newTotals, delta, paid, refundAmount } = built;

    await conn.beginTransaction();
    await snapshotAllOrderAdjustmentOriginals(conn, oid, order);
    await conn.query('DELETE FROM order_items WHERE id = ? AND order_id = ?', [iid, oid]);
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

    let adjustment = null;
    if (refundAmount >= 0.01) {
      adjustment = await applyRemoveRefund({
        order,
        oid,
        refundAmount,
        productName: item.product_name,
        skipAutoRefund,
      });
      adjustment.newTotal = newTotals.total;
      adjustment.priorTotal = priorTotal;
    }

    return {
      ok: true,
      order: await loadUpdatedOrder(oid),
      items: await loadOrderItems(oid),
      orderRefunds: await listOrderRefunds(oid),
      removedProductName: item.product_name,
      priorTotal,
      newTotal: newTotals.total,
      adjustment,
      warning: adjustment?.warning ?? null,
    };
  } catch (e) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    console.error('[order-line-item] remove failed:', e);
    return { ok: false, status: 500, error: e.message || 'Failed to remove line item' };
  } finally {
    conn.release();
  }
}

export async function deleteAdminOrder(orderId) {
  const id = Number(orderId);
  if (!id) {
    return { ok: false, status: 400, error: 'Invalid order id' };
  }

  const [[order]] = await pool.query(
    'SELECT id, order_number FROM orders WHERE id = ?',
    [id]
  );
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  return { ok: true, orderNumber: order.order_number };
}
