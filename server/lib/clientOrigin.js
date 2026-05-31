/** Public storefront origin used for Stripe return URLs, CORS, and email links. */
export const PRODUCTION_CLIENT_ORIGIN = 'https://bearriverquilting.com';

const DEV_CLIENT_ORIGIN = 'http://localhost:5173';

function normalizeOrigin(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().replace(/\/$/, '');
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
}

/**
 * Resolved site origin for redirects and CORS.
 * Set `CLIENT_ORIGIN=https://bearriverquilting.com` in production (recommended).
 * Falls back to the production domain when `NODE_ENV=production` and unset.
 */
export function getClientOrigin() {
  const explicit =
    normalizeOrigin(process.env.CLIENT_ORIGIN) ||
    normalizeOrigin(process.env.SITE_URL) ||
    normalizeOrigin(process.env.FRONTEND_URL) ||
    normalizeOrigin(process.env.PUBLIC_APP_URL);

  if (explicit) return explicit;

  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_CLIENT_ORIGIN;
  }

  return DEV_CLIENT_ORIGIN;
}

export function clientOriginPath(pathname) {
  const base = getClientOrigin();
  const path = String(pathname ?? '').startsWith('/') ? pathname : `/${pathname ?? ''}`;
  return `${base}${path}`;
}
