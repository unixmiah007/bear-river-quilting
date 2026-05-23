import { buildTrackingUrl, labelForCarrier } from '../lib/shippingCarriers.js';

/**
 * @param {{ carrier?: string | null, trackingNumber?: string | null, notifiedAt?: string | null }} props
 */
export default function OrderTrackingDisplay({ carrier, trackingNumber, notifiedAt }) {
  const num = String(trackingNumber ?? '').trim();
  if (!num) return null;

  const carrierLabel = labelForCarrier(carrier) || 'Carrier';
  const url = buildTrackingUrl(carrier, num);

  return (
    <div className="order-tracking">
      <p className="muted" style={{ margin: 0 }}>
        <strong>{carrierLabel}</strong>
        {' · '}
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="order-tracking__link">
            {num}
          </a>
        ) : (
          <strong>{num}</strong>
        )}
        {url ? (
          <>
            {' '}
            <span className="muted">(opens carrier site)</span>
          </>
        ) : null}
      </p>
      {notifiedAt ? (
        <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>
          Shipment notification sent {new Date(notifiedAt).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}
