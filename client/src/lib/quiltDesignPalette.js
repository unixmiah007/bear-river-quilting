import {
  IMPROV_QUILT_BASTING_IMAGE,
  IMPROV_QUILTING_010_IMAGE,
  IMPROV_QUILTING_020_IMAGE,
  IMPROV_QUILTING_IMAGE,
  PRODUCTS_HERO_IMAGES,
  QUILT_CRAFT_DETAIL_IMAGE,
  QUILT_MISTY_IMAGE,
  QUILT_STUDIO_IMAGE,
  BATTING_BAMBOO_IMAGE,
  BATTING_COTTON_IMAGE,
  BATTING_WOOL_IMAGE,
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
    value: 'standard',
    label: 'Standard',
    code: 'Std',
    hint: 'Classic studio size · ~70" × 90"',
    image: IMPROV_QUILTING_010_IMAGE,
  },
  {
    value: 'small',
    label: 'Small',
    code: 'S',
    hint: 'Throw / lap · ~50" × 65"',
    image: QUILT_CRAFT_DETAIL_IMAGE,
  },
  {
    value: 'large',
    label: 'Large',
    code: 'L',
    hint: 'Full / queen · ~90" × 90"',
    image: IMPROV_QUILTING_IMAGE,
  },
  {
    value: 'x-large',
    label: 'X-Large',
    code: 'XLarge',
    hint: 'Oversized queen · ~96" × 96"',
    image: PRODUCTS_HERO_IMAGES[0].src,
  },
  {
    value: 'xx-large',
    label: 'XX-Large',
    code: 'XXLarge',
    hint: 'King · ~108" × 96"',
    image: PRODUCTS_HERO_IMAGES[1].src,
  },
  {
    value: 'xxx-large',
    label: 'XXX-Large',
    code: 'XXXLarge',
    hint: 'Oversized king · ~110" × 98"',
    image: QUILT_STUDIO_IMAGE,
  },
];

export const COLOR_PALETTE_OPTIONS = [
  {
    value: 'warm-neutrals',
    label: 'Warm neutrals',
    hint: 'Cream, tan, rust',
    colors: ['#f7f2ea', '#e8d4b8', '#c9956a', '#a65d3f'],
  },
  {
    value: 'cool-blues',
    label: 'Cool blues',
    hint: 'Soft blues & gray',
    colors: ['#e8f1f8', '#9bb8d4', '#5a7fa3', '#6b7280'],
  },
  {
    value: 'sage-greens',
    label: 'Sage greens',
    hint: 'Sage & forest tones',
    colors: ['#e4ebe4', '#9cb39a', '#5f7d5c', '#3d5340'],
  },
  {
    value: 'jewel-tones',
    label: 'Jewel tones',
    hint: 'Ruby, emerald, plum',
    colors: ['#9b2335', '#1f6f54', '#5c2d6e', '#c9a227'],
  },
  {
    value: 'monochrome',
    label: 'Monochrome',
    hint: 'Black, white, gray',
    colors: ['#ffffff', '#d1d5db', '#6b7280', '#111111'],
  },
  {
    value: 'scrappy-rainbow',
    label: 'Scrappy rainbow',
    hint: 'Mixed vibrant prints',
    colors: ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#457b9d', '#9b5de5'],
    swatchLayout: 'stripes',
  },
];

export const BATTING_OPTIONS = [
  {
    value: 'cotton',
    label: 'Cotton',
    hint: 'All-season, breathable',
    image: BATTING_COTTON_IMAGE,
  },
  {
    value: 'wool',
    label: 'Wool',
    hint: 'Warm, lightweight loft',
    image: BATTING_WOOL_IMAGE,
  },
  {
    value: 'bamboo',
    label: 'Bamboo',
    hint: 'Silky, drapey hand',
    image: BATTING_BAMBOO_IMAGE,
  },
  {
    value: 'unsure',
    label: 'Not sure',
    hint: 'Designer recommendation',
    code: '?',
  },
];

const SIZE_MULTIPLIERS = {
  standard: 0.85,
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
  const name = o.code ? `${o.label} ${o.code}` : o.label;
  return o.hint ? `${name} — ${o.hint}` : name;
}
