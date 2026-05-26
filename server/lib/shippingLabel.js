import { getDefaultShipFrom } from './defaultShipFrom.js';

function pick(row, prefix, fallback) {
  const v = row?.[prefix];
  if (v != null && String(v).trim() !== '') return String(v).trim();
  return fallback;
}

export function resolveLabelFrom(order) {
  const d = getDefaultShipFrom();
  return {
    name: pick(order, 'label_from_name', d.name),
    address1: pick(order, 'label_from_address1', d.address1),
    address2: pick(order, 'label_from_address2', d.address2),
    city: pick(order, 'label_from_city', d.city),
    state: pick(order, 'label_from_state', d.state),
    postalCode: pick(order, 'label_from_postal_code', d.postalCode),
    country: pick(order, 'label_from_country', d.country),
    phone: pick(order, 'label_from_phone', d.phone),
  };
}

export function resolveLabelTo(order) {
  return {
    name: String(order?.customer_name ?? '').trim(),
    address1: String(order?.shipping_address1 ?? '').trim(),
    address2: String(order?.shipping_address2 ?? '').trim(),
    city: String(order?.shipping_city ?? '').trim(),
    state: String(order?.shipping_state ?? '').trim(),
    postalCode: String(order?.shipping_postal_code ?? '').trim(),
    country: String(order?.shipping_country ?? '').trim(),
    phone: String(order?.customer_phone ?? '').trim(),
  };
}

function normalizePart(value, maxLen) {
  return String(value ?? '').trim().slice(0, maxLen);
}

export function normalizeLabelAddress(raw, { requireName = true, requireLine1 = true } = {}) {
  const name = normalizePart(raw?.name, 255);
  const address1 = normalizePart(raw?.address1, 255);
  const address2 = normalizePart(raw?.address2, 255);
  const city = normalizePart(raw?.city, 120);
  const state = normalizePart(raw?.state, 120);
  const postalCode = normalizePart(raw?.postalCode ?? raw?.postal_code, 40);
  const country = normalizePart(raw?.country, 120);
  const phone = normalizePart(raw?.phone, 64);

  if (requireName && !name) {
    return { ok: false, error: 'Name is required' };
  }
  if (requireLine1 && !address1) {
    return { ok: false, error: 'Address line 1 is required' };
  }
  if (!city || !state || !postalCode || !country) {
    return { ok: false, error: 'City, state, postal code, and country are required' };
  }

  return {
    ok: true,
    value: { name, address1, address2, city, state, postalCode, country, phone },
  };
}
