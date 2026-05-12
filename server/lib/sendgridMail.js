import sgMail from '@sendgrid/mail';

/**
 * Same rules as scripts/send-test-email.js: MAIL_FROM_ADDRESS, or extract from MAIL_FROM.
 */
export function resolvePrimarySenderEmail() {
  let email = process.env.MAIL_FROM_ADDRESS?.trim();
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return email;
  const raw = process.env.MAIL_FROM?.trim();
  if (!raw) return null;
  const bracket = raw.match(/<([^>]+)>/);
  if (bracket) {
    const inner = bracket[1].trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inner)) return inner;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return raw;
  return null;
}

/** Verified sender for customer-facing mail (SendGrid). */
export function resolveSendGridFromCustomer() {
  const email = resolvePrimarySenderEmail();
  if (!email) return null;
  const name = process.env.MAIL_FROM_NAME?.trim() || 'Order confirmation';
  return { email, name };
}

/** Verified sender for internal “new order” mail; falls back to primary sender. */
export function resolveSendGridFromStaff() {
  let email = process.env.MAIL_STAFF_FROM_ADDRESS?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    email = resolvePrimarySenderEmail();
  }
  if (!email) {
    const raw = process.env.MAIL_STAFF_FROM?.trim() || process.env.MAIL_FROM?.trim();
    if (raw) {
      const bracket = raw.match(/^(.+?)\s*<([^>]+)>$/);
      if (bracket && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bracket[2].trim())) {
        return { email: bracket[2].trim(), name: bracket[1].trim().replace(/^"|"$/g, '') };
      }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        return { email: raw, name: process.env.MAIL_STAFF_FROM_NAME?.trim() || 'New order' };
      }
    }
    return null;
  }
  const name = process.env.MAIL_STAFF_FROM_NAME?.trim() || 'New order';
  return { email, name };
}

export function isSendGridConfigured() {
  return Boolean(process.env.SENDGRID_API_KEY?.trim());
}

function ensureApiKey() {
  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key) return false;
  sgMail.setApiKey(key);
  return true;
}

/**
 * @param {{ to: string, from: string | { email: string, name?: string }, subject: string, text: string, html: string }} opts
 */
export async function sendSendGridMail(opts) {
  if (!ensureApiKey()) {
    throw new Error('SENDGRID_API_KEY is not set');
  }
  await sgMail.send(opts);
}

export async function verifySendGridIfConfigured() {
  if (!isSendGridConfigured()) {
    console.warn(
      '[mail] SendGrid not configured: set SENDGRID_API_KEY and a verified MAIL_FROM_ADDRESS / MAIL_FROM in server/.env'
    );
    return;
  }
  ensureApiKey();
  const from = resolveSendGridFromCustomer();
  if (!from) {
    console.warn('[mail] SendGrid: set MAIL_FROM_ADDRESS (or MAIL_FROM) to a verified sender email.');
    return;
  }
  console.log('[mail] SendGrid API key loaded; from:', typeof from === 'string' ? from : from.email);
}
