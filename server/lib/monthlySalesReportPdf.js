import PDFDocument from 'pdfkit';
import { BRAND_LOGO_PATH, brandLogoExists } from './brandLogoPath.js';

function money(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(n) || 0
  );
}

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-US', { dateStyle: 'medium' });
  } catch {
    return String(d ?? '');
  }
}

function ensureSpace(doc, needed = 60) {
  if (doc.y > doc.page.height - doc.page.margins.bottom - needed) {
    doc.addPage();
  }
}

export function buildMonthlySalesReportPdf({
  monthLabel,
  generatedAt,
  monthTotals,
  monthOrders,
  monthlyBreakdown,
  refunds = [],
  statusBreakdown = [],
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;

    if (brandLogoExists()) {
      doc.image(BRAND_LOGO_PATH, left, doc.y, { height: 52 });
      doc.y += 60;
    }

    doc.font('Helvetica-Bold').fontSize(18).text('Monthly Sales Report');
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(10).fillColor('#4b5563');
    doc.text(`Reporting month: ${monthLabel}`);
    doc.text(`Generated: ${new Date(generatedAt).toLocaleString('en-US')}`);
    doc.fillColor('#000000');
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').fontSize(11).text('Month totals');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Orders: ${Number(monthTotals.orderCount) || 0}`);
    doc.text(`Subtotal: ${money(monthTotals.subtotal)}`);
    doc.text(`Tax: ${money(monthTotals.tax)}`);
    doc.text(`Shipping: ${money(monthTotals.shipping)}`);
    doc.font('Helvetica-Bold').text(`Total sales: ${money(monthTotals.total)}`);
    doc.font('Helvetica');
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').fontSize(11).text('Orders in selected month (all statuses)');
    doc.moveDown(0.3);
    if (!monthOrders.length) {
      doc.font('Helvetica').fontSize(10).text('No orders found for this month.');
      doc.moveDown(0.8);
    } else {
      const colOrder = left;
      const colDate = 130;
      const colCustomer = 220;
      const colStatus = 420;
      const colTotal = 495;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('Order #', colOrder, doc.y);
      doc.text('Date', colDate, doc.y);
      doc.text('Customer', colCustomer, doc.y);
      doc.text('Status', colStatus, doc.y, { width: 70 });
      doc.text('Total', colTotal, doc.y, { width: 70, align: 'right' });
      doc.moveDown(0.35);
      doc
        .strokeColor('#d1d5db')
        .moveTo(left, doc.y)
        .lineTo(left + pageWidth, doc.y)
        .stroke();
      doc.moveDown(0.35);
      doc.font('Helvetica').fontSize(9);

      for (const order of monthOrders) {
        ensureSpace(doc, 28);
        const y = doc.y;
        doc.text(String(order.order_number ?? ''), colOrder, y, { width: 95 });
        doc.text(fmtDate(order.created_at), colDate, y, { width: 100 });
        doc.text(String(order.customer_name ?? '—'), colCustomer, y, { width: 190 });
        doc.text(String(order.status ?? '—'), colStatus, y, { width: 70 });
        doc.text(money(order.total), colTotal, y, { width: 70, align: 'right' });
        doc.y = Math.max(doc.y, y + 14);
      }
      doc.moveDown(0.9);
    }

    ensureSpace(doc, 100);
    doc.font('Helvetica-Bold').fontSize(11).text('Order status totals');
    doc.moveDown(0.3);
    if (!statusBreakdown.length) {
      doc.font('Helvetica').fontSize(9).text('No status totals for this month.');
      doc.moveDown(0.7);
    } else {
      const colStatusName = left;
      const colStatusCount = 300;
      const colStatusTotal = 430;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('Status', colStatusName, doc.y);
      doc.text('Orders', colStatusCount, doc.y, { width: 90, align: 'right' });
      doc.text('Sales total', colStatusTotal, doc.y, { width: 110, align: 'right' });
      doc.moveDown(0.35);
      doc.font('Helvetica').fontSize(9);
      for (const row of statusBreakdown) {
        ensureSpace(doc, 20);
        const y = doc.y;
        doc.text(String(row.status ?? '—'), colStatusName, y, { width: 220 });
        doc.text(String(Number(row.orderCount) || 0), colStatusCount, y, {
          width: 90,
          align: 'right',
        });
        doc.text(money(row.total), colStatusTotal, y, { width: 110, align: 'right' });
        doc.y = Math.max(doc.y, y + 13);
      }
      doc.moveDown(0.8);
    }

    ensureSpace(doc, 140);
    doc.font('Helvetica-Bold').fontSize(11).text('Refunds');
    doc.moveDown(0.3);
    if (!refunds.length) {
      doc.font('Helvetica').fontSize(9).text('No refunds recorded for this month.');
      doc.moveDown(0.7);
    } else {
      const colRefundDate = left;
      const colRefundType = 120;
      const colRefundStatus = 220;
      const colRefundAmount = 300;
      const colRefundRef = 390;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('Date', colRefundDate, doc.y, { width: 90 });
      doc.text('Type', colRefundType, doc.y, { width: 90 });
      doc.text('Status', colRefundStatus, doc.y, { width: 70 });
      doc.text('Amount', colRefundAmount, doc.y, { width: 80, align: 'right' });
      doc.text('Reference', colRefundRef, doc.y, { width: 160 });
      doc.moveDown(0.35);
      doc.font('Helvetica').fontSize(9);
      for (const row of refunds) {
        ensureSpace(doc, 22);
        const y = doc.y;
        doc.text(fmtDate(row.createdAt), colRefundDate, y, { width: 90 });
        doc.text(String(row.type ?? 'Refund'), colRefundType, y, { width: 90 });
        doc.text(String(row.status ?? 'pending'), colRefundStatus, y, { width: 70 });
        doc.text(money(row.amount), colRefundAmount, y, { width: 80, align: 'right' });
        doc.text(String(row.reference ?? '—'), colRefundRef, y, { width: 160 });
        doc.y = Math.max(doc.y, y + 13);
      }
      doc.moveDown(0.8);
    }

    ensureSpace(doc, 120);
    doc.font('Helvetica-Bold').fontSize(11).text('Monthly breakdown (all months)');
    doc.moveDown(0.3);
    const colMonth = left;
    const colCount = 210;
    const colRevenue = 350;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Month', colMonth, doc.y);
    doc.text('Orders', colCount, doc.y, { width: 90, align: 'right' });
    doc.text('Total sales', colRevenue, doc.y, { width: 190, align: 'right' });
    doc.moveDown(0.35);
    doc
      .strokeColor('#d1d5db')
      .moveTo(left, doc.y)
      .lineTo(left + pageWidth, doc.y)
      .stroke();
    doc.moveDown(0.35);
    doc.font('Helvetica').fontSize(9);

    for (const row of monthlyBreakdown) {
      ensureSpace(doc, 20);
      const y = doc.y;
      doc.text(String(row.monthLabel ?? ''), colMonth, y, { width: 170 });
      doc.text(String(Number(row.orderCount) || 0), colCount, y, { width: 90, align: 'right' });
      doc.text(money(row.total), colRevenue, y, { width: 190, align: 'right' });
      doc.y = Math.max(doc.y, y + 13);
    }

    const issuedRefundTotal = refunds.reduce((sum, row) => {
      if (String(row.status).toLowerCase() === 'issued') return sum + (Number(row.amount) || 0);
      return sum;
    }, 0);
    const pendingRefundTotal = refunds.reduce((sum, row) => {
      if (String(row.status).toLowerCase() !== 'issued') return sum + (Number(row.amount) || 0);
      return sum;
    }, 0);
    const grossSales = Number(monthTotals.total) || 0;
    const netAfterIssuedRefunds = grossSales - issuedRefundTotal;
    const projectedNetAfterAllRefunds = grossSales - issuedRefundTotal - pendingRefundTotal;

    ensureSpace(doc, 100);
    doc.moveDown(0.7);
    doc
      .strokeColor('#9ca3af')
      .moveTo(left, doc.y)
      .lineTo(left + pageWidth, doc.y)
      .stroke();
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(11).text('Final calculations');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Gross sales (month): ${money(grossSales)}`);
    doc.text(`Issued refunds: ${money(issuedRefundTotal)}`);
    doc.text(`Refunds still due: ${money(pendingRefundTotal)}`);
    doc.font('Helvetica-Bold');
    doc.text(`Net sales after issued refunds: ${money(netAfterIssuedRefunds)}`);
    doc.text(`Projected net after all due refunds: ${money(projectedNetAfterAllRefunds)}`);

    doc.end();
  });
}

export function monthlySalesReportFilename(monthValue) {
  const safe = String(monthValue || 'month').replace(/[^0-9-]+/g, '-');
  return `sales-report-${safe}.pdf`;
}
