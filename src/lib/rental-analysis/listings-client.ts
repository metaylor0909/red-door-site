// RentEngine `GET /units` — used here ONLY for the CMA report page's
// small homes-for-rent cross-sell section (decision #8 step 10), not the
// bigger listings-page rebuild project (separate, not started). See
// claude/listings-build-notes.md for the full research this is built
// against: base URL https://app.rentengine.io/api/public/v1, always
// query with statuses=Available (the endpoint otherwise returns the
// account's entire multi-year unit history), and use the confirmed-real
// `custom_application_url`/`marketing_photos[].original` fields.
//
// Field names reconciled against a real live pull, 2026-09-20 (this
// file's earlier version guessed several of these from prose alone and
// got some wrong): the rent field is `target_rental_rate`, not `rent`;
// `id` is a number, not a string; `address.coordinates` is a 2-element
// `[longitude, latitude]` array (GeoJSON order), not an object.
//
// Confirmed 2026-09-20 against a real call: /units rejects an
// `account_id` query param outright (400, "must NOT have additional
// properties") — the Bearer token alone scopes the request to its
// account. `accountId` on ListingsClientConfig is kept for interface
// parity with the comps client but never sent as a query param here.

export interface AvailableUnit {
  id: number;
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
  id: number;
  status: string;
  bedrooms: number;
  bathrooms: number;
  target_rental_rate: number | null;
  custom_application_url?: string | null;
  address: {
    formatted_address: string;
    city: string;
    coordinates?: [number, number] | null; // [longitude, latitude]
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
        rent: u.target_rental_rate ?? 0,
        photoUrl: firstVisiblePhoto?.original ?? null,
        applyUrl: u.custom_application_url ?? null,
        latitude: u.address.coordinates?.[1] ?? null,
        longitude: u.address.coordinates?.[0] ?? null,
      };
    });
}
