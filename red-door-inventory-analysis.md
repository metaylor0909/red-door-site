# Red Door — Inventory Analysis

387 pages. Findings from `inventory.csv`, ordered by how much they matter.

Companion file: `red-door-migration-plan.csv` — every URL with an action,
priority, and its specific issues.

---

## 1. Duplicate page titles across 58 blog posts

The largest single problem, and the cheapest to fix.

| Shared title (truncated) | Pages |
|---|---|
| "Market Report, Avon, Anderson, Brownsburg, Fishers, Greenwood, Indianapolis, Leb…" | **41** |
| "landlord tips and tricks, Avon, Anderson, Brownsburg, Fishers, Greenwood, Indian…" | 7 |
| "Indianapolis Real Estate Market Property Management Real Estate Investing Rental" | 5 |
| "Red Door Property Management" | 3 |
| "Indianapolis Rental Market \| May 2025 Housing Update \| Investment Property Trend" | 2 |

Forty-one posts sharing one title is not a near-duplicate problem, it is the
same string repeated. These are keyword-stuffed city lists, a tactic Google
stopped rewarding well over a decade ago and now routinely rewrites or ignores.

Every one of those 41 posts is competing with the other 40 for the same
snippet. The URLs and content are fine; only the `<title>` needs replacing.

**Action:** rewrite 58 titles. Keep every URL. This is the highest
return-per-hour work in the entire migration — roughly a day of writing against
content that already exists.

---

## 2. `/owners` and `/indianapolis-property-management` are the same page

Identical title, identical H1, 2,936 words each, 8 images each. Byte-for-byte
duplicates at two URLs.

One of them is a pillar page you rewrote and are proud of. The other is
splitting its authority.

**Action:** keep `/indianapolis-property-management`, 301 `/owners` to it.
Check Search Console first — if `/owners` holds the rankings, reverse it.

`/index` is also live and duplicating the homepage. 301 it to `/`.

---

## 3. The 20 `-homes-for-rent` pages are a doorway-page pattern

| Word count | Pages |
|---|---|
| exactly 459 | 9 |
| exactly 465 | 11 |

Identical word counts to the digit means one template with the city name
swapped. All 20 are missing meta descriptions. This is the pattern Google's
doorway policy names directly, and it's the highest-risk content on the site.

Three options:

1. **Consolidate** into one `/homes-for-rent` page with city filtering. The
   listings come from a RentEngine iframe anyway, so the per-city pages add
   little the embed doesn't already do.
2. **Rewrite** each with genuinely different content — local rental context,
   typical inventory, what to expect in that submarket.
3. **Keep and noindex**, retaining them for navigation without asking Google
   to rank 20 near-identical pages.

**Do not decide without Search Console data.** If these pages are earning
traffic, consolidating loses it. If they earn nothing, they're pure liability.
Marked `DECIDE` in the plan CSV.

Note the contrast: the 20 `-property-management` city pages run 1,489–1,847
words with genuine variation. Those are good pages. It's only the
homes-for-rent set that's templated.

---

## 4. 116 pages have no meta description

| Type | Missing | Total | % |
|---|---|---|---|
| city | 40 | 40 | **100%** |
| other | 13 | 14 | 93% |
| pillar | 14 | 24 | 58% |
| blog | 49 | 309 | 16% |

Every city page — the pages built to win local search — is letting Google
invent its own snippet.

**Action:** write descriptions during migration, city pages first. Draft with
Claude Code from existing page content, review before publishing.

---

## 5. Pages that should not migrate

Live and crawlable today:

- `/google39077c6dc4a063eb.html` (2 words — a verification file)
- `/landing` (39 words)
- `/test` (305 words)
- `/carousel-test` (308 words)
- `/signatures` and `/signatures/signatures` (313, 314 words)

**Action:** 410 Gone, not 404. 410 tells Google the removal is deliberate and
drops them from the index faster.

`/success`, `/amp-success`, `/thank-you` and `/LP-success` are form
confirmations — three share an identical title. Migrate them but add `noindex`.

---

## 6. Three blog posts have no `<title>` at all

- `/blog/noblesville-market-report-cash-flow-is-the-decoy-long-term-hold-is-the-prize` (2,949 words)
- `/blog/greenwood-market-updates-affordable-fast-and-hard-to-ignore` (2,438 words)
- `/blog/august-2024-market-report-indianapolis-real-estate-insights` (530 words)

Two are substantial posts publishing with no title tag. Also `/advanced-marketing-platform`
has neither title nor H1.

---

## The blog is a bigger asset than anyone accounted for

- **309 posts, December 2020 to August 2026**
- 2023: 67 · 2024: 95 · 2025: 60 · 2026: 63 and climbing
- Currently 12–13 posts per month, consistently, for five straight months
- Average 1,610 words; the top four posts run 10,500–11,380 words
- **No thin posts.** Not one blog post under 400 words.

This is a genuine content operation, not a neglected blog. Two consequences:

**The CMS import must be scripted.** Nobody is re-entering 309 posts by hand.
Check Sanity's asset storage limits against the 209 MB image archive before
committing to it.

**Publishing cannot pause during migration.** At 13 posts a month, a six-week
migration means ~20 posts land mid-move. Decide now whether the team keeps
publishing to PMW and you re-import, or you cut over the blog first.

---

## Suggested order

1. **Rewrite the 58 duplicate titles** — biggest win, lowest effort, and it can
   be done on the live site today, before any migration
2. **Pull Search Console data** for the 20 homes-for-rent pages and for
   `/owners` vs `/indianapolis-property-management` — both decisions depend on it
3. **Write 40 city page meta descriptions**
4. **Fix the 3 missing blog titles**
5. **Build the redirect map** from the plan CSV
6. Then migrate

Steps 1, 3 and 4 improve the current site whether or not the rebuild ships on
schedule. That's a good property for work to have.
