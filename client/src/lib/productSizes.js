/** Values match server/lib/productSize.js PRODUCT_SIZE_VALUES */
export const PRODUCT_SIZE_OPTIONS = [
  { value: '', label: '— Not set —' },
  { value: 'small', label: 'Small' },
  { value: 'large', label: 'Large' },
  { value: 'x-large', label: 'X-Large' },
  { value: 'xx-large', label: 'XX-Large' },
  { value: 'xxx-large', label: 'XXX-Large' },
];

const LABELS = {
  small: 'Small',
  large: 'Large',
  'x-large': 'X-Large',
  'xx-large': 'XX-Large',
  'xxx-large': 'XXX-Large',
};

export function formatProductSizeLabel(value) {
  if (value == null || String(value).trim() === '') return null;
  const key = String(value).trim().toLowerCase();
  return LABELS[key] ?? value;
}
