import nodemailer from 'nodemailer';

/**
 * Reads GMAIL_USER / GMAIL_APP_PASSWORD from process.env (after loadEnv).
 * Strips all whitespace from the app password — Google accepts the 16-character form,
 * and quoted multi-word .env values often break if users forget quotes.
 */
export function gmailAuthFromEnv() {
  const user = process.env.GMAIL_USER?.trim() ?? '';
  let pass = process.env.GMAIL_APP_PASSWORD;
  if (pass != null && String(pass).trim() !== '') {
    pass = String(pass).replace(/\s+/g, '');
  } else {
    pass = '';
  }
  return { user, pass };
}

export function createGmailTransport() {
  const { user, pass } = gmailAuthFromEnv();
  if (!user || !pass) return null;

  if (pass.length !== 16) {
    console.warn(
      `[mail] GMAIL_APP_PASSWORD has length ${pass.length} after removing spaces; Google App Passwords are normally 16 characters. Check server/.env — use quotes if the value contains spaces: GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"`
    );
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

/** Optional startup check; logs success or failure without throwing. */
export async function verifyGmailIfConfigured() {
  const transport = createGmailTransport();
  if (!transport) {
    console.warn(
      '[mail] Gmail not configured: set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env — order emails will be skipped.'
    );
    return;
  }
  const { user } = gmailAuthFromEnv();
  try {
    await transport.verify();
    console.log(`[mail] Gmail SMTP ready (${user})`);
  } catch (e) {
    console.error('[mail] Gmail SMTP verify failed:', e?.message ?? e);
  }
}
