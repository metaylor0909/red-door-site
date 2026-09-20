// Decision #8, step 2 — Mapbox Geocoding API, the recommended default
// (reuses the Mapbox account/token already held for the listings map; see
// claude/rental-analysis-tool-build.md). RentEngine's own `zipcodes` param
// is exact-match only, not radius-based, so the comp-selection cascade's
// 1/2/3/5mi steps need real lat/long from somewhere — this is that.

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zip: string;
  /** Mapbox's own confidence signal for the match, surfaced so a very
   * poor match (typo'd address, etc.) can be caught before it burns a
   * RentEngine call. */
  relevance: number;
}

/**
 * Forward-geocodes a free-text property address via Mapbox. Returns null
 * if Mapbox found no plausible match (caller should reject the
 * submission rather than run the cascade against bad coordinates).
 */
export async function geocodeAddress(address: string, mapboxToken: string): Promise<GeocodeResult | null> {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`);
  url.searchParams.set('access_token', mapboxToken);
  url.searchParams.set('country', 'US');
  url.searchParams.set('types', 'address');
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Mapbox geocoding request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    features?: Array<{
      center: [number, number]; // [lng, lat]
      relevance: number;
      context?: Array<{ id: string; text: string; short_code?: string }>;
    }>;
  };

  const feature = data.features?.[0];
  if (!feature) return null;

  const context = feature.context ?? [];
  const place = context.find((c) => c.id.startsWith('place'))?.text ?? '';
  const region = context.find((c) => c.id.startsWith('region'))?.short_code?.replace('US-', '') ?? '';
  const postcode = context.find((c) => c.id.startsWith('postcode'))?.text ?? '';

  return {
    latitude: feature.center[1],
    longitude: feature.center[0],
    city: place,
    state: region,
    zip: postcode,
    relevance: feature.relevance,
  };
}
