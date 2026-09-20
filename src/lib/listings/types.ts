// RentEngine `GET /units` — the homes-for-rent listings project's own
// data source. See claude/listings-build-notes.md for the full research
// this is built against (a live read-only-token pull against all current
// units, not guessed from docs alone).
//
// This is the FULL internal record (~50 fields, per that research) —
// distinct from src/lib/rental-analysis/listings-client.ts, which is a
// separate, deliberately narrow client for the CMA tool's small
// cross-sell card summary. The two features use different RentEngine
// keys (decision #7's per-feature key-splitting) and don't share code,
// on the same reasoning.
//
// Field names below are RentEngine's raw shape as confirmed in that
// research, EXCEPT `rent`, which was never explicitly named there (the
// research focused on detail-page fields, not a specific price field
// name) — flagged clearly below, fix in one place once confirmed against
// a real response.

export interface UnitAddress {
  formatted_address: string;
  street_number: string;
  street_name: string;
  city: string;
  state: string;
  zip_code: string;
  coordinates?: { latitude: number; longitude: number } | null; // shape unconfirmed
}

export interface UnitFee {
  name: string;
  type: string;
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
  id: string;
  status: string; // confirmed values seen: "Available", "Leased", "On Hold" — always query statuses=Available
  property_type: string;
  address: UnitAddress;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  year_built: number | null;

  /** Unconfirmed field name — see module header. */
  rent?: number;

  marketing_description: string;
  marketing_photos: UnitPhoto[];
  custom_application_url: string | null;

  pets_allowed: boolean | null;
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
