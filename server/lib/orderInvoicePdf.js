import PDFDocument from 'pdfkit';
import { BRAND_LOGO_PATH, brandLogoExists } from './brandLogoPath.js';

function money(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(n) || 0
  );
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(d ?? '');
  }
}

function addressLines(name, line1, line2, city, state, postal, country) {
  const lines = [name, line1, line2, [city, state, postal].filter(Boolean).join(', '), country].filter(
    (l) => l != null && String(l).trim() !== ''
  );
  return lines;
}

function writeSection(doc, title, lines, { x = 50, width = 500 } = {}) {
  doc.font('Helvetica-Bold').fontSize(11).text(title, x, doc.y, { width });
  doc.moveDown(0.35);
  doc.font('Helvetica').fontSize(10);
  for (const line of lines) {
    doc.text(line, x, doc.y, { width });
    doc.moveDown(0.15);
  }
  doc.moveDown(0.5);
}

function shippingMethodLabel(method) {
  const m = String(method ?? 'standard').toLowerCase();
  if (m === 'express') return 'Express shipping';
  if (m === 'pickup') return 'Local pickup';
  return 'Standard shipping';
}

/** Builds a PDF invoice buffer for an order and its line items. */
export function buildOrderInvoicePdf(order, items) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const marginLeft = doc.page.margins.left;

    const logoHeight = 56;
    const headerTop = doc.y;
    if (brandLogoExists()) {
      doc.image(BRAND_LOGO_PATH, marginLeft, headerTop, { height: logoHeight });
      doc.y = headerTop + logoHeight + 10;
    } else {
      doc.font('Helvetica-Bold').fontSize(20).text('Bear River Quilting', { align: 'left' });
      doc.moveDown(0.35);
    }

    doc.font('Helvetica').fontSize(11).fillColor('#444444').text('Invoice', { align: 'left' });
    doc.fillColor('#000000');
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(12).text(`Order ${order.order_number}`);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Status: ${String(order.status ?? '').toUpperCase()}`);
    doc.text(`Date: ${formatDate(order.created_at)}`);
    doc.moveDown(0.75);

    writeSection(doc, 'Customer', [
      order.customer_name,
      order.customer_email,
      order.customer_phone ? `Phone: ${order.customer_phone}` : null,
    ].filter(Boolean));

    writeSection(
      doc,
      'Ship to',
      addressLines(
        order.customer_name,
        order.shipping_address1,
        order.shipping_address2,
        order.shipping_city,
        order.shipping_state,
        order.shipping_postal_code,
        order.shipping_country
      )
    );

    writeSection(
      doc,
      'Payment & billing',
      [
        order.billing_name,
        ...addressLines(
          null,
          order.billing_address1,
          order.billing_address2,
          order.billing_city,
          order.billing_state,
          order.billing_postal_code,
          order.billing_country
        ),
        `Card: •••• ${order.card_last4}`,
        `Shipping method: ${shippingMethodLabel(order.shipping_method)} (${money(order.shipping_cost)})`,
      ].filter(Boolean)
    );

    doc.font('Helvetica-Bold').fontSize(11).text('Order items');
    doc.moveDown(0.4);

    const tableTop = doc.y;
    const colItem = 50;
    const colQty = 320;
    const colUnit = 370;
    const colLine = 460;

    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Item', colItem, tableTop);
    doc.text('Qty', colQty, tableTop, { width: 40, align: 'right' });
    doc.text('Unit', colUnit, tableTop, { width: 80, align: 'right' });
    doc.text('Line', colLine, tableTop, { width: 80, align: 'right' });
    doc.moveDown(0.35);
    doc
      .strokeColor('#cccccc')
      .moveTo(colItem, doc.y)
      .lineTo(colItem + pageWidth, doc.y)
      .stroke();
    doc.moveDown(0.35);

    doc.font('Helvetica').fontSize(9);
    for (const it of items) {
      if (doc.y > doc.page.height - 120) {
        doc.addPage();
      }
      const rowY = doc.y;
      doc.text(String(it.product_name ?? 'Item'), colItem, rowY, { width: 250 });
      doc.text(String(it.quantity ?? 0), colQty, rowY, { width: 40, align: 'right' });
      doc.text(money(it.unit_price), colUnit, rowY, { width: 80, align: 'right' });
      doc.text(money(it.line_total), colLine, rowY, { width: 80, align: 'right' });
      doc.y = rowY + 14;
      doc.moveDown(0.25);
    }

    doc.moveDown(0.5);
    const totalsX = 360;
    doc.font('Helvetica').fontSize(10);
    doc.text(`Subtotal: ${money(order.subtotal)}`, totalsX, doc.y, { width: 180, align: 'right' });
    doc.text(`Tax: ${money(order.tax_amount)}`, totalsX, doc.y, { width: 180, align: 'right' });
    doc.text(`Shipping: ${money(order.shipping_cost)}`, totalsX, doc.y, { width: 180, align: 'right' });
    doc.moveDown(0.25);
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`Total: ${money(order.total)}`, totalsX, doc.y, { width: 180, align: 'right' });

    if (order.tracking_number) {
      doc.moveDown(1);
      doc.font('Helvetica').fontSize(9).fillColor('#444444');
      doc.text(
        `Tracking: ${order.tracking_carrier ? `${order.tracking_carrier} · ` : ''}${order.tracking_number}`,
        50,
        doc.y,
        { width: pageWidth }
      );
    }

    doc.end();
  });
}

export function invoicePdfFilename(orderNumber) {
  const safe = String(orderNumber ?? 'order')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `invoice-${safe || 'order'}.pdf`;
}
