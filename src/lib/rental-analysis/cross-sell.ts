// Decision #5's homes-for-rent cross-sell: "shows current listings in
// the subject property's own city first, falling back to a 'homes
// available nearby' set when that city's own inventory is thin" — the
// same default-city-then-nearby pattern already locked for the
// `-homes-for-rent` hub pages. Listings skew heavily to Indianapolis
// (confirmed in claude/listings-build-notes.md), so the fallback is the
// common case, not an edge case.

import { haversineMiles } from './geo';
import type { AvailableUnit } from './listings-client';

const CARD_COUNT = 3;

export function selectCrossSellUnits(
  units: AvailableUnit[],
  subject: { city: string; latitude: number; longitude: number }
): AvailableUnit[] {
  const sameCity = units.filter((u) => u.city.toLowerCase() === subject.city.toLowerCase());
  if (sameCity.length >= CARD_COUNT) {
    return sameCity.slice(0, CARD_COUNT);
  }

  // Thin (or zero) same-city inventory — fill the rest from the closest
  // other units, same "nearby fallback" reasoning as the hub pages.
  const remaining = units.filter((u) => !sameCity.includes(u) && u.latitude != null && u.longitude != null);
  const byDistance = remaining
    .map((u) => ({ unit: u, distance: haversineMiles(subject.latitude, subject.longitude, u.latitude!, u.longitude!) }))
    .sort((a, b) => a.distance - b.distance)
    .map((w) => w.unit);

  return [...sameCity, ...byDistance].slice(0, CARD_COUNT);
}
