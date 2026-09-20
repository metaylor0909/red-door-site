# Rental Analysis Tool — Build Brief

Standing context for building Red Door's custom rental-analysis (CMA-style)
lead-magnet tool. Read this first — it's a trimmed, self-contained version of
the relevant decisions from `red-door-website-todo.md`, which holds the full
history if you need it (search that file for "rental analysis" for the whole
evaluation trail: RentRange → Rentometer → RentEngine embed → RentEngine vs.
RentCast comparison → final decision below).

## What this is

An automated tool for `reddoorrents.com`: a prospective owner enters a
property address, gets a rent estimate report, and the report is emailed to
them automatically — no staff review step. It's a lead-magnet for owner
conversion, not a product; accuracy matters, but the report existing and
arriving fast matters more than it being defensible to the decimal point.

## Decision — FINAL, do not re-litigate

**Build a custom tool. Use RentEngine's `market-tool/comps` as the sole
source of the comps that drive the estimate itself.**

Not RentRange (ruled out on pricing — sits between small-operator and
enterprise tiers, neither viable for Red Door's volume). Not Rentometer (would
work, but no reason to pay a second vendor when RentEngine data is already
free/cheap and Red Door holds the account). Not RentEngine's own out-of-the-
box embeddable widget (real, free, and self-service — but a black box Red
Door can't fully control on branding/report design/lead handling). Not
RentCast as the estimate engine itself, even for just its computed estimate —
see reasoning below. (RentCast *is* now used elsewhere in this tool as a
supplementary data source — see decision #10 — that's a narrower, later
carve-out and doesn't reopen this core decision.)

Delivery is automated, straight to the prospect's inbox, no human-in-the-loop.
This was a deliberate reversal of an earlier "don't automate a lead magnet"
instinct — Michael confirmed it directly and it's settled.

### Why RentEngine data only, not RentEngine + RentCast, for the estimate itself

- RentCast's `GET /avm/rent/long-term` computes an estimate for you (median +
  range + correlation-ranked comps) — convenient, but it's ordinary,
  replicable math. Not worth paying for and integrating a second vendor just
  to skip writing a median/percentile calculation.
- RentEngine's comps carry `status: Rented` / `Available` plus `date_rented` —
  a real signal of which comps actually left the market. RentCast's `status`
  field is binary Active/Inactive with no way to tell rented from withdrawn
  from expired. This is a genuine data-quality edge RentCast can't match, and
  it's the basis for building the estimate in-house rather than importing
  RentCast's number.
- Cost: RentEngine is $0.50/successful call, 40/day cap, ~$10/month at
  current real volume (~20 analyses/month once internal team testing is
  excluded). Red Door already holds the RentEngine account directly — no new
  vendor contract. (Cost was a bigger factor when RentCast would have been a
  new vendor relationship on its cheapest paid tier; Michael has since said
  Red Door will be on an upgraded RentCast plan regardless, for other
  site features — see decision #10 — so this specific cost comparison no
  longer applies to the RentCast-as-supplementary-data question, only to
  "RentCast as the estimate engine," which remains rejected below.)
- Neither vendor has confirmed signed-lease data — both ultimately read
  asking rents from public listings. This is a data-quality ceiling on the
  whole approach, not something either vendor solves. See "Accuracy
  validation" below.

## The API — confirmed spec

`GET /market-tool/comps` — Bearer token auth.

**Required:** `latitude` + `longitude`, plus one of `radius_miles` (≤25 mi) or
`zipcodes` (≤50, comma-separated).

**Optional filters:** `min_beds`/`max_beds`, `min_baths`/`max_baths`,
`min_sqft`/`max_sqft`, `min_days_on_market`/`max_days_on_market`,
`start_date`/`end_date` (YYYY-MM-DD). `account_id` only needed for
multi-account tokens.

**Response:** array of up to 200 comps, each with address, beds, baths, sqft,
rent, days_on_market, date_rented, features, status (`Rented`/`Available`),
coordinates, property_type, image, zipcode, furnished, in_apartment_complex,
num_parking_spots, description.

**Cost:** $0.50 per successful call. Rate limit: 40 calls/24hrs.

**No aggregate-stats endpoint exists.** Median rent, price distribution,
supply-demand ratio — none of that comes back pre-computed. The tool has to
calculate all of it client-side from the raw comp list. (This includes the
supply/demand ratio and time-to-lease panels added to the report in decision
#5 below — both are computed from the same comps pull already being made for
the estimate, not a new API call.)

**Account ID:** `6ecca3ec-8e5a-42ed-87ea-af21f97d546e`

**API keys — REVISED (2026-09-20): one shared key for everything.**
Originally split one-per-feature (2026-09-13): the "API Key for Claude to
build listing pages" (created Sep 8) scoped to the listings-page build
(`/units`, `/marketing/listings`), and a second key (cut Sep 12 for the
accuracy-validation run) scoped to the rental-analysis tool's
`market-tool/comps` calls — reasoning at the time was that RentEngine's
key-creation UI has no per-endpoint scoping, so splitting was the only way
to see each feature's own usage/cost and revoke one without touching the
other. **Superseded by Michael's call once the homes-for-rent listings
build actually started using RentEngine too: reuse the rental-analysis
key for the listings project's own `/units` calls as well, rather than
manage a second key.** The original tracking/revocation reasoning still
holds if this becomes a real problem later (e.g. one feature's usage
becomes hard to distinguish from the other's, or one needs rotating
without affecting the other) — this is a simplification Michael chose,
not a discovery that the original reasoning was wrong. The "Caveat worth
knowing" below is now moot either way, since there's only one key.
~~Caveat worth knowing, not a reason to reverse this: it's not confirmed
whether RentEngine's rate limits (40 calls/24hrs on `market-tool/comps`,
30 requests/5 seconds standard) are enforced per-key or per-account.~~

**Lead webhook (RentEngine's own) — ruled out, FINAL (2026-09-13).** The
Developer Portal's Webhooks tab supports registering a URL against a
`pm_business_development_leads` target entity with an `INSERT` event type —
fires when a new lead record is created inside RentEngine itself. Not used:
Michael confirmed this tool only consumes RentEngine's API for comps data,
doesn't use RentEngine's own lead-capture widget or create lead records
inside RentEngine, so this webhook has nothing to fire on for this build.
See decision #6 and "Things already ruled out."

## Decision #4 — Accuracy validation — DONE (2026-09-12)

Ran median-of-Rented-comps against 7 real, recently-leased Red Door
properties, comparing to actual signed-lease rent. Full method, data-quality
notes, and per-property table: `claude/accuracy-validation-results.md`.

**Result: partial pass, two clear failure modes.**

- 3 of 7 (all single-family homes with ample same-bed/bath inventory nearby)
  landed within ~7% of actual — a reasonable result for an automated estimate.
- 4 of 7 missed by 10–44%, clustering into two identifiable causes, not
  random noise:
  1. **Thin local inventory forces radius-widening that trades geographic
     relevance for sample size.** The widening rule (step radius out until
     ≥5 Rented comps) optimizes for comp count, not accuracy — in a small
     town (Lapel), widening from 3mi (2 comps, −11% error) to 10mi (99 comps)
     to clear the threshold made the estimate *worse* (−22%), because it
     pulled in a cheaper adjacent submarket.
  2. **Multi-unit buildings have real unit-level rent variance a
     beds/baths/radius filter can't see.** Both apartment-complex properties
     tested missed by 15–44% — a filter that treats every unit in a 100+ unit
     building as interchangeable doesn't reflect actual unit economics
     (floor, condition, lease vintage, etc.).
- The Rented→Available fallback is coherent (Available median tracked within
  a few % of Rented median in every case) but doesn't fix either failure
  mode above — it's drawn from the same geographically-filtered pool, so
  treat it as "same estimate, less certain," not an independent check.
- Bed/bath tolerance (exact beds, ±0.5 baths) was not the bottleneck in any
  of the 7 cases — no evidence it needs loosening or tightening.
- Comp recency was **not** constrained in this test (some comp sets spanned
  400+ days DOM) — comp-selection logic (decision #1) needed to pick a date
  window; see decision #1 below for the final rule.
- Also surfaced live: RentEngine's comps can include the subject property
  itself (confirmed real re-lease, not bad data) and must be excluded by
  address+unit match, not just address — see results doc for detail.

## Decision #1 — Comp-selection logic — FINAL (2026-09-12, extended 2026-09-13)

Two paths, split by property type, both prioritizing geographic tightness
over recency and recency over radius width — per Michael: closer-but-older
comps beat farther-but-newer ones. Date cascade is capped at 12 months —
never use a comp older than that, regardless of how sparse the result is.

**Multi-unit / apartment-complex properties** (detect via RentEngine's
`in_apartment_complex` field, or multiple co-located units returned at the
same street address):

- Pull same-building comps first (any comp at the building's address,
  regardless of unit), starting with a 6-month date window.
- If same-building comps within 6 months total fewer than **5**, relax the
  date window once — 6mo → 12mo (hard cap, no comp older than 12 months
  ever) — before going to the area-wide radius path below.
- Only fall back to the standard/area-wide path if the building itself
  can't reach 5 comps within 12 months (i.e., a genuinely small building
  with too little recent history).
- Bed-count relaxation (below) does **not** apply to same-building comps —
  a building's own unit mix already spans bed counts by nature, and the
  known failure mode here is unit-level variance, not scarcity, so loosening
  beds further seemed more likely to hurt than help. If the building falls
  through to the area-wide path, that path's own bed-relaxation rule applies
  from there.

**Standard (single-family / non-complex) properties, and multi-unit
properties that fell through to this path:**

- Nested loop: for each radius step in turn (1mi → 2mi → 3mi → 5mi, capped —
  do not go to 10mi or 25mi; the accuracy-validation run showed widening
  past this point trades relevance for count and made the Lapel estimate
  *worse*, not better), first try the date-relaxation cascade (6mo → 12mo,
  hard cap) at that radius before widening further.
- **Bed-count cascade:** exact bed match only at 1mi (through its full date
  cascade). At 2mi, still try exact beds first (through its date cascade);
  only if that still comes up short does the bed filter relax to **±1
  bedroom**, re-running the date cascade at 2mi with the relaxed range. Once
  relaxed, beds stay at ±1 for any further widening (3mi, 5mi) rather than
  re-tightening. Baths stay at ±0.5 throughout — never relaxed in tandem;
  the confidence score (decision #9) carries the signal instead.
- Stop as soon as a step yields ≥5 `Rented`-status comps.
- If the full cascade (5mi radius, 12-month cap, ±1 bed) still doesn't reach
  5 Rented comps, use whatever's available and mark the report
  lower-confidence (per decision #2) rather than force a wider radius or
  reach past the caps above.

**Additional comp-quality filters** (apply throughout, on top of the
radius/date/bed/bath cascade above):

- **Property type match** — comp must share the subject's property type
  (single-family vs. townhouse/duplex vs. apartment/condo).
- **Sqft tolerance** — ±20% of the subject's sqft, when the subject's sqft is
  known; skipped entirely if the subject's sqft isn't available.
- **Furnished exclusion** — drop furnished comps unless the subject property
  is itself furnished (furnished units carry a rent premium that would skew
  the median).
- **Apartment-complex exclusion for standard-path subjects** — a
  non-multi-unit subject's area-wide pool excludes comps flagged
  `in_apartment_complex`, mirroring the reasoning that put multi-unit
  subjects on their own path above.

**Ranking and cap:** once the cascade + quality filters produce a qualifying
pool, rank by **distance first, recency second** (closest wins ties over
most-recent), and take the top **12**. This same top-12 set feeds *both* the
median/range/estimate math and the comps table shown in the report — not two
different selections, since showing a comp that wasn't actually part of the
estimate would be misleading. If fewer than 12 qualify, use however many
there are (governed by the 5-comp minimum above).

This was locked in without a further live re-test (Michael's call, given
budget/time) — reasoning is extrapolated from the one real validation run,
not separately confirmed.

## Decision #2 — Rented-vs-Available fallback rule — FINAL (2026-09-12)

Same sparsity threshold as decision #1 (5 comps), applied after the full
comp-selection cascade above has run its course:

- If the cascade ends with **≥5 Rented comps**, use the Rented-comp median
  as the estimate (Available comps not used).
- If it ends with **fewer than 5 Rented comps** (including zero), blend:
  combine the Rented and Available comps found into one pool and take the
  median of the pool, rather than switching to a pure Available-only
  estimate. Validation showed Available-medians track Rented-medians
  closely in every tested case, so blending uses the extra data without
  overriding the Rented signal when some does exist. With zero Rented
  comps, the blended median is just the Available median by default.
- Mark the report lower-confidence whenever the blend path is used (i.e.,
  whenever the final Rented-comp count is below 5).

This does not fix the thin-market or multi-unit failure modes surfaced in
decision #4 — decision #1's comp-selection rules are what address those.
This fallback only governs which numbers feed the median once the comp set
is settled.

## Decision #3 — Range/estimate math — FINAL (2026-09-12)

Point estimate is the median of the comp pool from decision #2 (already
settled). Range shown alongside it is a **fixed ±10% band around the
median**, not a percentile-based range — Michael's call, made instead of the
originally-proposed 25th–75th percentile split once it was flagged that a
percentile range is noisy at the 5-comp minimum decision #1 targets (with 5
comps, 25th/75th is really just the 2nd-lowest/2nd-highest value, not a
statistically meaningful band).

## Decision #5 — Report design and delivery architecture — FINAL (2026-09-13)

**Delivery architecture — FINAL: hybrid (Option C from a 3-way comparison of
self-contained email, fully hosted with teaser, and hybrid).**

- The email itself carries the headline numbers directly — estimate, range,
  confidence score — so the owner gets real value the moment they open it,
  no click required.
- The email also includes a "View full report & comparable properties"
  button linking to a hosted report page on `reddoorrents.com`, which holds
  the comps table (per decision #1/#10), methodology detail, market context,
  and a homes-for-rent cross-sell (both added below), plus (phase 2)
  interactive tools.
- **Why not pure self-contained email:** no reliable engagement signal.
  Email open-tracking pixels are close to useless now (Apple Mail Privacy
  Protection preloads images for iCloud/Mail users), so there'd be no way to
  know if an owner actually saw their report, and no basis for a
  business-development alert. Ruled out for that reason, even though it's
  the least engineering effort.
- **Why not pure hosted-with-teaser-only:** puts a click between the owner
  and any value at all — if they never click the email link, Red Door has
  spent the RentEngine/RentCast API cost generating a report nobody saw.
  Ruled out in favor of the hybrid, which delivers value either way.
- **PDF attachments — not part of either option.** Generating a PDF inside a
  Cloudflare Worker isn't simple (no headless browser in that runtime; it
  would mean either an external rendering service — a new vendor
  relationship — or a low-level library that can't render real HTML/CSS).
  A well-designed HTML email is both simpler and sufficient; no PDF planned.

**Hosted report page — key build constraints:**

- **Snapshot, not live.** The page renders exactly what was computed at
  generation time — stored once, not recomputed on each visit. Re-running
  RentEngine/RentCast on every page view would both re-spend API budget per
  visit and risk the page showing a different number than the email sent
  earlier, as new comps come in over time. A "request an updated analysis"
  action is a reasonable future feature; silent live recomputation on view
  is not.
- **Storage:** Cloudflare KV or D1 (both native to the stack Red Door's
  already on for Cloudflare Pages) — no new infrastructure vendor.
- **Route:** one new dynamic route in the otherwise-static Astro site.
  Astro supports hybrid static+SSR routing natively — this doesn't require
  restructuring the rest of the site.
- **Access:** an unguessable token in the URL (e.g., a UUID) is sufficient
  access control for a "magic link" report — no additional login/auth
  layer. Default assumption: no hard expiration on the link for v1; revisit
  if that turns out to matter.
- **Business-development alert — FINAL, revised (2026-09-13): fires on
  every distinct return visit, capped at once per 24 hours.** Originally
  scoped as "fires once, on the second visit only" — Michael revisited this
  once the Zap was actually built and working, wanting ongoing visibility
  rather than a single alert. Current rule: the first view never alerts
  (near-guaranteed the moment the owner opens the email, not a real
  interest signal); starting with the second distinct visit, every further
  distinct visit fires the alert again, **except that if an alert already
  fired within the last 24 hours, a new visit doesn't fire another one
  until that window passes** — so an owner who checks the report five times
  in one afternoon doesn't generate five separate emails/notes, but real
  engagement spread across days keeps surfacing. Views within a short
  window (~30 minutes) of each other still collapse into one visit, so a
  page reload or quick back-and-forth doesn't falsely count as a distinct
  return. Each alert includes the running distinct-visit count (e.g. "3rd
  visit") so Chris can see it's not the first time without needing five
  separate emails to know that. Channel and wiring: see decision #6.

**Phasing — FINAL:** interactive owner-facing tools (adjustable assumptions,
calculators, etc.) are explicitly **phase 2**, not v1 launch scope. V1 is:
hybrid email, snapshot hosted page with the comps table, methodology, market
context, and listings cross-sell (below), and the BD-alert-on-return-visit
wiring. This keeps v1 scope bounded while still delivering the engagement
visibility that was the actual point of hosting anything.

**Also settled:**

- Comps table included (up to 12 comps, per decision #1), showing both real
  and bedroom-adjusted rent per decision #10 — not just one or the other.
- **No AI-generated "agent comment" note — killed outright.** Replaced by
  fixed Fair-Housing-safe template sentences selected by data conditions
  (inventory tightness, confidence level, etc.) rather than freeform
  generation.
- **Confidence-score presentation:** shown as a numeric percentage (per
  decision #9's 55–94% scale) paired with a short plain-language bucket
  label — "Strong data support" / "Solid, some limitations" / "Limited
  comparable data" — not one or the other alone. Three fixed template
  sentences (one per bucket) explain what drove the score in plain terms;
  exact final wording still first-draft (see open items below).
- **CTA — FINAL: appears twice on the hosted page** (directly under the
  estimate/trend row, and again at the bottom) **plus once in the email.**
  Destination is a Calendly scheduling link — **not yet built into the
  mockup or the plan; flagged as a to-do below**, not forgotten.
- **Red Door's real business address confirmed:** 3815 River Crossing
  Parkway, Suite 100, Indianapolis, Indiana 46240. Replaces the placeholder
  used in earlier drafts of the email footer.

**Report content — expanded (2026-09-13), after reviewing three sample
reports Michael provided (Rentometer, RentRange, and Red Door's own real
RentEngine comps report for 17233 Rancorn Place):** the hosted page was
flagged as "too thin" and needing more data points to read as legitimate.
Added, all on the hosted page (not the email, which stays headline-only by
design):

- **Supply/demand ratio panel**, styled after the real RentEngine report's
  own format (ratio number, status badge, available-vs-rented proportion
  bar, unit counts, plain-language read of what the ratio means). Computed
  from the same area-wide comp pool already pulled for the estimate — no
  new API call.
- **Time-to-lease panel** — median days-on-market plus a bucketed breakdown
  (0–14 / 15–30 / 31–45 / 46+ days) — also derived from the existing comp
  pool, standing in for RentRange's days-on-market chart without needing
  RentRange as a vendor (RentRange remains rejected as a vendor — see
  "Things already ruled out" — this only borrows the chart concept).
- **12-month rent trend chart** (Rentometer-style line chart) and **average
  rent by bedroom count chart** (Rentometer-style bar chart, subject's bed
  count highlighted) — both submarket-level, not comp-level. Data source:
  the same RentCast `/v1/markets` per-city file already being pulled and
  cached for decision #10's bedroom adjustment (`bedroomLadder` gives the
  bar chart directly; the file's 6-month trailing history — see the Avon
  draft's "what I'm holding back" note — plus ongoing monthly pulls builds
  the 12-month line over time). No new vendor or integration; reusing data
  the tool already has.
- **Homes-for-rent cross-sell section** ("Homes for rent near this
  property") — mirrors the exact default-city-then-nearby-fallback pattern
  already locked in for the `-homes-for-rent` pages (`red-door-website-
  todo.md`): shows current listings in the subject property's own city
  first, falling back to a "homes available nearby" set when that city's
  own inventory is thin (the normal case for most of Red Door's smaller
  submarkets). Pulls from the same live listings feed as those pages — no
  new data source.
- **"From Red Door" post carousel** — recent market reports and landlord-tips
  posts, at the very bottom of the hosted page (just above the final CTA),
  so an owner sees this is an active resource, not a one-time report.

**Final locked layout, top to bottom (hosted page):** address line → estimate
card + 12-month rent trend chart side by side → CTA → one-line compact
methodology note → market context (supply/demand ratio, time-to-lease,
average rent by bedroom — 3 panels) → comps table (12 comps) → homes-for-rent
cross-sell (default city + nearby fallback) → "From Red Door" post carousel →
final CTA. The email stays simpler and headline-only: estimate, range,
confidence, one CTA, no charts or tables.

**Design is locked.** A working mockup of both the email and the hosted page,
through this final layout, is built and published for review (through v6,
2026-09-13) — ask Michael for the current artifact link if it's not already
in hand. What remains below is implementation detail and a small number of
external inputs, not open design questions.

**Visual refinement needed (2026-09-20) — the real built hosted page
doesn't match the approved v6 mockup closely enough.** The page was built
from this doc's own text description of the locked layout (section order,
content, copy), not from the actual v6 mockup artifact, which wasn't
available while building. Structurally correct (right sections, right
order, right data), but Michael's review of a populated mockup found the
visual execution "not even very close" to v6. Michael's call: hold off on
refining this further until all the real data sources are actually
flowing through it (decision #10's RentCast-fed charts, the homes-for-rent
cross-sell with real listings, etc.) rather than iterating on styling
against placeholder data now. **Before the next visual pass: get the real
v6 mockup artifact link from Michael and design against it directly**,
not this doc's text description of it.

**Still open (implementation/content, not design):**

- Exact final wording of the three confidence-bucket template sentences
  (first-draft only).
- **The Calendly link — FOUND (2026-09-13): `https://calendly.com/cknight-19/phone-call`.**
  Pulled directly from the embedded widget on the live `/pricing` page (Chris
  Knight, 30-minute phone call event) — the same Calendly account/event
  already in production use elsewhere on the site, not a new one. All three
  CTA instances (two on the hosted page, one in the email) can point at this
  now.
- Chart/data-source mechanics (supply/demand ratio, time-to-lease, rent
  trend, bedroom ladder) are specified at the "what data, from where" level,
  not yet at the "exact query/field" level — reasonable given decision #10
  already established the RentCast per-city file pattern this reuses.
- Homes-for-rent cross-sell: exact card count (mockup uses 1 default + 3
  nearby) and the definition of "nearby" — both still open on the
  `-homes-for-rent` pages themselves, so this tool should follow whatever
  gets decided there rather than diverge with its own definition.
- **"From Red Door" post carousel:** titles/dates in the mockup are
  illustrative; real build pulls from the Sanity blog collection (confirm
  most-recent-4 vs. biased toward the subject property's city/market-report
  tag). **Card styling — LOCKED (2026-09-17): use the shared card pattern
  from the market-reports page mockup**, not this doc's own earlier mockup
  design. Same pattern now used by Homes for Rent, Property Management,
  and this carousel — see "Card design — LOCKED (Sep 17)" in
  `red-door-website-todo.md` under "Market-reports page design." The
  layout/content here (title, category, date, link) stays as already
  settled; only the visual skin changes to match.
- Site header/footer nav links in the mockup are placeholders, not final
  copy.
- **Thank-you/confirmation page for conversion tracking — NEW (2026-09-17),
  needs reconciling with the submit-flow below.** Michael wants the form
  to send the owner to a dedicated thank-you page immediately after
  submission, specifically so the submission can be tracked as a
  conversion event (e.g., a Google Ads/Analytics goal tied to a stable
  URL). As currently scoped (decision #8, step 12 / the
  `POST /api/rental-analysis/submit` endpoint below), the flow redirects
  straight to the hosted report page at `/rental-analysis/[token]` — a
  different URL per submission, which isn't the fixed URL conversion
  tools typically target, and skipping straight to the report was itself
  a deliberate choice in this decision (get the owner to value with no
  extra click). Needs a decision on how to reconcile before this part of
  decision #8 gets built: (a) a brief fixed-URL interstitial (e.g.
  `/rental-analysis/thank-you`) that immediately forwards to the token'd
  report page — gets a trackable fixed URL without meaningfully delaying
  value; (b) fire the conversion-tracking event client-side on the hosted
  report page itself instead of using a URL-based trigger, avoiding an
  extra hop entirely; (c) something else Michael has in mind. Doesn't
  block the rest of the pipeline (decisions #1–#4, #6, #9, #10 and the
  rest of #8 are unaffected).

## Decision #6 — Lead capture and BD-alert wiring — FINAL (2026-09-13)

**Lead destination — FINAL: LeadSimple, and only LeadSimple.** Not email to
the leasing team, not AppFolio — Michael was explicit these leads land in
LeadSimple exclusively (for now). Tagged with lead source **"rental analysis
tool"**.

**Lead creation mechanism — FINAL: reuse the existing email-to-LeadSimple
pattern already in production, not a new Zapier integration.** Red Door's
current PMW site already creates LeadSimple leads this way when an owner
submits the existing rental-analysis form: it emails a specific LeadSimple
inbound address, and LeadSimple parses that email into a new lead record.
Reasons to reuse rather than replace:

- Proven and already working for this exact lead type — lower risk than a
  new integration.
- The Cloudflare Worker already has to send the owner's report email; a
  second email to a fixed internal address is a trivial marginal addition —
  no new vendor, no API keys, no Zapier account/task cost for this part.

**Lead source is set by which inbound address the email is sent to** (Red
Door confirmed: LeadSimple infers source purely from the receiving address,
not from anything in the email body). Since these leads must be tagged
"rental analysis tool" — a distinct source from whatever the current PMW
form's address maps to — **a new, dedicated LeadSimple inbound address needs
to be created for this tool specifically**, mapped to that source in
LeadSimple's own settings. This is a LeadSimple-admin-side setup step, not
something buildable from the Worker alone.

**Email format — FINAL (2026-09-13).** Michael supplied LeadSimple's own
manual email-to-lead documentation (training.leadsimple.com "Email leads to
LeadSimple manually" and "Setting up the PMW integration"), plus PMW's
field-mapping table and an example PMW notification email. Two things came
out of that:

- **LeadSimple's confirmed generic email-to-lead format** — recipient is the
  dedicated inbound address, subject must be `New Lead`, and the body is a
  fixed set of labeled lines: `Name:` / `Email:` / `Phone Number:` /
  `Address:` / `City:` / `State:` / `Zip Code:` / `Comments:`. This is
  vendor-documented and doesn't depend on reverse-engineering PMW's internal
  format — the Worker can build to this directly.
- **The PMW→LeadSimple field-mapping table** confirms two things already
  assumed above: Lead Source comes from the receiving address, not the email
  body (there's no Source line in the template above — consistent with
  that), and "any other form fields" fold into the Comments field. That's
  where this tool's estimate, range, confidence score, property address, and
  hosted-report link belong.
- **Correction — the sample email Michael forwarded is not the email that
  goes to LeadSimple.** It's PMW's own "New Form Submission (Contact)" staff
  notification — sent from `noreply@nesthub.com` to `mtaylor@` and
  `cknight@rdpmindy.com`, for a tenant contact-form inquiry (property
  availability, not a rental analysis). It never touches a LeadSimple
  address and its format (HTML notification with an "Inquiry Type" / "How
  did you hear about us?" / UTM block) doesn't match LeadSimple's parser
  format at all. It's useful only as a general example of what PMW form
  data looks like — LeadSimple's own generic format (above) was used
  instead.

**Dedicated inbound address — FINAL (2026-09-13): `new-deal937b93ae52@newlead.leadsimple.com`.**
Michael confirmed this is a brand-new address he created specifically for
the "rental analysis tool" source, not reused from another form.

**Draft email the Worker will send:**

```
To: new-deal937b93ae52@newlead.leadsimple.com
Subject: New Lead

Name: {{owner_name}}
Email: {{owner_email}}
Phone Number: {{owner_phone}}
Address: {{property_address}}
City: {{property_city}}
State: {{property_state}}
Zip Code: {{property_zip}}
Comments: Rental analysis request for {{property_address}}. Estimated rent:
${{estimate}}/mo (range ${{range_low}}-${{range_high}}). Confidence:
{{confidence_pct}}%. Full report: {{hosted_report_url}}
```

**BD-alert wiring — FINAL: separate mechanism from lead creation, not the
same email-ingestion path.** Email-to-LeadSimple is a *create* mechanism —
sending a second email for the same owner risks creating a duplicate lead
rather than updating the original one. The decision #5 return-visit alert is
an *update* to an already-existing lead (a note, not a new record), so it
needs a different path: a **Zapier webhook, running two actions** — not
just one, per Michael's revision (2026-09-13). Firing frequency was also
revised the same day (see decision #5): the webhook fires on **every
distinct return visit from the 2nd onward, capped at once per 24 hours**
(not just once, ever) — each alert names the running visit count:

1. **LeadSimple "Create Lead Note"** — finds the existing lead by the
   owner's email and attaches a note (e.g., "Viewed their rental analysis
   report (visit #3) — [address], [report link]"). Kept as a permanent,
   searchable record on the lead itself, for anyone reviewing that lead's
   history later. One note per firing, so repeat visits build a visible
   trail on the lead rather than a single stale note.
2. **A direct email to Chris Knight** (Red Door's business development
   manager — see decision #5's sender-identity note), via Zapier's
   built-in "Email by Zapier" action. **Added because a note alone isn't
   reliably actionable** — it depends on Chris happening to check that
   lead in LeadSimple, and it's unconfirmed whether LeadSimple itself
   surfaces any notification when a note is added. A direct email
   guarantees the alert reaches him regardless of what LeadSimple does on
   its own. "Email by Zapier" needs no separate account connection — it's
   a native Zapier action that just needs a destination address, subject,
   and body.

This does mean a Zapier account/zap is needed for this one piece even
though lead creation itself doesn't use Zapier — confirmed feasible:
LeadSimple's Zapier integration has both a documented "Create Lead" action
(used in multiple existing zap templates from other lead sources) and a
"Create Lead Note" action, so the underlying capability exists even without
confirmed public API docs beyond Zapier. **A custom field on the lead was
considered instead of/alongside the note, and set aside**: it would only be
more "actionable" than a note if LeadSimple has (or Red Door sets up) a
workflow rule that alerts Chris when that field changes — unconfirmed, and
not worth the extra LeadSimple-side setup when a direct email already
solves the actionability problem more simply.

**RentEngine's own lead webhook — ruled out, FINAL (2026-09-13).** See "The
API — confirmed spec" above. Michael confirmed this tool only consumes
RentEngine's API for comps data and never creates a lead record inside
RentEngine, so that webhook has nothing to trigger on here — not used.

**How to actually create the Zapier webhook (2026-09-13) — the intake form
does NOT need to exist first.** The trigger for this Zap is Zapier's own
"Webhooks by Zapier" app, not the rental-analysis form — the form is never
part of this Zap at all. The Worker/Astro route calls this webhook directly
via HTTP POST; nothing about creating it depends on the form, the Worker,
or anything else in decision #8 being built yet. Steps:

1. In Zapier, click **Create Zap**.
2. For the trigger app, choose **Webhooks by Zapier**, event **Catch Hook**.
   This generates a unique POST URL immediately — no external account or
   form connection needed for this step.
3. Copy that URL. **Done (2026-09-13): `https://hooks.zapier.com/hooks/catch/18363408/4dtgfdv/`
   — this is the "Zapier webhook URL" the Worker needs.** Test payload sent
   and caught successfully (step 4 below).
4. (Optional, for step 6 below) Send one test payload to that URL — a curl
   command or a tool like Postman — with the fields the real Worker will
   eventually send, e.g. `{"owner_email": "test@example.com",
   "property_address": "123 Main St", "report_url":
   "https://reddoorrents.com/rental-analysis/abc123"}`. Zapier uses this
   sample to let later steps map fields by name instead of by raw JSON
   path — it just needs *a* sample payload shaped like the real one, not
   an actual form submission.
5. For the first action, choose **LeadSimple**, action event **Create Lead
   Note** (confirm the exact action name inside Zapier's LeadSimple
   integration — connect/authenticate the LeadSimple account if not
   already connected in this Zapier workspace).
6. Configure that action: have it find the existing lead by the owner's
   email (the field from step 4's sample), then set the note text using
   the property address and report link fields, e.g. "Returned to view
   their rental analysis report — {{property_address}}, {{report_url}}."
   This step relies on a matching LeadSimple lead already existing — which
   it will, since the lead-creation email (above) always fires first, on
   submission, well before any return visit can trigger this note.
7. Click **+** to add a second action step. Choose **Email by Zapier**
   (a built-in Zapier action, not a separate account/app to connect).
8. Configure it: To = Chris Knight's address (`cknight@rdpmindy.com`),
   Subject something like "Owner returned to their rental analysis —
   {{property_address}}," and a short body using the same
   property_address/report_url/owner_email fields from step 4's sample, so
   Chris can click straight through to the report and knows who to follow
   up with.
9. Test both actions — the note against a real (internal-team, not a
   customer) test lead in LeadSimple, the email by confirming it actually
   lands in Chris's inbox — then turn the Zap on.

Once step 3 is done, hand the URL over — that's the one piece decision #8
is still waiting on from this decision.

**Decision #6 is now fully closed.** Destination, source tag, creation
mechanism, email format, the dedicated inbound address, BD-alert wiring, and
the RentEngine-webhook ruling are all settled. Nothing left open in this
decision.

## Decision #9 — Confidence score — FINAL (2026-09-12, extended 2026-09-13)

Show a confidence score (as a %) alongside the estimate, reflecting how much
comp-selection had to compromise to produce it. Not derived from the
accuracy-validation data (no way to test a confidence *score* against real
outcomes with only 7 samples) — built from the specific compromises
decisions #1, #2, and #10 can make.

**Step 1 — raw internal score, 0–100.** Start at 100, subtract:

| Compromise | Deduction |
|---|---|
| Radius widened to 2mi (standard path) | −10 |
| Radius widened to 3mi | −20 |
| Radius widened to 5mi (cap) | −30 |
| Had to relax date window from 6mo → 12mo | −15 |
| Bed count relaxed to ±1 (decision #1) | −20 |
| Final Rented-comp count < 5 (blend path fired, decision #2) | −20 |
| Blended pool itself still < 5 comps total | −15 |
| Multi-unit property: couldn't use same-building comps, fell back to area-wide radius path | −15 (in addition to whichever radius/date/bed deductions the area-wide path then incurs) |
| Bedroom-adjustment (decision #10) used, but the local city data for the relevant rung was thin | −10 |
| Bedroom-adjustment (decision #10) had to fall back to the portfolio-wide average ratio (no usable city-specific data at all) | −20 |

Clamp the raw score to [0, 100].

**Step 2 — rescale to the displayed range.** Per Michael: never show 100%
(overclaims certainty) and never show below 55% (undersells that a real
estimate was still produced) — displayed range is a hard **55–94%**.

`displayed % = round(55 + (raw / 100) × 39)`

- raw 100 (no deductions) → **94%** (ceiling)
- raw 0 (every deduction stacked) → **55%** (floor)

Sanity-checked against two real cases from the validation run:
- **Bluff Point Dr** (1mi, within 6mo, 30 Rented comps, single-family): raw
  100 → **94%**.
- **Lapel** (widened to the 5mi cap under decision #1's new rule, needed the
  12mo relaxation, ended in the blend path): raw ≈20 (−30 −15 −20 −15) →
  **~63%** — clearly lower than Bluff Point Dr, correctly reading as the
  weaker estimate, without implying it's worthless.

Round the final displayed number to the nearest whole percent.

**Presentation — see decision #5:** shown as this numeric % plus a
plain-language bucket label and a fixed template sentence, not the number
alone.

## Decision #10 — Bedroom-count rent adjustment — FINAL (2026-09-13)

When decision #1's bed-count cascade relaxes to ±1 bedroom, the ±1 comp's
rent gets normalized to the subject's bed count before it enters the
median/range math (a standard CMA "bedroom adjustment"), rather than folding
the raw comp rent in unadjusted. Report shows **both** the comp's real
rent and its bedroom-adjusted rent — not just one or the other.

**Data source: RentCast, deliberately, not a flat invented percentage.**
Michael confirmed Red Door will run RentCast at an upgraded tier regardless,
for other site features, so cost/vendor-relationship objections that applied
to using RentCast as the *estimate engine* (see the top-level decision) don't
apply here — this is explicitly approved as a narrower, supplementary use.
The separate homes-for-rent page project already pulls RentCast's
`/v1/markets` endpoint per city and stores a `bedroomLadder` (avg rent by
bedroom count, 1BR–5BR) as part of that per-city data file — this tool reads
that existing file rather than duplicating the pull. (Decision #5's new rent-
trend and bedroom-rent chart panels read from this same file.)

**Four-tier cascade, in order:**

1. **City covered, rung well-sampled.** Subject's city exists in the
   per-city file, and both the subject's and the comp's bedroom rungs meet
   the sample-size bar the homes-for-rent project already uses to flag thin
   data (`newListings` threshold). Use that city's specific ratio:
   `adjusted_rent = comp_rent × (subject_bed_rung_avgRent / comp_bed_rung_avgRent)`.
   No confidence penalty.
2. **City covered, rung thin.** Use it anyway (real data beats none), but
   apply the "thin local bedroom data" deduction in decision #9.
3. **City not covered at all.** Make a fresh, on-demand RentCast `/v1/markets`
   call for that city/ZIP, and write the result into the shared per-city
   file so it's cached for future analyses in that area (no repeated calls
   for the same gap). Capped at **50 of these ad hoc calls per month** for
   this tool specifically — Michael isn't concerned about call volume given
   the upgraded RentCast plan, but wants a ceiling rather than an unbounded
   tap. Once that monthly cap is hit, fall through to tier 4 for the rest of
   the month. A fresh call that itself lands on a thin rung is treated as
   tier 2 (deduction applies); a fresh call that returns a well-sampled rung
   is treated as tier 1 (no deduction) — freshness itself isn't penalized,
   only sample thinness.
4. **No usable data at all** (cap hit, API error, or truly nothing
   returned). Fall back to a **portfolio-wide weighted-average ratio**:
   across every city already in the per-city RentCast dataset, compute each
   city's own bed-to-bed ratio (e.g., 4BR-avg ÷ 3BR-avg) for the needed pair,
   then average those ratios weighted by sample size — a ratio, not a flat
   dollar difference, since a fixed dollar amount doesn't travel across Red
   Door's price range (Lapel vs. Indianapolis vs. Avon) the way a ratio
   does. Apply the "portfolio-wide fallback" deduction in decision #9 (the
   largest of the three decision #10 deductions, since this is the least
   location-specific basis for the adjustment).

Since the bed filter in decision #1 never relaxes past ±1, this adjustment
only ever needs to normalize a one-bedroom difference — no larger
multi-bedroom adjustment table is needed.

## Decision #8 — Hosting/implementation scope — IN PROGRESS (scoped 2026-09-13)

Every other decision (#1–#7, #9, #10) is now locked, so this section is the
actual build plan: what gets built, where it runs, what it's built on top
of, what's genuinely new/undecided, and a revised time estimate. Nothing
here reopens an earlier decision — it's the implementation of all of them.

**Architecture correction, worth making explicit before anyone starts
coding:** this has been called "a Cloudflare Worker" throughout the earlier
decisions, but per decision #5's own build constraints ("one new dynamic
route in the otherwise-static Astro site... Astro supports hybrid
static+SSR routing natively"), the request-handling logic for this tool is
new **Astro SSR API routes/pages deployed as part of the site's existing
Cloudflare Pages project** — not a separate standalone Worker service in
its own repo. That's a different thing from the *actual* standalone
Cloudflare Worker already decided for the homes-for-rent project (the
monthly RentCast-refresh job on its own Cron Trigger, per
`claude/red-door-homes-for-rent-data-schema.md`) — that one genuinely is a
separate Worker, because Cron Triggers aren't part of the site's own
request path. Two different things share the word "Worker" in this
project's docs; worth keeping straight during implementation so nobody
spins up an unnecessary second standalone project for the rental-analysis
logic. From here down, "the Worker" in older decisions above means "the new
Astro SSR routes," and this section uses that phrasing going forward.

**New endpoints needed, in the Astro app:**

- `POST /api/rental-analysis/submit` — takes the intake form submission,
  runs the full pipeline below, stores the snapshot, sends both emails,
  and redirects/responds with the hosted report's URL.
- `GET /rental-analysis/[token]` — the hosted report page (Astro SSR route,
  reads the stored snapshot by token per decision #5's "unguessable token
  in the URL" access model), rendering the v6 mockup layout against real
  data. Also where view-tracking for the BD alert happens (see below).

**Submit-flow pipeline, in order, mapping each step to the decision that
specifies it:**

1. **Validate and spam-check the form.** Recommend adding Cloudflare
   Turnstile to this form too, consistent with the Turnstile decision
   already made for the site's other forms (see "Decisions locked" in
   `red-door-website-todo.md`) — this form is a new public entry point and
   an obvious spam/abuse target (metered RentEngine/RentCast calls behind
   it).
2. **Geocode the submitted property address** to lat/long — needed for
   decision #1's radius-based cascade (RentEngine's `zipcodes` parameter
   is exact-match only, not radius-based, so zip alone isn't sufficient
   for the nested 1mi→2mi→3mi→5mi loop). **This is a genuinely new,
   previously-unaddressed requirement** — nothing in decisions #1–#10
   specifies how an arbitrary prospect address becomes coordinates.
   **Recommended default: Mapbox's Geocoding API**, reusing the Mapbox
   account/token already held for the listings map (decided in
   `red-door-website-todo.md`) — its free tier is 100,000 requests/month,
   nowhere close to being threatened by ~20–40 analyses/month, so this
   adds no new vendor and no new cost. Flagging as a default to confirm,
   not asking Michael to pick from scratch.
3. **Property characteristics.** The subject property's beds/baths/sqft/
   property type/furnished status feed decisions #1 and #10 directly, and
   nothing currently specifies where they come from. Recommended default:
   ask for them directly on the intake form, matching the exact pattern
   already tested and approved on RentEngine's own public embed widget
   (address → beds/baths/property type/sqft/features — see
   `red-door-website-todo.md`'s embed-widget findings) rather than
   inventing a different field set. Sqft can be left optional per decision
   #1's existing "skipped entirely if the subject's sqft isn't available"
   rule.
4. **Run decision #1's comp-selection cascade** against RentEngine
   `GET /market-tool/comps`: apartment-complex detection and same-building-
   first path vs. the standard radius/date/bed cascade, all comp-quality
   filters, ranking, and the top-12 cap. This is the single largest, most
   detail-sensitive piece of business logic in the whole build — every
   branch in decision #1 needs a corresponding code path, since the
   accuracy-validation results (decision #4) are what justified each one.
5. **Apply decision #2's Rented/Available fallback** to the cascade's
   output to get the comp pool that feeds the estimate.
6. **Compute the estimate and range** — median of the pool, ±10% band
   (decision #3).
7. **Compute the confidence score** — walk the same cascade's compromises
   (which radius step, which date relaxation, bed relaxation, blend path,
   multi-unit fallback) against decision #9's deduction table, rescale to
   55–94%, and select the matching bucket label/template sentence.
8. **Apply decision #10's bedroom adjustment** to any ±1-bed comp: read
   the shared per-city RentCast file (the same KV/D1 store the
   homes-for-rent project's Cron-Trigger Worker already writes monthly —
   see `claude/red-door-homes-for-rent-data-schema.md`) for the four-tier
   cascade. **Tier 3's on-demand RentCast pull needs write access to that
   same store at request time**, plus its own persisted monthly-call
   counter (a small table/row keyed by month, reset naturally by month
   value) to enforce the 50-calls/month cap.
9. **Compute the market-context panels** (supply/demand ratio, time-to-
   lease buckets) from the same area-wide comp pool already fetched in
   step 4 — pure arithmetic, no new calls, per decision #5.
10. **Fetch the homes-for-rent cross-sell set and the "From Red Door" post
    carousel.** Recommendation, not yet explicitly settled: snapshot the
    *analysis-specific* data (steps 4–9) at generation time per decision
    #5's "snapshot, not live" rule, but query these two sections **live on
    each page view** rather than freezing them too — they're cheap reads
    (the existing listings feed and a Sanity query), freshness is actually
    desirable here (a snapshotted cross-sell could show a listing that's
    since rented), and decision #5's snapshot rule was specifically about
    not re-spending metered API budget or showing a different *rent
    number* than the email — neither applies to these two sections.
11. **Store the snapshot** (steps 4–9's output, plus the owner/property
    intake fields) under a new token, in Cloudflare D1 (recommended over
    KV — see "Storage" below).
12. **Send two emails:**
    - The owner's headline email (decision #5): estimate, range,
      confidence, one CTA (now the Calendly link found above), hosted-
      report link.
    - The LeadSimple lead-creation email (decision #6): the exact template
      already drafted there, to the confirmed dedicated address.
    - **Sender identity — FINAL (2026-09-13):** both the owner's headline
      email and the hosted report page's CTA send/point to Chris Knight
      (Red Door's business development manager — matches the real
      `cknight-19` Calendly account found above, so the CTA and the "who
      sent this" identity are already the same person). Display name and
      Reply-To use Chris's real inbox (`cknight@rdpmindy.com`); the actual
      sending/envelope domain stays on Resend-verified infrastructure
      (see below), not his personal mailbox — keeps his day-to-day
      deliverability separate from an automated system, while replies
      still land with him directly. Final header shape (updated
      2026-09-20 for the `mail.rdpmindy.com` sending-domain change below —
      see "Resend sending domain/address"):
      `From: "Chris Knight, Red Door Property Management" <reports@mail.rdpmindy.com>`,
      `Reply-To: cknight@rdpmindy.com`.

**`GET /rental-analysis/[token]` (the hosted report page) — view tracking
for the BD alert:** on each render, record a view (timestamp) against the
token in D1; collapse views within ~30 minutes into one visit per decision
#5. Starting with the second distinct visit, every further distinct visit
POSTs to the Zapier webhook that triggers the note + email actions
(decision #6), **unless an alert already fired for this token within the
last 24 hours** — in that case, record the view but skip the POST. Each
POST payload includes the running distinct-visit count so the note/email
can say "3rd visit," etc. **The webhook is confirmed and fully live
(2026-09-13):
`https://hooks.zapier.com/hooks/catch/18363408/4dtgfdv/`, both action steps
(LeadSimple note, email to Chris) built and working.** Nothing further
needed on this piece — the Worker can be built against this URL and a real
POST to it will do exactly what decision #5 specifies.

**Storage — recommend Cloudflare D1 over KV, as a technical default (not
escalating this one — decision #5 already left "KV or D1" open as
equally-valid native options).** D1 is a better fit here specifically
because two pieces of this build want atomic increments/counts that plain
KV handles awkwardly: the repeat-visit BD-alert logic (needs a real count
of distinct visits, plus a "last alert fired at" timestamp for the 24-hour
cap — not just a single last-seen timestamp), and decision #10 tier 3's
50-calls/month cap (needs a reliable counter reset by month). Proposed
tables:

- `rental_analyses` — one row per submission: token (PK), timestamps,
  owner contact fields, property fields (address/city/state/zip/lat/lon/
  beds/baths/sqft/type), the full computed snapshot (estimate, range,
  confidence + bucket, comp list, market-context figures, which decision
  #10 tier was used), view timestamps, a running distinct-visit counter,
  and `last_bd_alert_fired_at` (nullable — null until the first alert
  fires, then used to enforce the 24-hour cap on subsequent visits).
- `rentcast_city_cache` — the same shared per-city file decision #10
  reads/writes, either this table or the existing one from the
  homes-for-rent project reused directly (same store, not a duplicate).
- `rentcast_adhoc_call_log` — one row per month, a counter, for decision
  #10 tier 3's cap.

**Genuinely new/open items this scoping surfaced** — all now resolved:

- **Geocoding vendor** — recommended default: Mapbox Geocoding API (see
  step 2 above). Low-stakes, reuses an existing account; flagging for
  awareness, not asking Michael to choose between options.
- **Transactional email vendor — FINAL (2026-09-13): Resend.** Checked
  current options directly: MailChannels' free relay for Cloudflare
  Workers — what a lot of older Cloudflare-email tutorials assume — was
  shut down (its own support site carries an End-of-Life notice).
  Cloudflare's own native "Email Service" exists but is still in public
  beta as of this check, not something to bet a production lead-gen flow
  on yet. Michael confirmed Resend: Cloudflare's own developer docs carry
  a dedicated tutorial for it, and its free tier (checked directly against
  resend.com/pricing: 3,000 emails/month, 100/day) comfortably covers Red
  Door's real volume (~20 analyses/month × 2 emails each, plus occasional
  resends — nowhere near the cap).
- **Resend sending domain/address — REVISED, FINAL (2026-09-20): `mail.rdpmindy.com`
  subdomain, `reports@mail.rdpmindy.com`.** Supersedes the original
  2026-09-13 choice of `mail.reddoorrents.com` below — kept for the
  record, not current. **Why it changed:** two things surfaced only once
  DNS setup was actually attempted. First, `reddoorrents.com` permanently
  forwards all of its email elsewhere rather than receiving it directly —
  the "runs Google Workspace for regular company email" premise below was
  wrong; the real company inboxes (`cknight@rdpmindy.com`, etc.) live on
  `rdpmindy.com`, not `reddoorrents.com`. Second, `reddoorrents.com`'s
  authoritative nameservers turned out to be `nesthubdns.com` (the
  PMW-era host), not GoDaddy — DNS records added in GoDaddy's panel were
  being saved to a zone the domain doesn't actually use, so nothing
  verified no matter how correctly the records were entered. Rather than
  either fix GoDaddy's records for a domain whose DNS isn't really there,
  or risk a nameserver cutover blind (everything currently live at NestHub
  would need auditing first), Michael moved the sending domain to a
  subdomain of `rdpmindy.com` instead — the domain that's actually
  correctly and currently under his control. **The same root-domain-SPF-
  conflict reasoning that originally justified a subdomain still applies
  here** (`rdpmindy.com` is the domain real staff email actually lives on
  now), so `mail.rdpmindy.com` keeps the same isolation the original
  choice was built around — this is a substitution, not an abandonment,
  of that reasoning. **DNS added and verified (2026-09-20):** Michael
  added `mail.rdpmindy.com`'s SPF (2 CNAMEs), DKIM (TXT), and DMARC (TXT)
  records, and Resend confirms the domain as verified. **Resend API key —
  still to generate**, same as originally noted below; nothing else is
  outstanding on this piece.

  <details><summary>Original 2026-09-13 decision (superseded above)</summary>

  **Resend sending domain/address — FINAL (2026-09-13): `mail.reddoorrents.com`
  subdomain, `reports@mail.reddoorrents.com`.** reddoorrents.com already
  runs Google Workspace for regular company email, and a domain can only
  carry one SPF TXT record — verifying Resend directly on the root domain
  would mean merging Resend's SPF entry into Google's existing one and
  adding Resend's DKIM entries alongside Google's, with real risk of
  breaking company email deliverability if done wrong. Michael chose a
  dedicated subdomain instead: Resend's SPF/DKIM records live entirely on
  `mail.reddoorrents.com`, fully isolated from the root domain's Google
  Workspace setup — no merging, no shared-record risk. Timing: reddoorrents.com's
  DNS is not yet on Cloudflare (hosting-platform choice is still open, see
  "Remaining decisions" in `red-door-website-todo.md`) and still sits on the
  current host from the PMW-era setup — Michael confirmed he can add DNS
  records there himself, so this doesn't need to wait for the Cloudflare
  cutover. **DNS records added and saved (2026-09-13):** Michael added
  `mail.reddoorrents.com`'s SPF (2 CNAMEs), DKIM (TXT), and DMARC (TXT,
  `p=none` — organizational-domain scope, not subdomain-scoped; flagged and
  Michael confirmed no conflict with existing records) to the current DNS
  host, matching Resend's generated values exactly. **Two small things
  still to confirm/do, neither blocking the build:**
  1. **Domain verification status** — DNS records being saved isn't the
     same as Resend showing the domain as *verified*; that depends on DNS
     propagation (TTL was set to 30 min) and Resend re-checking. Michael
     should go back into Resend and confirm the domain shows a verified/
     green status before the Worker tries to send through it.
  2. **Resend API key — not yet generated, new item.** Distinct from
     decision #7's RentEngine/RentCast keys — this is the credential the
     Astro/Worker code will actually use to call Resend's send API.
     Generate it once the domain is verified, and store it the same way as
     the other API keys (kept separate per feature, not shared).

  </details>

**Revised effort estimate (2026-09-13), replacing the original 1–2 day/1–2
week figure, which assumed email-only delivery with none of the above:**

| Piece | Estimate |
|---|---|
| Comp-selection cascade + fallback + range + confidence score (decisions #1, #2, #3, #9) | 1–2 days |
| Bedroom-adjustment 4-tier cascade incl. on-demand RentCast pull + monthly cap (decision #10) | 1 day |
| Form intake, Turnstile, geocoding, property-field validation | 0.5–1 day |
| D1 schema + submit-endpoint wiring, snapshot storage | 0.5–1 day |
| Hosted report page — porting the approved v6 mockup into a real Astro template wired to live data | 1.5–2.5 days |
| Email sending (owner email + LeadSimple email) via Resend | 0.5–1 day |
| View tracking + second-visit BD alert + Zapier webhook call | 0.5 day |
| Homes-for-rent cross-sell + "From Red Door" carousel, live queries | 0.5–1 day |
| QA: re-run the 7 decision #4 validation properties through the real pipeline, edge cases (zero-comp, multi-unit, thin-market), email deliverability | 1–1.5 days |

**Total: roughly 7.5–11.5 focused days** — about 1.5–2.5 weeks full-time,
or 3–5 weeks at the project's own "10–15 hrs/week" pace (see the Timeline
table in `red-door-website-todo.md`). This lands at or past the *upper*
end of the original 1–2 week estimate, as decision #8's earlier note
already predicted — not a surprise, just now a real number instead of a
placeholder.

**Recommended verification step once built:** re-run the same 7 real,
recently-leased properties from decision #4's accuracy validation through
the finished pipeline end-to-end, and confirm the outputs match what
decisions #1–#3 and #9 predict by hand. This checks the *implementation*
against the *decisions*, not the underlying data-quality ceiling
decision #4 already established (that ceiling doesn't change here).

## Remaining decisions (nothing below is settled yet)

1. ~~Comp-selection logic~~ — **done, see above.**
2. ~~Rented-vs-Available fallback rule~~ — **done, see above.**
3. ~~Range/estimate math~~ — **done, see above.**
4. ~~Accuracy validation~~ — **done, see above.**
5. ~~Report design and delivery architecture~~ — **done, see above.** Layout,
   copy, both new charts, the comps table position, the homes-for-rent
   cross-sell, and the "From Red Door" post carousel are all locked as of
   2026-09-13 (mockup through v6). What's left is external inputs and build
   detail, not design: the Calendly link, final template-sentence wording,
   exact chart data fields, and the homes-for-rent card-styling match noted
   above.
6. ~~Lead capture and BD-alert wiring~~ — **done, see above.** Destination
   (LeadSimple only), source tag, split creation-vs-note mechanism, the
   email format, the dedicated inbound address, and the RentEngine-webhook
   ruling (not used) are all settled as of 2026-09-13.
7. ~~API credentials~~ — **done, see above.** Revised 2026-09-20: one
   shared RentEngine key for both the rental-analysis tool and the
   homes-for-rent listings build, not split per feature as originally
   decided.
8. ~~Hosting/implementation~~ — **done, see decision #8 above.**
   Revised estimate: ~7.5–11.5 focused days (1.5–2.5 weeks full-time).
   Email vendor (Resend), sender identity (Chris Knight), the Calendly
   link, the Zapier webhook (URL live, both actions — note + email — built
   and confirmed working), and the Resend sending domain/address
   (`mail.rdpmindy.com`, revised 2026-09-20, verified) are all done.
   Geocoding (Mapbox) is a low-stakes default, not a blocker. **Nothing
   external is outstanding — `mail.rdpmindy.com` is verified in Resend;
   only the API key itself still needs generating (self-service, see
   decision #8), which doesn't block the build.**
9. ~~Confidence score~~ — **done, see above.**
10. ~~Bedroom-count rent adjustment~~ — **done, see above.**

**Next up: the build itself.** Every input this tool needs is now decided
and in hand — including the Resend sending domain (`mail.rdpmindy.com`,
verified) and Michael's confirmation he can add the DNS records himself.
Nothing left is blocking decision #8; the Worker/Astro build (~7.5–11.5 focused
days, see above) can run start to finish without waiting on anything
external, in parallel with Michael verifying the Resend domain.

## Things already ruled out — don't resurface these

- **RentRange** — pricing tier mismatch for Red Door's size (between
  small-operator and enterprise), confirmed by Michael. (A RentRange sample
  report was used purely as visual/layout reference for decision #5's
  days-on-market panel — that's a design reference, not a vendor
  reconsideration; RentRange itself is still rejected.)
- **A proprietary model built from Red Door's own executed-lease data** —
  seriously considered, explicitly ruled out: not realistic given Red Door's
  actual data volume.
- **RentEngine's out-of-the-box embeddable widget** — genuinely viable (free,
  self-service, already Red-Door-branded, automated lead-gate) but passed
  over in favor of full control via a custom build.
- **RentCast as the estimate engine or comps source** — including just for
  its pre-computed estimate. See reasoning above. **Narrower carve-out, not
  a reversal:** RentCast's city-level market data is approved as a
  supplementary input for the bedroom-count adjustment (decision #10) and,
  as of decision #5's expansion, the rent-trend and average-rent-by-bedroom
  chart panels — it still does not supply comps or drive the core estimate.
- **An AI-generated "agent comment" note in the report** — considered for
  decision #5, killed by Michael: replaced with fixed, data-driven template
  sentences instead of freeform generation. (Red Door's own real RentEngine
  report for 17233 Rancorn Place includes exactly this kind of freeform
  note — reviewed as design reference for decision #5's other panels, but
  the agent-comment note itself stays killed; it wasn't reintroduced.)
- **Pure self-contained email (no hosted page) and pure hosted-page-with-
  teaser-only-email** — both considered for decision #5, both passed over
  in favor of the hybrid. Pure email loses all engagement visibility (email
  open tracking is unreliable); pure hosted-with-teaser risks the owner
  never clicking through and getting zero value. See decision #5.
- **A PDF attachment/report** — considered for decision #5, not pursued:
  generating a PDF inside a Cloudflare Worker requires either an external
  rendering service (new vendor) or a low-level library that can't render
  real HTML/CSS. A well-designed HTML email covers the same need more
  simply.
- **Slack for the BD alert** — not an option; Red Door doesn't use Slack.
  **A BD alert on first page view** — considered for decision #5, rejected:
  a first view is near-guaranteed for anyone who clicks the email link at
  all and isn't a meaningful engagement signal; the alert fires on the
  second distinct view instead.
- **Using the same email-to-LeadSimple mechanism for both lead creation and
  the return-visit alert** — considered for decision #6, rejected: that
  mechanism creates new leads, and reusing it for the alert risked creating
  a duplicate lead instead of noting the existing one. Split into two
  mechanisms instead (see decision #6).
- **The public API does not expose report generation or email-sending.**
  RentEngine's internal staff tool has "Generate PDF"/"Send Email" buttons,
  but they're UI-only — not callable via the public API. The report
  formatting and email delivery have to be built from scratch regardless of
  data source; this was already priced into the 1–2 day/1–2 week estimate.
- **Reverse-engineering PMW's internal rental-analysis→LeadSimple email
  format from a forwarded PMW staff-notification email** — considered for
  decision #6, dropped: the sample Michael forwarded was PMW's own contact-
  form staff notification (to `mtaylor@`/`cknight@rdpmindy.com`), not the
  email PMW sends to LeadSimple, and it's for a tenant inquiry, not a
  rental-analysis submission — not usable as a format reference. LeadSimple's
  own documented generic email-to-lead format (see decision #6) is used
  instead.
- **RentEngine's own `pm_business_development_leads` lead webhook** —
  considered for decision #6, ruled out (2026-09-13): this tool only
  consumes RentEngine's API for comps data and never creates a lead record
  inside RentEngine itself, so the webhook (which fires on RentEngine-
  internal lead creation) has nothing to trigger on here.

## Brand and copy constraints (apply to the report/email)

- Brand color `--brand: #8b0e04` (primary), `--brand-mid: #bc1719` (hover/
  accents), `--brand-light: #e2565a` (links/accents on dark backgrounds —
  neither `--brand` nor `--brand-mid` is legible on dark backgrounds).
  Headings: Literata. Body/UI: Inter.
- **Fair Housing compliance is mandatory on any generated copy**, including
  the fixed template sentences that replaced the agent-comment note (see
  decision #5). Never describe a market, neighborhood, or property by the
  people who live there. No school ratings, crime statistics, or
  demographic references. Safe: rent, days on market, inventory, property
  type/age, seasonality, maintenance considerations.
- Writing style: plain and direct, no marketing inflation. Concrete numbers
  beat adjectives.
- **Red Door's real business address:** 3815 River Crossing Parkway, Suite
  100, Indianapolis, Indiana 46240 — use this in the email footer and
  anywhere else the report needs Red Door's physical address.

## Volume context

Of 94 real submissions in a recent export of the *current* (RentRange-based)
form, 43 (46%) were internal team testing (`@rdpmindy.com` addresses), not
real owner leads. Real volume is closer to ~20/month — use this, not the raw
94, when estimating cost or load.
