// Per-city owner content for the [city]-property-management pages
// (Michael, 2026-10-20): a written market paragraph and FAQ answers built
// from each city's own RentCast data, so every page carries numbers and
// sentences no other city page has, without anyone hand-writing them.
// Regenerates with each monthly RentCast refresh.
//
// Framed for owners deciding whether to hire a manager (what to charge,
// how long homes take to lease, what vacancy costs, rent vs. sale value),
// not as market-trend reporting — that's the -market-reports pages' job.
// Describes places and properties only (CLAUDE.md Fair Housing rules).

interface BedroomRow {
  bedrooms: number;
  averageRent?: number;
  totalListings?: number;
}

interface LeaseStat {
  medianDays: number;
  p25Days: number;
  p75Days: number;
  count: number;
}

export interface CityMarketRaw {
  dataAsOf?: string;
  zipsUsed?: string[];
  zipCount?: number;
  rentalData?: {
    medianRent?: number;
    totalListings?: number;
    dataByBedrooms?: BedroomRow[];
    history?: Record<string, { medianRent?: number }>;
  };
  saleData?: { medianPrice?: number; totalListings?: number };
  leaseTimes?: { all?: LeaseStat; byBedrooms?: Array<LeaseStat & { beds: number }>; windowStart?: string; windowEnd?: string } | null;
}

const MIN_LEASE_SAMPLE = 20;
const MIN_BEDROOM_LISTINGS = 5;

/** The city's stored market data: D1 first (current, includes lease
 * times), the static snapshot files as a fallback. */
export async function loadCityMarketRaw(db: D1Database | undefined, slug: string): Promise<CityMarketRaw | null> {
  if (db) {
    try {
      const row = await db
        .prepare('SELECT market_data_json FROM rentcast_city_cache WHERE city_key = ?')
        .bind(`${slug}-in`)
        .first<{ market_data_json: string }>();
      if (row) return JSON.parse(row.market_data_json) as CityMarketRaw;
    } catch (err) {
      console.warn(`[city-insights] D1 read failed for ${slug}:`, err);
    }
  }
  // Inside the function (still statically analyzable by Vite) so the pure
  // builders below can be imported outside a Vite build, e.g. in tests.
  const staticMarketData = import.meta.glob<{ default: CityMarketRaw }>('../../../data/homes-for-rent/*.json', { eager: true });
  const entry = Object.entries(staticMarketData).find(([p]) => p.endsWith(`/${slug}.json`));
  return entry ? entry[1].default : null;
}

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const roundTo = (n: number, step: number) => Math.round(n / step) * step;
// Whole percents once a gap is large ("about 52%", not "52.1%").
const pct = (n: number) =>
  Math.abs(n) >= 10 ? `${Math.round(Math.abs(n))}%` : `${Math.abs(n).toFixed(1).replace(/\.0$/, '')}%`;

function monthYear(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function bedroomRows(raw: CityMarketRaw): BedroomRow[] {
  return (raw.rentalData?.dataByBedrooms ?? [])
    .filter((b) => b.bedrooms >= 1 && b.bedrooms <= 5 && (b.totalListings ?? 0) >= MIN_BEDROOM_LISTINGS && b.averageRent)
    .sort((a, b) => a.bedrooms - b.bedrooms);
}

function leaseStat(raw: CityMarketRaw): LeaseStat | null {
  const all = raw.leaseTimes?.all;
  return all && all.count >= MIN_LEASE_SAMPLE ? all : null;
}

/** Gross annual rent as a share of the median sale price. */
function grossYield(raw: CityMarketRaw): number | null {
  const rent = raw.rentalData?.medianRent;
  const price = raw.saleData?.medianPrice;
  return rent && price ? ((rent * 12) / price) * 100 : null;
}

/** 12-month change in median asking rent. RentCast's history isn't
 * aggregated across ZIPs, so this is only used for single-ZIP areas. */
function rentChange(raw: CityMarketRaw): { from: number; to: number; change: number } | null {
  if ((raw.zipCount ?? raw.zipsUsed?.length ?? 0) !== 1) return null;
  const months = Object.keys(raw.rentalData?.history ?? {}).sort();
  if (months.length < 6) return null;
  const from = raw.rentalData!.history![months[0]].medianRent;
  const to = raw.rentalData!.history![months[months.length - 1]].medianRent;
  return from && to ? { from, to, change: ((to - from) / from) * 100 } : null;
}

export interface CityInsights {
  paragraphs: string[];
  sourceNote: string;
  faqs: Array<{ q: string; a: string }>;
}

/** Owner paragraphs + data FAQs for one city, compared against the
 * Indianapolis-area figures where that comparison means something. */
export function buildCityInsights(cityName: string, raw: CityMarketRaw | null, metro: CityMarketRaw | null): CityInsights | null {
  const medianRent = raw?.rentalData?.medianRent;
  if (!raw || !medianRent) return null;

  const paragraphs: string[] = [];
  const faqs: CityInsights['faqs'] = [];
  const asOf = monthYear(raw.dataAsOf);
  // "Indianapolis" here is the Marion County figure (RentCast's 37
  // standard-delivery Indianapolis ZIPs), so it's labeled that way.
  const compare = metro && metro !== raw ? metro : null;
  const metroRent = compare?.rentalData?.medianRent;

  // 1. What homes rent for, by size.
  const rows = bedroomRows(raw);
  const common = [...rows].sort((a, b) => (b.totalListings ?? 0) - (a.totalListings ?? 0))[0];
  let rentText = `Rentals in ${cityName} currently list for a median of ${money(medianRent)} a month`;
  if (metroRent) {
    const diff = ((medianRent - metroRent) / metroRent) * 100;
    rentText +=
      Math.abs(diff) < 3
        ? `, in line with the Indianapolis median of ${money(metroRent)}`
        : `, about ${pct(diff)} ${diff > 0 ? 'above' : 'below'} the Indianapolis median of ${money(metroRent)}`;
  }
  rentText += '.';
  if (common) {
    const others = rows.filter((r) => r !== common).slice(0, 3);
    rentText += ` The most common size on the market is the ${common.bedrooms}-bedroom rental, averaging ${money(common.averageRent!)} across ${common.totalListings} current listings`;
    rentText += others.length ? `; ${others.map((r) => `${r.bedrooms}-bedrooms average ${money(r.averageRent!)}`).join(', ')}.` : '.';
  }
  const change = rentChange(raw);
  if (change && Math.abs(change.change) >= 1) {
    rentText += ` The median asking rent has moved from ${money(change.from)} to ${money(change.to)} over the past year, ${change.change > 0 ? 'up' : 'down'} ${pct(change.change)}.`;
  }
  paragraphs.push(rentText);

  // 2. How long homes take to lease, and what vacancy costs.
  const lease = leaseStat(raw);
  if (lease) {
    const metroLease = compare ? leaseStat(compare) : null;
    let leaseText = `Over the past 12 months, half of the single-family and townhome rentals in ${cityName} leased within ${lease.medianDays} days of listing, and the middle half took ${lease.p25Days} to ${lease.p75Days} days (${lease.count.toLocaleString('en-US')} homes)`;
    if (metroLease) {
      const d = lease.medianDays - metroLease.medianDays;
      leaseText +=
        Math.abs(d) < 4
          ? `. That's close to the Indianapolis median of ${metroLease.medianDays} days.`
          : `. That's about ${Math.abs(d)} days ${d < 0 ? 'faster' : 'slower'} than the Indianapolis median of ${metroLease.medianDays} days.`;
    } else leaseText += '.';
    const vacancyCost = roundTo((medianRent / 30) * lease.medianDays, 10);
    leaseText += ` At the median ${cityName} rent, a home that sits empty for ${lease.medianDays} days costs its owner about ${money(vacancyCost)} in lost rent.`;
    paragraphs.push(leaseText);

    faqs.push({
      q: `How long does it take to rent a home in ${cityName}?`,
      a: `Over the past 12 months, half of the single-family and townhome rentals in ${cityName} leased within ${lease.medianDays} days of listing, and the middle half took ${lease.p25Days} to ${lease.p75Days} days (${lease.count.toLocaleString('en-US')} homes, from RentCast listing data). Price, condition, and season move a home within that range.`,
    });
  }

  // 3. Rent against sale value: the keep-or-sell context owners ask about.
  const yieldPct = grossYield(raw);
  const salePrice = raw.saleData?.medianPrice;
  if (yieldPct && salePrice) {
    const metroYield = compare ? grossYield(compare) : null;
    let yieldText = `The median ${cityName} home for sale is listed around ${money(roundTo(salePrice, 1000))}, so a home renting at the median brings in about ${yieldPct.toFixed(1)}% of its value each year in rent, before expenses`;
    if (metroYield) {
      const d = yieldPct - metroYield;
      if (Math.abs(d) < 0.3) {
        yieldText += `, about the same as the Indianapolis figure of ${metroYield.toFixed(1)}%.`;
      } else if (d > 0) {
        yieldText += `, more than the Indianapolis figure of ${metroYield.toFixed(1)}%. Rents here are strong relative to home prices, which favors owners focused on monthly cash flow.`;
      } else {
        yieldText += `, less than the Indianapolis figure of ${metroYield.toFixed(1)}%. Home prices here are high relative to rents, so long-term appreciation tends to matter more to an owner's return than monthly cash flow.`;
      }
    } else yieldText += '.';
    paragraphs.push(yieldText);
  }

  // Rent FAQ (always available when there's a median).
  const sizeLine = rows.length ? ` By size: ${rows.map((r) => `${r.bedrooms}-bedroom ${money(r.averageRent!)}`).join(', ')}.` : '';
  faqs.unshift({
    q: `How much can I rent my house for in ${cityName}?`,
    a: `${asOf ? `As of ${asOf}, rentals` : 'Rentals'} in ${cityName} list for a median of ${money(medianRent)} a month.${sizeLine} A specific home's rent depends on its size, condition, and exact location; Red Door's free rental analysis prices it against recently rented homes nearby.`,
  });

  const zips = raw.zipsUsed?.length ? ` (ZIP ${raw.zipsUsed.length > 1 ? 'codes' : 'code'} ${raw.zipsUsed.join(', ')})` : '';
  const sourceNote = `Figures from RentCast rental and for-sale listings for ${cityName}${zips}${asOf ? `, updated ${asOf}` : ''}; lease times from rentals that left the market in the past 12 months. "Indianapolis" figures cover Marion County.`;

  return { paragraphs, sourceNote, faqs };
}

export interface TrackRecord {
  /** Homes Red Door has leased in this city, or null when too few to cite. */
  cityCount: number | null;
  metroCount: number;
  since: string | null;
}

const MIN_CITY_LEASES = 5;
// RentEngine's setup import: 43 units created within seconds of each other
// on this date, some of them likely already leased when imported. Only
// units created after it count as homes Red Door listed and leased.
const RENTENGINE_IMPORT_DATE = '2026-01-14';

/** Red Door's own leases from RentEngine, for one city: matched by city
 * name, or by ZIP for areas inside Indianapolis (whose units all say
 * "Indianapolis"). A city's own count is only cited at 5 or more, so a
 * page never undersells a 50-year company with "1 home". */
export function redDoorTrackRecord(
  allUnits: Array<{ city: string; zip: string; createdAt: string }>,
  cityName: string,
  zips: string[]
): TrackRecord {
  const units = allUnits.filter((u) => u.createdAt.slice(0, 10) > RENTENGINE_IMPORT_DATE);
  const zipSet = new Set(zips);
  const name = cityName.toLowerCase();
  const inCity = units.filter((u) => u.city.toLowerCase() === name || zipSet.has(u.zip));
  const earliest = units.map((u) => u.createdAt).filter(Boolean).sort()[0];
  return {
    cityCount: inCity.length >= MIN_CITY_LEASES ? inCity.length : null,
    metroCount: units.length,
    since: monthYear(earliest),
  };
}
