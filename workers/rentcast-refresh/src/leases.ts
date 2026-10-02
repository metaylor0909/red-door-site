// Recently leased homes from RentCast's removed (inactive) rental listings.
// Two uses: real time-to-lease by city and bedroom count, and a year of
// comparable rentals per ZIP for the rent reduction calculator.
//
// RentCast keeps one record per address, with every earlier listing of
// that address in `history`; each history entry is its own listing event
// with listed/removed dates and price. Checked against Avon, Carmel and
// Fishers on 2026-10-01: about half of the events are "flash" listings up
// for 3 days or less (often the same home every year), which are crawl
// artifacts rather than one-day leases, and events over 180 days are
// usually withdrawals. Both are excluded from time-to-lease stats.

export interface LeaseRecord {
  address: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  type: string | null;
  price: number;
  listed: string; // YYYY-MM-DD
  removed: string; // YYYY-MM-DD
  days: number;
}

export interface LeaseTimeStat {
  medianDays: number;
  p25Days: number;
  p75Days: number;
  count: number;
}

export interface LeaseTimes {
  /** Single-family + townhome events removed in the window, cleaned. */
  all: LeaseTimeStat | null;
  byBedrooms: Array<LeaseTimeStat & { beds: number }>;
  windowStart: string | null;
  windowEnd: string | null;
  method: string;
}

interface RentCastHistoryEvent {
  event?: string;
  price?: number;
  listedDate?: string;
  removedDate?: string;
  daysOnMarket?: number;
}

interface RentCastInactiveListing {
  formattedAddress?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  price?: number;
  listedDate?: string;
  removedDate?: string;
  daysOnMarket?: number;
  history?: Record<string, RentCastHistoryEvent>;
}

const WINDOW_DAYS = 365;
const FLASH_MAX_DAYS = 3;
const STALE_MIN_DAYS = 181;
const DAY_MS = 86_400_000;

export async function fetchZipLeases(zip: string, apiKey: string): Promise<LeaseRecord[] | null> {
  const url = new URL('https://api.rentcast.io/v1/listings/rental/long-term');
  url.searchParams.set('zipCode', zip);
  url.searchParams.set('status', 'Inactive');
  url.searchParams.set('limit', '500');

  const response = await fetch(url.toString(), { headers: { 'X-Api-Key': apiKey } });
  if (!response.ok) {
    console.error(`[rentcast-refresh] leases ZIP ${zip} failed: ${response.status} ${await response.text()}`);
    return null;
  }
  const listings = (await response.json()) as RentCastInactiveListing[];
  return toLeaseRecords(listings, Date.now());
}

/** Flatten each address's listing events, keeping those removed within
 * the window. Done per ZIP right after fetching so the raw response
 * (often ~1 MB) isn't held while the remaining ZIPs are pulled. */
export function toLeaseRecords(listings: RentCastInactiveListing[], now: number): LeaseRecord[] {
  const cutoff = now - WINDOW_DAYS * DAY_MS;
  const records: LeaseRecord[] = [];
  for (const listing of listings) {
    const events = listing.history && Object.keys(listing.history).length > 0
      ? Object.values(listing.history)
      : [listing];
    for (const event of events) {
      if (!event.listedDate || !event.removedDate || typeof event.price !== 'number' || event.price <= 0) continue;
      const removed = new Date(event.removedDate).getTime();
      if (!(removed >= cutoff)) continue;
      const days =
        typeof event.daysOnMarket === 'number'
          ? event.daysOnMarket
          : Math.round((removed - new Date(event.listedDate).getTime()) / DAY_MS);
      records.push({
        address: listing.formattedAddress ?? 'Nearby rental',
        beds: listing.bedrooms ?? null,
        baths: listing.bathrooms ?? null,
        sqft: listing.squareFootage ?? null,
        type: listing.propertyType ?? null,
        price: event.price,
        listed: event.listedDate.slice(0, 10),
        removed: event.removedDate.slice(0, 10),
        days,
      });
    }
  }
  return records;
}

function quantile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

function statFor(days: number[]): LeaseTimeStat | null {
  if (days.length === 0) return null;
  const sorted = [...days].sort((a, b) => a - b);
  return {
    medianDays: quantile(sorted, 0.5),
    p25Days: quantile(sorted, 0.25),
    p75Days: quantile(sorted, 0.75),
    count: sorted.length,
  };
}

export function isLeasableHome(type: string | null): boolean {
  return type === 'Single Family' || type === 'Townhouse';
}

export function isCleanLeaseTime(days: number): boolean {
  return days > FLASH_MAX_DAYS && days < STALE_MIN_DAYS;
}

export function computeLeaseTimes(records: LeaseRecord[]): LeaseTimes {
  const clean = records.filter((r) => isLeasableHome(r.type) && isCleanLeaseTime(r.days));
  const byBedrooms: LeaseTimes['byBedrooms'] = [];
  for (const beds of [1, 2, 3, 4, 5]) {
    const stat = statFor(clean.filter((r) => r.beds === beds).map((r) => r.days));
    if (stat) byBedrooms.push({ beds, ...stat });
  }
  const removedDates = clean.map((r) => r.removed).sort();
  return {
    all: statFor(clean.map((r) => r.days)),
    byBedrooms,
    windowStart: removedDates[0] ?? null,
    windowEnd: removedDates[removedDates.length - 1] ?? null,
    method: `Single-family and townhome rental listings removed in the last 12 months, excluding listings up ${FLASH_MAX_DAYS} days or less (crawl artifacts) and over ${STALE_MIN_DAYS - 1} days (likely withdrawn).`,
  };
}
