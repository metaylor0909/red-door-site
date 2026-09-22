// RentEngine `GET /units` client for the homes-for-rent listings
// project. Base URL confirmed via the public OpenAPI spec (see
// claude/listings-build-notes.md): https://app.rentengine.io/api/public/v1.
//
// Always query with statuses=Available — /units otherwise returns the
// account's entire multi-year unit history (confirmed: 93 of the first
// 100 unfiltered records were status "Leased"). On Hold units are
// deliberately excluded too (decided Sep 18, see the research doc).
//
// Confirmed 2026-09-20 against a real call: /units rejects an
// `account_id` query param outright (400, "must NOT have additional
// properties") — unlike /market-tool/comps, which accepts one. The
// Bearer token alone scopes the request to its account. `accountId` on
// ListingsFetchConfig is kept for interface parity with the comps client
// but deliberately never sent as a query param here.
//
// Also confirmed 2026-09-20: `page_number` is 0-indexed, not 1-indexed —
// undocumented in claude/listings-build-notes.md's API research (which
// only noted the param exists, not its starting index). Requesting
// page_number=1 first (this file's original bug) silently skips the real
// first page and returns nothing after that, with no error — a passing-
// looking empty result, not a crash, so it went unnoticed until directly
// comparing page 0 vs. page 1 against a real account with known
// inventory.

import type { RentEngineUnit } from './types';

const BASE_URL = 'https://app.rentengine.io/api/public/v1';

// RentEngine's own account id (not a secret — a public identifier used in
// hosted-booking/schedule-showing URLs). Pulled into this shared module
// rather than declared as a top-level const in each page's own
// frontmatter: a bare frontmatter const isn't reliably visible inside
// that same file's getStaticPaths() for a DYNAMIC route ([city], [slug])
// — a recurring Astro prerendering gotcha hit repeatedly on this project
// (see red-door-website-todo.md). It silently caused
// [city]-homes-for-rent.astro and homes-for-rent/[city]/[slug].astro's
// getStaticPaths() to throw `ReferenceError: RENTENGINE_ACCOUNT_ID is not
// defined`, caught by their own try/catch and logged as a warning rather
// than failing the build — so 19 of 20 city hub pages silently built with
// zero live listings, and zero listing-detail pages built at all, without
// ever failing CI. indianapolis-homes-for-rent.astro (a plain, non-
// dynamic route) never hit this, which is why it alone showed real
// listings. Confirmed and fixed 2026-09-22.
export const RENTENGINE_ACCOUNT_ID = '6ecca3ec-8e5a-42ed-87ea-af21f97d546e';

export interface ListingsFetchConfig {
  apiKey: string;
  accountId?: string;
}

/** Fetches every currently-Available unit, paginating through RentEngine's
 * 100-per-page limit until a short page signals the end. */
export async function fetchAllAvailableUnits(config: ListingsFetchConfig): Promise<RentEngineUnit[]> {
  const units: RentEngineUnit[] = [];
  let pageNumber = 0;

  while (true) {
    const url = new URL(`${BASE_URL}/units`);
    url.searchParams.set('statuses', 'Available');
    url.searchParams.set('limit', '100');
    url.searchParams.set('page_number', String(pageNumber));

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`RentEngine units request failed: ${response.status} ${await response.text()}`);
    }

    const page = (await response.json()) as RentEngineUnit[];
    units.push(...page.filter((u) => u.status === 'Available').map(normalizeUnit));

    if (page.length < 100) break;
    pageNumber += 1;
  }

  return units;
}

/** RentEngine's own `amount` fields on fee arrays come back as a mix of
 * numbers and numeric strings within the SAME array on the SAME unit
 * (confirmed live, 2026-09-20) — coerced to real numbers here, once,
 * so every downstream consumer can trust UnitFee.amount without its own
 * defensive Number() call. */
function normalizeUnit(unit: RentEngineUnit): RentEngineUnit {
  const normalizeFees = (fees: RentEngineUnit['move_in_fees']) => fees.map((f) => ({ ...f, amount: Number(f.amount) }));
  return {
    ...unit,
    move_in_fees: normalizeFees(unit.move_in_fees ?? []),
    monthly_fees: normalizeFees(unit.monthly_fees ?? []),
    pet_fees: normalizeFees(unit.pet_fees ?? []),
  };
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
