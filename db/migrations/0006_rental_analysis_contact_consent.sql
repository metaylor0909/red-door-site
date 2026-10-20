-- Record the rental analysis form's contact consent (2026-10-20). The
-- checkbox has always been required in the browser, but nothing stored
-- that the person agreed, or to what. contact_consent_text keeps the exact
-- wording shown at submission, so a record stays accurate if the wording
-- changes later. Nullable: rows from before this migration have neither.
ALTER TABLE rental_analyses ADD COLUMN contact_consent INTEGER;
ALTER TABLE rental_analyses ADD COLUMN contact_consent_text TEXT;
