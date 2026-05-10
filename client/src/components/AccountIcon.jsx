/** User / account mark; filled shapes use currentColor (same idea as cart wheels). */
export default function AccountIcon({ className = '' }) {
  return (
    <svg
      className={className ? `account-icon ${className}` : 'account-icon'}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="8.25" r="4" fill="currentColor" />
      <path fill="currentColor" d="M4 21c0-4 3.6-7 8-7s8 3 8 7H4z" />
    </svg>
  );
}
