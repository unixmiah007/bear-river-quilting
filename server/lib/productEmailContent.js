import { clientOriginPath } from './clientOrigin.js';

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function stripRichHtml(html) {
  return String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateText(text, max = 220) {
  const s = String(text ?? '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trim()}…`;
}

export function resolveProductImageUrl(productId, imageUrl, galleryPath) {
  let path = imageUrl || galleryPath;
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/')) {
    const filename = path.split('/').pop();
    if (!filename) return null;
    path = `/uploads/products/${productId}/${filename}`;
  }
  return clientOriginPath(path);
}

export function formatUsd(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(amount)
  );
}

/**
 * @param {object} product hydrated row with id, name, description, price
 * @param {{ productId: number, galleryPath?: string | null, introLine: string, personalMessage?: string, subject?: string }} opts
 */
export function buildProductPromoEmail(product, opts) {
  const id = Number(opts.productId ?? product.id);
  const productUrl = clientOriginPath(`/products/${id}`);
  const imageUrl = resolveProductImageUrl(id, product.image_url, opts.galleryPath ?? null);
  const briefDescription =
    truncateText(stripRichHtml(product.description)) ||
    'Handmade quilt from Bear River Quilting.';
  const priceLabel = formatUsd(product.price);
  const personalMessage = String(opts.personalMessage ?? '').trim().slice(0, 2000);
  const subject =
    String(opts.subject ?? '').trim().slice(0, 255) ||
    `${product.name} — Bear River Quilting`;

  const introLine = String(opts.introLine ?? '').trim() || 'Bear River Quilting';

  const textParts = [introLine];
  if (personalMessage) {
    textParts.push('', personalMessage);
  }
  textParts.push(
    '',
    product.name,
    briefDescription,
    `From ${priceLabel}`,
    '',
    `View on our website: ${productUrl}`,
    '',
    '— Bear River Quilting'
  );

  const personalHtml = personalMessage
    ? `<p style="margin:0 0 1rem;padding:0.85rem 1rem;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;line-height:1.5">${escapeHtml(personalMessage).replace(/\n/g, '<br>')}</p>`
    : '';

  const imageHtml = imageUrl
    ? `<a href="${escapeHtml(productUrl)}" style="display:block;margin:0 0 1rem"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" width="320" style="display:block;max-width:100%;height:auto;border-radius:10px;border:1px solid #e5e7eb" /></a>`
    : '';

  const html = `
<p style="margin:0 0 1rem;line-height:1.5">${escapeHtml(introLine)}</p>
${personalHtml}
<table cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
  <tr><td>
    ${imageHtml}
    <h2 style="margin:0 0 0.35rem;font-size:1.35rem;font-weight:600;color:#111">${escapeHtml(product.name)}</h2>
    <p style="margin:0 0 0.75rem;color:#4b5563;line-height:1.5">${escapeHtml(briefDescription)}</p>
    <p style="margin:0 0 1rem;font-size:1.05rem"><strong>From ${escapeHtml(priceLabel)}</strong></p>
    <p style="margin:0 0 1.25rem"><a href="${escapeHtml(productUrl)}" style="display:inline-block;padding:0.7rem 1.15rem;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View this quilt</a></p>
    <p style="margin:0;font-size:0.9rem;color:#6b7280">Or open this link: <a href="${escapeHtml(productUrl)}">${escapeHtml(productUrl)}</a></p>
  </td></tr>
</table>
<p style="margin:1.25rem 0 0">— Bear River Quilting</p>`.trim();

  return {
    subject,
    text: textParts.join('\n'),
    html,
    productUrl,
  };
}
