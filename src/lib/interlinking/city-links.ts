// Shared source of truth for cross-linking the three per-city page types
// (-property-management, -homes-for-rent, -market-reports) -- built
// 2026-09-28 per Michael's request for a single replicable module, after
// red-door-website-todo.md's "interlinking is thin to nonexistent" item
// (flagged 2026-09-24) confirmed the real gap: property-management and
// homes-for-rent already link to each other (see [city]-property-
// management.astro's market-snapshot section and [city]-homes-for-rent
// .astro's own cta-band), but neither links to -market-reports in either
// direction, and market-reports only links back to ONE property-
// management page via a single CTA button -- nothing to homes-for-rent.
//
// Deliberately NOT a new hand-maintained city list. property-management/
// cities.ts and market-reports/markets.ts already both exist and already
// both have real per-city/per-market data (which is why this file has to
// live in `interlinking/`, not get bolted onto either one) -- this module
// just cross-references them, so there's exactly one place a market's
// city coverage is ever declared (markets.ts's own serviceAreaChips).
import { CITIES as PROPERTY_MANAGEMENT_CITIES } from '../property-management/cities';
import { MARKETS } from '../market-reports/markets';

export interface CityPageLinks {
  slug: string;
  name: string;
  propertyManagementHref: string;
  homesForRentHref: string;
  /** null when this city has no -market-reports coverage at all (most of
   * the 19 property-management/homes-for-rent cities don't -- only 6 of
   * the 9 market-report clusters map to a city that also has its own
   * property-management/homes-for-rent pages). */
  marketReportHref: string | null;
  /** e.g. "Westside" -- the market's own h1 minus " Market Report", same
   * derivation as [market]-market-reports.astro's own "Other Markets"
   * grid. Null alongside marketReportHref. */
  marketReportLabel: string | null;
}

// Indianapolis has its own bespoke property-management/homes-for-rent
// pages (indianapolis-property-management.astro /
// indianapolis-homes-for-rent.astro), not the [city]-... dynamic route,
// so it isn't in property-management/cities.ts's CITIES list -- added
// back in here since it's a real, valid interlink target.
const KNOWN_CITIES: Array<{ slug: string; name: string }> = [
  { slug: 'indianapolis', name: 'Indianapolis' },
  ...PROPERTY_MANAGEMENT_CITIES,
];

function slugifyChip(chip: string): string {
  return chip.toLowerCase().replace(/\s+/g, '-');
}

// e.g. 'avon' -> 'westside' (from the westside market's serviceAreaChips
// including 'Avon'), 'broad-ripple' -> undefined (no market-reports
// coverage for Broad Ripple).
const marketSlugByCitySlug = new Map<string, string>();
for (const market of MARKETS) {
  for (const chip of market.serviceAreaChips) {
    marketSlugByCitySlug.set(slugifyChip(chip), market.slug);
  }
}

function hrefFor(kind: 'property-management' | 'homes-for-rent', slug: string): string {
  return slug === 'indianapolis' ? `/indianapolis-${kind}` : `/${slug}-${kind}`;
}

/** For a property-management or homes-for-rent page: this city's own
 * cross-links. propertyManagementHref/homesForRentHref are always
 * populated (every KNOWN_CITIES entry has both page types);
 * marketReportHref is null when this city has no report coverage. */
export function getCityLinks(citySlug: string): CityPageLinks | null {
  const city = KNOWN_CITIES.find((c) => c.slug === citySlug);
  if (!city) return null;
  const marketSlug = marketSlugByCitySlug.get(citySlug);
  const market = marketSlug ? MARKETS.find((m) => m.slug === marketSlug) : undefined;
  return {
    slug: city.slug,
    name: city.name,
    propertyManagementHref: hrefFor('property-management', city.slug),
    homesForRentHref: hrefFor('homes-for-rent', city.slug),
    marketReportHref: market ? `/${market.slug}-market-reports` : null,
    marketReportLabel: market ? market.h1.replace(' Market Report', '') : null,
  };
}

/** For a market-reports page: the cities within this market cluster that
 * actually have their own property-management/homes-for-rent pages --
 * e.g. westside's serviceAreaChips are Avon/Brownsburg/Plainfield, but
 * only Avon has dedicated pages, so this returns just Avon rather than
 * three links where two would 404. */
export function getCitiesForMarket(marketSlug: string): CityPageLinks[] {
  const market = MARKETS.find((m) => m.slug === marketSlug);
  if (!market) return [];
  return market.serviceAreaChips
    .map((chip) => slugifyChip(chip))
    .map((slug) => getCityLinks(slug))
    .filter((c): c is CityPageLinks => c !== null);
}
