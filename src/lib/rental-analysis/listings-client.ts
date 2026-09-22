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
  /** Red Door's own listing detail page, per CLAUDE.md's locked
   * `/homes-for-rent/{city}/{address}` structure — added 2026-09-22, the
   * cross-sell cards on the report page were linking straight to
   * applyUrl (RentEngine's external hosted application), which skips the
   * site's own listing page entirely. Built with the exact same slug
   * transform as addressSlug() in src/lib/listings/rentengine.ts —
   * duplicated rather than imported, since that function's signature
   * takes a full RentEngineUnit, and this client only carries the flat
   * AvailableUnit shape. Keep the two slug functions in sync if the
   * address-slug rule ever changes. */
  detailHref: string;
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

/** Lowercase, hyphenated address slug — must stay in sync with
 * src/lib/listings/rentengine.ts's addressSlug(). */
function addressSlugFromFormatted(formattedAddress: string): string {
  return formattedAddress
    .toLowerCase()
    .replace(/[.,#]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function citySlugFromName(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-');
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
        detailHref: `/homes-for-rent/${citySlugFromName(u.address.city)}/${addressSlugFromFormatted(u.address.formatted_address)}`,
        latitude: u.address.coordinates?.[1] ?? null,
        longitude: u.address.coordinates?.[0] ?? null,
      };
    });
}
