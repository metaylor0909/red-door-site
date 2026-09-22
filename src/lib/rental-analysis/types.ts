// Shared types for the rental-analysis (CMA) tool.
// See claude/rental-analysis-tool-build.md for the full decision record —
// every field/shape here traces back to a specific decision in that doc.

/** A single comp as returned by RentEngine's GET /market-tool/comps. */
export interface RentEngineComp {
  address: string;
  /** Optional — needed to distinguish units at the same street address
   * (self-match exclusion, decision #4's "must exclude by address+unit,
   * not just address" finding; also used for same-building detection). */
  unit_number?: string | null;
  beds: number;
  baths: number;
  sqft: number | null;
  rent: number;
  days_on_market: number | null;
  date_rented: string | null; // ISO date; null for available comps
  // Lowercase — confirmed live 2026-09-22 against a real /market-tool/
  // comps response. Deliberately NOT the same casing as RentEngineUnit's
  // status field (src/lib/listings/types.ts) — that's a different
  // RentEngine endpoint (/units) which really does use capitalized
  // 'Available'/'Leased', confirmed working in production. The two
  // endpoints simply don't agree with each other; don't "fix" this one
  // to match the other.
  //
  // 'inactive' added 2026-09-22 for RentCast comps (rentcast-comps-
  // client.ts) — RentCast's own "Inactive" status means "no longer an
  // active listing," NOT "confirmed leased" the way RentEngine's
  // 'rented' is. Never treat 'inactive' as equivalent to 'rented';
  // fallback-and-estimate.ts's blend and market-context.ts's
  // supply/demand math both deliberately keep it a separate tier.
  status: 'rented' | 'available' | 'inactive';
  latitude: number;
  longitude: number;
  property_type: string;
  zipcode: string;
  furnished: boolean;
  in_apartment_complex: boolean;
  num_parking_spots: number | null;
  features?: string[];
  image?: string | null;
  description?: string | null;
  /** Decision #10 — set only for comps whose beds differ from the
   * subject's (i.e. the ±1-bed relaxed comps). Not part of RentEngine's
   * raw response; populated by bedroom-adjustment.ts after comp
   * selection, before the estimate median is computed. The report shows
   * both this and the real `rent`, never just one. */
  bedroomAdjustedRent?: number;
  /** Which API this comp came from — added 2026-09-22 alongside RentCast
   * comp blending. Defaults to 'rentengine' semantics wherever omitted in
   * older stored snapshots (JSON.parse just leaves the field undefined,
   * which every consumer treats the same as 'rentengine'). */
  source?: 'rentengine' | 'rentcast';
}

/** The subject property being analyzed. */
export interface SubjectProperty {
  address: string;
  unit_number?: string | null;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  beds: number;
  baths: number;
  sqft: number | null;
  property_type: string;
  furnished: boolean;
  /** Detected via the same signal decision #1 specifies: RentEngine's
   * in_apartment_complex field, or multiple co-located units at the same
   * address in the comp pool. Passed in explicitly since it's determined
   * from the fetched comp pool itself (see determineIsMultiUnit). */
  in_apartment_complex: boolean;
}

/** Deductions applied against decision #9's scoring table — each one
 * tracked explicitly as the cascade runs, rather than reverse-engineered
 * from the final comp set, so the confidence score and the report's
 * plain-language explanation stay in sync with what actually happened. */
export interface CascadeCompromises {
  radiusMiles: 1 | 2 | 3 | 5;
  dateWindowMonths: 6 | 12;
  bedsRelaxed: boolean; // ±1, per decision #1 — never relaxes further
  blendPathUsed: boolean; // decision #2: final Rented count < 5
  blendedPoolStillThin: boolean; // blended pool itself < 5
  multiUnitFellThroughToAreaWide: boolean;
  /** True when even RentEngine-rented + RentCast-inactive together fell
   * short of the 5-comp threshold and the estimate had to reach into
   * pure active-listing asking prices (RentEngine or RentCast) to fill
   * the rest — added 2026-09-22 with the RentCast comp blend. A real
   * step down from the 'inactive' tier, which is at least probably
   * off-market for some reason, not just a current ask. See
   * fallback-and-estimate.ts's three-tier blend. */
  reachedActiveListingsTier: boolean;
  bedroomAdjustment?: 'none' | 'tier1' | 'tier2' | 'tier3-fresh' | 'tier3-thin' | 'tier4-portfolio';
}

export interface CompSelectionResult {
  comps: RentEngineComp[]; // top 12 (or fewer), ranked distance-then-recency
  compromises: CascadeCompromises;
  isMultiUnitPath: boolean;
}
