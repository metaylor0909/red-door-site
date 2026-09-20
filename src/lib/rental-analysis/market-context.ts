// Decision #5's market-context panels (supply/demand ratio, time-to-
// lease) and decision #8 step 9: computed from the same area-wide comp
// pool already fetched for the estimate — no new RentEngine call. This
// runs over the FULL raw pool from rentengine-client.ts, not the
// narrowed top-12 from comp-selection.ts, since "how tight is this
// market" is a broader question than "what are the 12 best comps" —
// submit.ts calls this once at submission time and stores the result in
// the snapshot, since decision #5 treats the whole report as a
// snapshot, not something recomputed on each page view.

import type { RentEngineComp } from './types';

export interface SupplyDemandStats {
  rentedCount: number;
  availableCount: number;
  /** Rented ÷ Available — undefined when there are zero Available comps
   * (avoids a divide-by-zero; the UI should treat this as "all demand". */
  ratio: number | null;
  statusLabel: 'Tight market' | 'Balanced market' | 'Soft market';
}

export interface TimeToLeaseStats {
  medianDaysOnMarket: number | null;
  buckets: {
    days0to14: number;
    days15to30: number;
    days31to45: number;
    days46plus: number;
  };
}

export function computeSupplyDemand(pool: RentEngineComp[]): SupplyDemandStats {
  const rentedCount = pool.filter((c) => c.status === 'Rented').length;
  const availableCount = pool.filter((c) => c.status === 'Available').length;
  const ratio = availableCount > 0 ? rentedCount / availableCount : null;

  // Thresholds aren't numerically specified in the build brief (only the
  // panel concept, styled after RentEngine's own report format) — picked
  // so a market with meaningfully more turnover than active supply reads
  // as "tight," roughly even reads "balanced," and supply-heavy reads
  // "soft." Revisit if Michael gives explicit cutoffs later.
  let statusLabel: SupplyDemandStats['statusLabel'] = 'Balanced market';
  if (ratio === null || ratio >= 1.5) statusLabel = 'Tight market';
  else if (ratio < 0.75) statusLabel = 'Soft market';

  return { rentedCount, availableCount, ratio, statusLabel };
}

export function computeTimeToLease(pool: RentEngineComp[]): TimeToLeaseStats {
  const withDom = pool
    .filter((c) => c.status === 'Rented' && c.days_on_market != null)
    .map((c) => c.days_on_market as number);

  const buckets = { days0to14: 0, days15to30: 0, days31to45: 0, days46plus: 0 };
  for (const dom of withDom) {
    if (dom <= 14) buckets.days0to14 += 1;
    else if (dom <= 30) buckets.days15to30 += 1;
    else if (dom <= 45) buckets.days31to45 += 1;
    else buckets.days46plus += 1;
  }

  let medianDaysOnMarket: number | null = null;
  if (withDom.length > 0) {
    const sorted = [...withDom].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianDaysOnMarket =
      sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
  }

  return { medianDaysOnMarket, buckets };
}
