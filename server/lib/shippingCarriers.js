/** Supported carriers for admin shipment tracking emails. */
export const SHIPPING_CARRIERS = [
  { id: 'usps', label: 'USPS', trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking}' },
  { id: 'ups', label: 'UPS', trackingUrl: 'https://www.ups.com/track?tracknum={tracking}' },
  { id: 'fedex', label: 'FedEx', trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr={tracking}' },
  { id: 'dhl', label: 'DHL', trackingUrl: 'https://www.dhl.com/us-en/home/tracking.html?tracking-id={tracking}' },
  { id: 'amazon', label: 'Amazon Logistics', trackingUrl: null },
  { id: 'ontrac', label: 'OnTrac', trackingUrl: 'https://www.ontrac.com/tracking/?number={tracking}' },
  { id: 'lasership', label: 'LaserShip', trackingUrl: 'https://www.lasership.com/track/{tracking}' },
  { id: 'canada-post', label: 'Canada Post', trackingUrl: 'https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor={tracking}' },
  { id: 'royal-mail', label: 'Royal Mail', trackingUrl: 'https://www.royalmail.com/track-your-item#/tracking-results/{tracking}' },
  { id: 'other', label: 'Other carrier', trackingUrl: null },
];

const BY_ID = new Map(SHIPPING_CARRIERS.map((c) => [c.id, c]));

export function getShippingCarrier(id) {
  return BY_ID.get(String(id ?? '').trim().toLowerCase()) ?? null;
}

export function buildTrackingUrl(carrierId, trackingNumber) {
  const carrier = getShippingCarrier(carrierId);
  if (!carrier?.trackingUrl) return null;
  const num = encodeURIComponent(String(trackingNumber ?? '').trim());
  return carrier.trackingUrl.replace('{tracking}', num);
}

export function validateTrackingPayload({ carrier, trackingNumber }) {
  const carrierId = String(carrier ?? '').trim().toLowerCase();
  const tracking = String(trackingNumber ?? '').trim();
  if (!getShippingCarrier(carrierId)) {
    return { ok: false, status: 400, error: 'Select a shipping carrier' };
  }
  if (!tracking || tracking.length < 4 || tracking.length > 64) {
    return { ok: false, status: 400, error: 'Enter a valid tracking number (4–64 characters)' };
  }
  if (!/^[A-Za-z0-9\-_.\s]+$/.test(tracking)) {
    return { ok: false, status: 400, error: 'Tracking number contains invalid characters' };
  }
  return { ok: true, carrierId, tracking };
}
