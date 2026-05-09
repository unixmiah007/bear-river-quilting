/**
 * Inline quilt-block mark for the site header (patchwork + stitch motif).
 */
export default function BrandLogo({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      width="36"
      height="36"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1.75"
        y="1.75"
        width="32.5"
        height="32.5"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      {/* Nine-patch */}
      <rect x="4.5" y="4.5" width="8.5" height="8.5" rx="1" fill="currentColor" opacity="0.16" />
      <rect x="13.75" y="4.5" width="8.5" height="8.5" rx="1" fill="currentColor" opacity="0.32" />
      <rect x="23" y="4.5" width="8.5" height="8.5" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="4.5" y="13.75" width="8.5" height="8.5" rx="1" fill="currentColor" opacity="0.28" />
      <rect x="13.75" y="13.75" width="8.5" height="8.5" rx="1" fill="currentColor" opacity="0.1" />
      <rect x="23" y="13.75" width="8.5" height="8.5" rx="1" fill="currentColor" opacity="0.26" />
      <rect x="4.5" y="23" width="8.5" height="8.5" rx="1" fill="currentColor" opacity="0.18" />
      <rect x="13.75" y="23" width="8.5" height="8.5" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="23" y="23" width="8.5" height="8.5" rx="1" fill="currentColor" opacity="0.14" />
      {/* Hand-quilting arc */}
      <path
        d="M 6 26 Q 18 14 30 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeDasharray="1.8 3.2"
        opacity="0.55"
      />
      {/* Needle */}
      <line
        x1="27"
        y1="8"
        x2="22"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.65"
      />
      <circle cx="27" cy="8" r="1.35" fill="currentColor" opacity="0.75" />
    </svg>
  );
}
