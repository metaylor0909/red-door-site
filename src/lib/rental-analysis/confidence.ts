// Decision #9 — confidence score. Deduction table, rescale formula, and
// the two sanity-check cases (Bluff Point Dr, Lapel) are all taken
// verbatim from claude/rental-analysis-tool-build.md.

import type { CascadeCompromises } from './types';

export type ConfidenceBucket = 'strong' | 'solid' | 'limited';

export interface ConfidenceResult {
  rawScore: number; // 0-100 before rescaling
  displayPercent: number; // 55-94
  bucket: ConfidenceBucket;
  bucketLabel: string;
  templateSentence: string;
}

const DISPLAY_FLOOR = 55;
const DISPLAY_CEILING = 94;

function radiusDeduction(radiusMiles: CascadeCompromises['radiusMiles']): number {
  switch (radiusMiles) {
    case 2:
      return 10;
    case 3:
      return 20;
    case 5:
      return 30;
    default:
      return 0; // 1mi — no deduction
  }
}

function bedroomAdjustmentDeduction(tier: CascadeCompromises['bedroomAdjustment']): number {
  switch (tier) {
    case 'tier2':
    case 'tier3-thin':
      return 10; // "thin local bedroom data" deduction
    case 'tier4-portfolio':
      return 20; // "fell back to portfolio-wide average ratio" deduction
    default:
      return 0; // none, tier1, or tier3-fresh landing on a well-sampled rung
  }
}

/** Step 1 of decision #9: start at 100, subtract each compromise the
 * cascade actually made, clamp to [0, 100]. */
export function computeRawScore(compromises: CascadeCompromises): number {
  let score = 100;
  score -= radiusDeduction(compromises.radiusMiles);
  if (compromises.dateWindowMonths === 12) score -= 15;
  if (compromises.bedsRelaxed) score -= 20;
  // Cut from -20 to -10 on 2026-09-22 with the RentCast comp blend.
  // blendPathUsed now fires whenever the estimate needed ANY non-
  // confirmed-leased comps — which, since RentCast's 'inactive' tier
  // became a real, decent-quality fallback (not just RentEngine's raw
  // asking-price 'available' comps, the only fallback this deduction was
  // originally calibrated against), is a much more common and much less
  // severe situation than it used to be. reachedActiveListingsTier below
  // is the deduction for the genuinely worse case (pure asking prices).
  if (compromises.blendPathUsed) score -= 10;
  // Added 2026-09-22 with the RentCast comp blend — a real step down
  // from blendPathUsed's 'inactive' tier specifically, not a duplicate
  // penalty for it (see fallback-and-estimate.ts's module header: this
  // only fires when even RentCast's 'inactive' comps ran out too and the
  // estimate had to reach pure asking-price listings).
  if (compromises.reachedActiveListingsTier) score -= 10;
  if (compromises.blendedPoolStillThin) score -= 15;
  if (compromises.multiUnitFellThroughToAreaWide) score -= 15;
  score -= bedroomAdjustmentDeduction(compromises.bedroomAdjustment);
  return Math.max(0, Math.min(100, score));
}

/** Step 2: rescale the raw 0-100 score to the displayed 55-94 range —
 * never claim full certainty, never undersell a real estimate. */
export function rescaleToDisplayPercent(rawScore: number): number {
  return Math.round(DISPLAY_FLOOR + (rawScore / 100) * (DISPLAY_CEILING - DISPLAY_FLOOR));
}

// Bucket cutoffs aren't given numerically in the build brief (only the
// three label strings and two worked examples — Bluff Point Dr at 94%,
// Lapel at ~63%) — chosen so those two examples land in "strong" and
// "limited" respectively, with a "solid" band between. Revisit if Michael
// gives explicit thresholds later.
function bucketFor(displayPercent: number): { bucket: ConfidenceBucket; label: string; sentence: string } {
  if (displayPercent >= 85) {
    return {
      bucket: 'strong',
      label: 'Strong data support',
      sentence:
        'This estimate is backed by a strong set of comparable properties close by and recently leased.',
    };
  }
  if (displayPercent >= 70) {
    return {
      bucket: 'solid',
      label: 'Solid, some limitations',
      sentence:
        'This estimate is well-supported, though a wider search area or date range was needed to find enough comparable properties.',
    };
  }
  return {
    bucket: 'limited',
    label: 'Limited comparable data',
    sentence:
      'Comparable properties were limited in this area, so treat this estimate as a starting point rather than a precise figure.',
  };
}

export function computeConfidence(compromises: CascadeCompromises): ConfidenceResult {
  const rawScore = computeRawScore(compromises);
  const displayPercent = rescaleToDisplayPercent(rawScore);
  const { bucket, label, sentence } = bucketFor(displayPercent);
  return { rawScore, displayPercent, bucket, bucketLabel: label, templateSentence: sentence };
}
