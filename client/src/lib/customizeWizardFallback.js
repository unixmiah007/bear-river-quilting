import {
  BATTING_OPTIONS,
  COLOR_PALETTE_OPTIONS,
  CUSTOMIZE_SIZE_OPTIONS,
} from './quiltDesignPalette.js';

/** Client fallback when /api/customize/config is unavailable. */
export function getClientFallbackCustomizeConfig() {
  return {
    enabled: true,
    page: {
      eyebrow: 'Custom studio',
      title: 'Customize your quilt',
      intro:
        'Build your quilt step by step—pick a quilt from our catalog, set size and colors, then pay securely with Stripe to confirm your custom quilt request. Our designer will follow up within 2–3 business days with next steps.',
    },
    steps: [
      {
        n: 1,
        key: 'design',
        label: 'Design',
        enabled: true,
        title: 'Choose a quilt to customize',
        description:
          'Start with a quilt from our shop, or upload your own design and pay a $30 deposit today. You will choose size, colors, and batting in the next step.',
        emptyProductsMessage: 'No published products are available yet.',
      },
      {
        n: 2,
        key: 'options',
        label: 'Size & colors',
        enabled: true,
        title: 'Size, colors & batting',
        showSelectedProduct: true,
        basedOnPrefix: 'Based on',
        estimatedPrefix: '— estimated starting at',
      },
      {
        n: 3,
        key: 'vision',
        label: 'Your vision',
        enabled: true,
        title: 'Tell our designer your vision',
        quiltTitleLabel: 'Working title (optional)',
        quiltTitlePlaceholder: 'e.g. Guest room sunset quilt',
        notesLabel: 'Notes for the designer',
        notesPlaceholder: 'Room colors, deadline, gift recipient, pattern tweaks, etc.',
      },
      {
        n: 4,
        key: 'contact',
        label: 'Contact',
        enabled: true,
        title: 'How can we reach you?',
        nameLabel: 'Full name',
        emailLabel: 'Email',
        phoneLabel: 'Phone (optional)',
      },
      {
        n: 5,
        key: 'pay',
        label: 'Pay',
        enabled: true,
        title: 'Review & pay',
        stripeIntro:
          "You will be redirected to Stripe's secure checkout to pay {amount}. Test cards work in sandbox mode (for example 4242 4242 4242 4242).",
        finePrint:
          'Payment confirms your custom quilt request. Our designer may adjust the final scope or quote before production begins.',
        countdownMessage: 'Please review your order. Payment unlocks in {seconds}…',
        payButtonLabel: 'Pay with Stripe',
        payButtonWaitingLabel: 'Pay in {seconds}s…',
        payButtonBusyLabel: 'Redirecting to Stripe…',
      },
    ],
    sections: {
      sizes: { enabled: true, heading: 'Quilt size', display: 'letter' },
      colors: { enabled: true, heading: 'Color palette', display: 'swatch' },
      batting: { enabled: true, heading: 'Batting preference', display: 'batting' },
    },
    defaults: {
      productSize: 'large',
      colorPalette: 'warm-neutrals',
      batting: 'cotton',
    },
    pay: { pauseSeconds: 4 },
    sizeOptions: CUSTOMIZE_SIZE_OPTIONS.map((o) => ({ ...o, enabled: true })),
    colorOptions: COLOR_PALETTE_OPTIONS.map((o) => ({ ...o, enabled: true })),
    battingOptions: BATTING_OPTIONS.map((o) => ({ ...o, enabled: true })),
    messages: {
      chooseProduct: 'Choose a product from the catalog to continue.',
      ownDesignRequired: 'Upload your design image to continue with your own design.',
      selectSizeColor: 'Select a size and color palette.',
      contactRequired: 'Enter your name and email so our designer can reach you.',
      selectDesignPay: 'Select a design before paying.',
      priceError: 'Could not calculate price for this design and size.',
      checkoutCancelled:
        'Payment was cancelled. Your design is saved — review and try again when ready.',
      loadingProducts: 'Loading products…',
      wizardDisabled: 'Custom quilt orders are temporarily unavailable. Please check back soon.',
    },
  };
}
