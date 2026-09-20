// RentEngine `GET /units` client for the homes-for-rent listings
// project. Base URL confirmed via the public OpenAPI spec (see
// claude/listings-build-notes.md): https://app.rentengine.io/api/public/v1.
//
// Always query with statuses=Available — /units otherwise returns the
// account's entire multi-year unit history (confirmed: 93 of the first
// 100 unfiltered records were status "Leased"). On Hold units are
// deliberately excluded too (decided Sep 18, see the research doc).

import type { RentEngineUnit } from './types';

const BASE_URL = 'https://app.rentengine.io/api/public/v1';

export interface ListingsFetchConfig {
  apiKey: string;
  accountId?: string;
}

/** Fetches every currently-Available unit, paginating through RentEngine's
 * 100-per-page limit until a short page signals the end. */
export async function fetchAllAvailableUnits(config: ListingsFetchConfig): Promise<RentEngineUnit[]> {
  const units: RentEngineUnit[] = [];
  let pageNumber = 1;

  while (true) {
    const url = new URL(`${BASE_URL}/units`);
    url.searchParams.set('statuses', 'Available');
    url.searchParams.set('limit', '100');
    url.searchParams.set('page_number', String(pageNumber));
    if (config.accountId) url.searchParams.set('account_id', config.accountId);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`RentEngine units request failed: ${response.status} ${await response.text()}`);
    }

    const page = (await response.json()) as RentEngineUnit[];
    units.push(...page.filter((u) => u.status === 'Available'));

    if (page.length < 100) break;
    pageNumber += 1;
  }

  return units;
}

/** Lowercase, hyphenated address slug per CLAUDE.md's locked URL
 * structure: /homes-for-rent/{city}/{address-slug}, unit numbers
 * included, no punctuation. */
export function addressSlug(unit: RentEngineUnit): string {
  return unit.address.formatted_address
    .toLowerCase()
    .replace(/[.,#]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function citySlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-');
}
