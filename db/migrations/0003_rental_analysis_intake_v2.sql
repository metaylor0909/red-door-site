-- Rental analysis intake redesign (2026-09-22) -- see
-- src/pages/rental-analysis/index.astro's own header comment for the
-- full before/after. Owner name splits into first/last; four new
-- context fields are captured (property status, desired timeline,
-- current/expected rent, preferred contact method) but deliberately
-- don't feed the estimate logic itself, only the owner/LeadSimple
-- emails -- see that page's header comment for why.
--
-- rental_analyses had zero real rows at the time of this migration
-- (confirmed via a direct count) -- the form's Mapbox/RentEngine
-- secrets were only pushed to production the same day this migration
-- was written, so nothing real has gone through the old schema yet.
-- Safe to drop owner_name outright rather than leave it dangling.

ALTER TABLE rental_analyses ADD COLUMN owner_first_name TEXT;
ALTER TABLE rental_analyses ADD COLUMN owner_last_name TEXT;
ALTER TABLE rental_analyses ADD COLUMN property_status TEXT;
ALTER TABLE rental_analyses ADD COLUMN desired_timeline TEXT;
ALTER TABLE rental_analyses ADD COLUMN current_rent INTEGER;
ALTER TABLE rental_analyses ADD COLUMN preferred_contact_method TEXT;

ALTER TABLE rental_analyses DROP COLUMN owner_name;
