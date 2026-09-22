// RentCast city resolution + blending for the rental-analysis report
// page. Avon, Brownsburg, and Plainfield are reported together as one
// "West Side" submarket everywhere else on the site (market-reports'
// own westside cluster, src/lib/market-reports/markets.ts) — Plainfield
// specifically has no rentcast_city_cache row of its own (outside the
// 20-area ZIP mapping workers/rentcast-refresh covers), so a bare
// single-city lookup for it always came back empty. Michael flagged this
// live (2026-09-22): "Anything from Avon, Brownsburg, and Plainfield
// needs to include the West Side data."
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

const WEST_SIDE_CITIES = ['avon', 'brownsburg'];

/** Maps a subject property's own city slug to the RentCast slug(s) that
 * should actually be queried — Avon/Brownsburg/Plainfield all resolve to
 * the West Side pair (Plainfield itself is never queried directly, same
 * as the market-reports westside page). Every other covered city maps
 * to itself, unchanged. */
export function resolveRentCastSlugs(citySlug: string): string[] {
  if (citySlug === 'avon' || citySlug === 'brownsburg' || citySlug === 'plainfield') {
    return WEST_SIDE_CITIES;
  }
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

export interface RentTrendPoint {
  month: string;
  averageRent: number | null;
}

export interface RentTrendData {
  /** Chronological, oldest first — whatever trailing months RentCast's
   * `history` object actually has (confirmed 12 for a real live pull,
   * 2026-09-22), never padded or interpolated. */
  points: RentTrendPoint[];
  /** Percent change from the earliest to the latest point that both have
   * a real averageRent — null if there's fewer than 2 usable points.
   * Deliberately NOT labeled "YoY" in the UI: the real history window is
   * 11 months apart end-to-end (e.g. Oct '25 to Sep '26), not a true
   * same-month-last-year comparison. */
  changePercent: number | null;
}

/** City-wide (not per-bedroom) 12-month rent trend for the report page's
 * hero chart, added 2026-09-22 per Michael's request to match a reference
 * mockup's rent-trend box. RentCast's `history` entries only carry the
 * city-wide aggregate per month, no nested dataByBedrooms — confirmed
 * against the real stored Avon pull — so a bedroom-specific trend isn't
 * buildable from real data yet (Michael confirmed city-wide is fine for
 * now). Blends across 1+ cities the same weighted-by-totalListings way as
 * the other loaders in this file, keyed by each history entry's own
 * `month` string (RentCast's object keys are just array indices, not
 * month strings, so those can't be used to align cities). */
export async function loadBlendedRentTrend(db: D1Database, slugs: string[], state = 'IN'): Promise<RentTrendData | null> {
  const rows = (await Promise.all(slugs.map((s) => loadRawCity(db, s, state)))).filter((r): r is CityMarketDataRaw => r != null);
  if (rows.length === 0) return null;

  const byMonth = new Map<string, Array<{ value: number | null | undefined; weight: number }>>();
  for (const row of rows) {
    const history = row.rentalData?.history;
    if (!history) continue;
    for (const entry of Object.values(history)) {
      const month = resolveHistoryMonth(entry);
      if (!month) continue;
      const list = byMonth.get(month) ?? [];
      list.push({ value: entry.averageRent, weight: entry.totalListings ?? 0 });
      byMonth.set(month, list);
    }
  }
  if (byMonth.size === 0) return null;

  const points: RentTrendPoint[] = Array.from(byMonth.entries())
    .map(([month, values]) => ({ month, averageRent: weightedAverage(values) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const withRent = points.filter((p): p is { month: string; averageRent: number } => p.averageRent != null);
  const first = withRent[0];
  const last = withRent[withRent.length - 1];
  const changePercent =
    first && last && first !== last && first.averageRent !== 0
      ? Math.round(((last.averageRent - first.averageRent) / first.averageRent) * 1000) / 10
      : null;

  return { points, changePercent };
}
