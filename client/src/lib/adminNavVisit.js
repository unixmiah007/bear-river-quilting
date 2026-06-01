const STORAGE_PREFIX = 'brq_admin_last_visit_';

export const ADMIN_NAV_VISIT_KEYS = {
  orders: 'orders',
  customizeRequests: 'customize-requests',
};

export function getAdminLastVisited(key) {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    return null;
  }
}

export function setAdminLastVisited(key, iso = new Date().toISOString()) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, iso);
  } catch {
    /* ignore quota / private mode */
  }
}

/** @returns {string|null} e.g. "1+", "2+", "+10" */
export function formatAdminNavBadge(count) {
  const n = Number(count) || 0;
  if (n <= 0) return null;
  if (n >= 10) return '+10';
  return `${n}+`;
}
