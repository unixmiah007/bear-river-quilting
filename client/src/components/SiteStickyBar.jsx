/** Fictional toll-free line for demo / storefront contact. */
const SUPPORT_PHONE_DISPLAY = '1-800-472-7849';
const SUPPORT_PHONE_TEL = '18004727849';

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
    <aside className="site-sticky-bar" aria-label="Site information and customer care hours">
      <div className="site-sticky-bar__inner">
        <div className="site-sticky-bar__top">
          <p className="site-sticky-bar__copyright">
            © {year} Bear River Quilting. All rights reserved.
          </p>
          <p className="site-sticky-bar__phone">
            <a href={`tel:${SUPPORT_PHONE_TEL}`}>{SUPPORT_PHONE_DISPLAY}</a>
          </p>
        </div>
        <div className="site-sticky-bar__hours">
          <p className="site-sticky-bar__hours-label">Customer care hours (Mountain Time)</p>
          <ul className="site-sticky-bar__days">
            {WEEKDAY_HOURS.map(({ day, hours }) => (
              <li key={day}>
                <span className="site-sticky-bar__day">{day}</span>
                <span className="site-sticky-bar__time">{hours}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
