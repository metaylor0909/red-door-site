# Homes-for-rent page — data schema

Field-by-field spec for the Astro template + per-city data file behind all
20 `-homes-for-rent` pages, derived from the locked reference implementation
(the Avon Homes for Rent page, approved by Michael Sep 11). Hand this to
Claude Code alongside the Avon HTML/CSS and `red-door-city-facts-research.md`.

**Read `CLAUDE.md` and `red-door-website-todo.md`'s "City content pages —
three-page model" section first** — this schema assumes that decision (all
20 pages kept, real per-city listings + fallback) as settled.

## Before building: blocking decisions

**All three resolved as of Sep 11. Nothing further blocking the other 19
pages from being scripted.**

1. **Multi-ZIP aggregation rule — RESOLVED.** Decided in
   `red-door-rentcast-zip-mapping.md`: average across each area's *complete*
   ZIP list (not a representative ZIP), so no two townships that share ZIPs
   (e.g. Center/Franklin, which share 46203 and 46237) render identical
   numbers — the same doorway-page risk flagged in `CLAUDE.md` for the
   `-homes-for-rent` set. **50 distinct ZIPs total** across all 20 areas plus
   the Indianapolis umbrella page (46183 excluded — see below). **RentCast
   Foundation plan ($74/mo, 1,000 requests) approved** — the free Developer
   tier (50 req/mo) had zero headroom. Indianapolis page confirmed to pull
   the 37 standard-delivery ZIPs, not all 56. ZIP 46183 — flagged as a
   conflict (Decatur Township's list vs. the county PO-Box exclusion list) —
   confirmed PO-Box-only and excluded everywhere, including from Decatur
   Township's averaged list.
2. **Monthly RentCast refresh mechanism — RESOLVED: Option A.** Cloudflare
   Pages has no native build cron, so the real choice was *where* the
   monthly pull happens. Decided: a Cloudflare Worker on its own Cron
   Trigger calls RentCast monthly and writes the results to KV/D1; the
   Astro build reads that store rather than calling RentCast itself. This
   decouples the pull from rebuild timing — a failed or rate-limited pull
   doesn't break a build, the site just serves last month's cached numbers
   until the next successful pull.
3. **Raw RentCast JSON — RESOLVED.** Michael pulled and provided the raw
   `/markets` response for zip 46123. Real field names and structure are
   below, replacing the earlier guessed names.
4. **Sale-data availability — RESOLVED.** Pull with `dataType=All`, not
   `dataType=Rental`. One call returns both `rentalData` and `saleData` as
   sibling top-level fields — sale data is not a second call or an added
   cost. Confirmed against the same real Avon (46123) pull. This is what
   feeds the sales/investment-data section on the `-property-management`
   pages (see `red-door-website-todo.md` and
   `claude/avon-property-management-pilot-notes.md`) — the homes-for-rent
   template below only needs `rentalData`, but the per-city data file should
   store `saleData` too since both come from the same call at no extra cost.
## Per-city data file — fields

One data file per city (e.g. `src/data/homes-for-rent/avon.json` or a CMS
document in Sanity — either fits the "template + data file" pattern in
`CLAUDE.md`'s stack section). Fields marked **[team]** need Red Door's own
confirmation, not research or an API pull — never fill these from a generic
assumption; leave them out of the built page until confirmed, the same way
the Avon page left "leasing season" as an open note rather than guessing.

```
citySlug            string   "avon" — used in the URL and to derive
                              /[citySlug]-property-management for the
                              cross-sell link
cityName             string   "Avon" — display name
regionLabel          string   kicker text, e.g. "Hendricks County · West Metro"
county               string   "Hendricks County"
metaTitle            string   ≤60 chars, pattern:
                              "{City}, IN Homes for Rent | Red Door Property Management"
metaDescription      string   ~135–155 chars

heroDek              string   1–2 sentence intro paragraph under the H1
snapshotStats        array    exactly 4 {value, label} pairs for the hero
                              strip — distance, population, a founding/
                              incorporation fact, and main corridor for most
                              cities; townships should swap "incorporated as
                              a town" for "organized as a township" (see
                              red-door-city-facts-research.md — this isn't
                              cosmetic, townships were never incorporated)

localSnapshotProse   string   the full narrative paragraph(s) — start from
                              the draft in red-door-city-facts-research.md,
                              but any housing-age/housing-character
                              inference (Avon's "reads as newer
                              subdivisions...") is [team] — don't carry a
                              research-agent's flagged suggestion into copy
                              without that confirmation
sourceNote           string   citation for population/growth figures
                              (Census Bureau, Data USA, Wikipedia, etc.)

geo                  object   { lat, lon } — city/township center, decimal
                              degrees. See "Locator map" below — don't
                              hand-place SVG coordinates per city.
neighbors            array    [{ name, lat, lon, tier }], tier =
                              "primary" (bordering cities named in the
                              prose) | "secondary" (broader metro context
                              dots). Sourced from red-door-city-facts-
                              research.md; a few borders there are flagged
                              "not confirmed" — don't render those as solid
                              lines/claims on the map, or resolve them first.

market               object   RentCast /markets pull — see fields below.
                              Null/absent fields render as the Avon page's
                              "pending" placeholder state (dashed bar,
                              blank trend point), never a fabricated number.
                              Holds both `rentalData` (this page's primary
                              content) and `saleData` (stored here too,
                              since one `dataType=All` call returns both at
                              no extra cost — `saleData` is what the
                              corresponding `-property-management` page's
                              sales/investment section reads; this page
                              itself only renders the rentalData fields).
locationFacts        array    [{ label, value }] for the "What to Expect"
                              fact list — location/borders, sourced from
                              red-door-city-facts-research.md
housingStockNote     string   [team] — subdivision vs. standalone, age,
                              yard/garage norms. Omit the field (not a
                              placeholder string) until provided.
leasingSeasonNote    string   [team] — omit until provided, same as above

nearbyFallbackCities  array   ordered list of citySlugs to pull listings
                              from when this city's own inventory is thin —
                              e.g. avon → ["indianapolis", "brownsburg",
                              "plainfield"]. This drives the "homes
                              available nearby" section; RentEngine
                              listings themselves are NOT stored in this
                              file, they're queried live from /units
                              filtered by city.
```

### `market` object (RentCast `/v1/markets`) — verified against Avon's raw response, Sep 11

**The real response is nested, not flat.** Top level is
`{ id, zipCode, rentalData: {...}, saleData: {...} }` (pulled with
`dataType=All`). `rentalData` and `saleData` are siblings with the same
internal shape — aggregate figures, `dataByPropertyType`, `dataByBedrooms`,
`history` — one nested inside each. The per-city data file should store the
fields below already flattened/extracted at pull time — don't make the
template reach into the raw shape.

**Field-name corrections from the earlier (guessed) version of this doc:**
`rentMin`/`rentMax` → **`minRent`/`maxRent`**; single `pricePerSqft` → **four
separate fields** (`averageRentPerSquareFoot`, `medianRentPerSquareFoot`,
`minRentPerSquareFoot`, `maxRentPerSquareFoot`); `avgSquareFootage` +
`sqftMin`/`sqftMax` → **`averageSquareFootage`/`medianSquareFootage`/
`minSquareFootage`/`maxSquareFootage`**; `averageDaysToLease`/
`medianDaysToLease` → **`averageDaysOnMarket`/`medianDaysOnMarket`** (also
add `minDaysOnMarket`/`maxDaysOnMarket`, both present in the real response);
`listingCount` → **`totalListings`**; and there's a field this doc didn't
have at all — **`newListings`** — which matters as much as the rent figures,
see the small-sample guard below.

```
zipUsed                       string or array — post multi-ZIP-rule
                               resolution; for multi-ZIP areas this is the
                               full ZIP list averaged, per
                               red-door-rentcast-zip-mapping.md
dataAsOf                      date    pull date, for staleness/refresh
                               tracking

// top-level rentalData aggregate (all property types, all bedroom counts)
averageRent                   number
medianRent                    number
minRent / maxRent             number
averageRentPerSquareFoot      number
medianRentPerSquareFoot       number
minRentPerSquareFoot / maxRentPerSquareFoot   number
averageSquareFootage          number
medianSquareFootage           number
minSquareFootage / maxSquareFootage           number
averageDaysOnMarket           number
medianDaysOnMarket            number
minDaysOnMarket / maxDaysOnMarket             number
newListings                   number  new listings in the current pull
                               window — the sample-size figure
totalListings                 number  total active listings in the snapshot

singleFamilyAvgRent           number  pulled from dataByPropertyType where
                               propertyType === "Single Family"
singleFamilyShare             string  e.g. "79 of 89" — derived as
                               singleFamily totalListings over the
                               top-level totalListings; keep as the real
                               fraction, not a rounded percent, so the page
                               can say "9 in 10" the way Avon's does

dataByPropertyType            array   as returned by RentCast — each entry
                               { propertyType, averageRent, medianRent,
                               minRent, maxRent, ...same full stat set as
                               above..., newListings, totalListings } for
                               Apartment / Condo / Single Family /
                               Townhouse. Store as-is; the page currently
                               only surfaces the Single Family entry, but
                               keep the rest for later use.

bedroomLadder                 array   [{ beds, avgRent, newListings,
                               totalListings }] — derived from RentCast's
                               dataByBedrooms array (keyed 1–5). Only
                               include entries RentCast actually returned;
                               the template renders a dashed placeholder
                               bar for any missing bed count instead of
                               interpolating one. Never fill a gap with a
                               guessed number. Carry newListings/
                               totalListings through — Avon's 1BR/2BR rungs
                               rest on only 4 listings each, which is worth
                               a visible caveat, not silent equal-weight
                               treatment with the 48-listing 3BR rung.

monthlyTrend                  array   [{ month, averageRent, medianRent,
                               newListings, totalListings }] for the
                               trailing 6 months, derived from RentCast's
                               history object (keyed "YYYY-MM", each value
                               the same full shape as the top-level
                               rentalData, including its own nested
                               dataByPropertyType/dataByBedrooms — this
                               schema only needs the top-level aggregate
                               per month). newListings matters as much as
                               the rent figures — see the small-sample
                               guard below.
```

**Small-sample guard, confirmed necessary by the Avon build:** Avon's
May/June/July 1-day median-days-on-market figures looked like they might be
a small-sample artifact until checked against `newListings` for those
months (41, 47, 44 — well-sampled, not a fluke). Any month or bedroom rung
with a low `newListings` count should be flagged visually (Avon shows the
`n=` count under each point) rather than plotted at equal visual weight to
a well-sampled point. Exact threshold TBD — flag for Claude Code to
propose, not silently pick one.

### `saleData` object — same nested shape as `rentalData`, verified against Avon's real `dataType=All` pull

Field names mirror `rentalData` exactly, with "Rent" swapped for "Sale
Price" — RentCast uses the same schema shape for both. This is what the
`-property-management` pages' sales/investment section reads; the
`-homes-for-rent` template doesn't render these fields.

```
// top-level saleData aggregate (all property types, all bedroom counts)
averageSalePrice              number
medianSalePrice                number
minSalePrice / maxSalePrice   number
averagePricePerSquareFoot     number
medianPricePerSquareFoot      number
minPricePerSquareFoot / maxPricePerSquareFoot   number
averageSquareFootage          number
medianSquareFootage           number
minSquareFootage / maxSquareFootage             number
averageDaysOnMarket           number  Avon: 49.1, vs. 32 for rentals —
                               for-sale inventory sits noticeably longer;
                               this contrast is itself usable owner-facing
                               content (sell-vs-rent framing)
medianDaysOnMarket            number
minDaysOnMarket / maxDaysOnMarket             number
newListings                   number  new sale listings in the pull window
totalListings                 number  total active sale listings — Avon:
                               312, vs. 89 rental listings in the same ZIP

dataByPropertyType            array   same shape as rentalData's version —
                               see the "Land" and non-fixed-enum guards
                               below, both found on the sale side
dataByBedrooms                array   RentCast's raw per-bedroom breakdown
                               (1–5) — same shape as rentalData's
                               dataByBedrooms before it's turned into
                               bedroomLadder; a per-city file only needs a
                               sale-side bedroomLadder if a future page
                               design calls for one, not built yet
history                       object  keyed "YYYY-MM", same full nested
                               shape as top-level saleData — mirrors
                               rentalData's history
```

**Two parsing guards, found on the sale side of the real Avon pull —
apply to both `rentalData` and `saleData`:**

- **"Land" returns `null` for every `*PricePerSquareFoot` field** in
  `dataByPropertyType` (no structure on a bare lot to divide price by).
  The parsing script must skip/guard this rather than choke on it or
  silently coerce it to zero.
- **`dataByPropertyType` is not a fixed enum.** Its composition varies
  month to month based on what actually transacted — Avon's April
  `history` entry included a one-off "Manufactured" type that doesn't
  appear in other months. Don't hardcode an expected property-type list
  anywhere this gets parsed.
## Locator map — build once, don't hand-place

The Avon reference page hand-placed SVG dot coordinates for its locator
map, which doesn't scale to 20 cities. Recommended approach: store real
`lat`/`lon` for each city and its neighbors (already gathered in
`red-door-city-facts-research.md`), and have the template compute schematic
x/y positions with a shared projection function (a simple equirectangular
projection centered/scaled per city is enough — this doesn't need to be a
real map, just consistent). One function, reused by all 20 pages, driven
entirely by the `geo` and `neighbors` data above — not 20 bespoke diagrams.

## What's shared, not per-city

These come from the Avon reference page unchanged — don't duplicate them
into every data file:
- "How Renting with Red Door Works" section (browse/apply, screening
  criteria, self-guided showings) — pulled from the real, live
  `min_resident_qualifications` text
- Header/nav, footer, brand tokens, typography
- The bedroom-bar-chart and trend-chart *components* (only the data they
  render is per-city)
## Reference implementation

The Avon Homes for Rent artifact is the built, approved reference for
markup, styling, and content tone. Treat it as the template to extract this
schema's fields from — not a one-off page to be rewritten from scratch per
city.
