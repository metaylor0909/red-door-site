# Avon Property Management — pilot page notes
 
Pilot for the 20-city `-property-management` rewrite (Sep 11), same role the
Avon Homes for Rent page played for the `-homes-for-rent` set. Built as a
full HTML mockup — see the "Avon Property Management" artifact.
 
## What this reuses vs. what's new
 
**Reused wholesale, unchanged:** the brand system (colors, type), the 6-stage
process cards (Market Readiness → Marketing → Screening → Leasing →
Communication → Maintenance), the three guarantee cards, the reviews
carousel and its real review pool, the multi-step rental-analysis form, nav,
and footer. These came straight from the existing homepage build
(`index.html` in the project) — it turns out that file already *is* most of
what a property-management page needs; the per-city work is smaller than it
looked.
 
**Generalized (small edit, applies to all 20 going forward):** the process
section's heading and intro used to say "Indianapolis Property Management
Journey" — that read oddly reused on a city page, so it's now "The Red Door
Property Management Process," with no city name baked into shared copy.
Recommend the same edit lands in the real Indianapolis page too, so all 20
pages share literally the same component.
 
**New, genuinely per-city:** the H1 ("Avon Property Management," matching
the existing live H1 — Hard Rule 2 doesn't strictly require preserving H1
text, but there was no reason to change what's already working), the hero
dek, a real local-snapshot block (population/geography/borders — pulled
straight from the already-team-confirmed Avon homes-for-rent research, not
re-derived), a new **Rental & Sales Market Snapshot section** (see below),
the "Cities We Serve" grid with Avon highlighted, three real Westside
market-report blog posts in the Landlord Library section (see below), and
per-page meta/title/JSON-LD (`Service` + `BreadcrumbList`, scoped to Avon —
the homepage's schema only had Organization + BreadcrumbList, nothing
page-specific).
 
## Rental & sales market snapshot (added Sep 11, after first review)
 
Michael's first-look feedback on the pilot: the page read thin, and
replicated across 19-20 more cities it would look too similar to hold up.
He proposed two changes, discussed and resolved as follows:
 
- **Moving the full rental market data (charts, bedroom ladder, trend
  line) from the homes-for-rent page to this page — rejected.** Doing that
  would re-thin the homes-for-rent pages (recreating the doorway-page risk
  CLAUDE.md already flags them for) and blur the Sep 11 distinct-search-
  intent split between property-management ("hire us") and the future
  market-reports pages (informational rent-trend content) — both pages
  would end up covering the same rent-trend ground.
- **A condensed rental snapshot on this page, linking out to the full data
  — accepted.** This page now shows 3 headline rental stats (average rent,
  median rent, active listings) with a link to `/avon-homes-for-rent` for
  the full trend charts and bedroom breakdown. Enough to be useful without
  duplicating the homes-for-rent page's job.
- **Adding sales data — accepted, and turned out to cost nothing extra.**
  Michael confirmed (via an updated `red-door-rentcast-zip-mapping.md`)
  that RentCast's `/v1/markets` endpoint returns both `rentalData` and
  `saleData` in one call when pulled with `dataType=All` — sale data isn't
  a second API call or added cost. Real Avon (46123) figures: 312 active
  sale listings vs. 89 rental, average sale price $410,388 / median
  $389,585, average 49.1 days on market vs. 32 for rentals. This is
  genuinely different content from anything a market-reports page would
  cover — it's owner asset-value framing (sell vs. keep renting), not rent
  pricing data — so it doesn't compete with that future page type either.
Built as a new "Where the Avon Market Stands Right Now" section (two
side-by-side panels: Rental Market, Sales Market), placed between the free
rental-analysis form and the "Cities We Serve" area grid. The old one-line
"see current rent figures" sentence in the area-facts paragraph was removed
since the new section replaces it. This section's structure (two-panel
snapshot + links out) is meant to carry to all 20 property-management
pages, with `saleData` now added to the per-city data schema — see
`claude/red-door-homes-for-rent-data-schema.md`.
 
## Two findings from building this, not decisions needed from this page alone
 
1. **The "Westside Market Report" blog series is real evidence for the open
   market-reports city-list item.** While sourcing Landlord Library content
   for this page, the migration plan CSV shows a recurring monthly market
   report covering Avon/Brownsburg/Plainfield together — publishing close to
   monthly through 2026 (March, April, May, June, July all present). That's
   exactly the "active, recurring market-report production" bar
   `red-door-website-todo.md` sets for a `-market-reports` page to exist.
   Worth deciding whether Avon's market-reports page (if built) covers Avon
   alone or the Westside cluster it's actually reported on — the recurring
   series is per-cluster, not per-city.
2. **A live Fair Housing flag, found by accident, not yet in
   `content-fixes.csv`.** The July 2026 Westside report's crawled meta
   description reads: *"Avon, Brownsburg, and Plainfield show steady rent
   demand, low rental inventory, and strong school-driven fundamentals in
   July 2026."* "School-driven fundamentals" is the same pattern CLAUDE.md
   already flags and fixes elsewhere ("School-calendar timing" →
   "summer leasing season") — this one wasn't caught in the 173-fix pass.
   Recommend the same fix pattern: drop "school-driven," reframe as leasing
   seasonality. This is on a blog post, not this property-management page,
   so it doesn't block anything here — flagging so it doesn't get missed
   before launch.
## Open, not blocking
 
- Housing-stock detail beyond "newer subdivisions, fewer older homes" and
  leasing-season timing are still **[team]** items, same as the homes-for-rent
  page — omitted here rather than guessed.
- The reviews pool is the same general set used on the homepage; none are
  tagged Avon specifically. Didn't fabricate an Avon-specific testimonial —
  flag if Red Door has any Avon-tagged reviews to swap in later.
 