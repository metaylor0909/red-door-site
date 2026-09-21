// Config for the 9 confirmed market-reports pages — one page per market
// cluster (not per city; the "West Side" cluster covers 3 cities as one
// page, matching the real recurring report series). See
// red-door-website-todo.md's "Market-reports page design" section for
// the full confirmed 9-market list and the reasoning behind it.

export interface MarketConfig {
  slug: string;
  h1: string;
  leadText: string;
  /** Chips shown under the hero lead — the city or cities this market covers. */
  serviceAreaChips: string[];
  /** RentCast city_key slugs (matching rentcast_city_cache's slug half,
   * before "-in") this market's snapshot should read. Multiple entries
   * are weighted-averaged (by totalListings, matching workers/rentcast-
   * refresh's own multi-ZIP convention). Empty array = no RentCast
   * coverage for this market at all (Anderson/Lebanon/Greenfield are
   * outside the 20-area ZIP mapping the refresh Worker covers) — the
   * snapshot section is omitted rather than faking numbers.
   */
  rentCastSlugs: string[];
  /** Sanity GROQ `match` patterns (each becomes `title match "*X*"`,
   * OR'd together) used to find this market's real posts. */
  postTitleMatches: string[];
  ctaHeading: string;
  /** /[slug]-property-management to link from the CTA band, or null if
   * no such page exists for this market (Anderson/Lebanon/Greenfield
   * have market-reports coverage but no property-management page —
   * confirmed in this project's own build notes) — falls back to the
   * Indianapolis property-management page, same as those notes decided. */
  propertyManagementHref: string | null;
  /** Subtitle shown under each entry in the "nearby markets" grid. */
  county: string;
}

export const MARKETS: MarketConfig[] = [
  {
    slug: 'indianapolis',
    h1: 'Indianapolis Market Report',
    leadText:
      "Red Door manages rental homes across Indianapolis' 37 standard-mail-delivery ZIP codes in Marion County — the broadest market we track, averaged countywide rather than by a single neighborhood.",
    serviceAreaChips: ['Indianapolis', 'Marion County'],
    rentCastSlugs: ['indianapolis'],
    postTitleMatches: ['Indianapolis'],
    ctaHeading: 'Own a Rental in Indianapolis?',
    propertyManagementHref: '/indianapolis-property-management',
    county: 'Marion County',
  },
  {
    slug: 'fishers',
    h1: 'Fishers Market Report',
    leadText:
      'Red Door manages rental homes across Fishers, one of the fastest-growing communities in Hamilton County — a market that only incorporated as a city in January 2015.',
    serviceAreaChips: ['Fishers'],
    rentCastSlugs: ['fishers'],
    postTitleMatches: ['Fishers'],
    ctaHeading: 'Own a Rental in Fishers?',
    propertyManagementHref: '/fishers-property-management',
    county: 'Hamilton County',
  },
  {
    slug: 'noblesville',
    h1: 'Noblesville Market Report',
    leadText:
      'Red Door manages rental homes across Noblesville, one of Hamilton County\'s oldest cities — founded in 1823, with a courthouse-square downtown that gives it a genuinely different character from its newer neighbors.',
    serviceAreaChips: ['Noblesville'],
    rentCastSlugs: ['noblesville'],
    postTitleMatches: ['Noblesville'],
    ctaHeading: 'Own a Rental in Noblesville?',
    propertyManagementHref: '/noblesville-property-management',
    county: 'Hamilton County',
  },
  {
    slug: 'westfield',
    h1: 'Westfield Market Report',
    leadText:
      "Red Door manages rental homes across Westfield, one of the fastest-growing suburbs in the metro — up more than 7x in population since 2000, anchored by Grand Park Sports Complex.",
    serviceAreaChips: ['Westfield'],
    rentCastSlugs: ['westfield'],
    postTitleMatches: ['Westfield'],
    ctaHeading: 'Own a Rental in Westfield?',
    propertyManagementHref: '/westfield-property-management',
    county: 'Hamilton County',
  },
  {
    slug: 'greenwood',
    h1: 'Greenwood Market Report',
    leadText:
      'Red Door manages rental homes across Greenwood, a steady southside market that has grown from about 36,000 to 69,000 residents since 2000 without the dramatic swings some Central Indiana suburbs see.',
    serviceAreaChips: ['Greenwood'],
    rentCastSlugs: ['greenwood'],
    postTitleMatches: ['Greenwood'],
    ctaHeading: 'Own a Rental in Greenwood?',
    propertyManagementHref: '/greenwood-property-management',
    county: 'Johnson County',
  },
  {
    slug: 'westside',
    h1: 'Westside Market Report',
    leadText:
      'Red Door manages rental homes across Avon, Brownsburg, and Plainfield — three Hendricks County communities we track together as one westside submarket, since pricing, inventory, and demand here move as a single market more than they follow city lines.',
    serviceAreaChips: ['Avon', 'Brownsburg', 'Plainfield'],
    // Plainfield has no rentcast_city_cache row (outside the 20-area ZIP
    // mapping workers/rentcast-refresh covers) — the snapshot below
    // averages Avon + Brownsburg only and says so explicitly, rather
    // than silently presenting a 2-of-3-city number as if it covered
    // all three.
    rentCastSlugs: ['avon', 'brownsburg'],
    postTitleMatches: ['Avon', 'Brownsburg', 'Plainfield', 'Westside', 'West Side'],
    ctaHeading: 'Own a Rental in Avon, Brownsburg, or Plainfield?',
    propertyManagementHref: '/avon-property-management',
    county: 'Hendricks County',
  },
  {
    slug: 'anderson',
    h1: 'Anderson Market Report',
    leadText:
      'Red Door tracks rental conditions in Anderson, the Madison County seat about 35 miles northeast of Indianapolis — a market with an older housing stock and rents that typically run below the Hamilton County suburbs.',
    serviceAreaChips: ['Anderson'],
    rentCastSlugs: [],
    postTitleMatches: ['Anderson'],
    ctaHeading: 'Own a Rental in Anderson?',
    propertyManagementHref: null,
    county: 'Madison County',
  },
  {
    slug: 'lebanon',
    h1: 'Lebanon Market Report',
    leadText:
      "Red Door tracks rental conditions in Lebanon, the Boone County seat about 28 miles northwest of Indianapolis — a market drawing new attention from the LEAP Innovation and Research District's major manufacturing investment nearby.",
    serviceAreaChips: ['Lebanon'],
    rentCastSlugs: [],
    postTitleMatches: ['Lebanon'],
    ctaHeading: 'Own a Rental in Lebanon?',
    propertyManagementHref: null,
    county: 'Boone County',
  },
  {
    slug: 'greenfield',
    h1: 'Greenfield Market Report',
    leadText:
      'Red Door tracks rental conditions in Greenfield, the Hancock County seat about 14 miles east of Indianapolis — one of the fastest-growing counties in the state, driven by new subdivisions near I-70.',
    serviceAreaChips: ['Greenfield'],
    rentCastSlugs: [],
    postTitleMatches: ['Greenfield'],
    ctaHeading: 'Own a Rental in Greenfield?',
    propertyManagementHref: null,
    county: 'Hancock County',
  },
];
