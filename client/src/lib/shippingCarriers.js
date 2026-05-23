/** Must match server/lib/shippingCarriers.js ids and tracking URLs. */
export const SHIPPING_CARRIER_OPTIONS = [
  { id: 'usps', label: 'USPS', trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking}' },
  { id: 'ups', label: 'UPS', trackingUrl: 'https://www.ups.com/track?tracknum={tracking}' },
  { id: 'fedex', label: 'FedEx', trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr={tracking}' },
  { id: 'dhl', label: 'DHL', trackingUrl: 'https://www.dhl.com/us-en/home/tracking.html?tracking-id={tracking}' },
  { id: 'amazon', label: 'Amazon Logistics', trackingUrl: null },
  { id: 'ontrac', label: 'OnTrac', trackingUrl: 'https://www.ontrac.com/tracking/?number={tracking}' },
  { id: 'lasership', label: 'LaserShip', trackingUrl: 'https://www.lasership.com/track/{tracking}' },
  {
    id: 'canada-post',
    label: 'Canada Post',
    trackingUrl: 'https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor={tracking}',
  },
  {
    id: 'royal-mail',
    label: 'Royal Mail',
    trackingUrl: 'https://www.royalmail.com/track-your-item#/tracking-results/{tracking}',
  },
  { id: 'other', label: 'Other carrier', trackingUrl: null },
];

export function labelForCarrier(id) {
  return SHIPPING_CARRIER_OPTIONS.find((c) => c.id === id)?.label ?? id;
}

export function buildTrackingUrl(carrierId, trackingNumber) {
  const carrier = SHIPPING_CARRIER_OPTIONS.find((c) => c.id === carrierId);
  const num = String(trackingNumber ?? '').trim();
  if (!carrier?.trackingUrl || !num) return null;
  return carrier.trackingUrl.replace('{tracking}', encodeURIComponent(num));
}
