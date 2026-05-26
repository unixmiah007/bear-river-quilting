/** Default return / ship-from address for printable labels (override via server/.env). */
export function getDefaultShipFrom() {
  return {
    name: process.env.SHIP_FROM_NAME?.trim() || 'Bear River Quilting',
    address1: process.env.SHIP_FROM_ADDRESS1?.trim() || '1200 Bear River Road',
    address2: process.env.SHIP_FROM_ADDRESS2?.trim() || '',
    city: process.env.SHIP_FROM_CITY?.trim() || 'Logan',
    state: process.env.SHIP_FROM_STATE?.trim() || 'UT',
    postalCode: process.env.SHIP_FROM_POSTAL_CODE?.trim() || '84321',
    country: process.env.SHIP_FROM_COUNTRY?.trim() || 'United States',
    phone: process.env.SHIP_FROM_PHONE?.trim() || '1-800-472-7849',
  };
}
