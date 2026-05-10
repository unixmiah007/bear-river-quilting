/** Inline shopping-cart SVG; inherits color via currentColor. */
export default function CartIcon({ className = '' }) {
  return (
    <svg
      className={className ? `cart-icon ${className}` : 'cart-icon'}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 6h15l-1.5 12H7.5L6 6Z"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinejoin="round"
      />
      <path
        d="M6 6 5 3H2"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.65" fill="currentColor" />
      <circle cx="17" cy="20" r="1.65" fill="currentColor" />
    </svg>
  );
}
