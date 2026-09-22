// Classifies RentEngine's own raw property_type strings (confirmed live
// 2026-09-22 against a real /market-tool/comps call: "Apartment", "Single
// Family", "Townhouse" — and against /units listing data used elsewhere
// in this project: "Condo", "Duplex", "Multi-Family", "Single Family
// Residence") into this tool's internal PropertyType vocabulary
// (validation.ts's PROPERTY_TYPES).
//
// Found via a real bug: comp-selection.ts's property-type filter did a
// bare `c.property_type !== subject.property_type` — comparing
// RentEngine's raw strings directly against the form's hyphenated enum
// values ('single-family', 'townhome', etc.), which never match. Every
// real submission silently returned zero comps and a null estimate,
// invisible until this project's first real end-to-end test (Mapbox/
// RentEngine keys were only pushed to production the same day this was
// found). Keyword-based rather than an exact lookup table, since the
// comps and units endpoints don't even agree with each other on exact
// wording for the same category ("Single Family" vs "Single Family
// Residence") — this needs to survive that kind of variation, not just
// the one sample already seen.
import type { PropertyType } from './validation';

export function classifyRentEnginePropertyType(raw: string): PropertyType {
  const s = raw.toLowerCase();
  if (s.includes('single family')) return 'single-family';
  if (s.includes('townhouse') || s.includes('townhome')) return 'townhome';
  if (s.includes('condo')) return 'condo';
  if (s.includes('duplex')) return 'duplex';
  // A standalone "Apartment" unit is, by definition, part of a larger
  // multi-family building — folds into the same category as this tool's
  // own "Multi-family property" option rather than being its own bucket
  // the form doesn't offer.
  if (s.includes('multi') || s.includes('apartment')) return 'multi-family';
  return 'other';
}
