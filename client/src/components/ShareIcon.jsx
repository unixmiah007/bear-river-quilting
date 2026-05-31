/** Share / forward icon; inherits color via currentColor. */
export default function ShareIcon({ className = '' }) {
  return (
    <svg
      className={className ? `share-icon ${className}` : 'share-icon'}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="m8.6 13.4 6.8 3.9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="m15.4 6.7-6.8 3.9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
