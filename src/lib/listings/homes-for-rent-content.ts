// Data loaders for the 19 simple city "homes for rent" hub pages
// (src/pages/[city]-homes-for-rent.astro). Pulled out into a real module —
// not top-level helper functions declared inside the page's frontmatter —
// because the Cloudflare adapter's prerender step calls getStaticPaths in
// an isolated bundle that only carries real `import` bindings through, not
// other top-level consts/functions defined in the same .astro file.
// Confirmed by hitting `ReferenceError: <name> is not defined` at prerender
// time for both a JSON import and a local helper function declared directly
// in the .astro frontmatter before this file existed.
//
// Loaded via Vite's `import.meta.glob(..., { eager: true })`, not
// `fs.readFileSync` — the Cloudflare prerender step runs in a miniflare
// sandbox whose filesystem is the built worker bundle (`/bundle`), not this
// repo checkout, so a runtime fs read of a repo-relative path 404s there
// even though it works fine under plain `astro build`'s Node-side
// type-check. `import.meta.glob` resolves and inlines the JSON at build
// time instead, so no runtime file access is needed at all.

export interface CityStatTile {
  label: string;
  value: string;
  sub: string;
}

export interface CityNearbyItem {
  label: string;
  href: string | null;
}

export interface CityContent {
  citySlug: string;
  cityName: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  heroDek: string;
  dataAsOf: string;
  statTiles: CityStatTile[];
  snapshotDetail: string[];
  whatToExpectHeading: string;
  whatToExpectItemsHtml: string[];
  currentlyAvailableHeading: string;
  nearbyDek: string;
  nearby: CityNearbyItem[];
  ctaHeading: string;
  ctaText: string;
  propertyManagementHref: string;
}

interface BedroomBreakdownRaw {
  bedrooms: number;
  averageRent: number;
  newListings: number;
  totalListings: number;
}

export interface BedroomLadderEntry {
  beds: number;
  avgRent: number;
  newListings: number;
  totalListings: number;
}

interface CityMarketDataRaw {
  citySlug: string;
  zipsUsed: string[];
  rentalData?: {
    dataByBedrooms?: BedroomBreakdownRaw[];
  };
}

// Eagerly globbed at build time — becomes real bundled data, not a runtime
// file read. Keys are the resolved module paths Vite assigns (relative to
// this file), values are each JSON file's parsed default export.
const cityContentModules = import.meta.glob<{ default: Record<string, CityContent> }>(
  '../../data/homes-for-rent-content.json',
  { eager: true }
);

const cityMarketDataModules = import.meta.glob<{ default: CityMarketDataRaw }>('../../../data/homes-for-rent/*.json', {
  eager: true,
});

/** The 19 real city content entries, extracted from the approved static
 * reference pages at the repo root by scripts/extract-homes-for-rent-content.mjs
 * into src/data/homes-for-rent-content.json. Indianapolis is excluded (out
 * of scope — it keeps its own real search/filter/map page). */
export function loadCityContentMap(): Record<string, CityContent> {
  const [, module] = Object.entries(cityContentModules)[0] ?? [];
  if (!module) {
    throw new Error('src/data/homes-for-rent-content.json not found — run scripts/extract-homes-for-rent-content.mjs.');
  }
  return module.default;
}

/** Reads a city's real RentCast pull (data/homes-for-rent/{slug}.json) and
 * returns the ZIP list to match live RentEngine units against, plus the
 * bedroomLadder shape from claude/red-door-homes-for-rent-data-schema.md —
 * only bedroom counts RentCast actually returned, never an interpolated or
 * guessed one. */
export function loadCityMarketData(slug: string): { zipsUsed: string[]; bedroomLadder: BedroomLadderEntry[] } {
  const entry = Object.entries(cityMarketDataModules).find(([filePath]) => filePath.endsWith(`/${slug}.json`));
  if (!entry) {
    throw new Error(`No RentCast data file found for city "${slug}" under data/homes-for-rent/.`);
  }
  const raw = entry[1].default;
  const zipsUsed = raw.zipsUsed ?? [];
  const dataByBedrooms = raw.rentalData?.dataByBedrooms ?? [];
  const bedroomLadder = dataByBedrooms
    .slice()
    .sort((a, b) => a.bedrooms - b.bedrooms)
    .map((b) => ({
      beds: b.bedrooms,
      avgRent: b.averageRent,
      newListings: b.newListings,
      totalListings: b.totalListings,
    }));
  return { zipsUsed, bedroomLadder };
}
