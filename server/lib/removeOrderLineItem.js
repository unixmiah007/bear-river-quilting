import pool from '../db.js';
import { loadOrderItems, loadUpdatedOrder, orderIsPaid } from './orderLineItemProduct.js';

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

export async function removeOrderLineItem({ orderId, itemId }) {
  const oid = Number(orderId);
  const iid = Number(itemId);
  if (!oid || !iid) {
    return { ok: false, status: 400, error: 'Invalid order or line item' };
  }

  const conn = await pool.getConnection();
  try {
    const [[order]] = await conn.query(
      `SELECT id, order_number, subtotal, tax_amount, total, shipping_cost, stripe_payment_intent_id, status
       FROM orders WHERE id = ?`,
      [oid]
    );
    if (!order) {
      return { ok: false, status: 404, error: 'Order not found' };
    }

    const [[item]] = await conn.query(
      'SELECT id, product_name FROM order_items WHERE id = ? AND order_id = ?',
      [iid, oid]
    );
    if (!item) {
      return { ok: false, status: 404, error: 'Line item not found on this order' };
    }

    const priorTotal = Number(order.total);

    await conn.beginTransaction();
    await snapshotAllOrderAdjustmentOriginals(conn, oid, order);
    await conn.query('DELETE FROM order_items WHERE id = ? AND order_id = ?', [iid, oid]);

    const [rows] = await conn.query(
      `SELECT COALESCE(SUM(line_total), 0) AS subtotal FROM order_items WHERE order_id = ?`,
      [oid]
    );
    const subtotal = Number(rows[0]?.subtotal) || 0;
    const { taxAmount, total } = computeOrderTotals(subtotal, order.shipping_cost);

    await conn.query(
      `UPDATE orders SET subtotal = ?, tax_amount = ?, total = ? WHERE id = ?`,
      [subtotal.toFixed(2), taxAmount.toFixed(2), total.toFixed(2), oid]
    );
    await conn.commit();

    const paid = orderIsPaid(order);
    const delta = Number((total - priorTotal).toFixed(2));
    let warning = null;
    if (paid && delta < -0.01) {
      warning = `Line item removed. Order total is now ${total.toFixed(2)} (${Math.abs(delta).toFixed(2)} less than before). Issue a refund in Stripe if needed.`;
    }

    return {
      ok: true,
      order: await loadUpdatedOrder(oid),
      items: await loadOrderItems(oid),
      removedProductName: item.product_name,
      priorTotal,
      newTotal: total,
      warning,
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
