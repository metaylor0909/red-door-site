// POST /api/rental-analysis/submit — decision #8's intake pipeline.
// See claude/rental-analysis-tool-build.md, decision #8, "Submit-flow
// pipeline" for the numbered steps this follows.
//
// Steps wired up so far: 1 (Turnstile), 2 (geocode), 3 (validate fields),
// 4 (comp-selection cascade), 5-6 (blend fallback + estimate), 7
// (confidence score), 8 (decision #10's RentCast bedroom adjustment), 11
// (store snapshot in D1), 12 (Resend owner email + LeadSimple lead-
// creation email). Step 9's old market-context panels (supply/demand
// ratio, time-to-lease) were dropped 2026-09-22 — see this function's own
// note further down for why — and replaced on the report page with
// RentCast city-level trend data, computed fresh per page view rather
// than stored here. Deliberately NOT yet wired: step 10 (cross-sell
// content — the homes-for-rent listings feed it needs hasn't been built
// in Astro at all yet), and the Zapier BD-alert webhook (that's the
// [token] report page's concern, on return visits — see
// view-tracking.ts). Missing RESEND_API_KEY or RENTCAST_API_KEY degrade
// gracefully (skip sending / skip the bedroom adjustment) rather than
// failing the submission — only Mapbox and RentEngine are hard
// requirements, since the core estimate can't be computed without them.

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { validateIntake } from '../../../lib/rental-analysis/validation';
import { verifyTurnstileToken } from '../../../lib/rental-analysis/turnstile';
import { geocodeAddress } from '../../../lib/rental-analysis/geocode';
import { fetchComps } from '../../../lib/rental-analysis/rentengine-client';
import { fetchRentCastComps } from '../../../lib/rental-analysis/rentcast-comps-client';
import { mergeCompPools } from '../../../lib/rental-analysis/comp-selection';
import { analyze } from '../../../lib/rental-analysis/analyze';
import { sendEmail } from '../../../lib/rental-analysis/resend-client';
import { buildOwnerEmail, buildLeadSimpleEmail } from '../../../lib/rental-analysis/emails';
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
    // Turnstile auto-injects its solved token into the widget's own
    // hidden `cf-turnstile-response` input once solved — that's the real
    // field name to read. A previous version of this form tried to copy
    // the token into a separate `turnstile_token` field via a
    // `data-callback` JS function that was never actually defined
    // anywhere, so that field stayed permanently empty and every real
    // submission failed this check once TURNSTILE_SECRET_KEY was set —
    // found and fixed 2026-09-22 (same bug copied into the contact form).
    const token = raw['cf-turnstile-response'];
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
    // Street/city/zip are now three separate fields (2026-09-22 intake
    // redesign) instead of one freeform address + optional unit field —
    // joined back into a single query string purely for Mapbox, which
    // still returns the canonical geocoded city/state/zip used below
    // (not the raw user-typed city/zip, which only exist to disambiguate
    // the geocode search and aren't stored separately).
    geocoded = await geocodeAddress(
      [intake.propertyStreet, intake.propertyCityInput, intake.propertyZipInput].filter(Boolean).join(', '),
      mapboxToken
    );
  } catch (err) {
    console.error(err);
    return jsonError(502, 'Could not verify that address right now. Please try again shortly.');
  }
  if (!geocoded) {
    return jsonError(422, 'Could not locate that address.', { property_street: 'Double-check the address and try again.' });
  }

  const subject: SubjectProperty = {
    address: intake.propertyStreet,
    unit_number: null,
    city: geocoded.city,
    state: geocoded.state,
    zip: geocoded.zip,
    latitude: geocoded.latitude,
    longitude: geocoded.longitude,
    beds: intake.propertyBeds,
    baths: intake.propertyBaths,
    sqft: intake.propertySqft,
    property_type: intake.propertyType,
    furnished: false,
    // Condo and multi-family read as "part of a complex" for decision
    // #1's same-building-first path; determineIsMultiUnit also checks
    // the fetched pool itself for co-located units, so this is a
    // starting signal, not the only one. Townhome/duplex/single-family/
    // other default to false — a townhome or duplex isn't reliably
    // "one of many similar units at this address" the way a condo or
    // multi-family property is.
    in_apartment_complex: intake.propertyType === 'condo' || intake.propertyType === 'multi-family',
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

  // Second comp source, added 2026-09-22 — RentEngine's own pool landed
  // too thin on real submissions (1-4 usable comps) even after this
  // tool's property-type/status bugs were fixed; a real side-by-side
  // pull confirmed RentCast's /avm/rent/long-term returns 20+ tightly-
  // matched comps for the same addresses. Merged in (deduped by street
  // address, RentEngine wins collisions) BEFORE the cascade runs, so
  // comp-selection.ts's existing radius/date/beds/property-type filters
  // apply to the combined pool uniformly — see mergeCompPools() and
  // rentcast-comps-client.ts's own header for the full reasoning,
  // including why RentCast's 'Inactive' comps are NOT treated as
  // confirmed leases. Graceful skip if the key isn't configured or the
  // call fails — RentEngine alone is still enough to run the estimate,
  // same degrade-gracefully pattern as every other optional integration
  // here.
  const rentCastKey = envRecord.RENTCAST_API_KEY;
  if (typeof rentCastKey === 'string' && rentCastKey.length > 0) {
    const rentCastComps = await fetchRentCastComps(subject, { apiKey: rentCastKey });
    comps = mergeCompPools(comps, rentCastComps);
  } else {
    console.warn('[rental-analysis/submit] RENTCAST_API_KEY not configured — RentCast comp blend skipped.');
  }

  const db = env.DB;
  if (!db) {
    console.error('[rental-analysis/submit] D1 binding "DB" is not configured.');
    return jsonError(500, 'Rental analysis is temporarily unavailable. Please try again later.');
  }

  // Step 8: decision #10's bedroom adjustment — shares RentCast's account/
  // key with the (separate, not-yet-built) homes-for-rent project per
  // Michael's call. Graceful skip if not configured: the estimate still
  // works, ±1-bed comps just enter the median unadjusted, same as before
  // this tier existed.
  const bedroomAdjustmentContext =
    typeof rentCastKey === 'string' && rentCastKey.length > 0 ? { db, rentCastApiKey: rentCastKey } : undefined;
  if (!bedroomAdjustmentContext) {
    console.warn('[rental-analysis/submit] RENTCAST_API_KEY not configured — bedroom adjustment skipped.');
  }

  const result = await analyze(comps, subject, bedroomAdjustmentContext);

  // Step 11: store the snapshot. (Step 9's old market-context panels —
  // supply/demand ratio and time-to-lease, both derived from RentEngine's
  // `rented` comps — were dropped 2026-09-22: RentEngine's comp pool had
  // ~zero confirmed-leased comps for either real demo address, so both
  // panels were computing off empty data. Replaced on the report page
  // with RentCast's city-level trend data instead — see
  // rentcast-blend.ts's loadBlendedCityTrend(), read fresh on each page
  // view like the rest of the RentCast city sections, not snapshotted.)
  const token = crypto.randomUUID();
  const now = new Date().toISOString();
  const snapshot = {
    comps: result.comps,
    estimatedRent: result.estimatedRent,
    rangeLow: result.rangeLow,
    rangeHigh: result.rangeHigh,
    confidence: result.confidence,
    isMultiUnitPath: result.isMultiUnitPath,
  };

  await db
    .prepare(
      `INSERT INTO rental_analyses (
        token, created_at, owner_first_name, owner_last_name, owner_email,
        owner_phone, preferred_contact_method, property_address,
        property_city, property_state, property_zip, property_lat,
        property_lon, property_beds, property_baths, property_sqft,
        property_type, property_furnished, property_status,
        desired_timeline, current_rent, snapshot_json, distinct_visit_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
    )
    .bind(
      token,
      now,
      intake.ownerFirstName,
      intake.ownerLastName,
      intake.ownerEmail,
      intake.ownerPhone,
      intake.preferredContactMethod,
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
      intake.propertyStatus,
      intake.desiredTimeline,
      intake.currentRent,
      JSON.stringify(snapshot)
    )
    .run();

  // Step 12: send the owner's headline email and create the LeadSimple
  // lead. A send failure shouldn't fail the whole submission — the
  // report is already stored and the owner can still be redirected to
  // it; per the build brief, the report existing and arriving fast
  // matters more than any single delivery path being perfect.
  const relativeReportUrl = `/rental-analysis/${token}`;
  const absoluteReportUrl = `https://www.reddoorrents.com${relativeReportUrl}`;
  const resendKey = envRecord.RESEND_API_KEY;
  if (typeof resendKey === 'string' && resendKey.length > 0) {
    try {
      await sendEmail(
        buildOwnerEmail({
          ownerName: `${intake.ownerFirstName} ${intake.ownerLastName}`,
          ownerEmail: intake.ownerEmail,
          propertyAddress: subject.address,
          estimatedRent: result.estimatedRent,
          rangeLow: result.rangeLow,
          rangeHigh: result.rangeHigh,
          confidencePercent: result.confidence.displayPercent,
          confidenceBucketLabel: result.confidence.bucketLabel,
          reportUrl: absoluteReportUrl,
        }),
        resendKey
      );
    } catch (err) {
      console.error('[rental-analysis/submit] Owner email failed to send:', err);
    }

    try {
      await sendEmail(
        buildLeadSimpleEmail({
          ownerName: `${intake.ownerFirstName} ${intake.ownerLastName}`,
          ownerEmail: intake.ownerEmail,
          ownerPhone: intake.ownerPhone,
          preferredContactMethod: intake.preferredContactMethod,
          propertyAddress: subject.address,
          propertyCity: subject.city,
          propertyState: subject.state,
          propertyZip: subject.zip,
          propertyStatus: intake.propertyStatus,
          desiredTimeline: intake.desiredTimeline,
          currentRent: intake.currentRent,
          estimatedRent: result.estimatedRent,
          rangeLow: result.rangeLow,
          rangeHigh: result.rangeHigh,
          confidencePercent: result.confidence.displayPercent,
          reportUrl: absoluteReportUrl,
        }),
        resendKey
      );
    } catch (err) {
      console.error('[rental-analysis/submit] LeadSimple lead email failed to send:', err);
    }
  } else {
    console.warn('[rental-analysis/submit] RESEND_API_KEY not configured — owner/LeadSimple emails skipped.');
  }

  return new Response(
    JSON.stringify({ token, reportUrl: relativeReportUrl, redirectUrl: '/rental-analysis/thank-you' }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
