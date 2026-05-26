/** Product favorites persisted in localStorage (no login required). */
export const FAVORITES_STORAGE_KEY = 'brq_product_favorites';
const LEGACY_COOKIE_NAME = 'brq_product_favorites';

function readLegacyCookie() {
  if (typeof document === 'undefined') return null;
  const prefix = `${LEGACY_COOKIE_NAME}=`;
  const part = document.cookie.split(';').find((c) => c.trim().startsWith(prefix));
  if (!part) return null;
  return decodeURIComponent(part.trim().slice(prefix.length));
}

export function parseFavoriteIds(raw) {
  if (raw == null || String(raw).trim() === '') return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
  } catch {
    return [
      ...new Set(
        String(raw)
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((id) => Number.isInteger(id) && id > 0)
      ),
    ];
  }
}

function normalizeIds(ids) {
  return [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
}

export function readFavoriteIds() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored != null && stored !== '') {
      return parseFavoriteIds(stored);
    }
    const fromCookie = readLegacyCookie();
    if (fromCookie) {
      const migrated = parseFavoriteIds(fromCookie);
      if (migrated.length > 0) {
        window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(migrated));
        document.cookie = `${LEGACY_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
      }
      return migrated;
    }
  } catch {
    /* private browsing / quota */
  }
  return [];
}

export function writeFavoriteIds(ids) {
  const normalized = normalizeIds(ids);
  if (typeof window === 'undefined') return normalized;
  try {
    if (normalized.length === 0) {
      window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
    } else {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    /* ignore */
  }
  return normalized;
}

export function toggleFavoriteId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return readFavoriteIds();
  const current = readFavoriteIds();
  const next = current.includes(n) ? current.filter((x) => x !== n) : [...current, n];
  return writeFavoriteIds(next);
}
