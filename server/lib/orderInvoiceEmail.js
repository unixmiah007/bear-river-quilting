import { buildOrderInvoicePdf, invoicePdfFilename } from './orderInvoicePdf.js';
import { sendOrderInvoiceEmail } from './mail.js';

const ORDER_INVOICE_SELECT = `SELECT id, order_number, status, customer_name, customer_email, customer_phone,
              shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
              shipping_method, shipping_cost,
              billing_name, billing_address1, billing_address2, billing_city, billing_state, billing_postal_code, billing_country,
              card_last4, subtotal, tax_amount, total, created_at,
              tracking_carrier, tracking_number, invoice_emailed_at
       FROM orders WHERE id = ?`;

export async function loadOrderInvoiceContext(pool, orderId) {
  const id = Number(orderId);
  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, status: 400, error: 'Invalid order id' };
  }
  const [[order]] = await pool.query(ORDER_INVOICE_SELECT, [id]);
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }
  const [items] = await pool.query(
    `SELECT product_name, unit_price, quantity, line_total
     FROM order_items WHERE order_id = ? ORDER BY id ASC`,
    [id]
  );
  return { ok: true, order, items: Array.isArray(items) ? items : [] };
}

export async function emailCustomerOrderInvoice(pool, orderId) {
  const ctx = await loadOrderInvoiceContext(pool, orderId);
  if (!ctx.ok) return ctx;

  const { order, items } = ctx;
  const pdf = await buildOrderInvoicePdf(order, items);
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
