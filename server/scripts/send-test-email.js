import '../loadEnv.js';
import sgMail from '@sendgrid/mail';
import { parseOrderNotifyRecipients } from '../lib/mail.js';

const argv = process.argv.slice(2);
const notifyAll = argv.includes('--notify') || argv.includes('--staff');
const positional = argv.filter((a) => !a.startsWith('--'));
const firstAddr = positional[0]?.trim();

const apiKey = process.env.SENDGRID_API_KEY?.trim();
if (!apiKey) {
  console.error('Set SENDGRID_API_KEY in server/.env to send test emails via SendGrid.');
  process.exit(1);
}

sgMail.setApiKey(apiKey);

const fromAddress =
  process.env.MAIL_FROM_ADDRESS?.trim() ||
  process.env.MAIL_FROM?.trim()?.match(/<([^>]+)>/)?.[1] ||
  process.env.MAIL_FROM?.trim();
if (!fromAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) {
  console.error(
    'Set MAIL_FROM_ADDRESS (or MAIL_FROM as email / "Name <email>") to a SendGrid-verified sender.'
  );
  process.exit(1);
}

const fromName = process.env.MAIL_FROM_NAME?.trim() || 'SMTP test';
const from = { email: fromAddress, name: fromName };

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
  recipients = [firstAddr || fromAddress];
}

const subject = `SendGrid test ${new Date().toISOString()}`;
const text =
  'If you received this, SendGrid and ORDER_NOTIFY_EMAILS routing from this project are working.';
const html = `<p>${text}</p>`;

try {
  for (const to of recipients) {
    await sgMail.send({ from, to, subject, text, html });
    console.log('Sent to', to);
  }
  console.log(`Done (${recipients.length} message(s)).`);
} catch (e) {
  const detail = e?.response?.body?.errors ?? e?.message ?? e;
  console.error('SendGrid send failed:', detail);
  process.exit(1);
}
