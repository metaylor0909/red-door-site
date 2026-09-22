// RentCast `/avm/rent/long-term` — the second comp source, added
// 2026-09-22 after Michael flagged (and a live side-by-side pull
// confirmed) that RentEngine's own comp pool was landing too thin on two
// real submissions: 1 comp for a 3bd/2ba Indianapolis address, 4 for a
// 4bd/2.5ba Plainfield one, even after the property-type/status-casing
// bugs elsewhere in this module were fixed. A real pull against the same
// two addresses returned 20 tightly-correlated comps each (0.93-0.98
// correlation, mostly under a mile) from this single endpoint.
//
// One call returns BOTH currently-Active listings and RentCast's
// "Inactive" ones (delisted) in the same `comparables` array — no need
// for a second call to /listings/rental/long-term. Mapped into this
// tool's own RentEngineComp shape (source: 'rentcast') so the existing
// comp-selection cascade, estimate blend, and market-context math all
// run against one unified pool without needing their own RentCast-aware
// branch — see comp-selection.ts and fallback-and-estimate.ts for where
// the merged pool actually gets used.
//
// IMPORTANT, confirmed against a real response (2026-09-22): RentCast's
// "Inactive" status does NOT mean "confirmed leased" — it means "no
// longer an active listing," full stop. One real comp showed a
// listedDate and removedDate one day apart; its `price` is the last
// asking price, not a confirmed close. Mapped to this tool's own
// 'inactive' status (a new third value, distinct from RentEngine's
// 'rented'/'available') specifically so downstream code never conflates
// it with a confirmed RentEngine lease. See fallback-and-estimate.ts's
// three-tier blend and market-context.ts's exclusion of 'inactive' from
// the supply/demand and time-to-lease panels.

import type { RentEngineComp, SubjectProperty } from './types';

const MAX_RADIUS_MILES = 5; // matches comp-selection.ts's widest cascade step
const COMP_COUNT = 25;
const MAX_DAYS_OLD = 365; // matches the cascade's widest (12mo) date window

interface RentCastComparable {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  propertyType?: string | null;
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number | null;
  status: 'Active' | 'Inactive';
  price: number;
  listedDate?: string | null;
  removedDate?: string | null;
  daysOnMarket?: number | null;
  daysOld?: number | null;
}

interface RentCastAvmResponse {
  rent?: number;
  comparables?: RentCastComparable[];
}

export interface RentCastCompsConfig {
  apiKey: string;
}

/** Maps one RentCast comparable into this tool's own comp shape. Fields
 * RentCast doesn't report (furnished, in_apartment_complex, unit_number)
 * default to the same "assume not" values comp-selection.ts's filters
 * already tolerate for any comp missing that signal. */
function mapComparable(c: RentCastComparable): RentEngineComp {
  const isInactive = c.status === 'Inactive';
  return {
    address: c.formattedAddress,
    unit_number: null,
    beds: c.bedrooms,
    baths: c.bathrooms,
    sqft: c.squareFootage ?? null,
    rent: c.price,
    days_on_market: c.daysOnMarket ?? null,
    // Repurposed for 'inactive' comps as "date it left the market" (its
    // removedDate) rather than a confirmed lease date — isWithinDateWindow
    // in comp-selection.ts only uses this for recency filtering, which
    // removedDate serves just as well as a true date_rented would, with
    // the caveat (documented above) that it isn't a confirmed lease.
    date_rented: isInactive ? (c.removedDate ?? null) : null,
    status: isInactive ? 'inactive' : 'available',
    latitude: c.latitude,
    longitude: c.longitude,
    property_type: c.propertyType ?? '',
    zipcode: '',
    furnished: false,
    in_apartment_complex: false,
    num_parking_spots: null,
    source: 'rentcast',
  };
}

/** Fetches RentCast's rent-estimate comparables for the subject address.
 * Returns an empty array (never throws past its own catch) on any
 * failure — RentCast comps are an augmentation to RentEngine's pool, not
 * a hard requirement; submit.ts's estimate still works from RentEngine
 * alone if this fails, same graceful-degradation pattern as every other
 * optional integration in this tool. */
export async function fetchRentCastComps(subject: SubjectProperty, config: RentCastCompsConfig): Promise<RentEngineComp[]> {
  const url = new URL('https://api.rentcast.io/v1/avm/rent/long-term');
  url.searchParams.set('address', `${subject.address}, ${subject.city}, ${subject.state} ${subject.zip}`);
  if (subject.property_type && subject.property_type !== 'other') {
    // RentCast's own vocabulary ("Single Family", "Townhouse", ...) — the
    // reverse direction of classifyRentEnginePropertyType, but only a
    // handful of this tool's PropertyType values need a real mapping;
    // RentCast tolerates the rest being omitted (it just widens its own
    // search rather than rejecting the request).
    const rentCastType: Record<string, string> = {
      'single-family': 'Single Family',
      townhome: 'Townhouse',
      condo: 'Condo',
      duplex: 'Multi-Family',
      'multi-family': 'Multi-Family',
    };
    const mapped = rentCastType[subject.property_type];
    if (mapped) url.searchParams.set('propertyType', mapped);
  }
  url.searchParams.set('bedrooms', String(subject.beds));
  url.searchParams.set('bathrooms', String(subject.baths));
  if (subject.sqft != null) url.searchParams.set('squareFootage', String(subject.sqft));
  url.searchParams.set('maxRadius', String(MAX_RADIUS_MILES));
  url.searchParams.set('compCount', String(COMP_COUNT));
  url.searchParams.set('daysOld', String(MAX_DAYS_OLD));

  try {
    const response = await fetch(url, { headers: { 'X-Api-Key': config.apiKey, accept: 'application/json' } });
    if (!response.ok) {
      console.error(`[rental-analysis] RentCast AVM comps request failed: ${response.status} ${await response.text()}`);
      return [];
    }
    const data = (await response.json()) as RentCastAvmResponse;
    return (data.comparables ?? []).map(mapComparable);
  } catch (err) {
    console.error('[rental-analysis] RentCast AVM comps request threw:', err);
    return [];
  }
}
