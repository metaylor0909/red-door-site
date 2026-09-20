// Orchestrates decisions #1, #2, #3, #9 against an already-fetched comp
// pool. Decision #10's bedroom adjustment is deliberately not wired in
// yet — it needs a live RentCast-backed per-city file (see
// claude/rental-analysis-tool-build.md decision #10), which isn't
// available in this environment yet. Once that store exists, applying
// bedroom-adjusted rents to the ±1-bed comps in `comps` (before the
// estimate median in decision #2/#3) is the one remaining piece this
// orchestrator needs to grow.

import { selectComps } from './comp-selection';
import { buildEstimate, withEstimateCompromises } from './fallback-and-estimate';
import { computeConfidence } from './confidence';
import type { RentEngineComp, SubjectProperty } from './types';

export interface AnalysisResult {
  comps: RentEngineComp[];
  estimatedRent: number;
  rangeLow: number;
  rangeHigh: number;
  confidence: ReturnType<typeof computeConfidence>;
  isMultiUnitPath: boolean;
}

export function analyze(rawComps: RentEngineComp[], subject: SubjectProperty): AnalysisResult {
  const selection = selectComps(rawComps, subject);
  const estimate = buildEstimate(selection.comps);
  const compromises = withEstimateCompromises(selection.compromises, estimate);
  const confidence = computeConfidence(compromises);

  return {
    comps: selection.comps,
    estimatedRent: estimate.estimatedRent,
    rangeLow: estimate.rangeLow,
    rangeHigh: estimate.rangeHigh,
    confidence,
    isMultiUnitPath: selection.isMultiUnitPath,
  };
}
