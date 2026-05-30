import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';
import AcceptedPaymentMethods from './AcceptedPaymentMethods.jsx';
import SslTrustBadge from './SslTrustBadge.jsx';
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '../lib/siteContact.js';

const WEEKDAY_HOURS = [
  { day: 'Monday', hours: '7:00 AM – 7:00 PM' },
  { day: 'Tuesday', hours: '7:00 AM – 7:00 PM' },
  { day: 'Wednesday', hours: '7:00 AM – 7:00 PM' },
  { day: 'Thursday', hours: '7:00 AM – 7:00 PM' },
  { day: 'Friday', hours: '7:00 AM – 7:00 PM' },
];

export default function SiteStickyBar() {
  const year = new Date().getFullYear();

  return (
    <aside className="site-sticky-bar" aria-label="Contact and customer care hours">
      <div className="site-sticky-bar__inner">
        <div className="site-sticky-bar__top">
          <div className="site-sticky-bar__brand-row">
            <Link to="/" className="site-sticky-bar__logo-link" aria-label="Bear River Quilting home">
              <BrandLogo className="site-sticky-bar__logo" />
            </Link>
            <p className="site-sticky-bar__copyright">
              © {year} Bear River Quilting. All rights reserved.
            </p>
          </div>
          <p className="site-sticky-bar__phone">
            <a href={`tel:${SUPPORT_PHONE_TEL}`}>{SUPPORT_PHONE_DISPLAY}</a>
          </p>
        </div>
        <div className="site-sticky-bar__hours">
          <p className="site-sticky-bar__hours-label">Customer care hours (Eastern Standard Time)</p>
          <ul className="site-sticky-bar__days">
            {WEEKDAY_HOURS.map(({ day, hours }) => (
              <li key={day}>
                <span className="site-sticky-bar__day">{day}</span>
                <span className="site-sticky-bar__time">{hours}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="site-sticky-bar__trust">
          <div className="site-sticky-bar__secure">
            <SslTrustBadge />
          </div>
          <AcceptedPaymentMethods />
        </div>
      </div>
    </aside>
  );
}
