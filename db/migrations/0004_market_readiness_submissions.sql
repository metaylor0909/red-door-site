-- Market Readiness self-check full-report email requests
-- (src/components/MarketReadinessAssessment.astro,
-- src/pages/api/market-readiness/submit-report.ts). Stored independently
-- of email delivery succeeding, same reasoning as contact_submissions --
-- if Resend fails there is otherwise no record of the request at all.
--
-- answers_json / report_json store the full structured report (all 24
-- answers, every item's status/priority/recommendation, top unresolved
-- priorities) so the submission is fully reconstructable later without
-- re-deriving it from readinessQuestions -- useful for support/QA and if
-- the emailed report ever needs to be resent.

CREATE TABLE IF NOT EXISTS market_readiness_submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  property_address TEXT,
  phone TEXT,
  score INTEGER NOT NULL,
  result_category_key TEXT NOT NULL,
  result_category_heading TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  report_json TEXT NOT NULL,
  lead_source TEXT NOT NULL DEFAULT 'market_readiness_assessment'
);
