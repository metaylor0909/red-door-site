// RentCast `GET /v1/markets` — decision #10's data source for the
// bedroom-count adjustment, and (REVISED 2026-09-20) now the same shape
// workers/rentcast-refresh's standalone Cron Worker writes for the
// homes-for-rent project — see db/migrations/0001_rental_analysis_schema.sql's
// rentcast_city_cache comment for why these two consumers now share one
// table/shape instead of decision #10 having its own narrower one.
//
// Field names follow the corrections documented in red-door-homes-for-
// rent-data-schema.md (verified against a real Avon/46123 pull for that
// project, confirmed again live for this tool against ZIP 46060,
// 2026-09-20).
//
// Pulls `dataType=Rental` only for decision #10's own on-demand tier-3
// pulls (no use for `saleData` there) — the Cron Worker's own monthly
// pulls use `dataType=All` instead (see workers/rentcast-refresh), so a
// tier-3 ad-hoc row's `market_data_json.saleData` is absent until/unless
// the Cron Worker later writes a fuller row for that same city_key. This
// is a deliberate asymmetry (ad-hoc rows are "just enough for the
// adjustment," not a full homes-for-rent city profile), not a bug.

export interface RentCastBedroomRung {
  beds: number;
  avgRent: number;
  newListings: number;
  totalListings: number;
}

interface RentCastBedroomEntry {
  bedrooms: number;
  averageRent: number;
  newListings: number;
  totalListings: number;
}

export interface RentCastRentalData {
  dataByBedrooms?: RentCastBedroomEntry[];
  [key: string]: unknown; // averageRent, medianRent, dataByPropertyType, history, etc. — pulled through as-is, not fully typed here
}

interface RentCastMarketsResponse {
  zipCode: string;
  rentalData?: RentCastRentalData;
}

/** Raw single-ZIP pull, `dataType=Rental` — used by decision #10's tier 3
 * to build a market_data_json row consistent with the Cron Worker's own
 * shape (see module header). */
export async function fetchRentalMarketData(zip: string, apiKey: string): Promise<RentCastRentalData | null> {
  const url = new URL('https://api.rentcast.io/v1/markets');
  url.searchParams.set('zipCode', zip);
  url.searchParams.set('dataType', 'Rental');

  const response = await fetch(url.toString(), {
    headers: { 'X-Api-Key': apiKey },
  });

  if (!response.ok) {
    throw new Error(`RentCast markets request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as RentCastMarketsResponse;
  return data.rentalData ?? null;
}

export function deriveBedroomLadder(rentalData: RentCastRentalData | null | undefined): RentCastBedroomRung[] {
  const entries = rentalData?.dataByBedrooms ?? [];
  return entries.map((e) => ({
    beds: e.bedrooms,
    avgRent: e.averageRent,
    newListings: e.newListings,
    totalListings: e.totalListings,
  }));
}
