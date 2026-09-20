// RentEngine `GET /market-tool/comps` — see claude/rental-analysis-tool-
// build.md, "The API — confirmed spec." $0.50/successful call, 40/24hr
// cap, so this makes exactly ONE call per analysis: radius=5mi (decision
// #1's widest possible step) and a 12-month date floor (decision #1's
// hard cap), fetched unfiltered by beds/baths beyond that. Every
// narrower cascade step in comp-selection.ts then filters this single
// pool in memory rather than making a second call.
//
// Deliberately NOT filtering by beds/baths server-side, even though most
// cascade steps eventually narrow on both: decision #1's multi-unit path
// pulls same-building comps with NO bed restriction at all ("bed-count
// relaxation does not apply to same-building comps" — a building's own
// unit mix can span far more than +-1 bed from the subject), and which
// path applies isn't known until this pool is already in hand. Filtering
// beds server-side risks silently dropping legitimate same-building
// comps before comp-selection.ts ever sees them.

import type { RentEngineComp } from './types';

const RENTENGINE_BASE_URL = 'https://api.rentengine.io'; // placeholder host — confirm against docs.rentengine.io once the rental-analysis key is issued
const RADIUS_MILES = 5;
const DATE_WINDOW_MONTHS = 12;

function isoDateMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export interface RentEngineClientConfig {
  apiKey: string;
  accountId?: string;
}

export async function fetchComps(
  latitude: number,
  longitude: number,
  config: RentEngineClientConfig
): Promise<RentEngineComp[]> {
  const url = new URL(`${RENTENGINE_BASE_URL}/market-tool/comps`);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('radius_miles', String(RADIUS_MILES));
  url.searchParams.set('start_date', isoDateMonthsAgo(DATE_WINDOW_MONTHS));
  if (config.accountId) url.searchParams.set('account_id', config.accountId);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`RentEngine comps request failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as RentEngineComp[];
}
