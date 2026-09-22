// Decisions #2 (Rented/Available blend fallback) and #3 (median + fixed
// ±10% range) from claude/rental-analysis-tool-build.md. Takes the
// already-selected, distance-then-recency-ranked comp list from
// comp-selection.ts (which does not itself filter by status) and decides
// which of those comps actually feed the rent estimate.
//
// REVISED 2026-09-22 — extended decision #2's two-tier Rented/Available
// blend into three tiers, to fold in RentCast's comps (rentcast-comps-
// client.ts) without treating them as equivalent to a confirmed
// RentEngine lease: RentEngine 'rented' (confirmed) → 'inactive'
// (RentCast, probably off-market for SOME reason, not confirmed leased —
// see that client's own header note) → 'available' (currently listed,
// asking price, RentEngine or RentCast, least reliable for what a
// property will actually rent for). Each tier only gets used once the
// tier(s) above it run out — never blended by simple proportion — same
// "closest-first, only reach for the next tier if you have to" spirit as
// the original two-tier version.

import type { CascadeCompromises, RentEngineComp } from './types';

const BLEND_THRESHOLD = 5;
const RANGE_PCT = 0.1;

export interface EstimateResult {
  estimatedRent: number;
  rangeLow: number;
  rangeHigh: number;
  /** The comps actually used for the median — see the module header for
   * the three-tier fill order. */
  estimatePool: RentEngineComp[];
  blendPathUsed: boolean;
  blendedPoolStillThin: boolean;
  reachedActiveListingsTier: boolean;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Decision #2 (extended): fills the estimate pool from the highest tier
 * first — Rented, then Inactive, then Available — stopping as soon as the
 * 5-comp threshold is reached, same closest-first ordering the ranked
 * input already carries. Decision #3: the estimate is the pool's median
 * rent, with a fixed ±10% range rather than a range computed from the
 * pool's own spread.
 */
export function buildEstimate(rankedComps: RentEngineComp[]): EstimateResult {
  const rented = rankedComps.filter((c) => c.status === 'rented');
  const inactive = rankedComps.filter((c) => c.status === 'inactive');
  const available = rankedComps.filter((c) => c.status === 'available');

  const estimatePool: RentEngineComp[] = [...rented];
  let blendPathUsed = false;
  let reachedActiveListingsTier = false;

  if (estimatePool.length < BLEND_THRESHOLD) {
    blendPathUsed = true;
    estimatePool.push(...inactive.slice(0, BLEND_THRESHOLD - estimatePool.length));
  }
  if (estimatePool.length < BLEND_THRESHOLD) {
    reachedActiveListingsTier = true;
    estimatePool.push(...available.slice(0, BLEND_THRESHOLD - estimatePool.length));
  }

  const blendedPoolStillThin = estimatePool.length < BLEND_THRESHOLD;

  // Decision #10: a ±1-bed comp's rent gets normalized to the subject's
  // bed count before it enters this median — bedroomAdjustedRent is only
  // ever set on those comps (see bedroom-adjustment.ts), so comps at the
  // subject's own bed count are unaffected.
  const estimatedRent = Math.round(median(estimatePool.map((c) => c.bedroomAdjustedRent ?? c.rent)));
  const rangeLow = Math.round(estimatedRent * (1 - RANGE_PCT));
  const rangeHigh = Math.round(estimatedRent * (1 + RANGE_PCT));

  return {
    estimatedRent,
    rangeLow,
    rangeHigh,
    estimatePool,
    blendPathUsed,
    blendedPoolStillThin,
    reachedActiveListingsTier,
  };
}

/** Folds this module's fallback signals into the cascade's own
 * compromise record, so confidence.ts (decision #9) has one complete
 * object to score against. */
export function withEstimateCompromises(
  cascadeCompromises: CascadeCompromises,
  estimate: Pick<EstimateResult, 'blendPathUsed' | 'blendedPoolStillThin' | 'reachedActiveListingsTier'>
): CascadeCompromises {
  return {
    ...cascadeCompromises,
    blendPathUsed: estimate.blendPathUsed,
    blendedPoolStillThin: estimate.blendedPoolStillThin,
    reachedActiveListingsTier: estimate.reachedActiveListingsTier,
  };
}
