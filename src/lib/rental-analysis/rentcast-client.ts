// RentCast `GET /v1/markets` — decision #10's data source for the
// bedroom-count adjustment. Field names below follow the corrections
// documented in red-door-homes-for-rent-data-schema.md (verified against
// a real Avon/46123 pull for THAT project) — this tool's own on-demand
// tier-3 pulls haven't been reconciled against a live response yet, same
// caution already noted for RentEngine's comp fields elsewhere in this
// codebase.
//
// Pulls `dataType=Rental` only, not `All` — this tool has no use for
// `saleData`, unlike the homes-for-rent project's own pull. Whether that
// project ends up sharing this exact cache table/row shape isn't decided
// (its own schema doc leaves the storage format open), so no saleData
// column is speculatively added here.

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

interface RentCastMarketsResponse {
  zipCode: string;
  rentalData?: {
    dataByBedrooms?: RentCastBedroomEntry[];
  };
}

export async function fetchBedroomLadder(zip: string, apiKey: string): Promise<RentCastBedroomRung[]> {
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
  const entries = data.rentalData?.dataByBedrooms ?? [];

  return entries.map((e) => ({
    beds: e.bedrooms,
    avgRent: e.averageRent,
    newListings: e.newListings,
    totalListings: e.totalListings,
  }));
}
