import PDFDocument from 'pdfkit';
import { BRAND_LOGO_PATH, brandLogoExists } from './brandLogoPath.js';
import { longArmQuiltSourceLabel } from './longArmQuiltingRequest.js';

function money(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));
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
  return [name, line1, line2, [city, state, postal].filter(Boolean).join(', '), country].filter(
    (l) => l != null && String(l).trim() !== ''
  );
}

function writeSection(doc, title, lines, { x = 50, width = 500 } = {}) {
  doc.font('Helvetica-Bold').fontSize(11).text(title, x, doc.y, { width });
  doc.moveDown(0.35);
  doc.font('Helvetica').fontSize(10);
  for (const line of lines) {
    if (line == null || String(line).trim() === '') continue;
    doc.text(String(line), x, doc.y, { width });
    doc.moveDown(0.15);
  }
  doc.moveDown(0.5);
}

function longArmStatusLabel(status) {
  const labels = {
    pending_payment: 'Pending payment',
    deposit_paid: 'Deposit paid',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status || '—';
}

function acknowledgedLabel(value) {
  return String(value || 'N').toUpperCase() === 'Y' ? 'Yes' : 'No';
}

/** Builds a PDF invoice buffer for a long-arm quilting service request. */
export function buildLongArmRequestInvoicePdf(request) {
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

    doc.font('Helvetica-Bold').fontSize(12).text(`Request ${request.request_number}`);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Status: ${longArmStatusLabel(request.status)}`);
    doc.text(`Acknowledged: ${acknowledgedLabel(request.acknowledged)}`);
    doc.text(`Submitted: ${formatDate(request.created_at)}`);
    if (request.updated_at && request.updated_at !== request.created_at) {
      doc.text(`Updated: ${formatDate(request.updated_at)}`);
    }
    doc.moveDown(0.75);

    writeSection(doc, 'Customer', [
      request.customer_name,
      request.customer_email,
      request.customer_phone ? `Phone: ${request.customer_phone}` : null,
    ].filter(Boolean));

    const serviceLines = (request.services ?? []).map((s) => {
      const rate = s.hourly_rate != null ? ` — ${money(s.hourly_rate)}/hr` : '';
      return `${s.name}${rate}`;
    });
    writeSection(doc, 'Service', serviceLines.length ? serviceLines : ['—']);

    const quiltLines = [longArmQuiltSourceLabel(request.quilt_source)];
    if (request.blanket_palette) {
      quiltLines.push(
        `Base quilt: ${request.blanket_palette.title} (${money(request.blanket_palette.price)})`
      );
    } else if (request.quilt_source === 'use_ours') {
      quiltLines.push('Base quilt: Not recorded');
    }
    writeSection(doc, 'Quilt details', quiltLines);

    if (request.notes) {
      writeSection(doc, 'Customer notes', [request.notes]);
    }

    const paymentLines = [];
    if (request.deposit_paid_at) {
      paymentLines.push(
        `Deposit: ${money(request.deposit_amount)} — paid ${formatDate(request.deposit_paid_at)}`
      );
    } else {
      paymentLines.push(`Deposit: ${money(request.deposit_amount)} — unpaid`);
    }
    if (request.final_payment_amount != null) {
      paymentLines.push(`Final payment recorded: ${money(request.final_payment_amount)}`);
    }
    paymentLines.push(
      'Quilting labor is billed at the service hourly rate; amounts above are deposits and recorded payments.'
    );
    writeSection(doc, 'Payments', paymentLines);

    writeSection(
      doc,
      'Ship to',
      addressLines(
        request.customer_name,
        request.shipping_address1,
        request.shipping_address2,
        request.shipping_city,
        request.shipping_state,
        request.shipping_postal_code,
        request.shipping_country
      )
    );

    writeSection(
      doc,
      'Billing',
      addressLines(
        request.billing_name,
        request.billing_address1,
        request.billing_address2,
        request.billing_city,
        request.billing_state,
        request.billing_postal_code,
        request.billing_country
      )
    );

    doc.font('Helvetica').fontSize(9).fillColor('#444444');
    doc.text('Thank you for choosing Bear River Quilting long-arm quilting services.', 50, doc.y, {
      width: pageWidth,
    });
    doc.fillColor('#000000');

    doc.end();
  });
}

export function longArmInvoicePdfFilename(requestNumber) {
  const safe = String(requestNumber ?? 'request')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `invoice-${safe || 'long-arm-request'}.pdf`;
}
