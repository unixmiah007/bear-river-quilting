/** Bear River Quilting wordmark — used in header and footer sticky bar. */
const LOGO_SRC = '/assets/bear-river-quilting-logo.png';

export default function BrandLogo({ className }) {
  return (
    <img
      className={className}
      src={LOGO_SRC}
      alt=""
      decoding="async"
      aria-hidden="true"
    />
  );
}
