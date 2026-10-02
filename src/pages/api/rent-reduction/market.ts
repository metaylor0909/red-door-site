// GET /api/rent-reduction/market?zip=46032&beds=3&baths=2
//
// Market inputs for the rent reduction calculator, read entirely from D1
// (written monthly by workers/rentcast-refresh) so using the calculator
// never spends a RentCast request:
//   - local lease time: cleaned median days on market for the most specific
//     served area containing the ZIP, by bedroom count when the sample is
//     large enough, else all sizes, else the Indianapolis area;
//   - market rent and comparables: recently rented homes in the ZIP with
//     the same bedrooms and baths within a half, widened to the whole area
//     when the ZIP alone has too few.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  isCleanLeaseTime,
  isLeasableHome,
  type LeaseRecord,
  type LeaseTimes,
  type LeaseTimeStat,
} from '../../../../workers/rentcast-refresh/src/leases';
import type { Comparable, MarketData } from '../../../lib/rent-reduction/model';

export const prerender = false;

const MIN_LEASE_SAMPLE = 20;
const MIN_COMPS = 3;
const MAX_COMPS = 8;
const RECENT_RENT_DAYS = 183;
const METRO_KEY = 'indianapolis-in';

interface CityRow {
  key: string;
  name: string;
  zips: string[];
  leaseTimes: LeaseTimes | null;
  bedroomRents: Array<{ bedrooms: number; averageRent?: number; totalListings?: number }>;
  dataAsOf: string | null;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': status === 200 ? 'public, max-age=3600' : 'no-store' },
  });
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function pickLeaseTime(
  city: CityRow,
  metro: CityRow | undefined,
  beds: number
): { stat: LeaseTimeStat; label: string } | null {
  const sizeLabel = `${beds}-bedroom homes`;
  const tries: Array<[CityRow | undefined, 'beds' | 'all', string]> = [
    [city, 'beds', `${city.name} ${sizeLabel}`],
    [city, 'all', `${city.name} homes (all sizes)`],
    [metro, 'beds', `Indianapolis-area ${sizeLabel}`],
    [metro, 'all', 'Indianapolis-area homes (all sizes)'],
  ];
  for (const [row, kind, label] of tries) {
    const lt = row?.leaseTimes;
    const stat = kind === 'beds' ? lt?.byBedrooms.find((b) => b.beds === beds) : lt?.all;
    if (stat && stat.count >= MIN_LEASE_SAMPLE) return { stat, label };
  }
  return null;
}

export const GET: APIRoute = async ({ url }) => {
  const zip = url.searchParams.get('zip') ?? '';
  const beds = Number(url.searchParams.get('beds'));
  const baths = Number(url.searchParams.get('baths'));
  if (!/^\d{5}$/.test(zip) || !Number.isInteger(beds) || beds < 1 || beds > 5 || !(baths >= 1 && baths <= 5)) {
    return json(400, { error: 'Enter a 5-digit ZIP, 1–5 bedrooms, and 1–5 bathrooms.' });
  }

  const db = env.DB;
  if (!db) return json(503, { error: 'Market data is temporarily unavailable.' });

  const { results } = await db.prepare('SELECT city_key, market_data_json FROM rentcast_city_cache').all<{ city_key: string; market_data_json: string }>();
  const cities: CityRow[] = results.map((r) => {
    const d = JSON.parse(r.market_data_json);
    return {
      key: r.city_key,
      name: titleCase(d.citySlug ?? r.city_key.replace(/-in$/, '')),
      zips: d.zipsUsed ?? [],
      leaseTimes: d.leaseTimes ?? null,
      bedroomRents: d.rentalData?.dataByBedrooms ?? [],
      dataAsOf: d.dataAsOf ?? null,
    };
  });
  const metro = cities.find((c) => c.key === METRO_KEY);
  // The most specific area wins: Carmel's 2 ZIPs over Indianapolis's 37.
  const city = cities.filter((c) => c.zips.includes(zip)).sort((a, b) => a.zips.length - b.zips.length)[0];
  if (!city) {
    return json(404, {
      error: "We don't have rental data for this ZIP. The calculator covers the Indianapolis area — check the ZIP and try again.",
    });
  }

  const leaseTime = pickLeaseTime(city, metro, beds);
  if (!leaseTime) return json(404, { error: 'Not enough recent rentals in this area to estimate lease times.' });

  const matches = (records: LeaseRecord[]) =>
    records.filter(
      (r) =>
        isLeasableHome(r.type) &&
        isCleanLeaseTime(r.days) &&
        r.beds === beds &&
        r.baths != null &&
        Math.abs(r.baths - baths) <= 0.5
    );
  const loadLeases = async (zips: string[]): Promise<LeaseRecord[]> => {
    if (zips.length === 0) return [];
    const rows = await db
      .prepare(`SELECT leases_json FROM rentcast_zip_leases WHERE zip IN (${zips.map(() => '?').join(',')})`)
      .bind(...zips)
      .all<{ leases_json: string }>();
    return rows.results.flatMap((r) => JSON.parse(r.leases_json) as LeaseRecord[]);
  };

  let comps = matches(await loadLeases([zip]));
  if (comps.length < MIN_COMPS && city.zips.length > 1) {
    comps = matches(await loadLeases(city.zips));
  }
  comps.sort((a, b) => b.removed.localeCompare(a.removed));

  // Rent level from the last ~6 months when there are enough, so a year of
  // rent growth doesn't drag the "market rent" below today's market.
  const cutoff = new Date(Date.now() - RECENT_RENT_DAYS * 86_400_000).toISOString().slice(0, 10);
  const recent = comps.filter((c) => c.removed >= cutoff);
  const rentSample = recent.length >= MIN_COMPS ? recent : comps;

  let marketRent: number;
  let marketRentSource: MarketData['marketRentSource'];
  let marketRentCount: number;
  if (rentSample.length >= MIN_COMPS) {
    marketRent = median(rentSample.map((c) => c.price));
    marketRentSource = 'comps';
    marketRentCount = rentSample.length;
  } else {
    const avg = city.bedroomRents.find((b) => b.bedrooms === beds);
    if (!avg?.averageRent) return json(404, { error: 'Not enough recent rentals like this one to estimate market rent.' });
    marketRent = avg.averageRent;
    marketRentSource = 'market-average';
    marketRentCount = avg.totalListings ?? 0;
  }

  const comparables: Comparable[] = comps.slice(0, MAX_COMPS).map((c) => ({
    address: c.address,
    price: c.price,
    beds: c.beds,
    baths: c.baths,
    sqft: c.sqft,
    removedDate: c.removed,
    daysOnMarket: c.days,
  }));

  const body: MarketData = {
    areaName: city.name,
    marketRent: Math.round(marketRent),
    marketRentSource,
    marketRentCount,
    localMedianDays: leaseTime.stat.medianDays,
    localMiddleHalfDays: [leaseTime.stat.p25Days, leaseTime.stat.p75Days],
    localDaysCount: leaseTime.stat.count,
    localDaysLabel: leaseTime.label,
    comparables,
    dataAsOf: city.dataAsOf,
  };
  return json(200, body);
};
