const PAYMENT_METHODS = [
  { id: 'visa', label: 'Visa', src: '/assets/payment-icons/visa.svg' },
  { id: 'mastercard', label: 'Mastercard', src: '/assets/payment-icons/mastercard.svg' },
  { id: 'amex', label: 'American Express', src: '/assets/payment-icons/amex.svg' },
  { id: 'discover', label: 'Discover', src: '/assets/payment-icons/discover.svg' },
  { id: 'klarna', label: 'Klarna', src: '/assets/payment-icons/klarna.svg' },
  { id: 'cash-app', label: 'Cash App', src: '/assets/payment-icons/cash-app.svg' },
  { id: 'affirm', label: 'Affirm', src: '/assets/payment-icons/affirm.svg' },
  { id: 'bank', label: 'Bank transfer', src: '/assets/payment-icons/bank.svg' },
];

/** Display width / height — matches 78×48 SVG viewBox (credit-card proportion). */
const ICON_W = 78;
const ICON_H = 48;
const DISPLAY_W = 52;

export default function AcceptedPaymentMethods() {
  const displayH = Math.round((DISPLAY_W * ICON_H) / ICON_W);

  return (
    <div className="accepted-payments">
      <p className="accepted-payments__label">We accept</p>
      <ul className="accepted-payments__list">
        {PAYMENT_METHODS.map(({ id, label, src }) => (
          <li key={id} className="accepted-payments__item">
            <span className="accepted-payments__chip" title={label}>
              <img
                className="accepted-payments__img"
                src={src}
                alt={label}
                width={DISPLAY_W}
                height={displayH}
                loading="lazy"
                decoding="async"
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
