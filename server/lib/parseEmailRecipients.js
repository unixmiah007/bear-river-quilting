export function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 255);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Parse a pasted list: one email per line, with optional comma/semicolon separators.
 * @param {string | string[]} raw
 * @param {{ max?: number }} [opts]
 */
export function parseEmailRecipients(raw, opts = {}) {
  const max = opts.max ?? 500;
  const lines =
    typeof raw === 'string'
      ? raw.split(/\r?\n/)
      : Array.isArray(raw)
        ? raw
        : [];

  const emails = [];
  const seen = new Set();
  const invalid = [];

  for (const line of lines) {
    const parts = String(line ?? '')
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) continue;

    for (const part of parts) {
      const email = normalizeEmail(part);
      if (!email) continue;
      if (!isValidEmail(email)) {
        invalid.push(part.slice(0, 80));
        continue;
      }
      if (seen.has(email)) continue;
      seen.add(email);
      emails.push(email);
      if (emails.length >= max) break;
    }
    if (emails.length >= max) break;
  }

  return { emails, invalid, truncated: emails.length >= max };
}
