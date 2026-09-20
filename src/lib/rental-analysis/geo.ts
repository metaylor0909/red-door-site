/** Great-circle distance in miles. Same formula already used elsewhere in
 * this project (build_listing_detail.js's "nearby homes" ranking) — kept
 * separate here since this module has no dependency on that script. */
export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Loose address normalization for same-address (same-building) and
 * self-match comparisons — lowercase, strip punctuation, collapse
 * whitespace. Not a full address-parsing library; RentEngine's addresses
 * are consistently formatted enough that this is sufficient in practice. */
export function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[.,#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
