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
  /** Available ÷ Rented — how much active inventory sits on the market
   * for every home that's actually leased, over the same comp-pool
   * window. Lower is healthier (homes get absorbed faster than they
   * pile up); null when there are zero Rented comps to divide by.
   * REVISED 2026-09-22 to match Michael's report-design reference (an
   * 8-available/26-rented example labeled "Healthy" at a 0.31 ratio) —
   * previously this was Rented ÷ Available, the inverse, which called
   * that same scenario "Soft." */
  ratio: number | null;
  statusLabel: 'Healthy market' | 'Balanced market' | 'Soft market';
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

// REVISED 2026-09-22 — the pool can now also contain RentCast 'inactive'
// comps (rentcast-comps-client.ts). Deliberately excluded from both
// counts below by the exact-match filters (neither === 'rented' nor
// === 'available' catches 'inactive') — it isn't a confirmed lease OR a
// current listing, so counting it either way would misrepresent this
// panel's whole point. It still appears in the comps table/estimate;
// just not here.
export function computeSupplyDemand(pool: RentEngineComp[]): SupplyDemandStats {
  const rentedCount = pool.filter((c) => c.status === 'rented').length;
  const availableCount = pool.filter((c) => c.status === 'available').length;
  const ratio = rentedCount > 0 ? availableCount / rentedCount : null;

  // Thresholds aren't numerically specified in the build brief — picked
  // to match Michael's own report-design reference (0.31 → "Healthy").
  // Revisit if Michael gives explicit cutoffs later.
  let statusLabel: SupplyDemandStats['statusLabel'] = 'Balanced market';
  if (ratio === null || ratio > 1) statusLabel = 'Soft market';
  else if (ratio <= 0.5) statusLabel = 'Healthy market';

  return { rentedCount, availableCount, ratio, statusLabel };
}

export function computeTimeToLease(pool: RentEngineComp[]): TimeToLeaseStats {
  const withDom = pool
    .filter((c) => c.status === 'rented' && c.days_on_market != null)
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
