// The 20 served homes-for-rent areas and their exact ZIP lists — copied
// directly from claude/red-door-rentcast-zip-mapping.md (resolved,
// FINAL, 2026-09-11). Do not re-derive or edit this list without
// updating that doc too; it's the single source of truth for which ZIPs
// belong to which area. citySlug values match the existing filenames in
// data/homes-for-rent/*.json exactly, so this Worker's writes and the
// Astro pages' reads stay keyed consistently.

export interface CityConfig {
  citySlug: string;
  cityName: string;
  state: string;
  zips: string[];
}

export const CITIES: CityConfig[] = [
  // Standalone suburbs / neighborhoods
  { citySlug: 'avon', cityName: 'Avon', state: 'IN', zips: ['46123'] },
  { citySlug: 'brownsburg', cityName: 'Brownsburg', state: 'IN', zips: ['46112'] },
  { citySlug: 'carmel', cityName: 'Carmel', state: 'IN', zips: ['46032', '46033'] },
  { citySlug: 'fishers', cityName: 'Fishers', state: 'IN', zips: ['46037', '46038'] },
  { citySlug: 'greenwood', cityName: 'Greenwood', state: 'IN', zips: ['46142', '46143'] },
  { citySlug: 'noblesville', cityName: 'Noblesville', state: 'IN', zips: ['46060', '46062'] },
  { citySlug: 'westfield', cityName: 'Westfield', state: 'IN', zips: ['46074'] },
  { citySlug: 'zionsville', cityName: 'Zionsville', state: 'IN', zips: ['46077'] },
  { citySlug: 'broad-ripple', cityName: 'Broad Ripple', state: 'IN', zips: ['46220'] },
  { citySlug: 'downtown-indianapolis', cityName: 'Downtown Indianapolis', state: 'IN', zips: ['46202', '46204', '46225'] },

  // Marion County townships — full ZIP list per township, averaged
  // (never a single "representative" ZIP — see the mapping doc for why:
  // avoids two townships that share ZIPs, e.g. Center/Franklin, from
  // rendering byte-identical numbers).
  { citySlug: 'center-township', cityName: 'Center Township', state: 'IN', zips: ['46107', '46201', '46202', '46203', '46204', '46205', '46208', '46217', '46218', '46219', '46221', '46222', '46225', '46237'] },
  { citySlug: 'decatur-township', cityName: 'Decatur Township', state: 'IN', zips: ['46113', '46217', '46221', '46231', '46241'] },
  { citySlug: 'franklin-township', cityName: 'Franklin Township', state: 'IN', zips: ['46107', '46203', '46237', '46239', '46259'] },
  { citySlug: 'lawrence-township', cityName: 'Lawrence Township', state: 'IN', zips: ['46216', '46218', '46220', '46226', '46235', '46236', '46250', '46256'] },
  { citySlug: 'perry-township', cityName: 'Perry Township', state: 'IN', zips: ['46107', '46203', '46217', '46225', '46227', '46237'] },
  { citySlug: 'pike-township', cityName: 'Pike Township', state: 'IN', zips: ['46077', '46228', '46234', '46254', '46260', '46268', '46278'] },
  { citySlug: 'warren-township', cityName: 'Warren Township', state: 'IN', zips: ['46203', '46218', '46219', '46226', '46229', '46235', '46239'] },
  { citySlug: 'washington-township', cityName: 'Washington Township', state: 'IN', zips: ['46205', '46208', '46218', '46220', '46226', '46228', '46240', '46250', '46260', '46268'] },
  { citySlug: 'wayne-township', cityName: 'Wayne Township', state: 'IN', zips: ['46214', '46221', '46222', '46224', '46231', '46234', '46241', '46254'] },

  // Indianapolis umbrella — countywide average across the 37 standard-
  // delivery ZIPs (of the county's 56; 19 are PO-Box-only/single-entity
  // and excluded, per the mapping doc's resolved decision). 46183 is
  // excluded everywhere, including from Decatur Township above.
  {
    citySlug: 'indianapolis',
    cityName: 'Indianapolis',
    state: 'IN',
    zips: [
      '46107', '46201', '46202', '46203', '46204', '46205', '46208', '46214', '46216', '46217',
      '46218', '46219', '46220', '46221', '46222', '46224', '46225', '46226', '46227', '46228',
      '46229', '46231', '46234', '46235', '46236', '46237', '46239', '46240', '46241', '46250',
      '46254', '46256', '46259', '46260', '46268', '46278', '46282',
    ],
  },

  // Homepage-listed service areas with no dedicated homes-for-rent/
  // property-management page — added 2026-09-23 so the rental-analysis
  // (CMA) tool can serve real city-level data for these on request,
  // instead of omitting the section entirely (Michael: "we get lots of
  // requests" for towns like Ingalls with no city page). ZIPs verified
  // against each town's Wikipedia infobox, cross-checked against a live
  // Mapbox geocode of the town center — not guessed. Several (Southport,
  // Beech Grove, Lawrence, Speedway, Cumberland) share a ZIP already
  // pulled for a Marion County township above — distinctZips() below
  // already dedupes, so those cost zero additional API calls; the rest
  // are net-new. See [token].astro's own note on why RENTCAST_COVERED_SLUGS
  // was removed in favor of just trying the D1 read — this list can keep
  // growing without another code change on the report-page side.
  { citySlug: 'southport', cityName: 'Southport', state: 'IN', zips: ['46227'] },
  { citySlug: 'beech-grove', cityName: 'Beech Grove', state: 'IN', zips: ['46107'] },
  { citySlug: 'lawrence', cityName: 'Lawrence', state: 'IN', zips: ['46216', '46226', '46235', '46236'] },
  { citySlug: 'speedway', cityName: 'Speedway', state: 'IN', zips: ['46224'] },
  { citySlug: 'cumberland', cityName: 'Cumberland', state: 'IN', zips: ['46229'] },
  { citySlug: 'anderson', cityName: 'Anderson', state: 'IN', zips: ['46011', '46012', '46013', '46016', '46017'] },
  { citySlug: 'pendleton', cityName: 'Pendleton', state: 'IN', zips: ['46064'] },
  { citySlug: 'lapel', cityName: 'Lapel', state: 'IN', zips: ['46051'] },
  { citySlug: 'ingalls', cityName: 'Ingalls', state: 'IN', zips: ['46048'] },
  { citySlug: 'danville', cityName: 'Danville', state: 'IN', zips: ['46122'] },
  { citySlug: 'franklin', cityName: 'Franklin', state: 'IN', zips: ['46131'] },
  { citySlug: 'whiteland', cityName: 'Whiteland', state: 'IN', zips: ['46184'] },
  { citySlug: 'bargersville', cityName: 'Bargersville', state: 'IN', zips: ['46106'] },
  { citySlug: 'greenfield', cityName: 'Greenfield', state: 'IN', zips: ['46140'] },
  { citySlug: 'mccordsville', cityName: 'McCordsville', state: 'IN', zips: ['46055'] },
  { citySlug: 'new-palestine', cityName: 'New Palestine', state: 'IN', zips: ['46163'] },
  { citySlug: 'fortville', cityName: 'Fortville', state: 'IN', zips: ['46040'] },
  { citySlug: 'shelbyville', cityName: 'Shelbyville', state: 'IN', zips: ['46176'] },
  { citySlug: 'fairland', cityName: 'Fairland', state: 'IN', zips: ['46126'] },
  { citySlug: 'morristown', cityName: 'Morristown', state: 'IN', zips: ['46161'] },
  { citySlug: 'boggstown', cityName: 'Boggstown', state: 'IN', zips: ['46110'] },
  { citySlug: 'whitestown', cityName: 'Whitestown', state: 'IN', zips: ['46075'] },
  { citySlug: 'lebanon', cityName: 'Lebanon', state: 'IN', zips: ['46052'] },
  { citySlug: 'mooresville', cityName: 'Mooresville', state: 'IN', zips: ['46158'] },
  { citySlug: 'martinsville', cityName: 'Martinsville', state: 'IN', zips: ['46151'] },
  // Plainfield previously had no row of its own — the rental-analysis
  // tool blended it into an Avon+Brownsburg "West Side" average instead
  // (2026-09-22). Now gets its own real data like every other area;
  // see rentcast-blend.ts and markets.ts for the "West Side combined"
  // view, which still exists (now correctly averaging all 3 real cities
  // instead of silently 2 of 3) but is separate from this per-city row.
  { citySlug: 'plainfield', cityName: 'Plainfield', state: 'IN', zips: ['46168'] },
];

/** Every distinct ZIP across all 20 areas — 50 total per the mapping doc.
 * Fetch each ONCE and reuse across every area that shares it, rather than
 * re-fetching the same ZIP per area (RentCast has no batch endpoint —
 * every call, including a repeat of the same ZIP, counts against the
 * plan the same way). */
export function distinctZips(): string[] {
  const zips = new Set<string>();
  for (const city of CITIES) {
    for (const zip of city.zips) zips.add(zip);
  }
  return Array.from(zips);
}
