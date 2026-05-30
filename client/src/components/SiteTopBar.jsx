import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
} from '../lib/siteContact.js';

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16v12H4V6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 4.8c.4 2.1 1.2 4.1 2.3 5.9l-1.4 1.4a14 14 0 0 0 5.8 5.8l1.4-1.4c1.8 1.1 3.8 1.9 5.9 2.3l.5 3.6a1 1 0 0 1-.9 1.1 16 16 0 0 1-12.6-6.2A16 16 0 0 1 5.4 5.7a1 1 0 0 1 1.1-.9l3.6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SiteTopBar() {
  return (
    <div className="site-top-bar" role="region" aria-label="Contact and hours">
      <div className="site-top-bar__inner">
        <p className="site-top-bar__hours">Hours of operation: M-F 7am-7pm EST</p>
        <div className="site-top-bar__contact">
          <a className="site-top-bar__link" href={`mailto:${SUPPORT_EMAIL}`}>
            <MailIcon />
            <span>{SUPPORT_EMAIL}</span>
          </a>
          <a className="site-top-bar__link" href={`tel:${SUPPORT_PHONE_TEL}`}>
            <PhoneIcon />
            <span>{SUPPORT_PHONE_DISPLAY}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
