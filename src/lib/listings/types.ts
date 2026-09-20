// RentEngine `GET /units` — the homes-for-rent listings project's own
// data source. See claude/listings-build-notes.md for the full research
// this is built against (a live read-only-token pull against all current
// units, not guessed from docs alone).
//
// This is the FULL internal record (~50 fields, per that research) —
// distinct from src/lib/rental-analysis/listings-client.ts, which is a
// separate, deliberately narrow client for the CMA tool's small
// cross-sell card summary. The two features now share one RentEngine key
// (revised 2026-09-20, see claude/rental-analysis-tool-build.md) but
// still don't share code — different consumers, different shapes.
//
// Field names below were reconciled against a real live pull on
// 2026-09-20 (this doc's earlier version guessed several of these from
// prose alone, e.g. via claude/listings-build-notes.md, and got some
// wrong — corrections noted per-field):
//   - `rent` doesn't exist — the real field is `target_rental_rate`.
//   - `id` is a number, not a string.
//   - `address.coordinates` is a 2-element array, `[longitude, latitude]`
//     (GeoJSON order), NOT `{latitude, longitude}` as originally guessed.
//   - `pets_allowed` is a descriptive STRING ("Yes", "Dogs only" seen so
//     far — presumably "No"/"Cats only"/etc. too), not a boolean.
//   - Fee `amount` values are inconsistently numbers or numeric strings
//     within the SAME array on the SAME unit (confirmed: one unit's
//     monthly_fees had `{amount: 45}` and `{amount: "35"}` side by side)
//     — `fetchAllAvailableUnits` normalizes these to real numbers before
//     returning, so downstream code can trust `UnitFee.amount` is always
//     a number despite the API's own inconsistency.
//   - `security_deposit_amount` is real (not absent, as first assumed
//     before live data was available).

export interface UnitAddress {
  formatted_address: string;
  street_number: string;
  street_name: string;
  city: string;
  state: string;
  zip_code: string;
  /** [longitude, latitude] — GeoJSON order, confirmed against a real pull. */
  coordinates?: [number, number] | null;
}

export interface UnitFee {
  name: string;
  type: string;
  /** Always a real number after fetchAllAvailableUnits's normalization —
   * see the module header on the API's own numeric-string inconsistency. */
  amount: number;
}

export interface UnitPhoto {
  path: string;
  hidden: boolean;
  original: string;
}

export type LaundryType = 'In Unit' | 'Shared' | 'Coin-op' | 'Hookups but no machines' | 'On-site' | 'None';

export type ParkingType =
  | 'Street'
  | 'Carport'
  | 'Assigned Spots'
  | 'Driveway'
  | 'Shared Garage'
  | 'Private Garage'
  | 'Paid Parking';

export interface RentEngineUnit {
  id: number;
  status: string; // confirmed values seen: "Available", "Leased", "On Hold" — always query statuses=Available
  property_type: string;
  address: UnitAddress;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  year_built: number | null;

  target_rental_rate: number | null;
  security_deposit_amount: number | null;
  security_deposit_amount_max: number | null;

  marketing_description: string;
  marketing_photos: UnitPhoto[];
  custom_application_url: string | null;

  /** A descriptive string ("Yes", "Dogs only", presumably "No"/"Cats
   * only"/etc.) confirmed against real data — not a boolean. */
  pets_allowed: string | null;
  pet_restrictions: string | null;
  pet_fees: UnitFee[];
  accepts_vouchers: boolean | null; // confirmed null on every current unit — open item, don't build a voucher filter against this yet

  utilities_included: string[] | null;
  laundry: LaundryType | null;
  parking_type: ParkingType[] | null;
  num_parking_spots: number | null;

  monthly_fees: UnitFee[];
  move_in_fees: UnitFee[];

  min_resident_qualifications: string; // identical text across every unit — link to /application-criteria, don't render raw (see build_listing_detail note in listings-build-notes.md)

  furnished: boolean | null;
  has_elevator: boolean | null;
  floor_number: number | null;
  storm_protection: boolean | null;

  key_access: string | null;
  showing_method: string | null;

  updated_at?: string;
}
