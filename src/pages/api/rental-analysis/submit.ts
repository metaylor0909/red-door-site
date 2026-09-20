// POST /api/rental-analysis/submit — decision #8's intake pipeline.
// See claude/rental-analysis-tool-build.md, decision #8, "Submit-flow
// pipeline" for the numbered steps this follows.
//
// Steps wired up so far: 1 (Turnstile), 2 (geocode), 3 (validate fields),
// 4 (comp-selection cascade), 5-6 (blend fallback + estimate), 7
// (confidence score), 9 (market-context panels), 11 (store snapshot in
// D1). Deliberately NOT yet wired: step 8 (decision #10's RentCast
// bedroom adjustment — needs the shared per-city cache table this tool
// doesn't populate on its own), step 10 (cross-sell content — the
// homes-for-rent listings feed it needs hasn't been built in Astro at
// all yet), step 12 (Resend owner + LeadSimple emails, the Zapier
// BD-alert wiring). Those need credentials this environment doesn't have
// yet (RentCast, Resend) or are hosted-report-page/other-feature
// concerns. A submission today stores a real snapshot and returns a real
// token, but nothing gets emailed and no lead is created until step 12
// is built.

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { validateIntake } from '../../../lib/rental-analysis/validation';
import { verifyTurnstileToken } from '../../../lib/rental-analysis/turnstile';
import { geocodeAddress } from '../../../lib/rental-analysis/geocode';
import { fetchComps } from '../../../lib/rental-analysis/rentengine-client';
import { analyze } from '../../../lib/rental-analysis/analyze';
import { computeSupplyDemand, computeTimeToLease } from '../../../lib/rental-analysis/market-context';
import { requireEnvString } from '../../../lib/rental-analysis/env';
import type { SubjectProperty } from '../../../lib/rental-analysis/types';

export const prerender = false;

function jsonError(status: number, message: string, fieldErrors?: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message, fieldErrors }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function readBodyAsRecord(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v ?? '')]));
  }
  const form = await request.formData();
  return Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, String(v)]));
}

export const POST: APIRoute = async ({ request }) => {
  // `wrangler types` only knows about vars it can see in .env (Sanity's),
  // not the .dev.vars secrets this route also needs — cast once here
  // rather than repeating the escape hatch at every lookup below.
  const envRecord = env as unknown as Record<string, unknown>;

  let raw: Record<string, string>;
  try {
    raw = await readBodyAsRecord(request);
  } catch {
    return jsonError(400, 'Could not read the submitted form data.');
  }

  // Step 1: spam check. Cloudflare Turnstile is required per CLAUDE.md's
  // forms decision, not optional — but this environment doesn't have a
  // secret key yet, so verification is skipped (with a loud server-side
  // warning) rather than blocking all development. Do not ship this
  // fallback: set TURNSTILE_SECRET_KEY before this form goes live.
  const turnstileSecret = envRecord.TURNSTILE_SECRET_KEY;
  if (typeof turnstileSecret === 'string' && turnstileSecret.length > 0) {
    const token = raw.turnstile_token;
    // `Astro.clientAddress` isn't supported by this adapter version — the
    // `remoteip` param to Turnstile's siteverify is optional, so this
    // still verifies the token, just without binding it to the caller's IP.
    const passed = token ? await verifyTurnstileToken(token, turnstileSecret) : false;
    if (!passed) return jsonError(400, 'Spam check failed. Please try again.');
  } else {
    console.warn('[rental-analysis/submit] TURNSTILE_SECRET_KEY not configured — spam check skipped.');
  }

  // Step 3: validate the property/owner fields.
  const validation = validateIntake(raw);
  if (!validation.valid) {
    return jsonError(422, 'Please fix the highlighted fields.', validation.errors);
  }
  const intake = validation.value;

  // Step 2: geocode the address.
  let mapboxToken: string;
  try {
    mapboxToken = requireEnvString(envRecord, 'MAPBOX_TOKEN');
  } catch (err) {
    console.error(err);
    return jsonError(500, 'Rental analysis is temporarily unavailable. Please try again later.');
  }

  let geocoded;
  try {
    geocoded = await geocodeAddress(
      [intake.propertyAddress, intake.propertyUnit].filter(Boolean).join(' '),
      mapboxToken
    );
  } catch (err) {
    console.error(err);
    return jsonError(502, 'Could not verify that address right now. Please try again shortly.');
  }
  if (!geocoded) {
    return jsonError(422, 'Could not locate that address.', { property_address: 'Double-check the address and try again.' });
  }

  const subject: SubjectProperty = {
    address: intake.propertyAddress,
    unit_number: intake.propertyUnit,
    city: geocoded.city,
    state: geocoded.state,
    zip: geocoded.zip,
    latitude: geocoded.latitude,
    longitude: geocoded.longitude,
    beds: intake.propertyBeds,
    baths: intake.propertyBaths,
    sqft: intake.propertySqft,
    property_type: intake.propertyType,
    furnished: intake.propertyFurnished,
    // Self-reported apartment/condo strongly implies "part of a complex"
    // for decision #1's same-building-first path; determineIsMultiUnit
    // also checks the fetched pool itself for co-located units, so this
    // is a starting signal, not the only one.
    in_apartment_complex: intake.propertyType === 'apartment-condo',
  };

  // Step 4-7: fetch comps (one RentEngine call) and run the cascade.
  let rentEngineKey: string;
  try {
    rentEngineKey = requireEnvString(envRecord, 'RENTENGINE_RENTAL_ANALYSIS_KEY');
  } catch (err) {
    console.error(err);
    return jsonError(500, 'Rental analysis is temporarily unavailable. Please try again later.');
  }
  const accountId = envRecord.RENTENGINE_ACCOUNT_ID;

  let comps;
  try {
    comps = await fetchComps(subject.latitude, subject.longitude, {
      apiKey: rentEngineKey,
      accountId: typeof accountId === 'string' ? accountId : undefined,
    });
  } catch (err) {
    console.error(err);
    return jsonError(502, 'Could not pull comparable properties right now. Please try again shortly.');
  }

  const result = analyze(comps, subject);

  // Step 9: market-context panels, from the same full pool just fetched
  // (not the narrowed top-12) — no new RentEngine call.
  const supplyDemand = computeSupplyDemand(comps);
  const timeToLease = computeTimeToLease(comps);

  // Step 11: store the snapshot.
  const token = crypto.randomUUID();
  const now = new Date().toISOString();
  const snapshot = {
    comps: result.comps,
    estimatedRent: result.estimatedRent,
    rangeLow: result.rangeLow,
    rangeHigh: result.rangeHigh,
    confidence: result.confidence,
    isMultiUnitPath: result.isMultiUnitPath,
    supplyDemand,
    timeToLease,
  };

  const db = env.DB;
  if (!db) {
    console.error('[rental-analysis/submit] D1 binding "DB" is not configured.');
    return jsonError(500, 'Rental analysis is temporarily unavailable. Please try again later.');
  }

  await db
    .prepare(
      `INSERT INTO rental_analyses (
        token, created_at, owner_name, owner_email, owner_phone,
        property_address, property_city, property_state, property_zip,
        property_lat, property_lon, property_beds, property_baths,
        property_sqft, property_type, property_furnished, snapshot_json,
        distinct_visit_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
    )
    .bind(
      token,
      now,
      intake.ownerName,
      intake.ownerEmail,
      intake.ownerPhone,
      subject.address,
      subject.city,
      subject.state,
      subject.zip,
      subject.latitude,
      subject.longitude,
      subject.beds,
      subject.baths,
      subject.sqft,
      subject.property_type,
      subject.furnished ? 1 : 0,
      JSON.stringify(snapshot)
    )
    .run();

  // Step 12 (emails + LeadSimple + BD-alert wiring) isn't built yet — see
  // the module header. The report is real and stored; nothing is sent.

  return new Response(JSON.stringify({ token, reportUrl: `/rental-analysis/${token}` }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
