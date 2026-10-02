// Standalone Cloudflare Worker, its own Cron Trigger — NOT part of the
// main Astro site's request path. Pulls RentCast's /v1/markets monthly
// for the homes-for-rent project's 50 distinct ZIPs (once each, reused
// across every area that shares a ZIP), aggregates per the locked
// multi-ZIP-averaging decision (see aggregate.ts), and writes one row
// per served area into the shared rentcast_city_cache D1 table — the
// same table decision #10's bedroom adjustment reads/writes, see
// db/migrations/0001_rental_analysis_schema.sql's table comment for why
// they're unified rather than duplicated.
//
// The Astro build reads this store rather than calling RentCast itself,
// decoupling the pull from rebuild timing (claude/listings-build-notes.md's
// locked "Refresh mechanism" decision) — a failed or rate-limited pull
// doesn't break a build, the site just serves last month's cached rows
// until the next successful run.

import { CITIES, distinctZips, type CityConfig } from './cities';
import { aggregateDataBlock, type RentCastDataBlock, type ZipPull } from './aggregate';
import { computeLeaseTimes, fetchZipLeases, type LeaseRecord } from './leases';

export interface Env {
  DB: D1Database;
  RENTCAST_API_KEY: string;
  /** Required for the manual POST trigger; without it the trigger is off. */
  REFRESH_SECRET?: string;
}

interface RentCastMarketsResponse {
  zipCode: string;
  rentalData?: RentCastDataBlock;
  saleData?: RentCastDataBlock;
}

// No documented per-second rate limit for RentCast (unlike RentEngine's
// confirmed 30 requests/5 seconds) — this is a conservative, undocumented
// safety margin, not a confirmed requirement.
const DELAY_BETWEEN_CALLS_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchZip(zip: string, apiKey: string): Promise<RentCastMarketsResponse | null> {
  const url = new URL('https://api.rentcast.io/v1/markets');
  url.searchParams.set('zipCode', zip);
  url.searchParams.set('dataType', 'All'); // one call returns both rentalData and saleData at no extra cost

  const response = await fetch(url.toString(), { headers: { 'X-Api-Key': apiKey } });
  if (!response.ok) {
    console.error(`[rentcast-refresh] ZIP ${zip} failed: ${response.status} ${await response.text()}`);
    return null;
  }
  return (await response.json()) as RentCastMarketsResponse;
}

function cityKeyFor(city: CityConfig): string {
  return `${city.citySlug}-${city.state.toLowerCase()}`;
}

async function upsertCity(
  db: D1Database,
  city: CityConfig,
  pulls: Map<string, RentCastMarketsResponse>,
  leases: Map<string, LeaseRecord[]>
): Promise<boolean> {
  const zipPulls = city.zips.map((zip) => pulls.get(zip)).filter((p): p is RentCastMarketsResponse => p != null);
  const zipsMissing = city.zips.filter((zip) => !pulls.has(zip));
  const leaseZips = city.zips.filter((zip) => leases.has(zip));

  // Whatever this cycle couldn't fetch keeps last month's values.
  const existingRow = await db
    .prepare('SELECT market_data_json FROM rentcast_city_cache WHERE city_key = ?')
    .bind(cityKeyFor(city))
    .first<{ market_data_json: string }>();
  const existing = existingRow ? (JSON.parse(existingRow.market_data_json) as Record<string, unknown>) : null;

  if (zipPulls.length === 0 && leaseZips.length === 0) {
    console.error(`[rentcast-refresh] No usable data for ${city.citySlug} — every ZIP failed, skipping this cycle (last successful row stays in place).`);
    return false;
  }

  const leaseTimes =
    leaseZips.length > 0
      ? { ...computeLeaseTimes(leaseZips.flatMap((zip) => leases.get(zip)!)), zipsUsed: leaseZips }
      : existing?.leaseTimes ?? null;

  let marketData: Record<string, unknown>;
  if (zipPulls.length > 0) {
    const rentalPulls: ZipPull[] = zipPulls.filter((p) => p.rentalData).map((p) => ({ zip: p.zipCode, data: p.rentalData! }));
    const salePulls: ZipPull[] = zipPulls.filter((p) => p.saleData).map((p) => ({ zip: p.zipCode, data: p.saleData! }));
    marketData = {
      citySlug: city.citySlug,
      zipsUsed: zipPulls.map((p) => p.zipCode),
      zipsMissing,
      zipCount: city.zips.length,
      dataAsOf: new Date().toISOString().slice(0, 10),
      aggregationMethod:
        city.zips.length === 1
          ? 'Single ZIP, no aggregation needed.'
          : `Averaged across ${zipPulls.length} of ${city.zips.length} ZIPs (weighted by totalListings; history not multi-ZIP aggregated, see aggregate.ts).`,
      rentalData: rentalPulls.length > 0 ? aggregateDataBlock(rentalPulls) : null,
      saleData: salePulls.length > 0 ? aggregateDataBlock(salePulls) : null,
      leaseTimes,
    };
  } else if (existing) {
    marketData = { ...existing, leaseTimes };
  } else {
    console.error(`[rentcast-refresh] ${city.citySlug}: lease data only and no existing market row; skipping.`);
    return false;
  }

  await db
    .prepare(
      `INSERT INTO rentcast_city_cache (city_key, market_data_json, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(city_key) DO UPDATE SET market_data_json = excluded.market_data_json, updated_at = excluded.updated_at`
    )
    .bind(cityKeyFor(city), JSON.stringify(marketData), new Date().toISOString())
    .run();
  return true;
}

export async function runRefresh(
  env: Env,
  options: { leasesOnly?: boolean } = {}
): Promise<{ zipsFetched: number; zipsFailed: number; leaseZipsFetched: number; leaseZipsFailed: number; citiesUpdated: number }> {
  const zips = distinctZips();
  const pulls = new Map<string, RentCastMarketsResponse>();
  const leases = new Map<string, LeaseRecord[]>();
  let failed = 0;
  let leaseFailed = 0;

  for (const zip of zips) {
    if (!options.leasesOnly) {
      const result = await fetchZip(zip, env.RENTCAST_API_KEY);
      if (result) {
        pulls.set(zip, result);
      } else {
        failed += 1;
      }
      await sleep(DELAY_BETWEEN_CALLS_MS);
    }

    const records = await fetchZipLeases(zip, env.RENTCAST_API_KEY);
    if (records) {
      leases.set(zip, records);
      await env.DB
        .prepare(
          `INSERT INTO rentcast_zip_leases (zip, leases_json, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(zip) DO UPDATE SET leases_json = excluded.leases_json, updated_at = excluded.updated_at`
        )
        .bind(zip, JSON.stringify(records), new Date().toISOString())
        .run();
    } else {
      leaseFailed += 1;
    }
    await sleep(DELAY_BETWEEN_CALLS_MS);
  }

  let citiesUpdated = 0;
  for (const city of CITIES) {
    if (await upsertCity(env.DB, city, pulls, leases)) citiesUpdated += 1;
  }

  console.log(
    `[rentcast-refresh] Done: ${pulls.size}/${options.leasesOnly ? 0 : zips.length} market ZIPs, ${leases.size}/${zips.length} lease ZIPs fetched, ${citiesUpdated} city rows written.`
  );
  return { zipsFetched: pulls.size, zipsFailed: failed, leaseZipsFetched: leases.size, leaseZipsFailed: leaseFailed, citiesUpdated };
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runRefresh(env));
  },
  // Manual trigger for on-demand runs. Each run spends RentCast requests,
  // so it requires the REFRESH_SECRET (sent as X-Refresh-Secret) and is
  // disabled entirely when that secret isn't set. ?leases=only skips the
  // market pull and refreshes just the lease data.
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('POST to trigger a manual refresh run.', { status: 405 });
    }
    const secret = env.REFRESH_SECRET?.trim();
    if (!secret) {
      return new Response('Manual refresh is disabled.', { status: 503 });
    }
    if (request.headers.get('X-Refresh-Secret') !== secret) {
      return new Response('Unauthorized.', { status: 401 });
    }
    const leasesOnly = new URL(request.url).searchParams.get('leases') === 'only';
    const result = await runRefresh(env, { leasesOnly });
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
  },
};
