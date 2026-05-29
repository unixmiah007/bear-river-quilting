/** Recently viewed products persisted in localStorage (this browser). */
export const VISIT_HISTORY_STORAGE_KEY = 'brq_product_visit_history';
const MAX_ENTRIES = 200;

function normalizeEntry(raw) {
  const id = Number(raw?.id ?? raw?.productId);
  const at = Number(raw?.at ?? raw?.visitedAt);
  if (!Number.isInteger(id) || id <= 0) return null;
  if (!Number.isFinite(at) || at <= 0) return null;
  return { id, at };
}

export function readProductVisitHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(VISIT_HISTORY_STORAGE_KEY);
    if (stored == null || stored === '') return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry).filter(Boolean);
  } catch {
    return [];
  }
}

export function writeProductVisitHistory(entries) {
  const normalized = entries.map(normalizeEntry).filter(Boolean).slice(0, MAX_ENTRIES);
  if (typeof window === 'undefined') return normalized;
  try {
    if (normalized.length === 0) {
      window.localStorage.removeItem(VISIT_HISTORY_STORAGE_KEY);
    } else {
      window.localStorage.setItem(VISIT_HISTORY_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    /* quota / private mode */
  }
  return normalized;
}

/** Adds or moves a product to the front of visit history (newest first). */
export function recordProductVisit(productId) {
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) return readProductVisitHistory();
  const now = Date.now();
  const rest = readProductVisitHistory().filter((e) => e.id !== id);
  return writeProductVisitHistory([{ id, at: now }, ...rest]);
}
