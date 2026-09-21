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
// REVISED 2026-09-21 — market data (stat tiles, bedroom ladder, ZIP list)
// now reads from the shared rentcast_city_cache D1 table that
// workers/rentcast-refresh writes monthly, instead of the static
// data/homes-for-rent/*.json snapshot frozen from the Sep 17 one-time
// pull. Confirmed this session that D1 bindings (via `cloudflare:workers`)
// ARE available during getStaticPaths() prerendering, unlike raw
// filesystem access — this is a real, viable build-time data source, not
// a workaround. Falls back to the static snapshot file if D1 has no row
// yet for a city (e.g. the Worker hasn't run in this environment), so
// local dev doesn't require deploying and running the Worker first.
//
// City facts (hero copy, "What to Expect" prose, curated nearby links,
// CTA copy) stay static, loaded from src/data/homes-for-rent-content.json
// via import.meta.glob — this is real editorial content extracted once
// from the approved reference pages, not RentCast-derived numbers, so
// there's nothing for the Cron Worker to refresh there. Only the
// mechanically-derivable numbers (stat tiles' values, bedroom ladder,
// dataAsOf) are regenerated from fresh data; the more nuanced prose
// paragraph (snapshotDetail, e.g. "Half of Avon's listings lease within
// 11 days...") stays frozen at the original extraction — regenerating
// natural-language prose from raw numbers is a meaningfully bigger,
// separate task, not attempted here.

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

interface RentCastBedroomEntry {
  bedrooms: number;
  averageRent: number;
  newListings: number;
  totalListings: number;
}

interface RentCastPropertyTypeEntry {
  propertyType: string;
  averageRent: number | null;
  totalListings: number;
}

export interface BedroomLadderEntry {
  beds: number;
  avgRent: number;
  newListings: number;
  totalListings: number;
}

interface RentalDataBlock {
  averageRent?: number | null;
  medianRent?: number | null;
  minRent?: number | null;
  maxRent?: number | null;
  totalListings?: number;
  dataByBedrooms?: RentCastBedroomEntry[];
  dataByPropertyType?: RentCastPropertyTypeEntry[];
}

interface CityMarketDataRaw {
  citySlug: string;
  zipsUsed: string[];
  dataAsOf?: string;
  rentalData?: RentalDataBlock;
}

export interface CityMarketData {
  zipsUsed: string[];
  bedroomLadder: BedroomLadderEntry[];
  statTiles: CityStatTile[];
  dataAsOf: string;
}

// Eagerly globbed at build time — becomes real bundled data, not a runtime
// file read. Keys are the resolved module paths Vite assigns (relative to
// this file), values are each JSON file's parsed default export.
const cityContentModules = import.meta.glob<{ default: Record<string, CityContent> }>(
  '../../data/homes-for-rent-content.json',
  { eager: true }
);

const staticMarketDataModules = import.meta.glob<{ default: CityMarketDataRaw }>('../../../data/homes-for-rent/*.json', {
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

function deriveBedroomLadder(dataByBedrooms: RentCastBedroomEntry[] | undefined): BedroomLadderEntry[] {
  return (dataByBedrooms ?? [])
    .slice()
    .sort((a, b) => a.bedrooms - b.bedrooms)
    .map((b) => ({ beds: b.bedrooms, avgRent: b.averageRent, newListings: b.newListings, totalListings: b.totalListings }));
}

/** Regenerates the 3 headline stat tiles from fresh rentalData, using the
 * exact same simple templates the original static extraction's tiles
 * followed (confirmed by inspecting the real Avon data this was built
 * against: "Average Rent" / "Median Rent" / "Single-Family Average", the
 * sub-text patterns are plain string templates, not free-form prose). */
function buildStatTiles(cityName: string, rentalData: RentalDataBlock | undefined): CityStatTile[] {
  if (!rentalData || rentalData.averageRent == null) return [];

  const totalListings = rentalData.totalListings ?? 0;
  const singleFamily = rentalData.dataByPropertyType?.find((p) => p.propertyType === 'Single Family');

  const tiles: CityStatTile[] = [
    {
      label: 'Average Rent',
      value: `$${Math.round(rentalData.averageRent).toLocaleString()}`,
      sub: `Across ${totalListings} currently listed ${cityName} rental${totalListings === 1 ? '' : 's'}`,
    },
  ];

  if (rentalData.medianRent != null) {
    tiles.push({
      label: 'Median Rent',
      value: `$${Math.round(rentalData.medianRent).toLocaleString()}`,
      sub:
        rentalData.minRent != null && rentalData.maxRent != null
          ? `Range: $${Math.round(rentalData.minRent).toLocaleString()} – $${Math.round(rentalData.maxRent).toLocaleString()}`
          : '',
    });
  }

  if (singleFamily?.averageRent != null) {
    tiles.push({
      label: 'Single-Family Average',
      value: `$${Math.round(singleFamily.averageRent).toLocaleString()}`,
      sub: `Red Door's focus — ${singleFamily.totalListings} of ${totalListings} listings`,
    });
  }

  return tiles;
}

/** Both the Worker (index.ts's `new Date().toISOString().slice(0, 10)`) and
 * the static Sep 17 snapshot store dataAsOf as a bare ISO date
 * ("2026-09-20"), not display prose — the original static extraction's
 * dataAsOf sentence ("RentCast market data pulled September 17, 2026 —
 * monthly automated refresh not yet wired up") was hand-written text in
 * src/data/homes-for-rent-content.json, a different field entirely. That
 * "not yet wired up" caveat is also stale now that the Worker exists, so
 * this formats a fresh sentence from the raw date rather than reusing it. */
function formatDataAsOf(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return '';
  const formatted = parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `RentCast market data pulled ${formatted} — refreshed monthly.`;
}

function marketDataFromRaw(raw: CityMarketDataRaw): CityMarketData {
  return {
    zipsUsed: raw.zipsUsed ?? [],
    bedroomLadder: deriveBedroomLadder(raw.rentalData?.dataByBedrooms),
    statTiles: buildStatTiles(raw.citySlug, raw.rentalData),
    dataAsOf: raw.dataAsOf ? formatDataAsOf(raw.dataAsOf) : '',
  };
}

function loadStaticMarketData(slug: string): CityMarketData {
  const entry = Object.entries(staticMarketDataModules).find(([filePath]) => filePath.endsWith(`/${slug}.json`));
  if (!entry) {
    throw new Error(`No RentCast data file found for city "${slug}" under data/homes-for-rent/.`);
  }
  return marketDataFromRaw(entry[1].default);
}

/** city_key format matches decision #10's own canonical
 * `${city}-${state}` (see claude/rental-analysis-tool-build.md and
 * db/migrations/0001_rental_analysis_schema.sql) — not bare citySlug,
 * so this stays compatible with the same rows decision #10 reads/writes. */
function cityKeyFor(slug: string, state: string): string {
  return `${slug}-${state.toLowerCase()}`;
}

/** Reads a city's live RentCast data from the shared rentcast_city_cache
 * D1 table (written monthly by workers/rentcast-refresh), regenerating
 * the headline stat tiles and bedroom ladder from it. Falls back to the
 * static data/homes-for-rent/{slug}.json snapshot if D1 has no row yet —
 * keeps local dev working without requiring the Worker to have run. */
export async function loadCityMarketData(db: D1Database, slug: string, state = 'IN'): Promise<CityMarketData> {
  const cityKey = cityKeyFor(slug, state);
  try {
    const row = await db
      .prepare('SELECT market_data_json FROM rentcast_city_cache WHERE city_key = ?')
      .bind(cityKey)
      .first<{ market_data_json: string }>();

    if (row) {
      const raw = JSON.parse(row.market_data_json) as CityMarketDataRaw;
      return marketDataFromRaw(raw);
    }
    console.warn(`[homes-for-rent] No D1 cache row for "${cityKey}" — falling back to the static snapshot.`);
  } catch (err) {
    console.error(`[homes-for-rent] D1 read failed for "${cityKey}" — falling back to the static snapshot.`, err);
  }
  return loadStaticMarketData(slug);
}
