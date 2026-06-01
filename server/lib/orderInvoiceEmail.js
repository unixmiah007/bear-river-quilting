import { buildOrderInvoicePdf, invoicePdfFilename } from './orderInvoicePdf.js';
import { sendOrderInvoiceEmail } from './mail.js';

const ORDER_INVOICE_SELECT = `SELECT id, order_number, status, customer_name, customer_email, customer_phone,
              shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
              shipping_method, shipping_cost,
              billing_name, billing_address1, billing_address2, billing_city, billing_state, billing_postal_code, billing_country,
              card_last4, subtotal, tax_amount, total, created_at,
              original_subtotal, original_tax_amount, original_total, order_adjusted_at,
              tracking_carrier, tracking_number, invoice_emailed_at
       FROM orders WHERE id = ?`;

const ORDER_INVOICE_ITEMS_SELECT = `SELECT product_id, product_name, unit_price, quantity, line_total,
              line_refund_amount, line_refund_status, line_refund_at, stripe_refund_id,
              original_product_id, original_product_name, original_unit_price, original_line_total
       FROM order_items WHERE order_id = ? ORDER BY id ASC`;

export async function loadOrderInvoiceContext(pool, orderId) {
  const id = Number(orderId);
  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, status: 400, error: 'Invalid order id' };
  }
  const [[order]] = await pool.query(ORDER_INVOICE_SELECT, [id]);
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }
  const [items] = await pool.query(ORDER_INVOICE_ITEMS_SELECT, [id]);

  let customPayments = [];
  try {
    const [payments] = await pool.query(
      `SELECT payment_number, amount, status, admin_note, email_sent_at, paid_at, created_at
       FROM order_custom_payments
       WHERE order_id = ?
       ORDER BY created_at ASC`,
      [id]
    );
    customPayments = payments;
  } catch (e) {
    if (e.code !== 'ER_NO_SUCH_TABLE') throw e;
  }

  return {
    ok: true,
    order,
    items: Array.isArray(items) ? items : [],
    customPayments,
  };
}

export async function emailCustomerOrderInvoice(pool, orderId) {
  const ctx = await loadOrderInvoiceContext(pool, orderId);
  if (!ctx.ok) return ctx;

  const { order, items, customPayments } = ctx;
  const pdf = await buildOrderInvoicePdf(order, items, { customPayments });
  const filename = invoicePdfFilename(order.order_number);

  await sendOrderInvoiceEmail({
    to: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    total: order.total,
    pdfBuffer: pdf,
    filename,
  });

  await pool.query('UPDATE orders SET invoice_emailed_at = CURRENT_TIMESTAMP WHERE id = ?', [order.id]);

  const [[updated]] = await pool.query(
    'SELECT invoice_emailed_at FROM orders WHERE id = ?',
    [order.id]
  );

  return {
    ok: true,
    invoiceEmailedAt: updated?.invoice_emailed_at ?? new Date().toISOString(),
  };
}
