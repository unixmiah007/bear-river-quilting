import {
  IMPROV_QUILT_BASTING_IMAGE,
  IMPROV_QUILTING_010_IMAGE,
  IMPROV_QUILTING_020_IMAGE,
  IMPROV_QUILTING_IMAGE,
  PRODUCTS_HERO_IMAGES,
  QUILT_CRAFT_DETAIL_IMAGE,
  QUILT_MISTY_IMAGE,
  QUILT_STUDIO_IMAGE,
  SEWING_MACHINE_IMAGE,
} from './quiltAssets.js';

/** Design templates for the Customize wizard (ids must match server allowlist). */
export const QUILT_DESIGN_PALETTE = [
  {
    id: 'heritage-log-cabin',
    name: 'Heritage Log Cabin',
    description: 'Classic log-cabin blocks with warm heirloom tones.',
    image: IMPROV_QUILTING_IMAGE,
    basePrice: 289,
  },
  {
    id: 'modern-loft-stripe',
    name: 'Modern Loft Stripe',
    description: 'Clean linear piecing with bold negative space.',
    image: IMPROV_QUILTING_020_IMAGE,
    basePrice: 319,
  },
  {
    id: 'prairie-nine-patch',
    name: 'Prairie Nine Patch',
    description: 'Repeating nine-patch grid with scrappy charm.',
    image: IMPROV_QUILTING_010_IMAGE,
    basePrice: 269,
  },
  {
    id: 'sunset-flying-geese',
    name: 'Sunset Flying Geese',
    description: 'Directional geese in amber, cream, and rust.',
    image: PRODUCTS_HERO_IMAGES[0].src,
    basePrice: 299,
  },
  {
    id: 'sage-basting',
    name: 'Sage Basting Study',
    description: 'Soft sage layers with hand-finished texture.',
    image: IMPROV_QUILT_BASTING_IMAGE,
    basePrice: 279,
  },
  {
    id: 'misty-floral',
    name: 'Misty Floral',
    description: 'Gentle florals and low-contrast blending.',
    image: QUILT_MISTY_IMAGE,
    basePrice: 309,
  },
  {
    id: 'studio-medallion',
    name: 'Studio Medallion',
    description: 'Center medallion with framed borders.',
    image: QUILT_STUDIO_IMAGE,
    basePrice: 349,
  },
  {
    id: 'patchwork-heritage',
    name: 'Patchwork Heritage',
    description: 'Geometric patchwork in rich, saturated blocks.',
    image: PRODUCTS_HERO_IMAGES[2].src,
    basePrice: 289,
  },
];

/** Step 2 — size cards (values must match server product_size). */
export const CUSTOMIZE_SIZE_OPTIONS = [
  {
    value: 'small',
    label: 'Small',
    hint: 'Throw / lap · ~50" × 65"',
    image: QUILT_CRAFT_DETAIL_IMAGE,
  },
  {
    value: 'large',
    label: 'Large',
    hint: 'Full / queen · ~90" × 90"',
    image: IMPROV_QUILTING_IMAGE,
  },
  {
    value: 'x-large',
    label: 'X-Large',
    hint: 'Oversized queen · ~96" × 96"',
    image: PRODUCTS_HERO_IMAGES[0].src,
  },
  {
    value: 'xx-large',
    label: 'XX-Large',
    hint: 'King · ~108" × 96"',
    image: PRODUCTS_HERO_IMAGES[1].src,
  },
  {
    value: 'xxx-large',
    label: 'XXX-Large',
    hint: 'Oversized king · ~110" × 98"',
    image: QUILT_STUDIO_IMAGE,
  },
];

export const COLOR_PALETTE_OPTIONS = [
  {
    value: 'warm-neutrals',
    label: 'Warm neutrals',
    hint: 'Cream, tan, rust',
    image: IMPROV_QUILTING_IMAGE,
  },
  {
    value: 'cool-blues',
    label: 'Cool blues',
    hint: 'Soft blues & gray',
    image: QUILT_MISTY_IMAGE,
  },
  {
    value: 'sage-greens',
    label: 'Sage greens',
    hint: 'Sage & forest tones',
    image: IMPROV_QUILT_BASTING_IMAGE,
  },
  {
    value: 'jewel-tones',
    label: 'Jewel tones',
    hint: 'Ruby, emerald, plum',
    image: PRODUCTS_HERO_IMAGES[2].src,
  },
  {
    value: 'monochrome',
    label: 'Monochrome',
    hint: 'Black, white, gray',
    image: IMPROV_QUILTING_020_IMAGE,
  },
  {
    value: 'scrappy-rainbow',
    label: 'Scrappy rainbow',
    hint: 'Mixed vibrant prints',
    image: PRODUCTS_HERO_IMAGES[3].src,
  },
];

export const BATTING_OPTIONS = [
  {
    value: 'cotton',
    label: 'Cotton',
    hint: 'All-season, breathable',
    image: QUILT_CRAFT_DETAIL_IMAGE,
  },
  {
    value: 'wool',
    label: 'Wool',
    hint: 'Warm, lightweight loft',
    image: IMPROV_QUILTING_010_IMAGE,
  },
  {
    value: 'bamboo',
    label: 'Bamboo',
    hint: 'Silky, drapey hand',
    image: QUILT_MISTY_IMAGE,
  },
  {
    value: 'unsure',
    label: 'Not sure',
    hint: 'Designer recommendation',
    image: SEWING_MACHINE_IMAGE,
  },
];

const SIZE_MULTIPLIERS = {
  small: 0.85,
  large: 1,
  'x-large': 1.12,
  'xx-large': 1.22,
  'xxx-large': 1.32,
};

export function estimateCustomQuiltPrice(designId, productSize) {
  const design = QUILT_DESIGN_PALETTE.find((d) => d.id === designId);
  if (!design) return null;
  const mult = SIZE_MULTIPLIERS[productSize] ?? 1;
  return Math.round(design.basePrice * mult * 100) / 100;
}

export function getDesignById(id) {
  return QUILT_DESIGN_PALETTE.find((d) => d.id === id) ?? null;
}

export function labelForColorPalette(value) {
  const o = COLOR_PALETTE_OPTIONS.find((opt) => opt.value === value);
  if (!o) return value;
  return o.hint ? `${o.label} (${o.hint})` : o.label;
}

export function labelForBatting(value) {
  const o = BATTING_OPTIONS.find((opt) => opt.value === value);
  if (!o) return value;
  return o.hint ? `${o.label} (${o.hint})` : o.label;
}

export function labelForCustomizeSize(value) {
  const o = CUSTOMIZE_SIZE_OPTIONS.find((opt) => opt.value === value);
  if (!o) return value;
  return o.hint ? `${o.label} — ${o.hint}` : o.label;
}
