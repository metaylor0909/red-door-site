// Pulled into a real module rather than declared inline in
// [city]-property-management.astro's frontmatter — the Cloudflare
// adapter's prerender step doesn't reliably see top-level consts declared
// directly in an .astro file from inside getStaticPaths() (confirmed
// building this exact page: "ReferenceError: CITIES is not defined").
// Same fix already applied to the homes-for-rent pages — see
// src/lib/listings/homes-for-rent-content.ts's own header comment.

export interface CityEntry {
  slug: string;
  name: string;
  /** False for a city with a property-management page but no
   * -homes-for-rent page of its own (the six added 2026-11-10). Its
   * rental-listing links go to the all-areas listings view instead. */
  hasHomesForRent?: boolean;
  /** -market-reports slugs to show, nearest first, as a gallery where the
   * city's own report strip would be. Only for cities with no market
   * report of their own (the 2026-11-10 pilots): the L10 decided not to
   * add market reports for new cities. */
  nearbyMarkets?: string[];
}

// The 19 simple cities (Indianapolis excluded — its own mockup uses a
// meaningfully different design, see the .astro file's header comment).
// Same slug set as the -homes-for-rent pages. Downtown Indianapolis added
// 2026-10-07: it was a real old-site page (/downtown-indianapolis-property-
// management, MIGRATE in the migration plan) that 9 blog posts link to.
export const CITIES: CityEntry[] = [
  { slug: 'avon', name: 'Avon' },
  { slug: 'broad-ripple', name: 'Broad Ripple' },
  { slug: 'brownsburg', name: 'Brownsburg' },
  { slug: 'carmel', name: 'Carmel' },
  { slug: 'center-township', name: 'Center Township' },
  { slug: 'decatur-township', name: 'Decatur Township' },
  { slug: 'downtown-indianapolis', name: 'Downtown Indianapolis' },
  { slug: 'fishers', name: 'Fishers' },
  { slug: 'franklin-township', name: 'Franklin Township' },
  { slug: 'greenwood', name: 'Greenwood' },
  { slug: 'lawrence-township', name: 'Lawrence Township' },
  { slug: 'noblesville', name: 'Noblesville' },
  { slug: 'perry-township', name: 'Perry Township' },
  { slug: 'pike-township', name: 'Pike Township' },
  { slug: 'warren-township', name: 'Warren Township' },
  { slug: 'washington-township', name: 'Washington Township' },
  { slug: 'wayne-township', name: 'Wayne Township' },
  { slug: 'westfield', name: 'Westfield' },
  { slug: 'zionsville', name: 'Zionsville' },

  // Added 2026-11-10 (Marketing L10). Anderson, Greenfield, and Lebanon
  // back up the market reports already published for them; Danville,
  // Fortville, and McCordsville are a pilot (about 90 days in Search
  // Console before deciding on more cities). None has a homes-for-rent
  // page, and the pilots have no market report of their own. RentCast
  // data for all six was already in rentcast_city_cache (added to
  // workers/rentcast-refresh 2026-09-23 for the rental analysis tool).
  { slug: 'anderson', name: 'Anderson', hasHomesForRent: false },
  { slug: 'greenfield', name: 'Greenfield', hasHomesForRent: false },
  { slug: 'lebanon', name: 'Lebanon', hasHomesForRent: false },
  { slug: 'danville', name: 'Danville', hasHomesForRent: false, nearbyMarkets: ['westside', 'indianapolis', 'lebanon'] },
  { slug: 'fortville', name: 'Fortville', hasHomesForRent: false, nearbyMarkets: ['greenfield', 'fishers', 'anderson'] },
  { slug: 'mccordsville', name: 'McCordsville', hasHomesForRent: false, nearbyMarkets: ['greenfield', 'fishers', 'indianapolis'] },
];
