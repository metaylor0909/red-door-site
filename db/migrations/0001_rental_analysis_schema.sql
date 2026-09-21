-- Rental analysis tool schema. See claude/rental-analysis-tool-build.md,
-- decision #8, "Storage" for the reasoning (D1 over KV: this build needs
-- real atomic counts — distinct-visit tracking and the monthly RentCast
-- ad-hoc call cap — that plain KV handles awkwardly).

CREATE TABLE IF NOT EXISTS rental_analyses (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,

  -- Owner/intake fields (decision #8, step 3 + submit-flow)
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT,

  -- Property fields
  property_address TEXT NOT NULL,
  property_city TEXT NOT NULL,
  property_state TEXT NOT NULL,
  property_zip TEXT NOT NULL,
  property_lat REAL,
  property_lon REAL,
  property_beds INTEGER NOT NULL,
  property_baths REAL NOT NULL,
  property_sqft INTEGER,
  property_type TEXT NOT NULL,
  property_furnished INTEGER NOT NULL DEFAULT 0,

  -- The full computed snapshot (decision #5's "snapshot, not live" rule):
  -- estimate, range, confidence + bucket, comp list, market-context
  -- figures (supply/demand, time-to-lease), which decision #10 tier was
  -- used for the bedroom adjustment. Stored as JSON rather than normalized
  -- columns since it's written once and read whole, never queried by
  -- sub-field.
  snapshot_json TEXT NOT NULL,

  -- View tracking for the decision #5 BD-alert-on-return-visit rule.
  -- distinct_visit_count starts at 0 (no page views yet at submission
  -- time) and increments on each distinct report-page view; the first
  -- view (count becomes 1) never alerts per decision #5, since it's
  -- near-guaranteed the moment the owner opens the email. last_view_at is
  -- used to collapse views within ~30 minutes into a single visit;
  -- last_bd_alert_fired_at enforces the 24-hour cap between alerts.
  distinct_visit_count INTEGER NOT NULL DEFAULT 0,
  last_view_at TEXT,
  last_bd_alert_fired_at TEXT
);

-- Genuinely shared between two consumers, not a duplicate pull each:
--   1. workers/rentcast-refresh (its own standalone Cron-Trigger Worker,
--      not part of this Astro site's request path) writes one row per
--      served homes-for-rent city/township monthly, per
--      claude/red-door-rentcast-zip-mapping.md's 20-area/50-ZIP list.
--   2. src/lib/rental-analysis/bedroom-adjustment.ts (decision #10) reads
--      these same rows for its tier 1/2 cache-hit path, and writes its
--      own ad-hoc rows here for cities outside that served list (tier 3).
-- REVISED 2026-09-20: originally scoped narrowly for decision #10 alone
-- (just a pre-derived bedroom_ladder_json array) before the homes-for-rent
-- pages' own live-refresh need made it clear this should hold the FULL
-- per-city payload instead — a superset covers both consumers; the
-- narrower shape didn't. city_key format is decision #10's own
-- `${city}-${state}` (e.g. "avon-in", lowercase-hyphenated) — the
-- homes-for-rent pages' plain citySlug ("avon") doesn't include state,
-- so the Worker and the Astro pages both key off this format, not
-- citySlug alone, to stay compatible with decision #10's existing keys.
CREATE TABLE IF NOT EXISTS rentcast_city_cache (
  city_key TEXT PRIMARY KEY, -- e.g. "avon-in"
  -- Full per-city RentCast payload, matching claude/red-door-homes-for-
  -- rent-data-schema.md's real shape (confirmed against data/homes-for-
  -- rent/*.json, 2026-09-17 pull): { citySlug, zipsUsed, zipsMissing,
  -- zipCount, dataAsOf, aggregationMethod, rentalData, saleData }.
  -- bedroomLadder (decision #10's own need) is derived on read from
  -- rentalData.dataByBedrooms, not stored separately.
  market_data_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Decision #10 tier 3's 50-ad-hoc-calls/month cap. One row per month,
-- reset naturally by the month key rather than a scheduled job.
CREATE TABLE IF NOT EXISTS rentcast_adhoc_call_log (
  month TEXT PRIMARY KEY, -- e.g. "2026-09"
  call_count INTEGER NOT NULL DEFAULT 0
);
