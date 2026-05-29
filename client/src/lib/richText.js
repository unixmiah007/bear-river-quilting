/** Treat Quill empty states as no content. */
export function normalizeRichHtml(html) {
  const t = String(html ?? '').trim();
  if (!t || t === '<p><br></p>' || t === '<p></p>') return '';
  return t;
}

/** Plain text for list/card previews. */
export function stripRichHtml(html) {
  return String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
