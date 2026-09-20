// Orchestrates decisions #1, #2, #3, #9, #10 against an already-fetched
// comp pool.

import { selectComps } from './comp-selection';
import { buildEstimate, withEstimateCompromises } from './fallback-and-estimate';
import { computeConfidence } from './confidence';
import { applyBedroomAdjustments } from './bedroom-adjustment';
import type { RentEngineComp, SubjectProperty } from './types';

export interface AnalysisResult {
  comps: RentEngineComp[];
  estimatedRent: number;
  rangeLow: number;
  rangeHigh: number;
  confidence: ReturnType<typeof computeConfidence>;
  isMultiUnitPath: boolean;
}

/** Decision #10 needs D1 + a RentCast key — optional so this module stays
 * testable without either (bedroom adjustment simply doesn't run, same
 * as before it was built). submit.ts is the only real caller and always
 * provides this. */
export interface BedroomAdjustmentContext {
  db: D1Database;
  rentCastApiKey: string;
}

export async function analyze(
  rawComps: RentEngineComp[],
  subject: SubjectProperty,
  bedroomAdjustmentContext?: BedroomAdjustmentContext
): Promise<AnalysisResult> {
  const selection = selectComps(rawComps, subject);

  let comps = selection.comps;
  let bedroomAdjustment: NonNullable<Parameters<typeof computeConfidence>[0]['bedroomAdjustment']> = 'none';
  if (bedroomAdjustmentContext) {
    const adjusted = await applyBedroomAdjustments(
      comps,
      subject,
      bedroomAdjustmentContext.db,
      bedroomAdjustmentContext.rentCastApiKey
    );
    comps = adjusted.comps;
    bedroomAdjustment = adjusted.tier;
  }

  const estimate = buildEstimate(comps);
  const compromises = withEstimateCompromises(selection.compromises, estimate);
  compromises.bedroomAdjustment = bedroomAdjustment;
  const confidence = computeConfidence(compromises);

  return {
    comps,
    estimatedRent: estimate.estimatedRent,
    rangeLow: estimate.rangeLow,
    rangeHigh: estimate.rangeHigh,
    confidence,
    isMultiUnitPath: selection.isMultiUnitPath,
  };
}
