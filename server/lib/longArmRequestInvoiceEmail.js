import { buildLongArmRequestInvoicePdf, longArmInvoicePdfFilename } from './longArmRequestInvoicePdf.js';
import { getLongArmRequestForAdmin } from './longArmQuiltingRequest.js';
import { sendLongArmRequestInvoiceEmail } from './mail.js';

export async function loadLongArmRequestInvoiceContext(requestId) {
  return getLongArmRequestForAdmin(requestId);
}

export async function emailCustomerLongArmRequestInvoice(requestId) {
  const ctx = await loadLongArmRequestInvoiceContext(requestId);
  if (!ctx.ok) return ctx;

  const { request } = ctx;
  const pdf = await buildLongArmRequestInvoicePdf(request);
  const filename = longArmInvoicePdfFilename(request.request_number);

  await sendLongArmRequestInvoiceEmail({
    to: request.customer_email,
    customerName: request.customer_name,
    requestNumber: request.request_number,
    pdfBuffer: pdf,
    filename,
  });

  return { ok: true, emailedAt: new Date().toISOString() };
}
