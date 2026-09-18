# Listings Build — Reference Notes

Standing context for the RentEngine-powered listings feature: the city
homes-for-rent pages, the listings index/search experience, and individual
listing detail pages. Read this before touching any of that work. This is a
trimmed, self-contained record of the relevant research and decisions — the
main `red-door-website-todo.md` keeps only a short status pointer here.

---

## API schema — confirmed from RentEngine's public OpenAPI spec

Source: `docs.rentengine.io` → "RentEngine Public API" → Download OpenAPI
description → `openapi.json` (readable with no auth). Base URL:
`https://app.rentengine.io/api/public/v1` (staging at
`staging-app.rentengine.io` if a sandbox account exists). Account ID:
`6ecca3ec-8e5a-42ed-87ea-af21f97d546e`.

**`GET /units`** — the full internal record (~50 fields). Everything a real
detail page needs: `property_type`, `bedrooms`/`bathrooms`/`sqft`/
`year_built`, `amenities` (array), `pets_allowed`/`pet_restrictions`/
`pet_fees`, `utilities_included`, `parking_type`, HOA fields,
`marketing_description`, `marketing_photos` (array of
`{path, hidden, original}`), structured `address` (`formatted_address`,
`street_number`, `street_name`, `city`, `state`, `zip_code`, `coordinates`),
plus internal-only fields to ignore (`internal_notes`, `commission_amount`,
`prescreen_template_id`, etc). Filterable by `city`, `zip_codes`, `statuses`,
`updated_after`/`before`; paginated (`limit` up to 100, `page_number`).

**`GET /marketing/listings/{accountId}`** — a second endpoint built
specifically "for embedding listings on external websites." Flatter shape
(`address`/`beds`/`baths`/`rentAmount` as plain strings, `photos` as plain
URL strings) plus ready-made CTA fields (`applyUrl`, `btnUrl`/`btnText`,
`waitlistLabel`, `virtualTour`, `specials`). Almost certainly what feeds the
current live iframe widget. **Missing:** amenities, pet policy, parking, HOA,
utilities — everything a real detail page needs beyond a listing card.

**Decision: build from `/units`.** `/marketing/listings` is fine for a quick
grid prototype but can't support a real detail page.

---

## Real data findings — from a live read-only-token pull, all current units

- **`/units` returns the account's entire history, not just active
  listings.** Of the first 100 records (unfiltered), 93 were `status:
  "Leased"` — a full unit ledger going back years, not a current-inventory
  feed. **Always query with `statuses=Available`** (22 right now).
- **`On Hold` (8 right now) is a separate status from `Available`.**
  **Decided (Sep 18): hide entirely.** Query `/units` with
  `statuses=Available` only — matches the original query recommendation
  above, no separate On Hold handling needed.
- **Current 22 Available units skew heavily to Indianapolis: 17 of 22.** The
  rest are one each in Westfield, Noblesville, Carmel, Fishers, and
  Pendleton. Beds range 1–4, rent $845–$2,545. **This makes the thin/empty
  city page the normal case, not an edge case** — most of the 20
  `-homes-for-rent` pages will show zero or one listing at any given time.
  The page needs to read as complete and useful even with nothing in the
  grid — city guidance content carries it, not the listing count.
- **`amenities` (structured field) is essentially unused: 2 of 100 units
  populated.** `highlighted_amenities` is usually the literal string
  `"None"`. **Don't build an amenities checklist UI against this field** —
  the data isn't there. Confirmed again (Sep 9) against all 22 current
  Available units: 0 of 22 have `amenities` or `utilities_included`
  populated. Whatever amenity information exists lives in the free-text
  `marketing_description` instead.
- **`marketing_description` is 100% populated, ~1,190 characters average** —
  the real content source for the detail page body, not the structured
  fields. **Tone is resolved, no build-time action needed:** Michael
  confirmed this copy is reviewed before it enters RentEngine (Fair Housing
  compliance included), so render it verbatim — no scrubbing, no per-listing
  review on our end.
- **Every unit has at least one photo (0 of 100 had zero); most have
  20–50.** Usable URL: `marketing_photos[].original`
  (`https://images.cdn.appfolio.com/...`, directly hotlinkable). The sibling
  `path` field is a relative RentEngine-internal reference, not a resolvable
  URL on its own. Check `hidden` defensively even though none were `true` in
  the sample. Photos flow from AppFolio into RentEngine, not a separate
  upload. **Decided (Sep 18): hotlink directly**, not mirror/cache — no
  build step needed for photos.
- **Fees are clean and structured:** `monthly_fees` / `move_in_fees` /
  `pet_fees` are each arrays of `{name, type, amount}` — easy to render as a
  line-item list (e.g. "Resident's Benefits Package — $45/mo", "Lease Prep
  Fee — $195"). Unit 44214's total move-in cost: $1,940.
- **`min_resident_qualifications`** — 100% populated, identical text across
  all 22 units (real, company-wide rental criteria). Confirmed usable —
  powers the detail page's "Rental requirements" section.
- **`laundry`** (enum: In Unit, Shared, Coin-op, Hookups but no machines,
  On-site, None) and **`parking_type`** (enum array: Street, Carport,
  Assigned Spots, Driveway, Shared Garage, Private Garage, Paid Parking) plus
  **`num_parking_spots`** — both real and populated across the 22 units (9
  None/6 In Unit/4 Coin-op/1 Shared/1 On-site/1 Hookups on laundry). **A
  "Features" section surfacing these was built (v4, Sep 9) then removed
  (Sep 10)** at Michael's call — laundry didn't read as useful alone, and
  parking data isn't reliable enough to commit to a UI element yet. Both
  fields remain confirmed-real if a better treatment comes up later.
- **`furnished`, `has_elevator`, `floor_number`, `storm_protection`** — exist
  but false/empty for essentially every current unit. Not worth a UI around
  yet; revisit if inventory composition changes.
- **`custom_application_url`** — real, AppFolio-hosted, confirmed as the
  actual "Apply now" target.
- **`key_access` / `showing_method`** — confirms RentEngine's own
  self-guided digital lockbox handles showings for every current unit.
- **`accepts_vouchers`** — null for every current unit, despite at least one
  listing's marketing copy advertising Section 8 acceptance. **Open —
  resolve with Michael/RentEngine before building a voucher filter.**
- **CORRECTION (Sep 18): a real showings/booking API exists** —
  `docs.rentengine.io/openapi/openapi/showings`, not found during the
  original research pass (`/units` doesn't expose a showing-booking field,
  which is presumably why this was missed). Two endpoints, both `BearerAuth`:
  - **`GET /showings/availability?unitId={id}`** — returns
    `preferredShowingWindows` and `availableShowingWindows` (each an array
    of `{start, end, invitedUserIds, showingMethodsAvailable}` in ISO 8601),
    the unit's configured `showingMethod` (enum: Accompanied / Remote Guided
    / Remote Guided with Gated Access / Self Guided), `timezoneName`/
    `timezoneAbbreviation`, and `unitStatus`.
  - **`POST /showings/create`** — books (or reschedules, via
    `rescheduleEvent`) a showing. Body: `unitId`, `plannedForTime` (ISO
    8601), `desiredShowingMethod`, and required `prospectData`
    (`firstName`/`lastName`/`email`/`phone`, plus prescreening fields —
    `creditScore`, `income`, `questionAnswers[]` with a
    `fixedQuestionType: "housing_voucher"` yes/no question among others,
    `prospectType`: `"Self"` or `"Agent"` — Agent requires a 6-character
    `agentTk`). **For Self prospects the API runs prescreening
    automatically against the unit's prescreen template; if it fails, the
    showing isn't created.** Response is just `{statusText: "success"}` (or
    a 400/500 with prescreening/validation failure detail — exact error
    shape not yet checked).
  - **This resolves the open item below and changes the recommended build:**
    a real in-page "Schedule a Showing" flow (pick a slot from
    `availableShowingWindows`, submit `prospectData`) is now buildable
    against real availability, not just a lead-capture-then-manual-followup
    placeholder. **Still open:** the `questionAnswers` prescreening
    question set isn't fully documented here (only two examples shown:
    housing-voucher and felony-conviction) — need to confirm the complete
    per-unit or per-account question list before building the form, so it
    isn't a guess. Also unconfirmed: what a failed-prescreening 400
    response actually contains, so the UI can show a real reason rather
    than a generic error.

---

## What the live PMW site is actually doing today (confirmed by DOM inspection)

Loaded `/indianapolis-homes-for-rent` and inspected directly: it's a real PMW
page (header, hero, intro copy, "Communities We Serve") with one
`<iframe id="listings-iframe">` embedding
`rentengine.io/c/reddoorpm?desktopViewStartAs=grid&...` — RentEngine's whole
whole-account widget, unmodified, on **all 20** `-homes-for-rent` pages
today. There is no per-city filtering happening on the live site at all —
it's an accident of the embed, not a deliberate design.

The `#listing/{id}/{slug}` fragment in the URL bar is client-side only —
fragments are never sent to the server, and Google stopped treating `#!`
hash routes as indexable around 2015. Every listing "page" today is really
the same URL with different content swapped in by JS. Confirmed
`/_system/listings/35269` already 404s live.

**This strengthens, not changes, the existing decision:** build real
server-rendered pages from the API. It also clarifies why
`/indianapolis-homes-for-rent`'s current ranking works at all — it comes
entirely from the page's own title/H1/copy, not from which listings happen
to render inside the iframe. Once listings are real HTML, what's shown on
each page becomes crawlable for the first time — city filtering is a genuine
upgrade, not just styling.

---

## City content — the three-page model (LOCKED, Sep 11)

Every serviced city can have up to three distinct page types, each targeting
different search intent so they don't compete against each other:

1. **`/[city]-homes-for-rent`** — transactional, tenant-facing. **All 20
   kept and rebuilt**, each real and server-rendered, defaulting to that
   city's own listings with a "homes available nearby" fallback grid when
   its own inventory is thin (the common case — see the Indianapolis skew
   above). Locked template: the Avon homes-for-rent page (approved Sep 11).
   Individual RentEngine listings are also tagged by city so they can
   independently rank for "[city] homes for rent" too — additive to the hub
   pages, not a replacement.
2. **`/[city]-property-management`** — transactional, owner-facing ("hire
   us"). Now the highest-priority page type on the site (Sep 11). A Sep 10
   content audit found the existing "1,489–1,847 words with genuine
   variation" description was overstated — most length is identical
   service-description boilerplate; the only genuinely unique content is a
   short, inconsistent Wikipedia-sourced area-history blurb. **These need
   real strengthening, not just a template port.** Avon pilot built (Sep
   11): each page gets a condensed **rental & sales market snapshot**
   section (3 headline rental stats + link to that city's homes-for-rent
   page, next to 3 headline sale stats — avg/median sale price, days on
   market — framed as owner sell-vs-rent context). Sale-side data isn't an
   added RentCast cost — see below. Full writeup:
   `claude/avon-property-management-pilot-notes.md`.
3. **`/[city]-market-reports`** — informational/data intent ("Fishers rent
   prices," "Fishers rent trends"). **New page type, not built yet.** Only
   for cities with active recurring market-report production — **open item:
   get that city list from Michael.**

**Writing-style rule (Sep 11):** if a sentence would work equally well on
either the property-management or market-reports page for the same city,
it's not specific enough to either one. Property-management writes to "hire
us"; market-reports writes to "here's the data."

### RentCast data pipeline for the three-page model

**Full field-by-field schema, RentCast's real JSON structure, and two
parsing guards found in production data:**
`claude/red-door-homes-for-rent-data-schema.md`. **Full pilot build log for
the first `-property-management` rewrite:**
`claude/avon-property-management-pilot-notes.md`. Both are canonical — read
them before building either page type, don't re-derive field names or
re-litigate what's reusable.

**One finding from the Avon pilot worth surfacing here:** most of a
`-property-management` page turns out to already exist. The 6-stage process
cards, the three guarantee cards, the reviews carousel, the multi-step
rental-analysis form, nav, and footer all came straight from the existing
homepage build unchanged — the per-city work is smaller than it looked
before that page was actually built. One small shared-copy fix falls out of
this: the process section's heading ("Indianapolis Property Management
Journey") reads oddly reused on a city page and should become "The Red Door
Property Management Process" everywhere, Indianapolis included, so all 20
pages share the literal same component.

- **Plan: RentCast Foundation, $74/month** (1,000 requests) — approved.
  (Growth is $199/mo for 5,000, Scale $449/mo for 25,000; source:
  rentcast.io/api, checked Sep 12.)
- **Pull with `dataType=All`, not `dataType=Rental`** — one call returns
  both `rentalData` and `saleData` at no extra cost, confirmed against the
  real Avon pull. `saleData` feeds the property-management page's sales
  snapshot; it isn't used on the homes-for-rent page itself.
- **Multi-ZIP aggregation rule:** average across each area's full ZIP list.
  50 distinct ZIPs total across all serviced cities — see
  `red-door-rentcast-zip-mapping.md`. The Indianapolis page pulls the 37
  standard-delivery ZIPs, not all 56. ZIP 46183 confirmed PO-Box-only and
  excluded everywhere, including from Decatur Township's list.
- **Refresh mechanism:** a Cloudflare Worker on its own Cron Trigger pulls
  RentCast monthly and writes to KV/D1; the Astro build reads that store
  rather than calling RentCast itself at build time — decouples the pull
  from rebuild timing.
- Raw field names verified against Avon's real pull:
  `red-door-homes-for-rent-data-schema.md`.

---

## Listings SEO / URL architecture (LOCKED, Sep 9)

- **Each of the 20 `-homes-for-rent` pages is a real, separate,
  server-rendered page**, not a shared template with a client-side city
  filter — protects each page's own SEO equity, same reasoning as "don't
  consolidate the city pages."
- **No separate `/homes-for-rent` catch-all page.**
  `/indianapolis-homes-for-rent` stays the one URL, and its indexed content
  stays genuinely Indianapolis-scoped (17 of 22 current units — barely a
  trim versus "everything" today). An **"All areas" control** on that same
  page lets a visitor see every listing without navigating away; because
  it's click-triggered client-side state rather than present in the initial
  render, it doesn't get indexed as part of that URL, so it doesn't dilute
  Indianapolis's own indexed content.
- ✅ **Built (Sep 18): header nav's "Homes for Rent" link points at
  `/indianapolis-homes-for-rent?areas=all`** sitewide (93 pages + the
  shared header fragment) — a real visitor gets the full inventory
  immediately, while the self-referencing canonical tag on the bare URL
  (confirmed present) keeps Google treating the Indianapolis-scoped
  version as authoritative, so the param variant never competes with the
  other 19 city pages.
- ✅ **Built (Sep 18): the Indianapolis page's pills, search, filters, and
  a live Mapbox GL JS map** — see `red-door-website-todo.md`, "Listings —
  real data wired," for the full writeup. Pills reflect whichever cities
  actually have current inventory, not a fixed guess: Indianapolis
  (current page), Carmel, Westfield, Noblesville, Greenwood, Avon are
  real links to each city's own page (Fishers dropped — zero current
  units despite appearing in the reference mockup; Greenwood/Avon added
  — one unit each, missed in the first pass), "All areas" is the only
  client-side toggle. Pendleton's pill dropped (real listing, no
  served-city page). This is Indianapolis-only, per Michael's explicit
  instruction — the other 19 `-homes-for-rent` pages keep their plain
  grid.
- ✅ **Follow-up refinement pass (Sep 18), against a reference mockup
  Michael provided:** moved the whole browser section (pills/search/
  filters/map/grid) to directly below the hero, ahead of the RentCast
  snapshot and "What to Expect" sections. Map is 50/50 with the grid by
  default (2 cards per row); a "Hide map" toggle switches to a 3-per-row
  full-width grid. Hovering a card highlights (enlarges) its map pin and
  vice versa. Price and square-footage filters are real dual-handle
  range sliders with a histogram computed from the actual 28-listing
  dataset (not the placeholder dropdowns from the first pass), each in
  its own popover matching the reference mockup's pattern. **The map
  defaults to showing every available home in every area** (not
  Indianapolis-scoped) and stays that way regardless of which city pill
  is active — only the search box and beds/price/sqft/pets filters
  narrow what the map shows; the Indianapolis/All areas pill only
  controls the card grid below it, per the locked SEO reasoning (the
  map's pins aren't indexable text content the way the cards are, so
  there's no dilution risk in showing all of them by default).
- **Every listing detail page's title, meta, H1, and schema must include the
  city plainly** — individual listings rank for "[city] homes for rent" in
  addition to the city hub page, so the city can't live only in the URL
  path.

---

## Map provider — Mapbox GL JS (decided Sep 9)

Checked current pricing before deciding: Google reworked Maps Platform
billing in March 2025 — no more blanket $200/month credit; Dynamic Maps now
gets 10,000 free loads/month then $7/1,000. Mapbox's free tier is 50,000
loads/month then $5/1,000, with pin clustering built in. At current traffic
(~700 visits/month across the 20 city pages combined) neither cost matters
yet — the deciding factor was styling: Mapbox makes it far easier to restyle
the basemap to sit inside Red Door's brand system instead of looking like a
dropped-in Google widget. [Sources checked Sep 9: mapsplatform.google.com/
pricing, storerocket.io/learn/google-maps-api-pricing, mapbox.com/pricing.]

---

## Design iteration history — index and detail pages

**Index/search page** — drafted Sep 8, redesigned v2/v3 Sep 9. v1: card grid
with dropdown filters. v2: added map+list split (custom-built from real
coordinates, not RentEngine's widget), a universal search bar, Zillow-style
price/sqft range sliders with real histograms. v3: fixed a row-collapse
layout bug, moved the pet filter from chips to a dropdown (Any pets/Dogs
allowed/Cats allowed/No pets), gave the map panel a real basemap style, added
illustrated placeholder photos. Built and tested against all 22 real
Available units. **Still to do:** rebuild as 20 genuine per-city
server-rendered pages per the locked SEO architecture above, sorting UI,
pagination/infinite-scroll (not urgent at 22 listings), swap the placeholder
map for real Mapbox GL JS.

**Detail page template** — drafted Sep 8, extended v4 Sep 9–10. Photo
gallery, specs, full description (rendered as-is), availability date, pet
policy, sticky CTA sidebar, map placeholder, similar-homes row — built
against real unit 44214. v4 added: a prominent primary "Schedule a showing"
CTA above Apply now, a real "Total move-in cost" breakdown ($1,940 for unit
44214), and a "Rental requirements" section using the real
`min_resident_qualifications` text. A "Features" section (laundry/parking)
was tried and removed the next day. **Still to do:** real showing-booking
submission (API confirmed to exist, see the correction above; built as a
simple lead-capture form for now). ✅ Apply now wired to
`custom_application_url`, ✅ real hotlinked photos, and ✅ a live Mapbox
embed (on the Indianapolis page only) are all built — see
`red-door-website-todo.md`, "Listings — real data wired."

---

## Open items summary (also tracked in the main to-do list)

- ✅ **Resolved (Sep 18): `?areas=all` query-param convention built and
  live** — see the correction above.
- ✅ **Resolved (Sep 18): "Schedule a showing" has a real API** —
  `GET /showings/availability` + `POST /showings/create`, see the
  correction above. Still need the full prescreening `questionAnswers` set
  and the failed-prescreening error shape before building the form.
- Resolve `accepts_vouchers` vs. marketing-copy mismatch before building a
  voucher/Section-8 filter.
- Confirm Apply now points at `custom_application_url` (AppFolio), not
  Findigs — check with Michael whether the live PMW nav's Findigs link is
  stale or a separate flow.
- ✅ **Decided (Sep 18): hide `On Hold` units entirely** — query
  `/units?statuses=Available` only.
- ✅ **Decided (Sep 18): hotlink AppFolio-hosted listing photos**, don't
  mirror/cache.
- Get the city list for which cities get a `-market-reports` page.
- Per-listing title/meta/H1/schema generation, templated from address, beds,
  baths, city.
- Decide delisted-property handling (404, 410, or redirect to the city
  listings page — redirect is usually best for users and link equity).
