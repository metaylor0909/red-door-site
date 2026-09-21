// Live snapshot data for the market-reports pages — reads the same
// rentcast_city_cache D1 rows the homes-for-rent and property-management
// pages already read, per red-door-website-todo.md's "Live data snapshot
// at launch" decision: "2–3 headline numbers... pulled from the same
// per-city RentCast data file... no new API cost or vendor."
//
// Deliberately a separate small loader rather than reusing homes-for-
// rent-content.ts's or property-management/market-snapshot.ts's — this
// page type needs a different stat (most common bedroom size, not a
// full bedroom ladder or sale-side data) and, uniquely among the three,
// needs to average across MULTIPLE cities for the West Side cluster
// (Avon + Brownsburg — Plainfield has no D1 row, see markets.ts's own
// comment on that gap).

interface RentCastBedroomEntry {
  bedrooms: number;
  averageRent?: number | null;
  totalListings?: number;
}

interface RentalDataBlock {
  medianRent?: number | null;
  totalListings?: number;
  dataByBedrooms?: RentCastBedroomEntry[];
}

interface CityMarketDataRaw {
  dataAsOf?: string;
  rentalData?: RentalDataBlock;
}

export interface MarketSnapshotStat {
  medianRent: number | null;
  activeListings: number;
  /** The bedroom count with the most active listings, e.g. 3 for
   * "3-Bedroom" — not a full "3 bed / 2 bath" profile, since RentCast's
   * schema has no bathroom field; showing a fabricated bath count would
   * violate this project's "don't invent data" rule. */
  mostCommonBedrooms: number | null;
  dataAsOf: string;
  /** True when this snapshot blends more than one city's data (West
   * Side only) — the page should say so rather than present a merged
   * number as if it were one city's real figure. */
  isBlended: boolean;
}

function formatDataAsOf(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function mostCommonBedroomCount(entries: RentCastBedroomEntry[] | undefined): number | null {
  if (!entries || entries.length === 0) return null;
  const best = entries.reduce((a, b) => ((b.totalListings ?? 0) > (a.totalListings ?? 0) ? b : a));
  return best.bedrooms;
}

async function loadRawCity(db: D1Database, slug: string, state = 'IN'): Promise<CityMarketDataRaw | null> {
  const cityKey = `${slug}-${state.toLowerCase()}`;
  try {
    const row = await db
      .prepare('SELECT market_data_json FROM rentcast_city_cache WHERE city_key = ?')
      .bind(cityKey)
      .first<{ market_data_json: string }>();
    if (!row) {
      console.warn(`[market-reports] No D1 cache row for "${cityKey}".`);
      return null;
    }
    return JSON.parse(row.market_data_json) as CityMarketDataRaw;
  } catch (err) {
    console.error(`[market-reports] D1 read failed for "${cityKey}".`, err);
    return null;
  }
}

/** Returns null when none of the given slugs have a D1 row — callers
 * should omit the snapshot section entirely in that case rather than
 * show empty/zero stats (see markets.ts: Anderson/Lebanon/Greenfield
 * pass an empty rentCastSlugs array for exactly this reason). */
export async function loadMarketReportSnapshot(db: D1Database, citySlugs: string[]): Promise<MarketSnapshotStat | null> {
  if (citySlugs.length === 0) return null;

  const rows = (await Promise.all(citySlugs.map((slug) => loadRawCity(db, slug)))).filter(
    (r): r is CityMarketDataRaw => r != null
  );
  if (rows.length === 0) return null;

  const dataAsOf = rows.find((r) => r.dataAsOf)?.dataAsOf ?? '';

  if (rows.length === 1) {
    const rental = rows[0].rentalData;
    return {
      medianRent: rental?.medianRent ?? null,
      activeListings: rental?.totalListings ?? 0,
      mostCommonBedrooms: mostCommonBedroomCount(rental?.dataByBedrooms),
      dataAsOf: formatDataAsOf(dataAsOf),
      isBlended: false,
    };
  }

  // Multi-city (West Side): weighted average by totalListings, matching
  // workers/rentcast-refresh/src/aggregate.ts's own multi-ZIP convention.
  const withWeights = rows
    .map((r) => ({ rental: r.rentalData, weight: r.rentalData?.totalListings ?? 0 }))
    .filter((r) => r.weight > 0);
  const totalWeight = withWeights.reduce((sum, r) => sum + r.weight, 0);
  const medianRent =
    totalWeight > 0
      ? Math.round(withWeights.reduce((sum, r) => sum + (r.rental?.medianRent ?? 0) * r.weight, 0) / totalWeight)
      : null;
  const activeListings = rows.reduce((sum, r) => sum + (r.rentalData?.totalListings ?? 0), 0);

  const bedroomTotals = new Map<number, number>();
  for (const r of rows) {
    for (const entry of r.rentalData?.dataByBedrooms ?? []) {
      bedroomTotals.set(entry.bedrooms, (bedroomTotals.get(entry.bedrooms) ?? 0) + (entry.totalListings ?? 0));
    }
  }
  let mostCommonBedrooms: number | null = null;
  let bestCount = -1;
  for (const [beds, count] of bedroomTotals) {
    if (count > bestCount) {
      bestCount = count;
      mostCommonBedrooms = beds;
    }
  }

  return {
    medianRent,
    activeListings,
    mostCommonBedrooms,
    dataAsOf: formatDataAsOf(dataAsOf),
    isBlended: true,
  };
}
