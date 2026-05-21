export function orderNumber() {
  return `Q${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
}

/** Validates checkout payload and loads published products from the database. */
export async function buildCheckoutFromBody(conn, body) {
  const { customer, shipping, billing, items } = body ?? {};
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, status: 400, error: 'Cart is empty' };
  }
  if (!customer?.name || !customer?.email) {
    return { ok: false, status: 400, error: 'Customer name and email are required' };
  }
  if (
    !shipping?.address1 ||
    !shipping?.city ||
    !shipping?.state ||
    !shipping?.postalCode ||
    !shipping?.country
  ) {
    return { ok: false, status: 400, error: 'Complete shipping address is required' };
  }
  if (
    !billing?.name ||
    !billing?.address1 ||
    !billing?.city ||
    !billing?.state ||
    !billing?.postalCode ||
    !billing?.country
  ) {
    return { ok: false, status: 400, error: 'Complete billing address is required' };
  }

  const productIds = items.map((it) => Number(it.productId)).filter(Boolean);
  if (productIds.length === 0) {
    return { ok: false, status: 400, error: 'Invalid cart items' };
  }

  const [products] = await conn.query(
    `SELECT id, name, price FROM products WHERE is_published = 1 AND id IN (${productIds
      .map(() => '?')
      .join(',')})`,
    productIds
  );
  const productMap = new Map(products.map((p) => [p.id, p]));

  const normalizedItems = [];
  for (const raw of items) {
    const productId = Number(raw.productId);
    const quantity = Math.max(1, Math.min(99, Number(raw.quantity) || 1));
    const product = productMap.get(productId);
    if (!product) continue;
    normalizedItems.push({
      productId,
      productName: product.name,
      unitPrice: Number(product.price),
      quantity,
      lineTotal: Number(product.price) * quantity,
    });
  }
  if (normalizedItems.length === 0) {
    return { ok: false, status: 400, error: 'No purchasable products found in cart' };
  }

  const subtotal = normalizedItems.reduce((sum, it) => sum + it.lineTotal, 0);
  const shippingMethod = String(shipping?.method ?? 'standard');
  const shippingCostMap = { standard: 9.99, express: 19.99, pickup: 0 };
  const shippingCost = shippingCostMap[shippingMethod] ?? 9.99;
  const taxAmount = Number((subtotal * 0.0825).toFixed(2));
  const total = Number((subtotal + shippingCost + taxAmount).toFixed(2));

  return {
    ok: true,
    customer,
    shipping,
    billing,
    normalizedItems,
    subtotal,
    shippingMethod,
    shippingCost,
    taxAmount,
    total,
  };
}

export async function insertPendingOrder(conn, draft, { paymentMethod = 'stripe', cardLast4 = '----' }) {
  const ordNo = orderNumber();
  const { customer, shipping, billing, normalizedItems, subtotal, shippingMethod, shippingCost, taxAmount, total } =
    draft;

  const [orderInsert] = await conn.query(
    `INSERT INTO orders (
        order_number, status, customer_name, customer_email, customer_phone,
        shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
        shipping_method, shipping_cost,
        billing_name, billing_address1, billing_address2, billing_city, billing_state, billing_postal_code, billing_country,
        card_last4, subtotal, tax_amount, total, payment_method
      ) VALUES (?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ordNo,
      customer.name,
      customer.email,
      customer.phone ?? null,
      shipping.address1,
      shipping.address2 ?? null,
      shipping.city,
      shipping.state,
      shipping.postalCode,
      shipping.country,
      shippingMethod,
      shippingCost.toFixed(2),
      billing.name,
      billing.address1,
      billing.address2 ?? null,
      billing.city,
      billing.state,
      billing.postalCode,
      billing.country,
      cardLast4,
      subtotal.toFixed(2),
      taxAmount.toFixed(2),
      total.toFixed(2),
      paymentMethod,
    ]
  );
  const orderId = orderInsert.insertId;

  for (const item of normalizedItems) {
    await conn.query(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, item.productId, item.productName, item.unitPrice, item.quantity, item.lineTotal.toFixed(2)]
    );
  }

  return { orderId, orderNumber: ordNo };
}
