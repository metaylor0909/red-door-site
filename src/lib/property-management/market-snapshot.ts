// Rental & Sales Market Snapshot data for the -property-management pages
// (src/pages/[city]-property-management.astro) — see
// claude/avon-property-management-pilot-notes.md for the section's design
// history. Reads the SAME rentcast_city_cache D1 rows the homes-for-rent
// pages already read (confirmed: every -property-management city slug is
// a subset of the -homes-for-rent city list, so no new data pipeline is
// needed here — this module is purely a different derivation over the
// same stored market_data_json, this time pulling saleData too, which
// the homes-for-rent pages' own loader never reads).
//
// Deliberately NOT sharing code with src/lib/listings/homes-for-rent-content.ts
// beyond the same small D1-read/fallback shape — that module's own
// derivations (bedroom ladder, stat tiles) are specific to its page type,
// and duplicating the ~15-line D1 query here is simpler and safer than
// refactoring that already-verified pipeline to share it.

interface RentCastDataBlock {
  averageRent?: number | null;
  medianRent?: number | null;
  averagePrice?: number | null;
  medianPrice?: number | null;
  averageDaysOnMarket?: number | null;
  totalListings?: number;
}

interface CityMarketDataRaw {
  citySlug: string;
  dataAsOf?: string;
  rentalData?: RentCastDataBlock;
  saleData?: RentCastDataBlock;
}

export interface MarketSnapshot {
  dataAsOf: string;
  rental: {
    averageRent: number | null;
    medianRent: number | null;
    activeListings: number;
    averageDaysOnMarket: number | null;
  };
  sale: {
    averagePrice: number | null;
    medianPrice: number | null;
    activeListings: number;
    averageDaysOnMarket: number | null;
  };
}

const staticMarketDataModules = import.meta.glob<{ default: CityMarketDataRaw }>('../../../data/homes-for-rent/*.json', {
  eager: true,
});

/** Same display sentence homes-for-rent-content.ts's own formatDataAsOf
 * produces, duplicated rather than imported — see this module's header. */
function formatDataAsOf(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return '';
  const formatted = parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `RentCast market data pulled ${formatted} — refreshed monthly.`;
}

function snapshotFromRaw(raw: CityMarketDataRaw): MarketSnapshot {
  return {
    dataAsOf: raw.dataAsOf ? formatDataAsOf(raw.dataAsOf) : '',
    rental: {
      averageRent: raw.rentalData?.averageRent ?? null,
      medianRent: raw.rentalData?.medianRent ?? null,
      activeListings: raw.rentalData?.totalListings ?? 0,
      averageDaysOnMarket: raw.rentalData?.averageDaysOnMarket ?? null,
    },
    sale: {
      averagePrice: raw.saleData?.averagePrice ?? null,
      medianPrice: raw.saleData?.medianPrice ?? null,
      activeListings: raw.saleData?.totalListings ?? 0,
      averageDaysOnMarket: raw.saleData?.averageDaysOnMarket ?? null,
    },
  };
}

function loadStaticSnapshot(slug: string): MarketSnapshot {
  const entry = Object.entries(staticMarketDataModules).find(([filePath]) => filePath.endsWith(`/${slug}.json`));
  if (!entry) {
    throw new Error(`No RentCast data file found for city "${slug}" under data/homes-for-rent/.`);
  }
  return snapshotFromRaw(entry[1].default);
}

function cityKeyFor(slug: string, state: string): string {
  return `${slug}-${state.toLowerCase()}`;
}

/** Reads a city's rental+sales snapshot from the shared rentcast_city_cache
 * D1 table (see src/lib/listings/homes-for-rent-content.ts's own loader
 * for the identical fallback rationale). */
export async function loadMarketSnapshot(db: D1Database, slug: string, state = 'IN'): Promise<MarketSnapshot> {
  const cityKey = cityKeyFor(slug, state);
  try {
    const row = await db
      .prepare('SELECT market_data_json FROM rentcast_city_cache WHERE city_key = ?')
      .bind(cityKey)
      .first<{ market_data_json: string }>();

    if (row) {
      const raw = JSON.parse(row.market_data_json) as CityMarketDataRaw;
      return snapshotFromRaw(raw);
    }
    console.warn(`[property-management] No D1 cache row for "${cityKey}" — falling back to the static snapshot.`);
  } catch (err) {
    console.error(`[property-management] D1 read failed for "${cityKey}" — falling back to the static snapshot.`, err);
  }
  return loadStaticSnapshot(slug);
}
