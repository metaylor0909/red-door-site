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

-- Shared with the homes-for-rent project's own Cron-Trigger Worker (see
-- claude/red-door-homes-for-rent-data-schema.md) — same store, not a
-- duplicate pull. If that Worker's own migration already created this
-- table under a different name/shape, reconcile before deploying rather
-- than running both.
CREATE TABLE IF NOT EXISTS rentcast_city_cache (
  city_key TEXT PRIMARY KEY, -- e.g. "avon-in"
  bedroom_ladder_json TEXT NOT NULL, -- avg rent by bedroom count, 1BR-5BR
  sample_sizes_json TEXT NOT NULL, -- newListings per rung, for the thin-data check
  rent_trend_json TEXT, -- trailing rent-trend history for decision #5's chart
  updated_at TEXT NOT NULL
);

-- Decision #10 tier 3's 50-ad-hoc-calls/month cap. One row per month,
-- reset naturally by the month key rather than a scheduled job.
CREATE TABLE IF NOT EXISTS rentcast_adhoc_call_log (
  month TEXT PRIMARY KEY, -- e.g. "2026-09"
  call_count INTEGER NOT NULL DEFAULT 0
);
