// Approximate city/township center points for the 19 -homes-for-rent
// cities (all 19 in property-management/cities.ts, including
// downtown-indianapolis since 2026-10-07)
// plus Indianapolis itself -- added 2026-09-29 so each city's new listings
// map has somewhere to center on even when that city currently has zero
// live units (the common case per CLAUDE.md/listings-build-notes.md).
// [longitude, latitude], matching RentEngineUnit.address.coordinates'
// GeoJSON order (see src/lib/listings/types.ts) so both can feed the same
// Mapbox calls without reordering.
export const CITY_CENTER: Record<string, [number, number]> = {
  indianapolis: [-86.1581, 39.7684],
  'downtown-indianapolis': [-86.1581, 39.7684],
  avon: [-86.3997, 39.7629],
  'broad-ripple': [-86.1439, 39.8698],
  brownsburg: [-86.3978, 39.8398],
  carmel: [-86.118, 39.9784],
  'center-township': [-86.1581, 39.7684],
  'decatur-township': [-86.268, 39.689],
  fishers: [-86.0134, 39.9568],
  'franklin-township': [-86.031, 39.696],
  greenwood: [-86.1067, 39.6137],
  'lawrence-township': [-86.03, 39.85],
  noblesville: [-86.0086, 40.0456],
  'perry-township': [-86.133, 39.68],
  'pike-township': [-86.24, 39.885],
  'warren-township': [-86.043, 39.777],
  'washington-township': [-86.15, 39.87],
  'wayne-township': [-86.247, 39.77],
  westfield: [-86.1275, 40.0428],
  zionsville: [-86.2606, 39.9508],
};
