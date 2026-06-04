import { clientOriginPath } from './clientOrigin.js';

export function siteLogoEmailUrl() {
  return clientOriginPath('/uploads/brand/bear-river-quilting-logo.png');
}

export function siteLogoEmailHtml() {
  const url = siteLogoEmailUrl();
  return `<img src="${url.replace(/"/g, '&quot;')}" alt="Bear River Quilting" width="220" style="display:block;max-width:100%;height:auto;margin:0 0 1.25rem" />`;
}
