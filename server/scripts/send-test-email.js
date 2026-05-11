import '../loadEnv.js';
import { createGmailTransport, gmailAuthFromEnv } from '../lib/gmailTransport.js';
import { parseOrderNotifyRecipients } from '../lib/mail.js';

const argv = process.argv.slice(2);
const notifyAll = argv.includes('--notify') || argv.includes('--staff');
const positional = argv.filter((a) => !a.startsWith('--'));
const firstAddr = positional[0]?.trim();

const { user } = gmailAuthFromEnv();
const transport = createGmailTransport();

if (!user || !transport) {
  console.error(
    'Set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env (Google App Password, 16 chars — quote if it contains spaces).'
  );
  process.exit(1);
}

let recipients;
if (notifyAll) {
  recipients = parseOrderNotifyRecipients();
  if (recipients.length === 0) {
    console.error(
      'No notify recipients: set ORDER_NOTIFY_EMAILS in server/.env (comma-separated addresses).'
    );
    process.exit(1);
  }
} else {
  recipients = [firstAddr || user];
}

const from = process.env.MAIL_FROM?.trim() || `SMTP test <${user}>`;
const subject = `SMTP test (notify list) ${new Date().toISOString()}`;
const text =
  'If you received this, Gmail SMTP and ORDER_NOTIFY_EMAILS routing from this project are working.';
const html = `<p>${text}</p>`;

try {
  for (const to of recipients) {
    const sent = await transport.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log('Sent to', to, 'messageId:', sent.messageId);
  }
  console.log(`Done (${recipients.length} message(s)).`);
} catch (e) {
  if (e?.code === 'EAUTH' || String(e?.message).includes('Application-specific password')) {
    console.error(
      'Gmail rejected the password. Use a 16-character App Password (Google Account → Security → App passwords).\n' +
        'https://support.google.com/mail/?p=InvalidSecondFactor'
    );
  } else {
    console.error(e?.message ?? e);
  }
  process.exit(1);
}
