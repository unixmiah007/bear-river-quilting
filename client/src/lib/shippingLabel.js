export const emptyLabelAddress = {
  name: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
};

export function formatLabelBlock(addr) {
  const lines = [
    addr.name,
    addr.address1,
    addr.address2,
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(', '),
    addr.country,
    addr.phone ? `Phone: ${addr.phone}` : null,
  ].filter((line) => line != null && String(line).trim() !== '');
  return lines;
}
