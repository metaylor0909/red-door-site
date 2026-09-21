// Multi-ZIP aggregation for a single city/township, per claude/red-door-
// rentcast-zip-mapping.md's "average across each area's full ZIP list"
// decision. RentCast's own docs and red-door-homes-for-rent-data-schema.md
// don't specify an exact multi-field averaging formula, so the approach
// here is a documented, defensible choice, not a re-derivation of a
// settled decision:
//
// - Rent/price/sqft/days-on-market figures are averaged WEIGHTED by each
//   ZIP's own totalListings, not a plain unweighted mean of per-ZIP
//   averages — a ZIP with 40 listings should count more than one with 4.
// - Count fields (newListings, totalListings) are SUMMED across ZIPs,
//   not averaged — they're genuinely additive.
// - dataByBedrooms/dataByPropertyType are merged by their key (bedroom
//   count / property type) across ZIPs, each group aggregated the same
//   weighted-average-or-sum way.
// - `history` (trailing monthly trend) is NOT multi-ZIP aggregated here —
//   merging month-keyed nested aggregates with the same rigor would be a
//   meaningfully bigger piece of work, and nothing built yet consumes it
//   (it's reserved for decision #5's future rent-trend chart). Uses the
//   single ZIP with the most totalListings as a reasonable stand-in,
//   flagged clearly in the stored aggregationMethod string. Revisit once
//   something actually reads history.
// - `null` per-sqft fields (RentCast's "Land" property type quirk, per
//   the schema doc) are skipped rather than treated as zero.
//
// Which top-level fields get averaged is determined DYNAMICALLY (any
// numeric field not in EXCLUDED_FROM_AVERAGING), not a hardcoded list —
// confirmed live 2026-09-20 that rentalData and saleData use genuinely
// different field-naming schemes for the same concept (rentalData:
// averageRent/medianRent/minRent/maxRent; saleData: averagePrice/
// medianPrice/minPrice/maxPrice — NOT "averageSalePrice" as red-door-
// homes-for-rent-data-schema.md's prose description suggested). A fixed
// field list tuned for rentalData's names would silently produce all-null
// output when run against saleData, which is exactly what the first
// version of this file did before being caught here.

export interface RentCastBedroomEntry {
  bedrooms: number;
  averageRent: number | null;
  medianRent: number | null;
  newListings: number;
  totalListings: number;
  [key: string]: unknown;
}

export interface RentCastPropertyTypeEntry {
  propertyType: string;
  averageRent: number | null;
  medianRent: number | null;
  newListings: number;
  totalListings: number;
  [key: string]: unknown;
}

export interface RentCastDataBlock {
  averageRent?: number | null;
  medianRent?: number | null;
  minRent?: number | null;
  maxRent?: number | null;
  averageRentPerSquareFoot?: number | null;
  medianRentPerSquareFoot?: number | null;
  averageSquareFootage?: number | null;
  medianSquareFootage?: number | null;
  minSquareFootage?: number | null;
  maxSquareFootage?: number | null;
  averageDaysOnMarket?: number | null;
  medianDaysOnMarket?: number | null;
  minDaysOnMarket?: number | null;
  maxDaysOnMarket?: number | null;
  newListings?: number;
  totalListings?: number;
  dataByBedrooms?: RentCastBedroomEntry[];
  dataByPropertyType?: RentCastPropertyTypeEntry[];
  history?: Record<string, unknown>;
  // Sale-side equivalents (averageSalePrice, etc.) pass through this same
  // shape when aggregating saleData — RentCast uses the identical
  // structure for both, per the schema doc.
  [key: string]: unknown;
}

interface ZipPull {
  zip: string;
  data: RentCastDataBlock;
}

function weightedAverage(pairs: Array<{ value: number | null | undefined; weight: number }>): number | null {
  let sum = 0;
  let totalWeight = 0;
  for (const { value, weight } of pairs) {
    if (value == null || weight <= 0) continue;
    sum += value * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? Math.round((sum / totalWeight) * 100) / 100 : null;
}

function sumField(pulls: ZipPull[], field: 'newListings' | 'totalListings'): number {
  return pulls.reduce((total, p) => total + (p.data[field] ?? 0), 0);
}

// Fields that are additive (summed elsewhere) or non-numeric metadata —
// everything else numeric gets weighted-averaged. `zipsReporting` is
// RentCast's own per-rung sample-size field on dataByBedrooms/
// dataByPropertyType entries; also additive, not averaged.
const EXCLUDED_FROM_AVERAGING = new Set(['newListings', 'totalListings', 'zipsReporting']);

function numericFieldNames(objects: Record<string, unknown>[]): string[] {
  const names = new Set<string>();
  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      if (EXCLUDED_FROM_AVERAGING.has(key)) continue;
      if (typeof value === 'number' || value === null) names.add(key);
    }
  }
  return Array.from(names);
}

function aggregateTopLevel(pulls: ZipPull[]): RentCastDataBlock {
  const result: RentCastDataBlock = {};
  for (const field of numericFieldNames(pulls.map((p) => p.data))) {
    result[field] = weightedAverage(
      pulls.map((p) => ({ value: p.data[field] as number | null | undefined, weight: p.data.totalListings ?? 0 }))
    );
  }
  result.newListings = sumField(pulls, 'newListings');
  result.totalListings = sumField(pulls, 'totalListings');
  return result;
}

function aggregateGroupedEntries<T extends { newListings: number; totalListings: number }>(
  pulls: ZipPull[],
  field: 'dataByBedrooms' | 'dataByPropertyType',
  keyField: 'bedrooms' | 'propertyType'
): T[] {
  const groups = new Map<string | number, T[]>();
  for (const pull of pulls) {
    const entries = (pull.data[field] as T[] | undefined) ?? [];
    for (const entry of entries) {
      const key = (entry as any)[keyField];
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }
  }

  const result: T[] = [];
  for (const [key, entries] of groups) {
    const merged: any = { [keyField]: key };
    for (const numericField of numericFieldNames(entries as unknown as Record<string, unknown>[])) {
      merged[numericField] = weightedAverage(
        entries.map((e: any) => ({ value: e[numericField], weight: e.totalListings ?? 0 }))
      );
    }
    merged.newListings = entries.reduce((sum, e: any) => sum + (e.newListings ?? 0), 0);
    merged.totalListings = entries.reduce((sum, e: any) => sum + (e.totalListings ?? 0), 0);
    result.push(merged);
  }
  return result.sort((a: any, b: any) => (typeof a[keyField] === 'number' ? a[keyField] - b[keyField] : String(a[keyField]).localeCompare(String(b[keyField]))));
}

/** Aggregates one field block (rentalData or saleData) across every ZIP
 * pull for a city. Single-ZIP areas skip the math entirely and pass the
 * one pull through unchanged (matches data/homes-for-rent/avon.json's
 * real "Single ZIP, no aggregation needed." aggregationMethod string). */
export function aggregateDataBlock(pulls: ZipPull[]): RentCastDataBlock {
  if (pulls.length === 1) return pulls[0].data;

  const top = aggregateTopLevel(pulls);
  top.dataByBedrooms = aggregateGroupedEntries<RentCastBedroomEntry>(pulls, 'dataByBedrooms', 'bedrooms');
  top.dataByPropertyType = aggregateGroupedEntries<RentCastPropertyTypeEntry>(pulls, 'dataByPropertyType', 'propertyType');

  // history: not aggregated (see module header) — pass through the
  // largest-inventory ZIP's own history as a stand-in.
  const biggest = pulls.reduce((a, b) => ((b.data.totalListings ?? 0) > (a.data.totalListings ?? 0) ? b : a));
  top.history = biggest.data.history;

  return top;
}

export type { ZipPull };
