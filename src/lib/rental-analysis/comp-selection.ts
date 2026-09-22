// Decision #1 — comp-selection cascade. See
// claude/rental-analysis-tool-build.md for the full reasoning; this is a
// direct translation of that decision's prose into code, not a
// reinterpretation. Every branch below is commented back to the specific
// paragraph it implements so the two stay traceable against each other.

import type { CascadeCompromises, RentEngineComp, SubjectProperty } from './types';
import { haversineMiles, normalizeAddress } from './geo';
import { classifyRentEnginePropertyType } from './property-type';

const RENTED_COMP_MINIMUM = 5;
const FINAL_COMP_CAP = 12;

function monthsAgo(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

function isWithinDateWindow(comp: RentEngineComp, months: number): boolean {
  if (comp.status === 'available') return true; // no date_rented to check; see module notes below
  if (!comp.date_rented) return false;
  return new Date(comp.date_rented) >= monthsAgo(months);
}

function isSelfMatch(comp: RentEngineComp, subject: SubjectProperty): boolean {
  // Decision #4: RentEngine's comps can include the subject property
  // itself (a real prior/re-lease, not bad data) — must exclude by
  // address+unit, not just address, or a genuine other unit in the same
  // building gets wrongly dropped too.
  if (normalizeAddress(comp.address) !== normalizeAddress(subject.address)) return false;
  const compUnit = comp.unit_number ? comp.unit_number.trim().toLowerCase() : '';
  const subjectUnit = subject.unit_number ? subject.unit_number.trim().toLowerCase() : '';
  return compUnit === subjectUnit;
}

/** Static quality filters applied throughout, on top of the radius/date/
 * bed/bath cascade — property type, sqft tolerance, furnished exclusion,
 * apartment-complex exclusion for standard-path subjects. `isMultiUnit` is
 * the *computed* determination (subject's own flag OR co-located units
 * found in the pool — see determineIsMultiUnit), not just the raw subject
 * flag, so a property caught by the co-located-units heuristic still gets
 * exempted from the exclusion below even if its own flag is false. */
function applyQualityFilters(comps: RentEngineComp[], subject: SubjectProperty, isMultiUnit: boolean): RentEngineComp[] {
  return comps.filter((c) => {
    if (isSelfMatch(c, subject)) return false;
    // subject.property_type is this tool's internal enum ('single-family',
    // 'townhome', etc. — see validation.ts); c.property_type is
    // RentEngine's own raw string ("Single Family", "Apartment", ...),
    // never directly comparable — see property-type.ts's header comment
    // for the real bug this fixes.
    if (classifyRentEnginePropertyType(c.property_type) !== subject.property_type) return false;
    if (subject.sqft != null && c.sqft != null) {
      const lower = subject.sqft * 0.8;
      const upper = subject.sqft * 1.2;
      if (c.sqft < lower || c.sqft > upper) return false;
    }
    if (c.furnished && !subject.furnished) return false;
    if (!isMultiUnit && c.in_apartment_complex) return false;
    return true;
  });
}

function withinBaths(comp: RentEngineComp, subject: SubjectProperty): boolean {
  // Baths stay ±0.5 throughout — never relaxed in tandem with beds; the
  // confidence score carries that signal instead.
  return Math.abs(comp.baths - subject.baths) <= 0.5;
}

function withinBeds(comp: RentEngineComp, subject: SubjectProperty, relaxed: boolean): boolean {
  return relaxed ? Math.abs(comp.beds - subject.beds) <= 1 : comp.beds === subject.beds;
}

function countRented(comps: RentEngineComp[]): number {
  return comps.filter((c) => c.status === 'rented').length;
}

/** Rank by distance first, recency second (closest wins ties over
 * most-recent), then cap at 12 — decision #1's ranking rule. Recency for
 * Available comps (no date_rented) sorts after all Rented comps of equal
 * distance, on the reasoning that a confirmed Rented outcome is a
 * stronger signal than a still-active listing at the same distance. */
function rankAndCap(comps: RentEngineComp[], subject: SubjectProperty): RentEngineComp[] {
  const withDistance = comps.map((c) => ({
    comp: c,
    distance: haversineMiles(subject.latitude, subject.longitude, c.latitude, c.longitude),
  }));
  withDistance.sort((a, b) => {
    if (Math.abs(a.distance - b.distance) > 1e-9) return a.distance - b.distance;
    const aTime = a.comp.date_rented ? new Date(a.comp.date_rented).getTime() : -Infinity;
    const bTime = b.comp.date_rented ? new Date(b.comp.date_rented).getTime() : -Infinity;
    return bTime - aTime; // more recent first
  });
  return withDistance.slice(0, FINAL_COMP_CAP).map((w) => w.comp);
}

/** Detects the multi-unit path per decision #1: RentEngine's own
 * in_apartment_complex field, OR multiple co-located units returned at
 * the subject's address in the fetched pool. */
export function determineIsMultiUnit(subjectFlag: boolean, allComps: RentEngineComp[], subject: SubjectProperty): boolean {
  if (subjectFlag) return true;
  const sameAddress = allComps.filter((c) => normalizeAddress(c.address) === normalizeAddress(subject.address));
  return sameAddress.length > 1;
}

interface StandardStep {
  radiusMiles: 1 | 2 | 3 | 5;
  dateWindowMonths: 6 | 12;
  bedsRelaxed: boolean;
}

// The 10-step standard-path cascade, in order — see the module header
// comment for how this was derived from decision #1's prose. Beds only
// relax once (at radius 2, after both its date-window attempts at exact
// beds fail) and then stay relaxed for every subsequent, wider step.
const STANDARD_CASCADE: StandardStep[] = [
  { radiusMiles: 1, dateWindowMonths: 6, bedsRelaxed: false },
  { radiusMiles: 1, dateWindowMonths: 12, bedsRelaxed: false },
  { radiusMiles: 2, dateWindowMonths: 6, bedsRelaxed: false },
  { radiusMiles: 2, dateWindowMonths: 12, bedsRelaxed: false },
  { radiusMiles: 2, dateWindowMonths: 6, bedsRelaxed: true },
  { radiusMiles: 2, dateWindowMonths: 12, bedsRelaxed: true },
  { radiusMiles: 3, dateWindowMonths: 6, bedsRelaxed: true },
  { radiusMiles: 3, dateWindowMonths: 12, bedsRelaxed: true },
  { radiusMiles: 5, dateWindowMonths: 6, bedsRelaxed: true },
  { radiusMiles: 5, dateWindowMonths: 12, bedsRelaxed: true },
];

function poolForStep(qualityFiltered: RentEngineComp[], subject: SubjectProperty, step: StandardStep): RentEngineComp[] {
  return qualityFiltered.filter(
    (c) =>
      haversineMiles(subject.latitude, subject.longitude, c.latitude, c.longitude) <= step.radiusMiles &&
      withinBaths(c, subject) &&
      withinBeds(c, subject, step.bedsRelaxed) &&
      isWithinDateWindow(c, step.dateWindowMonths)
  );
}

function runStandardPath(
  qualityFiltered: RentEngineComp[],
  subject: SubjectProperty
): { pool: RentEngineComp[]; compromises: Omit<CascadeCompromises, 'blendPathUsed' | 'blendedPoolStillThin' | 'multiUnitFellThroughToAreaWide'> } {
  let lastStep = STANDARD_CASCADE[0];
  let lastPool: RentEngineComp[] = [];
  for (const step of STANDARD_CASCADE) {
    lastStep = step;
    lastPool = poolForStep(qualityFiltered, subject, step);
    if (countRented(lastPool) >= RENTED_COMP_MINIMUM) break;
  }
  // If the cascade is exhausted without reaching the minimum, lastPool is
  // whatever the final (5mi/12mo/±1) step produced — used as-is per
  // decision #1's "use whatever's available" rule; the thin-data signal
  // flows into decision #2's fallback and decision #9's confidence score.
  return {
    pool: lastPool,
    compromises: {
      radiusMiles: lastStep.radiusMiles,
      dateWindowMonths: lastStep.dateWindowMonths,
      bedsRelaxed: lastStep.bedsRelaxed,
    },
  };
}

function runMultiUnitPath(
  allQualityFiltered: RentEngineComp[],
  subject: SubjectProperty
): { pool: RentEngineComp[]; usedSameBuilding: boolean; dateWindowMonths: 6 | 12 } {
  // Same-building comps: any comp at the subject's address, regardless of
  // unit — bed-relaxation does not apply here (a building's own unit mix
  // already spans bed counts by nature). Baths stays ±0.5 as always.
  const sameBuilding = allQualityFiltered.filter(
    (c) => normalizeAddress(c.address) === normalizeAddress(subject.address) && withinBaths(c, subject)
  );
  for (const months of [6, 12] as const) {
    const pool = sameBuilding.filter((c) => isWithinDateWindow(c, months));
    if (countRented(pool) >= RENTED_COMP_MINIMUM) {
      return { pool, usedSameBuilding: true, dateWindowMonths: months };
    }
  }
  // Building itself can't reach 5 comps within the 12-month cap — fall
  // through to the area-wide standard path entirely.
  return { pool: [], usedSameBuilding: false, dateWindowMonths: 12 };
}

/**
 * Runs decision #1's full cascade against an already-fetched, broad comp
 * pool (radius ≤5mi, date ≤12mo, beds within ±1 of the subject — the
 * widest scope any step could need — fetched once by the caller to
 * minimize RentEngine API cost, then narrowed here entirely in memory).
 */
export function selectComps(
  rawComps: RentEngineComp[],
  subject: SubjectProperty
): { comps: RentEngineComp[]; compromises: CascadeCompromises; isMultiUnitPath: boolean } {
  const isMultiUnit = determineIsMultiUnit(subject.in_apartment_complex, rawComps, subject);
  const qualityFiltered = applyQualityFilters(rawComps, subject, isMultiUnit);

  let finalPool: RentEngineComp[];
  let compromises: CascadeCompromises;

  if (isMultiUnit) {
    const { pool, usedSameBuilding, dateWindowMonths } = runMultiUnitPath(qualityFiltered, subject);
    if (usedSameBuilding) {
      finalPool = pool;
      compromises = {
        radiusMiles: 1, // not radius-governed on this path; nominal value, no radius deduction applies
        dateWindowMonths,
        bedsRelaxed: false,
        blendPathUsed: false,
        blendedPoolStillThin: false,
        multiUnitFellThroughToAreaWide: false,
      };
    } else {
      const standard = runStandardPath(qualityFiltered, subject);
      finalPool = standard.pool;
      compromises = {
        ...standard.compromises,
        blendPathUsed: false,
        blendedPoolStillThin: false,
        multiUnitFellThroughToAreaWide: true,
      };
    }
  } else {
    const standard = runStandardPath(qualityFiltered, subject);
    finalPool = standard.pool;
    compromises = {
      ...standard.compromises,
      blendPathUsed: false,
      blendedPoolStillThin: false,
      multiUnitFellThroughToAreaWide: false,
    };
  }

  return {
    comps: rankAndCap(finalPool, subject),
    compromises,
    isMultiUnitPath: isMultiUnit,
  };
}
