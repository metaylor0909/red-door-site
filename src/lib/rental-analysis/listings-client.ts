// RentEngine `GET /units` — used here ONLY for the CMA report page's
// small homes-for-rent cross-sell section (decision #8 step 10), not the
// bigger listings-page rebuild project (separate, not started). See
// claude/listings-build-notes.md for the full research this is built
// against: base URL https://app.rentengine.io/api/public/v1, always
// query with statuses=Available (the endpoint otherwise returns the
// account's entire multi-year unit history), and use the confirmed-real
// `custom_application_url`/`marketing_photos[].original` fields.
//
// Field names below are RentEngine's raw response shape as described in
// that research doc, EXCEPT the rent amount and coordinates sub-shape,
// which weren't explicitly given there (that research focused on detail-
// page fields, not a card-summary shape) — `rent` and
// `address.coordinates.{latitude,longitude}` are reasonable guesses, not
// confirmed. Reconcile against a real response once RENTENGINE_LISTINGS_KEY
// is available to test with.

export interface AvailableUnit {
  id: string;
  formattedAddress: string;
  city: string;
  beds: number;
  baths: number;
  rent: number;
  photoUrl: string | null;
  applyUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface RentEngineUnit {
  id: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  rent?: number; // unconfirmed field name — see module header
  custom_application_url?: string | null;
  address: {
    formatted_address: string;
    city: string;
    coordinates?: { latitude: number; longitude: number } | null; // unconfirmed shape
  };
  marketing_photos?: Array<{ path: string; hidden: boolean; original: string }>;
}

export interface ListingsClientConfig {
  apiKey: string;
  accountId?: string;
}

export async function fetchAvailableUnits(config: ListingsClientConfig): Promise<AvailableUnit[]> {
  const url = new URL('https://app.rentengine.io/api/public/v1/units');
  url.searchParams.set('statuses', 'Available');
  url.searchParams.set('limit', '100');
  if (config.accountId) url.searchParams.set('account_id', config.accountId);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`RentEngine units request failed: ${response.status} ${await response.text()}`);
  }

  const units = (await response.json()) as RentEngineUnit[];

  return units
    .filter((u) => u.status === 'Available')
    .map((u) => {
      const firstVisiblePhoto = u.marketing_photos?.find((p) => !p.hidden);
      return {
        id: u.id,
        formattedAddress: u.address.formatted_address,
        city: u.address.city,
        beds: u.bedrooms,
        baths: u.bathrooms,
        rent: u.rent ?? 0,
        photoUrl: firstVisiblePhoto?.original ?? null,
        applyUrl: u.custom_application_url ?? null,
        latitude: u.address.coordinates?.latitude ?? null,
        longitude: u.address.coordinates?.longitude ?? null,
      };
    });
}
