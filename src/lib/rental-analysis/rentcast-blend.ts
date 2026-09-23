// RentCast city resolution + blending for the rental-analysis report
// page. Historically (2026-09-22) this also special-cased Avon/
// Brownsburg/Plainfield into a shared "West Side" blend, since Plainfield
// had no rentcast_city_cache row of its own — a bare single-city lookup
// for it always came back empty. REVISED 2026-09-23: Plainfield now has
// its own real row (workers/rentcast-refresh/src/cities.ts), so that
// special-case is gone — every city, including all three of these,
// resolves to itself and shows its own real numbers on its own report,
// same as any other covered area. The combined "West Side" view Michael
// still wants available lives on the dedicated westside market-reports
// page instead (src/lib/market-reports/markets.ts's own MARKETS config,
// a separate blending implementation, not this file) — see that file's
// own note. resolveRentCastSlugs() is kept as a real function (not
// inlined at each call site) specifically so a future genuine blend case
// has one obvious place to add it back, the way this one worked.
//
// A new small module rather than extending homes-for-rent-content.ts's
// or property-management/market-snapshot.ts's existing single-city
// loaders — same reasoning those two already give for not sharing code
// with each other: duplicating the small D1-read shape here is simpler
// and safer than reworking two already-verified, currently-live
// pipelines (18+ homes-for-rent and property-management pages) just to
// grow a multi-city blending path only this page needs. Produces the
// same output shapes those loaders already return, so the report page's
// rendering code needs no changes beyond swapping which loader it calls.

import type { CityMarketData, BedroomLadderEntry } from '../listings/homes-for-rent-content';
import type { MarketSnapshot } from '../property-management/market-snapshot';

/** Maps a subject property's own city slug to the RentCast slug(s) that
 * should actually be queried. Currently always just itself — see the
 * module header for why the old Avon/Brownsburg/Plainfield special-case
 * was removed 2026-09-23. */
export function resolveRentCastSlugs(citySlug: string): string[] {
  return [citySlug];
}

interface RentCastBedroomEntry {
  bedrooms: number;
  averageRent?: number | null;
  newListings?: number;
  totalListings?: number;
}

interface RentCastHistoryEntry {
  /** Present on some pulls (e.g. the original static Avon extraction),
   * already "YYYY-MM". */
  month?: string;
  /** Present on others (confirmed live against the real stored
   * Indianapolis pull, 2026-09-22) — a full ISO datetime
   * ("2025-10-01T00:00:00.000Z") instead. RentCast isn't consistent
   * about which field a given history entry carries, so both are read;
   * see resolveHistoryMonth() below. */
  date?: string;
  averageRent?: number | null;
  medianDaysOnMarket?: number | null;
  totalListings?: number;
}

/** Normalizes a history entry's month across RentCast's two observed
 * shapes (see RentCastHistoryEntry above) into a plain "YYYY-MM" string. */
function resolveHistoryMonth(entry: RentCastHistoryEntry): string | null {
  if (entry.month) return entry.month;
  if (entry.date) return entry.date.slice(0, 7);
  return null;
}

interface RentCastDataBlock {
  averageRent?: number | null;
  medianRent?: number | null;
  averagePrice?: number | null;
  medianPrice?: number | null;
  averageDaysOnMarket?: number | null;
  totalListings?: number;
  dataByBedrooms?: RentCastBedroomEntry[];
  /** RentCast's own trailing-12-month history, keyed by array index (not
   * by month — each entry carries its own `month` field). City-wide only,
   * no per-bedroom breakdown inside each month — confirmed 2026-09-22
   * against the real stored Avon pull while scoping the report page's
   * rent-trend chart. Passed through as-is by workers/rentcast-refresh's
   * aggregate.ts (see that file's own header note on why history isn't
   * multi-ZIP aggregated there). */
  history?: Record<string, RentCastHistoryEntry>;
}

interface CityMarketDataRaw {
  dataAsOf?: string;
  rentalData?: RentCastDataBlock;
  saleData?: RentCastDataBlock;
}

function cityKeyFor(slug: string, state: string): string {
  return `${slug}-${state.toLowerCase()}`;
}

async function loadRawCity(db: D1Database, slug: string, state: string): Promise<CityMarketDataRaw | null> {
  const cityKey = cityKeyFor(slug, state);
  try {
    const row = await db
      .prepare('SELECT market_data_json FROM rentcast_city_cache WHERE city_key = ?')
      .bind(cityKey)
      .first<{ market_data_json: string }>();
    if (!row) return null;
    return JSON.parse(row.market_data_json) as CityMarketDataRaw;
  } catch (err) {
    console.error(`[rental-analysis/rentcast-blend] D1 read failed for "${cityKey}".`, err);
    return null;
  }
}

function formatDataAsOf(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return '';
  const formatted = parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `RentCast market data pulled ${formatted} — refreshed monthly.`;
}

/** Weighted average by totalListings, matching workers/rentcast-
 * refresh/src/aggregate.ts's own multi-ZIP convention (reused
 * identically by market-reports/snapshot.ts for this same West Side
 * pair). Returns null if there's nothing to weight. */
function weightedAverage(values: Array<{ value: number | null | undefined; weight: number }>): number | null {
  const withWeight = values.filter((v) => v.value != null && v.weight > 0) as Array<{ value: number; weight: number }>;
  const totalWeight = withWeight.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight === 0) return null;
  return withWeight.reduce((sum, v) => sum + v.value * v.weight, 0) / totalWeight;
}

/** Blended equivalent of homes-for-rent-content.ts's loadCityMarketData
 * — same CityMarketData shape, weighted-averaged across 1+ cities. The
 * "Single-Family Average" tile buildStatTiles derives per-city is
 * skipped here (the report page replaces that 3rd tile with average
 * days on market anyway — see [token].astro's reportStatTiles). */
export async function loadBlendedCityMarketData(db: D1Database, slugs: string[], state = 'IN'): Promise<CityMarketData | null> {
  const rows = (await Promise.all(slugs.map((s) => loadRawCity(db, s, state)))).filter((r): r is CityMarketDataRaw => r != null);
  if (rows.length === 0) return null;

  const dataAsOf = rows.find((r) => r.dataAsOf)?.dataAsOf ?? '';
  const weights = rows.map((r) => r.rentalData?.totalListings ?? 0);

  const averageRent = weightedAverage(rows.map((r, i) => ({ value: r.rentalData?.averageRent, weight: weights[i] })));
  const medianRent = weightedAverage(rows.map((r, i) => ({ value: r.rentalData?.medianRent, weight: weights[i] })));
  const averageDaysOnMarket = weightedAverage(rows.map((r, i) => ({ value: r.rentalData?.averageDaysOnMarket, weight: weights[i] })));
  const totalListings = weights.reduce((sum, w) => sum + w, 0);

  const bedroomMap = new Map<number, { rentTotal: number; weight: number; newListings: number; totalListings: number }>();
  for (const row of rows) {
    for (const entry of row.rentalData?.dataByBedrooms ?? []) {
      const existing = bedroomMap.get(entry.bedrooms) ?? { rentTotal: 0, weight: 0, newListings: 0, totalListings: 0 };
      const w = entry.totalListings ?? 0;
      if (entry.averageRent != null) existing.rentTotal += entry.averageRent * w;
      existing.weight += w;
      existing.newListings += entry.newListings ?? 0;
      existing.totalListings += entry.totalListings ?? 0;
      bedroomMap.set(entry.bedrooms, existing);
    }
  }
  const bedroomLadder: BedroomLadderEntry[] = Array.from(bedroomMap.entries())
    .map(([beds, v]) => ({
      beds,
      avgRent: v.weight > 0 ? v.rentTotal / v.weight : 0,
      newListings: v.newListings,
      totalListings: v.totalListings,
    }))
    .sort((a, b) => a.beds - b.beds);

  const statTiles =
    averageRent != null
      ? [
          { label: 'Average Rent', value: `$${Math.round(averageRent).toLocaleString()}`, sub: `Across ${totalListings} currently listed rentals` },
          ...(medianRent != null ? [{ label: 'Median Rent', value: `$${Math.round(medianRent).toLocaleString()}`, sub: '' }] : []),
        ]
      : [];

  return {
    zipsUsed: [],
    bedroomLadder,
    statTiles,
    dataAsOf: dataAsOf ? formatDataAsOf(dataAsOf) : '',
    averageDaysOnMarket,
  };
}

/** Blended equivalent of property-management/market-snapshot.ts's
 * loadMarketSnapshot — same MarketSnapshot shape (rental + sale sides),
 * weighted-averaged across 1+ cities. */
export async function loadBlendedMarketSnapshot(db: D1Database, slugs: string[], state = 'IN'): Promise<MarketSnapshot | null> {
  const rows = (await Promise.all(slugs.map((s) => loadRawCity(db, s, state)))).filter((r): r is CityMarketDataRaw => r != null);
  if (rows.length === 0) return null;

  const dataAsOf = rows.find((r) => r.dataAsOf)?.dataAsOf ?? '';
  const rentalWeights = rows.map((r) => r.rentalData?.totalListings ?? 0);
  const saleWeights = rows.map((r) => r.saleData?.totalListings ?? 0);

  return {
    dataAsOf: dataAsOf ? formatDataAsOf(dataAsOf) : '',
    rental: {
      averageRent: weightedAverage(rows.map((r, i) => ({ value: r.rentalData?.averageRent, weight: rentalWeights[i] }))),
      medianRent: weightedAverage(rows.map((r, i) => ({ value: r.rentalData?.medianRent, weight: rentalWeights[i] }))),
      activeListings: rentalWeights.reduce((sum, w) => sum + w, 0),
      averageDaysOnMarket: weightedAverage(rows.map((r, i) => ({ value: r.rentalData?.averageDaysOnMarket, weight: rentalWeights[i] }))),
    },
    sale: {
      averagePrice: weightedAverage(rows.map((r, i) => ({ value: r.saleData?.averagePrice, weight: saleWeights[i] }))),
      medianPrice: weightedAverage(rows.map((r, i) => ({ value: r.saleData?.medianPrice, weight: saleWeights[i] }))),
      activeListings: saleWeights.reduce((sum, w) => sum + w, 0),
      averageDaysOnMarket: weightedAverage(rows.map((r, i) => ({ value: r.saleData?.averageDaysOnMarket, weight: saleWeights[i] }))),
    },
  };
}

export interface CityTrendPoint {
  month: string;
  averageRent: number | null;
  medianDaysOnMarket: number | null;
  /** Summed across blended cities (a listing count, not a rate) — unlike
   * averageRent/medianDaysOnMarket, which are weighted-averaged. */
  totalListings: number | null;
}

export interface CityTrendData {
  /** Chronological, oldest first — whatever trailing months RentCast's
   * `history` object actually has (confirmed 12 for a real live pull,
   * 2026-09-22), never padded or interpolated. Each field is independently
   * nullable — a month can be missing one metric without dropping the
   * whole point, since callers filter per-metric before charting (see
   * [token].astro's buildTrendPath). */
  points: CityTrendPoint[];
}

/** City-wide (not per-bedroom or per-comp) 12-month trend across three
 * metrics — average rent, median days on market, and total active
 * listings — added 2026-09-22. Originally just rent (for the hero's
 * trend chart, per a reference mockup Michael shared); broadened the same
 * day to also carry days-on-market and inventory once Michael asked for
 * those as real replacements for the market-context panel's broken
 * RentEngine-derived numbers (RentEngine's own comp pool had ~zero
 * confirmed-leased comps for either real demo address, so both the old
 * supply/demand ratio and time-to-lease panels were computing off empty
 * data). RentCast's `history` entries only carry the city-wide aggregate
 * per month, no nested per-bedroom or per-comp breakdown — confirmed
 * against the real stored Avon pull — so this stays city-wide, not
 * comp-set-specific. Blends across 1+ cities the same weighted-by-
 * totalListings way as the other loaders in this file (totalListings
 * itself is summed, not averaged — see CityTrendPoint), keyed by each
 * history entry's own `month` string (RentCast's object keys are just
 * array indices, not month strings, so those can't be used to align
 * cities). */
export async function loadBlendedCityTrend(db: D1Database, slugs: string[], state = 'IN'): Promise<CityTrendData | null> {
  const rows = (await Promise.all(slugs.map((s) => loadRawCity(db, s, state)))).filter((r): r is CityMarketDataRaw => r != null);
  if (rows.length === 0) return null;

  const byMonth = new Map<
    string,
    { rent: Array<{ value: number | null | undefined; weight: number }>; dom: Array<{ value: number | null | undefined; weight: number }>; totalListings: number }
  >();
  for (const row of rows) {
    const history = row.rentalData?.history;
    if (!history) continue;
    for (const entry of Object.values(history)) {
      const month = resolveHistoryMonth(entry);
      if (!month) continue;
      const bucket = byMonth.get(month) ?? { rent: [], dom: [], totalListings: 0 };
      const weight = entry.totalListings ?? 0;
      bucket.rent.push({ value: entry.averageRent, weight });
      bucket.dom.push({ value: entry.medianDaysOnMarket, weight });
      bucket.totalListings += weight;
      byMonth.set(month, bucket);
    }
  }
  if (byMonth.size === 0) return null;

  const points: CityTrendPoint[] = Array.from(byMonth.entries())
    .map(([month, b]) => ({
      month,
      averageRent: weightedAverage(b.rent),
      medianDaysOnMarket: weightedAverage(b.dom),
      totalListings: b.totalListings > 0 ? b.totalListings : null,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return { points };
}
