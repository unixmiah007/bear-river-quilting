function IconBase({ className, children }) {
  return (
    <svg
      className={className ? `admin-section-icon ${className}` : 'admin-section-icon'}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ShippingLabelIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M5 4h9l5 5v11H5V4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 4v5h5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path
        d="M8 13h8M8 17h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function OrderStatusIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M9 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9 6V4a2 2 0 0 1 2-2h5l4 4v2M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function TrackingEmailIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M3 8h11v8H3V8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M3 8l5.5 4L14 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 10h2l3 3v5h-5v-8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="15.5" cy="18.5" r="1.5" fill="currentColor" />
      <circle cx="19.5" cy="18.5" r="1.5" fill="currentColor" />
    </IconBase>
  );
}

export function CustomerMessagingIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M5 6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-4 3v-3H8a3 3 0 0 1-3-3V6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9 9h6M9 12h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </IconBase>
  );
}

export function ProductEditIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M4 7.5V4a2 2 0 0 1 2-2h3.5M20 7.5V4a2 2 0 0 0-2-2h-3.5M4 16.5V20a2 2 0 0 0 2 2h3.5M20 16.5V20a2 2 0 0 1-2 2h-3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M9 15l6-6 2 2-6 6H9v-2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function SizePricesIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M12 3v18M7 8h6.5a2.5 2.5 0 0 1 0 5H10a2.5 2.5 0 0 0 0 5h3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function ProductVisibilityIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </IconBase>
  );
}

export function ProductCategoriesIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M4 6h7v7H4V6ZM13 6h7v4h-7V6ZM13 13h7v5h-7v-5ZM4 15h7v3H4v-3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function ProductImagesIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8 14l3-3 3 3 4-4 2 2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="1.25" fill="currentColor" />
    </IconBase>
  );
}

export function MediaGalleryIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M4 15l4-4 3 3 4-5 5 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function CsvImportIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M12 4v10M8.5 10.5 12 14l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 18h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M7 8h10M7 12h7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.55"
      />
    </IconBase>
  );
}

export function CustomizePageIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M12 3l1.4 4.3h4.5l-3.6 2.6 1.4 4.3L12 11.6 8.3 14.2l1.4-4.3-3.6-2.6h4.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M5 19h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function PageHeaderIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path d="M5 7h14M5 12h10M5 17h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M18 10v8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function PayStepIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.75" />
      <path d="M7 15h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </IconBase>
  );
}

export function WizardStepsIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M8 6h12M8 12h12M8 18h12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="5" cy="6" r="1.5" fill="currentColor" />
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="5" cy="18" r="1.5" fill="currentColor" />
    </IconBase>
  );
}

export function Step2SectionsIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M4 8h6v8H4V8ZM14 4h6v6h-6V4ZM14 14h6v6h-6v-6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function QuiltSizesIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M4 8h16M4 16h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M8 4v16M16 4v16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function ColorPalettesIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <circle cx="8" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="16" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M6 17c1.2-2.5 3-4 6-4s4.8 1.5 6 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function BattingOptionsIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M4 9h16M4 15h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M6 6v12M12 5v14M18 7v10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function ValidationMessagesIcon({ className = '' }) {
  return (
    <IconBase className={className}>
      <path
        d="M12 4 20 18H4L12 4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 9v5M12 16.5v.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </IconBase>
  );
}
