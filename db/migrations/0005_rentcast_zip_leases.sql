-- Recently removed rental listings per ZIP, written monthly by the
-- rentcast-refresh Worker (workers/rentcast-refresh/src/leases.ts) from
-- RentCast's /v1/listings/rental/long-term?status=Inactive. Read by the
-- rent reduction calculator's market lookup (comparable rentals and market
-- rent) so the calculator never calls RentCast at request time.
--
-- leases_json: compact records for listing events removed in the last 12
-- months — see LeaseRecord in leases.ts for the shape.

CREATE TABLE IF NOT EXISTS rentcast_zip_leases (
  zip TEXT PRIMARY KEY,
  leases_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
