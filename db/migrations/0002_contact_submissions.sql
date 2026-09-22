-- Contact form submissions (src/pages/contact.astro). Stored independently
-- of email delivery succeeding — unlike the rental-analysis tool, a
-- contact-form lead has no separate hosted "product" page it can always
-- fall back to, so if Resend fails the submission would otherwise be lost
-- entirely with no record anywhere. See src/pages/api/contact/submit.ts.

CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  inquiry_type TEXT NOT NULL,
  referral_source TEXT NOT NULL,
  comment TEXT,
  sms_consent INTEGER NOT NULL DEFAULT 0
);
