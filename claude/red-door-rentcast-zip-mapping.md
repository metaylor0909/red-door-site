# RentCast ZIP mapping — city & township pages

Decided 2026-09-11. Feeds the RentCast `/v1/markets` pull for the ~40 city
pages (20 areas × `-property-management` + `-homes-for-rent`). Not yet run —
this file is the agreed input for when the pull is scripted.

## How this will be pulled

- RentCast's `/v1/markets` endpoint takes exactly one `zipCode` per call, no
  batch/multi-zip option. Every successful call to any RentCast endpoint
  counts as one request against the plan (confirmed via their docs).
- **Fetch each distinct ZIP once and cache the response; reuse it for every
  page that shares that ZIP.** Many ZIPs below appear in more than one
  township list — don't re-fetch the same ZIP per page.
- Total distinct ZIPs across everything below: **50** (38 from the township
  union, 11 suburb-only additions, +1 new for the Indianapolis county-wide
  average — see below; 46183 excluded per the resolved decision below). A
  monthly refresh at that volume needs the **Foundation plan ($74/mo, 1,000
  requests)** — the free Developer tier (50 req/mo) has zero headroom.
- **Pull with `dataType=All`, not `dataType=Rental`.** One call then returns
  both `rentalData` and `saleData` as separate top-level fields — sale data
  is not a separate call or added cost, confirmed against a real Avon
  (46123) pull. `saleData` has the same nested shape as `rentalData`
  (current snapshot + `dataByPropertyType` + `dataByBedrooms` + `history`).
  Avon: 312 total sale listings vs. 89 rental in that ZIP, avg sale price
  $410,388 / median $389,585, avg days on market 49.1 (vs. 32 for rentals —
  for-sale inventory sits noticeably longer). Sale price and days-on-market
  data is directly usable owner-facing content (sell-vs-rent framing) and is
  Fair-Housing-safe by the same logic as the rental fields. **This is what's
  feeding the sales-data addition to the property-management pages** (Sep
  11 decision — see `red-door-website-todo.md` and
  `claude/avon-property-management-pilot-notes.md`).
- **Handle `null` per-sqft fields in `dataByPropertyType`.** The "Land"
  property type returns `null` for every `*PricePerSquareFoot` field (no
  structure to divide by) — the processing script needs to skip/guard that
  rather than choke on it or silently coerce it to zero.
- **`dataByPropertyType` is not a fixed enum.** It varies month to month
  based on what actually transacted — Avon's April history included a
  one-off "Manufactured" entry that doesn't appear in later months. Don't
  hardcode an expected list of property types when parsing `history`.

## Standalone suburbs / neighborhoods — one ZIP set each

| City page | ZIP(s) |
|---|---|
| Avon | 46123 |
| Brownsburg | 46112 |
| Carmel | 46032, 46033 |
| Fishers | 46037, 46038 |
| Greenwood | 46142, 46143 |
| Noblesville | 46060, 46062 |
| Westfield | 46074 |
| Zionsville | 46077 |
| Broad Ripple | 46220 |
| Downtown Indianapolis | 46202, 46204, 46225 |

## Marion County townships — full ZIP list per township, averaged

Decision: use each township's **complete** distinct ZIP list and average
across it, rather than one representative ZIP. Rationale: no two townships
have an identical ZIP set, so this still produces a distinct number per page
even though the underlying ZIPs overlap heavily — a single representative
ZIP per township risked two neighboring townships (e.g. Center/Franklin,
which share 46203 and 46237) showing byte-identical numbers, which is the
same doorway-page pattern flagged for the `-homes-for-rent` pages in
`CLAUDE.md`.

| Township | ZIPs to pull & average |
|---|---|
| Center | 46107, 46201, 46202, 46203, 46204, 46205, 46208, 46217, 46218, 46219, 46221, 46222, 46225, 46237 |
| Decatur | 46113, 46217, 46221, 46231, 46241 (46183 excluded — PO-Box-only, see below) |
| Franklin | 46107, 46203, 46237, 46239, 46259 |
| Lawrence | 46216, 46218, 46220, 46226, 46235, 46236, 46250, 46256 |
| Perry | 46107, 46203, 46217, 46225, 46227, 46237 |
| Pike | 46077, 46228, 46234, 46254, 46260, 46268, 46278 |
| Warren | 46203, 46218, 46219, 46226, 46229, 46235, 46239 |
| Washington | 46205, 46208, 46218, 46220, 46226, 46228, 46240, 46250, 46260, 46268 |
| Wayne | 46214, 46221, 46222, 46224, 46231, 46234, 46241, 46254 |

## Indianapolis umbrella page — countywide average

Decision: average across Marion County's ZIPs into one figure for the
Indianapolis page, rather than a curated sample or skipping zip-level data.

Of the county's 56 ZIP codes, 19 are PO-Box-only or single-entity codes
(no residential delivery, so no rental market) — those will return
empty/null from RentCast. The working set is the **37 standard-delivery
ZIPs**:

```
46107, 46201, 46202, 46203, 46204, 46205, 46208, 46214, 46216, 46217,
46218, 46219, 46220, 46221, 46222, 46224, 46225, 46226, 46227, 46228,
46229, 46231, 46234, 46235, 46236, 46237, 46239, 46240, 46241, 46250,
46254, 46256, 46259, 46260, 46268, 46278, 46282
```

36 of these 37 are already covered by the township pulls above; only
**46282** is a net-new call for this page specifically.

Excluded (PO-Box-only / single-entity, not real residential ZIPs):
`46183, 46206, 46207, 46209, 46213, 46230, 46242, 46244, 46247, 46249,
46251, 46253, 46255, 46262, 46277, 46280, 46283, 46285, 46288, 46298`

## Decisions — RESOLVED Sep 11

- **Indianapolis page pulls the 37 standard-delivery ZIPs, not all 56.**
  Confirmed by Michael. The excluded 19 PO-Box-only/single-entity codes are
  not pulled.
- **RentCast Foundation plan ($74/mo) approved.** Confirmed by Michael —
  the 50-distinct-ZIP monthly refresh needs it; the free tier doesn't have
  the headroom.
- **46183 conflict resolved: excluded everywhere.** Michael confirmed it's
  PO-Box-only and should not be pulled at all — removed from Decatur
  Township's list above (previously appeared there via a different source
  than the county exclusion list). Decatur Township now averages across its
  remaining 5 ZIPs. Total distinct ZIP count corrected from 51 to 50.

All ZIP-mapping decisions in this document are resolved. Nothing further
blocking the pull from being scripted.
