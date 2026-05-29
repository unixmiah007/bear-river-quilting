/** Centered spinner for page and route loading states. */
export default function PageLoader({ label = 'Loading…', inline = false }) {
  return (
    <div
      className={`page-loader${inline ? ' page-loader--inline' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="page-loader__spinner" aria-hidden="true" />
      <span className="page-loader__label">{label}</span>
    </div>
  );
}
