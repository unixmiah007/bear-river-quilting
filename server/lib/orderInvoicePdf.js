import PDFDocument from 'pdfkit';
import { BRAND_LOGO_PATH, brandLogoExists } from './brandLogoPath.js';
import { labelForOrderStatus } from './orderStatuses.js';

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

function issuedRefundTotal(items) {
  return (items || []).reduce((sum, it) => {
    if (it.line_refund_status === 'issued' && it.line_refund_amount != null) {
      return sum + Number(it.line_refund_amount);
    }
    return sum;
  }, 0);
}

function orderWasAdjusted(order, items) {
  if (
    order?.original_total != null &&
    Math.abs(Number(order.original_total) - Number(order.total)) >= 0.01
  ) {
    return true;
  }
  return (items || []).some((it) => it.original_product_name != null);
}

function lineItemSnapshot(it, useOriginal) {
  if (useOriginal && it.original_product_name) {
    return {
      name: it.original_product_name,
      unit: it.original_unit_price,
      line: it.original_line_total,
      qty: it.quantity,
    };
  }
  return {
    name: it.product_name,
    unit: it.unit_price,
    line: it.line_total,
    qty: it.quantity,
  };
}

function refundNoteForItem(it) {
  const amount = it.line_refund_amount != null ? Number(it.line_refund_amount) : null;
  const status = it.line_refund_status;
  if (amount == null || !status) return null;
  if (status === 'issued') {
    const when = it.line_refund_at ? formatDate(it.line_refund_at) : null;
    return `Refund issued: ${money(amount)}${when ? ` (${when})` : ''}`;
  }
  if (status === 'pending') {
    return `Refund processing: ${money(amount)}`;
  }
  if (status === 'failed') {
    return `Refund pending review: ${money(amount)}`;
  }
  return null;
}

function paymentStatusLabel(status) {
  const s = String(status ?? '').toLowerCase();
  if (s === 'paid' || s === 'complete') return 'Paid';
  if (s === 'pending') return 'Pending';
  if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
  return status || '—';
}

function ensureSpace(doc, needed = 80) {
  if (doc.y > doc.page.height - doc.page.margins.bottom - needed) {
    doc.addPage();
  }
}

function writeLineItemsTable(doc, { title, items, useOriginal = false, pageWidth }) {
  ensureSpace(doc, 100);
  doc.font('Helvetica-Bold').fontSize(11).text(title);
  doc.moveDown(0.4);

  const colItem = 50;
  const colQty = 300;
  const colUnit = 355;
  const colLine = 445;

  const tableTop = doc.y;
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Product', colItem, tableTop);
  doc.text('Qty', colQty, tableTop, { width: 40, align: 'right' });
  doc.text('Unit price', colUnit, tableTop, { width: 80, align: 'right' });
  doc.text('Line total', colLine, tableTop, { width: 80, align: 'right' });
  doc.moveDown(0.35);
  doc
    .strokeColor('#cccccc')
    .moveTo(colItem, doc.y)
    .lineTo(colItem + pageWidth, doc.y)
    .stroke();
  doc.moveDown(0.35);

  doc.font('Helvetica').fontSize(9);
  for (const it of items) {
    ensureSpace(doc, 50);
    const snap = lineItemSnapshot(it, useOriginal);
    const rowY = doc.y;
    doc.text(String(snap.name ?? 'Item'), colItem, rowY, { width: 235 });
    doc.text(String(snap.qty ?? 0), colQty, rowY, { width: 40, align: 'right' });
    doc.text(money(snap.unit), colUnit, rowY, { width: 80, align: 'right' });
    doc.text(money(snap.line), colLine, rowY, { width: 80, align: 'right' });
    let nextY = rowY + 14;
    const refundNote = !useOriginal ? refundNoteForItem(it) : null;
    if (refundNote) {
      doc.font('Helvetica').fontSize(8).fillColor('#065f46');
      doc.text(refundNote, colItem, nextY, { width: pageWidth - 10 });
      doc.fillColor('#000000');
      nextY = doc.y + 2;
    }
    doc.y = nextY;
    doc.moveDown(0.2);
  }
  doc.moveDown(0.35);
}

function writeOrderTotalsBlock(doc, order, { label, subtotal, tax, shipping, total, totalsX }) {
  const prefix = label ? `${label} — ` : '';
  doc.font('Helvetica').fontSize(10);
  doc.text(`${prefix}Subtotal: ${money(subtotal)}`, totalsX, doc.y, { width: 180, align: 'right' });
  doc.text(`${prefix}Tax: ${money(tax)}`, totalsX, doc.y, { width: 180, align: 'right' });
  doc.text(`${prefix}Shipping: ${money(shipping)}`, totalsX, doc.y, { width: 180, align: 'right' });
  doc.moveDown(0.2);
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(`${prefix}Total: ${money(total)}`, totalsX, doc.y, { width: 180, align: 'right' });
  doc.font('Helvetica');
  doc.moveDown(0.5);
}

/** Builds a PDF invoice buffer for an order and its line items. */
export function buildOrderInvoicePdf(order, items, { customPayments = [] } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const marginLeft = doc.page.margins.left;
    const totalsX = 360;
    const adjusted = orderWasAdjusted(order, items);
    const refundTotal = issuedRefundTotal(items);
    const payments = Array.isArray(customPayments) ? customPayments : [];
    const hasHistory = adjusted || refundTotal >= 0.01 || payments.length > 0;

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
    doc.text(`Status: ${labelForOrderStatus(order.status)}`);
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

    const currentTitle = adjusted ? 'Items purchased (current)' : 'Items purchased';
    writeLineItemsTable(doc, {
      title: currentTitle,
      items,
      useOriginal: false,
      pageWidth,
    });

    writeOrderTotalsBlock(doc, order, {
      label: adjusted ? 'Current' : null,
      subtotal: order.subtotal,
      tax: order.tax_amount,
      shipping: order.shipping_cost,
      total: order.total,
      totalsX,
    });

    if (hasHistory) {
      ensureSpace(doc, 120);
      doc.font('Helvetica-Bold').fontSize(11).text('Order history');
      doc.moveDown(0.35);
      doc.font('Helvetica').fontSize(9).fillColor('#444444');

      if (order.order_adjusted_at) {
        doc.text(`Last updated: ${formatDate(order.order_adjusted_at)}`, 50, doc.y, {
          width: pageWidth,
        });
        doc.moveDown(0.35);
      }

      if (adjusted && order.original_total != null) {
        doc.fillColor('#000000');
        writeLineItemsTable(doc, {
          title: 'Original purchase (at checkout)',
          items,
          useOriginal: true,
          pageWidth,
        });
        writeOrderTotalsBlock(doc, order, {
          label: 'Original',
          subtotal: order.original_subtotal,
          tax: order.original_tax_amount,
          shipping: order.shipping_cost,
          total: order.original_total,
          totalsX,
        });
      }

      if (refundTotal >= 0.01) {
        ensureSpace(doc, 40);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#065f46');
        doc.text(`Refunded to card: ${money(refundTotal)}`, 50, doc.y, { width: pageWidth });
        doc.fillColor('#000000');
        doc.moveDown(0.5);
      }

      if (payments.length > 0) {
        ensureSpace(doc, 60);
        doc.font('Helvetica-Bold').fontSize(10).text('Payment links sent');
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(9);
        for (const p of payments) {
          ensureSpace(doc, 36);
          const parts = [
            `${p.payment_number}: ${money(p.amount)} — ${paymentStatusLabel(p.status)}`,
          ];
          if (p.email_sent_at) {
            parts.push(`emailed ${formatDate(p.email_sent_at)}`);
          } else if (p.created_at) {
            parts.push(`created ${formatDate(p.created_at)}`);
          }
          if (p.paid_at) {
            parts.push(`paid ${formatDate(p.paid_at)}`);
          }
          doc.text(parts.join(' · '), 50, doc.y, { width: pageWidth });
          if (p.admin_note) {
            doc.font('Helvetica-Oblique').text(`Note: ${p.admin_note}`, 50, doc.y, {
              width: pageWidth,
            });
            doc.font('Helvetica');
          }
          doc.moveDown(0.25);
        }
        doc.moveDown(0.25);
      }
    }

    if (order.tracking_number) {
      ensureSpace(doc, 40);
      doc.font('Helvetica').fontSize(9).fillColor('#444444');
      doc.text(
        `Tracking: ${order.tracking_carrier ? `${order.tracking_carrier} · ` : ''}${order.tracking_number}`,
        50,
        doc.y,
        { width: pageWidth }
      );
      doc.fillColor('#000000');
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
