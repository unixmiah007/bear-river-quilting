import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const user = process.env.GMAIL_USER?.trim();
const pass = process.env.GMAIL_APP_PASSWORD?.trim();

if (!user || !pass) {
  console.error('Set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env (use a Google App Password).');
  process.exit(1);
}

const to = process.argv[2]?.trim() || user;

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass },
});

const from = process.env.MAIL_FROM?.trim() || `SMTP test <${user}>`;

try {
  const sent = await transport.sendMail({
    from,
    to,
    subject: `SMTP test ${new Date().toISOString()}`,
    text: 'If you received this, Gmail SMTP from this project is working.',
    html: '<p>If you received this, Gmail SMTP from this project is working.</p>',
  });

  console.log('Sent. messageId:', sent.messageId);
  console.log('To:', to);
} catch (e) {
  if (e?.code === 'EAUTH' || String(e?.message).includes('Application-specific password')) {
    console.error(
      'Gmail rejected the password. Use a 16-character App Password (Google Account → Security → 2-Step Verification → App passwords), not your normal Gmail password.\n' +
        'https://support.google.com/mail/?p=InvalidSecondFactor'
    );
  } else {
    console.error(e?.message ?? e);
  }
  process.exit(1);
}
