// Decision #10 — bedroom-count rent adjustment. Four-tier cascade, in
// order: (1) city cached and well-sampled, (2) city cached but thin,
// (3) city not cached — on-demand RentCast pull, capped at 50/month,
// (4) no usable data — portfolio-wide weighted-average ratio fallback.
// Since decision #1 never relaxes beds past ±1, this only ever needs to
// normalize a one-bedroom difference.
//
// The "well-sampled vs. thin" newListings threshold is NOT a settled
// decision — red-door-homes-for-rent-data-schema.md explicitly left it
// "TBD, flag for Claude Code to propose." 10 is proposed here as a
// reasonable default (see that doc's own Avon example: rungs with 4
// listings were flagged as thin, rungs with 41-47 were called
// well-sampled) — not a confirmed number. Revisit if Michael sets one.

import { fetchRentalMarketData, deriveBedroomLadder, type RentCastBedroomRung, type RentCastRentalData } from './rentcast-client';
import type { RentEngineComp, SubjectProperty, CascadeCompromises } from './types';

export const THIN_SAMPLE_THRESHOLD = 10;
const MONTHLY_AD_HOC_CALL_CAP = 50;

export type BedroomAdjustmentTier = NonNullable<CascadeCompromises['bedroomAdjustment']>;

/** market_data_json's real shape — see db/migrations/0001_rental_analysis_schema.sql
 * and claude/red-door-homes-for-rent-data-schema.md. Only the fields this
 * module actually reads are typed; the rest (saleData, dataByPropertyType,
 * history, etc.) pass through untouched for the homes-for-rent consumer. */
interface CityMarketData {
  rentalData?: RentCastRentalData | null;
  [key: string]: unknown;
}

export interface CachedCityRow {
  city_key: string;
  market_data_json: string;
}

function cityKeyFor(subject: Pick<SubjectProperty, 'city' | 'state'>): string {
  return `${subject.city.toLowerCase().replace(/\s+/g, '-')}-${subject.state.toLowerCase()}`;
}

function rungFor(ladder: RentCastBedroomRung[], beds: number): RentCastBedroomRung | undefined {
  return ladder.find((r) => r.beds === beds);
}

async function getCurrentMonthCallCount(db: D1Database, month: string): Promise<number> {
  const row = await db
    .prepare('SELECT call_count FROM rentcast_adhoc_call_log WHERE month = ?')
    .bind(month)
    .first<{ call_count: number }>();
  return row?.call_count ?? 0;
}

async function incrementMonthCallCount(db: D1Database, month: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO rentcast_adhoc_call_log (month, call_count) VALUES (?, 1)
       ON CONFLICT(month) DO UPDATE SET call_count = call_count + 1`
    )
    .bind(month)
    .run();
}

interface ResolvedLadder {
  ladder: RentCastBedroomRung[];
  /** Whether this came from cache, a fresh pull, or neither was possible. */
  source: 'cache' | 'fresh' | 'unavailable';
}

/**
 * Resolves the subject's city bedroom ladder — tiers 1-3 of decision #10.
 * Tier 4 (portfolio fallback) is handled separately by the caller when
 * this returns `source: 'unavailable'`.
 */
async function resolveCityLadder(
  db: D1Database,
  rentCastApiKey: string,
  subject: SubjectProperty
): Promise<ResolvedLadder> {
  const cityKey = cityKeyFor(subject);

  const cached = await db
    .prepare('SELECT city_key, market_data_json FROM rentcast_city_cache WHERE city_key = ?')
    .bind(cityKey)
    .first<CachedCityRow>();

  if (cached) {
    const marketData: CityMarketData = JSON.parse(cached.market_data_json);
    return { ladder: deriveBedroomLadder(marketData.rentalData), source: 'cache' };
  }

  // Tier 3: not cached — try an on-demand pull, subject to the monthly cap.
  const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const callsSoFar = await getCurrentMonthCallCount(db, month);
  if (callsSoFar >= MONTHLY_AD_HOC_CALL_CAP) {
    return { ladder: [], source: 'unavailable' };
  }

  try {
    const rentalData = await fetchRentalMarketData(subject.zip, rentCastApiKey);
    await incrementMonthCallCount(db, month);
    const ladder = deriveBedroomLadder(rentalData);
    if (ladder.length === 0) {
      return { ladder: [], source: 'unavailable' };
    }
    // A leaner row than the Cron Worker's own (no saleData) — see the
    // module header on rentcast-client.ts for why that's fine here.
    const marketData: CityMarketData = {
      citySlug: cityKey,
      zipsUsed: [subject.zip],
      dataAsOf: new Date().toISOString().slice(0, 10),
      aggregationMethod: 'Single ZIP, ad-hoc pull for decision #10 tier 3.',
      rentalData,
    };
    await db
      .prepare(
        `INSERT INTO rentcast_city_cache (city_key, market_data_json, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(city_key) DO UPDATE SET market_data_json = excluded.market_data_json, updated_at = excluded.updated_at`
      )
      .bind(cityKey, JSON.stringify(marketData), new Date().toISOString())
      .run();
    return { ladder, source: 'fresh' };
  } catch (err) {
    console.error('[rental-analysis] RentCast on-demand pull failed:', err);
    return { ladder: [], source: 'unavailable' };
  }
}

/**
 * Tier 4: portfolio-wide weighted-average ratio across every city
 * already cached, for the specific bed-count pair needed. A ratio, not a
 * flat dollar difference, so it travels across Red Door's price range.
 * Returns null if there's truly nothing to average yet (an empty or
 * not-yet-useful cache) — the caller should skip the adjustment entirely
 * in that case rather than invent a number.
 */
async function computePortfolioRatio(db: D1Database, subjectBeds: number, compBeds: number): Promise<number | null> {
  const rows = await db.prepare('SELECT market_data_json FROM rentcast_city_cache').all<{ market_data_json: string }>();

  let weightedRatioSum = 0;
  let totalWeight = 0;

  for (const row of rows.results ?? []) {
    const marketData: CityMarketData = JSON.parse(row.market_data_json);
    const ladder = deriveBedroomLadder(marketData.rentalData);
    const subjectRung = rungFor(ladder, subjectBeds);
    const compRung = rungFor(ladder, compBeds);
    if (!subjectRung || !compRung || compRung.avgRent <= 0) continue;

    const weight = Math.min(subjectRung.totalListings, compRung.totalListings);
    if (weight <= 0) continue;

    weightedRatioSum += (subjectRung.avgRent / compRung.avgRent) * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedRatioSum / totalWeight : null;
}

export interface BedroomAdjustmentResult {
  comps: RentEngineComp[]; // same array, with bedroomAdjustedRent set on relaxed-bed comps
  tier: BedroomAdjustmentTier;
}

/**
 * Applies decision #10's adjustment to any comp whose beds differ from
 * the subject's. Comps at the subject's own bed count are left
 * untouched. Determines a single tier for the whole analysis — decision
 * #9's confidence table only has one bedroomAdjustment slot, and since
 * decision #1 caps relaxation at ±1, at most two distinct off-target bed
 * counts (subject-1, subject+1) are ever in play for one analysis, both
 * resolved from the same city ladder.
 */
export async function applyBedroomAdjustments(
  comps: RentEngineComp[],
  subject: SubjectProperty,
  db: D1Database,
  rentCastApiKey: string
): Promise<BedroomAdjustmentResult> {
  const relaxedComps = comps.filter((c) => c.beds !== subject.beds);
  if (relaxedComps.length === 0) {
    return { comps, tier: 'none' };
  }

  const resolved = await resolveCityLadder(db, rentCastApiKey, subject);

  if (resolved.source === 'unavailable') {
    const ratios = new Map<number, number>();
    for (const beds of new Set(relaxedComps.map((c) => c.beds))) {
      const ratio = await computePortfolioRatio(db, subject.beds, beds);
      if (ratio != null) ratios.set(beds, ratio);
    }
    for (const comp of relaxedComps) {
      const ratio = ratios.get(comp.beds);
      if (ratio != null) comp.bedroomAdjustedRent = Math.round(comp.rent * ratio);
      // If even the portfolio fallback has nothing for this bed count,
      // the comp keeps its raw, unadjusted rent — same as if decision
      // #10 didn't exist, rather than inventing a number.
    }
    return { comps, tier: 'tier4-portfolio' };
  }

  const subjectRung = rungFor(resolved.ladder, subject.beds);
  let anyThin = false;
  let anyAdjusted = false;

  for (const comp of relaxedComps) {
    const compRung = rungFor(resolved.ladder, comp.beds);
    if (!subjectRung || !compRung || compRung.avgRent <= 0) continue;

    comp.bedroomAdjustedRent = Math.round(comp.rent * (subjectRung.avgRent / compRung.avgRent));
    anyAdjusted = true;
    if (subjectRung.newListings < THIN_SAMPLE_THRESHOLD || compRung.newListings < THIN_SAMPLE_THRESHOLD) {
      anyThin = true;
    }
  }

  if (!anyAdjusted) {
    // The ladder existed but didn't actually cover the bed counts this
    // analysis needed (e.g. RentCast returned only 2BR-4BR and the
    // subject is a studio) — same "nothing to adjust with" outcome as
    // tier 4, just discovered after already having a ladder in hand.
    const ratios = new Map<number, number>();
    for (const beds of new Set(relaxedComps.map((c) => c.beds))) {
      const ratio = await computePortfolioRatio(db, subject.beds, beds);
      if (ratio != null) ratios.set(beds, ratio);
    }
    for (const comp of relaxedComps) {
      const ratio = ratios.get(comp.beds);
      if (ratio != null) comp.bedroomAdjustedRent = Math.round(comp.rent * ratio);
    }
    return { comps, tier: 'tier4-portfolio' };
  }

  if (resolved.source === 'fresh') {
    return { comps, tier: anyThin ? 'tier3-thin' : 'tier3-fresh' };
  }
  return { comps, tier: anyThin ? 'tier2' : 'tier1' };
}
