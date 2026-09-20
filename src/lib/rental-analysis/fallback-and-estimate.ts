// Decisions #2 (Rented/Available blend fallback) and #3 (median + fixed
// ±10% range) from claude/rental-analysis-tool-build.md. Takes the
// already-selected, distance-then-recency-ranked comp list from
// comp-selection.ts (which does not itself filter by status) and decides
// which of those comps actually feed the rent estimate.

import type { CascadeCompromises, RentEngineComp } from './types';

const BLEND_THRESHOLD = 5;
const RANGE_PCT = 0.1;

export interface EstimateResult {
  estimatedRent: number;
  rangeLow: number;
  rangeHigh: number;
  /** The comps actually used for the median — Rented-only, or the
   * Rented+Available blend when Rented alone falls short. */
  estimatePool: RentEngineComp[];
  blendPathUsed: boolean;
  blendedPoolStillThin: boolean;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Decision #2: if the selected pool has fewer than 5 Rented comps, blend
 * in Available comps (closest-first — `rankedComps` already arrives
 * distance-then-recency sorted from comp-selection.ts) until the blended
 * total reaches the 5-comp threshold or the pool is exhausted. Decision
 * #3: the estimate is the pool's median rent, with a fixed ±10% range
 * rather than a range computed from the pool's own spread.
 */
export function buildEstimate(rankedComps: RentEngineComp[]): EstimateResult {
  const rented = rankedComps.filter((c) => c.status === 'Rented');
  const available = rankedComps.filter((c) => c.status === 'Available');

  let estimatePool: RentEngineComp[];
  let blendPathUsed: boolean;

  if (rented.length >= BLEND_THRESHOLD) {
    estimatePool = rented;
    blendPathUsed = false;
  } else {
    blendPathUsed = true;
    const needed = BLEND_THRESHOLD - rented.length;
    estimatePool = [...rented, ...available.slice(0, needed)];
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
  };
}

/** Folds this module's two fallback signals into the cascade's own
 * compromise record, so confidence.ts (decision #9) has one complete
 * object to score against. */
export function withEstimateCompromises(
  cascadeCompromises: CascadeCompromises,
  estimate: Pick<EstimateResult, 'blendPathUsed' | 'blendedPoolStillThin'>
): CascadeCompromises {
  return {
    ...cascadeCompromises,
    blendPathUsed: estimate.blendPathUsed,
    blendedPoolStillThin: estimate.blendedPoolStillThin,
  };
}
