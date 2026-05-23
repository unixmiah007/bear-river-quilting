/** Must match server/lib/shippingCarriers.js ids. */
export const SHIPPING_CARRIER_OPTIONS = [
  { id: 'usps', label: 'USPS' },
  { id: 'ups', label: 'UPS' },
  { id: 'fedex', label: 'FedEx' },
  { id: 'dhl', label: 'DHL' },
  { id: 'amazon', label: 'Amazon Logistics' },
  { id: 'ontrac', label: 'OnTrac' },
  { id: 'lasership', label: 'LaserShip' },
  { id: 'canada-post', label: 'Canada Post' },
  { id: 'royal-mail', label: 'Royal Mail' },
  { id: 'other', label: 'Other carrier' },
];

export function labelForCarrier(id) {
  return SHIPPING_CARRIER_OPTIONS.find((c) => c.id === id)?.label ?? id;
}
