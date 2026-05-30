/** SSL trust indicator for the site footer (dark bar). */
export default function SslTrustBadge() {
  return (
    <div className="ssl-trust-badge" role="img" aria-label="This site uses 256-bit SSL encryption">
      <svg
        className="ssl-trust-badge__icon"
        width="28"
        height="32"
        viewBox="0 0 28 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M14 1.5L24.5 6.2v8.4c0 6.2-4.4 11.9-10.5 13.4L14 30l-0.3-0.1C7.1 28.5 3.5 22.8 3.5 14.6V6.2L14 1.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M10.5 15.2 12.6 17.4 17.8 12"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="11.25"
          y="9.5"
          width="5.5"
          height="4.25"
          rx="1.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M12 9.5V7.8a2 2 0 0 1 4 0v1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div className="ssl-trust-badge__text">
        <span className="ssl-trust-badge__title">Secured with SSL</span>
        <span className="ssl-trust-badge__detail">256-bit encryption</span>
      </div>
    </div>
  );
}
