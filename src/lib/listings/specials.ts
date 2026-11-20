// Move-in specials ("special offers") for listing banners, as set in
// RentEngine's Special Offer section on each property's Price step.
//
// Source: GET /marketing/listings/{accountId} — the same feed RentEngine's
// own listings widget reads. It is public (the widget calls it without a
// key), it merges specials set on the unit, its floorplan and its
// multifamily property, and it drops expired ones. /units carries only the
// unit's own specials, expired ones included, so it is the fallback when
// the marketing feed can't be reached. Both shapes are
// {description, start_date, end_date?}; end_date is omitted for an ongoing
// offer. Marketing listing `id` is the /units id as a string (checked
// 2026-11-20: 13340 East Golden Gate Dr is 68673 in both).

import type { RentEngineUnit, UnitSpecial } from './types';

const MARKETING_URL = 'https://app.rentengine.io/api/public/v1/marketing/listings';

/** Today's date (YYYY-MM-DD) in Indianapolis, which is how RentEngine's
 * start/end dates read. */
export function todayInIndianapolis(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Indiana/Indianapolis' }).format(now);
}

/** Specials whose date range includes today, with blank descriptions dropped. */
export function activeSpecials(specials: UnitSpecial[] | null | undefined, today = todayInIndianapolis()): UnitSpecial[] {
  return (specials ?? [])
    .map((s) => ({ ...s, description: (s.description ?? '').trim() }))
    .filter((s) => s.description && (!s.start_date || s.start_date <= today) && (!s.end_date || s.end_date >= today));
}

/** "Nov 30, 2026" for an end date, or null for an ongoing offer. */
export function specialEndLabel(special: UnitSpecial): string | null {
  if (!special.end_date) return null;
  const [y, m, d] = special.end_date.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

let marketingSpecialsPromise: Promise<Map<number, UnitSpecial[]> | null> | null = null;

/** Unit id -> specials from the marketing feed, fetched once per build.
 * Null when the feed can't be read, so callers fall back to /units. */
export function fetchMarketingSpecials(accountId: string): Promise<Map<number, UnitSpecial[]> | null> {
  marketingSpecialsPromise ??= (async () => {
    try {
      const byId = new Map<number, UnitSpecial[]>();
      for (let page = 0; page < 20; page++) {
        const url = new URL(`${MARKETING_URL}/${accountId}`);
        url.searchParams.set('limit', '100');
        url.searchParams.set('page_number', String(page));
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const listings = (await res.json()) as Array<{ id: string | number; specials?: UnitSpecial[] }>;
        if (!Array.isArray(listings)) throw new Error('unexpected response shape');
        for (const l of listings) {
          const id = Number(l.id);
          if (Number.isFinite(id)) byId.set(id, l.specials ?? []);
        }
        if (listings.length < 100) break;
      }
      return byId;
    } catch (err) {
      console.warn("[listings] Couldn't read RentEngine's marketing feed for special offers; using each unit's own specials instead.", err);
      return null;
    }
  })();
  return marketingSpecialsPromise;
}

/** Sets active_specials on every unit: marketing-feed specials when the
 * feed has the unit, otherwise the unit's own /units specials. */
export async function attachActiveSpecials(units: RentEngineUnit[], accountId: string): Promise<RentEngineUnit[]> {
  const marketing = await fetchMarketingSpecials(accountId);
  const today = todayInIndianapolis();
  return units.map((u) => ({
    ...u,
    active_specials: activeSpecials(marketing?.get(u.id) ?? u.specials, today),
  }));
}
