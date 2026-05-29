import { SITE_LOGO_ALT, SITE_LOGO_URL } from '../lib/siteBrand.js';

/** Bear River Quilting wordmark — used in header and footer sticky bar. */
export default function BrandLogo({ className }) {
  return (
    <img
      className={className}
      src={SITE_LOGO_URL}
      alt=""
      decoding="async"
      aria-hidden="true"
    />
  );
}
