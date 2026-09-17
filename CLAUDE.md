# CLAUDE.md — Red Door Property Management
 
Standing context for this project. Read before making changes.
 
This file works as a plain file in a plain folder — it does not require git.
 
## What this project is
 
Rebuilding reddoorrents.com, a residential property management company serving
the Indianapolis metro. Migrating **387 pages** off a PMW template site onto a
self-hosted static site.
 
Confirmed by full crawl (September 2026), not estimated:
 
| Type | Count |
|---|---|
| blog | 309 |
| city | 40 |
| pillar (catch-all for non-city content pages) | 24 |
| other | 14 |
 
The blog is far larger than anyone assumed — 309 posts from December 2020 to
August 2026, averaging 1,610 words, currently publishing 12–13 per month. No
post is under 400 words. It is the largest asset in the migration and the CMS
import must be scripted.
 
The company is family-run, over 50 years old, and manages single-family rentals
for owners and investors. The audience is property **owners**, not tenants —
tenants use the portals, owners are who the marketing speaks to.
 
## Hard rules
 
1. **Never rewrite content during structural migration.** Move it as-is, launch,
   improve later. If content and structure change at the same time, a traffic
   drop is impossible to diagnose.
2. **Preserve every existing URL.** Any URL that must change gets a 301. City
   pages are earning local search traffic; a broken slug is lost ranking.
3. **Fair Housing compliance is not optional.** See the section below. This has
   been violated three times already in generated copy.
4. **No thin templated pages.** The original 40-page `-homes-for-rent` /
   `-property-management` set was exactly this problem — pages that differ
   only by city name are Google's doorway-page pattern and the single biggest
   SEO liability on this site. **The city-page structure was revised Sep 11,
   then corrected same day** (full reasoning and task list in
   `red-door-website-todo.md`, "City content pages — three-page model" —
   read the correction note at the top of that section, not just the
   original list below it): all 20 `-homes-for-rent` pages are kept, each a
   real page with its own listings and a "homes available nearby" fallback,
   built from a locked template (the Avon homes-for-rent page) plus a
   per-city data file; `/[city]-property-management` for every serviced
   city, strengthened with genuinely distinct content, not just kept as-is;
   `/[city]-market-reports` only for cities with active recurring report
   coverage, so that page type never goes thin or stale. Whatever template is
   used to generate any of these, the content per market must still be
   genuinely different — that's the whole point, and it's exactly why the
   homes-for-rent pages aren't a find-and-replace job: each one needs its own
   real market data (RentCast) and team-confirmed local facts, not just a new
   city name dropped into the same paragraph.
## Stack
 
- **Astro** + Tailwind CSS, static output
- **Sanity** for the CMS — the person publishing blog posts is non-technical and
  needs a hosted studio with email login, no GitHub, no terminal
- **Cloudflare Pages** for hosting, on the **Workers Paid plan ($5/month)** —
  raises builds from 500/month to 5,000/month and covers Workers, Pages
  Functions, Workers KV, Hyperdrive and Durable Objects under the same
  minimum. Decided (not just "Free plan, TBD") because per-listing-webhook
  rebuilds plus 13 monthly blog publishes made 500 builds/month too tight;
  see the RentEngine rebuild-strategy note below — direct webhook, no
  debounce logic needed at this budget. Cloudflare Free plan for DNS. Form
  handling via a Worker (now billed under Workers Paid) with Turnstile for
  spam protection. Cloudflare Pages does not bundle form handling the way
  Netlify does, so the rental analysis form needs a Worker endpoint — this is
  not optional, the form currently discards submissions.
- Redirects go in a `_redirects` file at the site root.
- Content in Markdown; city pages generated from a single template plus a data file

## Locked structural decisions (site-wide, not city-page-specific)

- **Listing URL structure: `/homes-for-rent/{city}/{address}`** for individual
  RentEngine unit detail pages (distinct from the city hub pages at
  `/[city]-homes-for-rent` described below — both exist, one per unit and one
  per city). Address slug: lowercase, hyphens for spaces, unit numbers
  included, no punctuation — e.g.
  `/homes-for-rent/carmel/1234-main-st-unit-2`.
- **Owner Roadmap step order: Maintenance = 5, Communication = 6.** Matches
  the live site.
- **Airbnb URLs (`/airbnb-management`, `/airbnb-management-indianapolis`):
  301 to `/`.** Both retired; confirmed no distinct Airbnb/short-term-rental
  service page exists on the new site, so no more specific redirect target
  applies.
- ✅ **`/application-criteria` built (Sep 17).** Standalone page
  (`application-criteria.html`), fair-housing-researched; criminal history
  clause still needs attorney sign-off before launch. See
  `red-door-website-todo.md` for full detail. The Tenants nav dropdown links
  to it directly; the separate "Application" link (to the live apply flow)
  was removed from the nav entirely rather than pointed at an unconfirmed
  URL.
## Brand tokens
 
Anchored to the logo red, sampled from the source file as `#8b0e04`.
 
| Token | Value | Role |
|---|---|---|
| `--brand` | `#8b0e04` | Logo, primary buttons, accents on white. 9.71:1 on white. |
| `--brand-mid` | `#bc1719` | Button hover, icon fills, underlines, kicker text. |
| `--brand-light` | `#e2565a` | Links and accents on dark backgrounds. 4.67:1 on `#1b1b1e`. |
| `--brand-tint` | `#fcecea` | Section washes, badge backgrounds, row highlights. |
| `--gray` | `#717073` | Brand gray, sampled from the logo. Base for muted text. |
| `--ink` | `#171717` | Body text. |
| `--charcoal` | `#252525` | Dark section backgrounds. |
| `--line` | `#e4e3e6` | Borders and dividers. |
| `--soft` | `#f5f5f6` | Alternating section backgrounds. |
 
**Neither `#8b0e04` nor `#bc1719` is legible on dark backgrounds.** They sit at
1.77:1 and 2.68:1 on charcoal. Always use `--brand-light` there. This is the
easiest mistake to make on this site because it has several dark bands.
 
Radius `8px`. Max content width `1220px`.
 
## Typography
 
- **Headings:** Literata. `h1` at weight 500 with letter-spacing `-.02em`,
  `h2`/`h3`/`h4` at 600 with `-.015em`. The tighter tracking on `h1` matters —
  Literata is wide and sturdy, and large headings run long without it.
- **Body and all UI:** Inter. Buttons, nav, form fields, labels, kickers.
- **Literata never touches body copy or interface elements.** It is a display
  face here. Left unchecked it creeps into `h4` and small UI text.
- Literata has an optical-size axis (7–72) that the browser applies
  automatically based on font size. This is fine and needs no pinning. Unlike
  Fraunces there is no `WONK` axis, so nothing eccentric surfaces at large sizes.
- Self-host both as woff2 with `@font-face`. Do not ship a Google Fonts CDN link
  to production — slower, third-party request, GDPR exposure.
- Two weights per family maximum.
**History:** Fraunces was chosen first and rejected. Its `f` and `g` read as
odd, driven by the `WONK` axis and auto-applied optical sizing at display
scale. Literata was picked as a warmer, sturdier serif with conventional
letterforms. Do not reintroduce Fraunces.
 
## Logo assets
 
| File | Use |
|---|---|
| `red-door-logo-horizontal.svg` | Header on light backgrounds |
| `red-door-logo-reversed.svg` | Header over the dark hero, and the footer |
| `red-door-logo-full.svg` | Full lockup with frame — documents, print |
| `red-door-favicon-tile.svg` | Favicon. Red tile, door knocked out in white. |
| `red-door-favicon.svg` | Bare transparent mark. Avoid at small sizes. |
 
The header inverts on scroll (transparent over the hero, white once scrolled),
so both header logos ship and swap via CSS.
 
**Use the tile favicon, not the bare mark.** The door mark is 161:330, so in a
square icon it becomes an illegible sliver at 16px.
 
**These are the ORIGINAL vector files**, recovered from the designer in
September 2026 (Adobe Illustrator export, `RDPM_logo.svg` / `.eps`). They
supersede the earlier traced redraw entirely — 5.5KB vs 69KB, and cleaner. The
brand colours above come from this file, not from sampling a raster.
 
The reversed variant uses an SVG `mask` so the keyhole punches through to
whatever background sits behind it, rather than being filled with one hardcoded
dark value.
 
**The typefaces are unrecoverable.** `%%DocumentFonts:` in the EPS is empty —
text was converted to outlines before export. The designer is April Eichenberg
(re-exported 9/8/26) if the font names are ever needed.
 
## Fair Housing — read this before writing any marketing copy
 
Red Door markets housing, so the Fair Housing Act applies to all site copy.
 
**Safe:** rent, sale prices, days on market, inventory, property type, property
age, HOA rules, commute patterns, seasonality, maintenance considerations.
 
**Never write:** anything describing a market, neighborhood, or property by the
people who live there. Familial status, race, religion, national origin,
disability, and sex are protected classes.
 
Specific patterns that have already appeared in generated copy and must not
recur:
 
- ❌ "family-oriented demand" / "steady demand from families" → ✅ "steady demand
  from commuters and long-term renters"
- ❌ "family-oriented presentation" → ✅ "move-in presentation"
- ❌ "School-calendar timing" → ✅ "summer leasing season"
- ❌ School ratings, crime statistics, demographic breakdowns of any kind
- ❌ **"reputation for being socially, economically, and ethnically diverse"**
  (found live on `/broad-ripple-property-management`, Sep 10 — describing a
  neighborhood by the demographic makeup of its residents, missed by the
  original audit because it read as area-history trivia rather than
  marketing copy) → ✅ describe what's actually there instead — cultural
  district status, restaurants, galleries, nearby Butler University, the
  Monon Trail
"Single-family home" is a property type and is fine. Avoid the word "school"
entirely — the legitimate point is always about leasing seasonality, which can
be said without it.
 
Quoted customer testimonials in the customer's own words are a different
category and do not need sanitizing.
 
## Content structure and known inventory problems
 
Full analysis in `red-door-inventory-analysis.md`. Per-URL actions in
`red-door-migration-plan.csv`. Raw crawl in `archive/` — **never edit `archive/`,
it is the frozen record of what the old site contained.**
 
- **8 true pillar pages** — Indianapolis property management, market readiness,
  marketing process, tenant screening, leasing process, maintenance,
  communication, pricing. Recently rewritten and the quality benchmark for the
  rest of the site. Note `page_type=pillar` in the CSV is a catch-all of 24
  non-city content pages, not these 8.
- **20 `-property-management` city pages — now the highest-priority page type
  on the site** (Sep 11 decision, see `red-door-website-todo.md`). Described
  elsewhere as "1,489–1,847 words with genuine variation," but a Sep 10
  content audit (fetched live, not just word-counted) found that's
  overstated: most of that length is identical service-description
  boilerplate copied city to city, and the only genuinely unique content is a
  short, inconsistent Wikipedia-sourced area-history blurb. These need real
  strengthening, not just a template port — see the todo for the full
  finding and the per-city research gaps it left open. **Avon pilot built
  (Sep 11), including a resolved thin-content fix:** the pilot's first
  review flagged that the page would read too similar across all 20 cities.
  Rather than moving the homes-for-rent page's full rent-trend charts over
  here (rejected — it would re-thin homes-for-rent and blur the
  property-management/market-reports search-intent split below), each page
  now gets a condensed **rental & sales market snapshot** section: 3
  headline rental stats + link to that city's homes-for-rent page, next to
  3 headline sale stats (avg/median sale price, days on market) framed as
  owner sell-vs-rent context. The sale-side data is not an added RentCast
  cost — see the RentCast note below. See
  `claude/avon-property-management-pilot-notes.md` for the full pilot
  writeup.
- **20 `-homes-for-rent` city pages — DECIDED (Sep 11, final): all 20 are
  kept and rebuilt.** (A same-day detour briefly cut this to
  `/indianapolis-homes-for-rent` only; that's superseded — see the
  correction note at the top of "City content pages — three-page model" in
  `red-door-website-todo.md`.) Each city page is real and server-rendered,
  defaults to that city's own listings, and falls back to a "homes available
  nearby" grid when its own inventory is thin — the common case, since
  inventory skews heavily toward Indianapolis. Locked template: the Avon
  homes-for-rent page, approved Sep 11. Individual RentEngine listings are
  *still* tagged by city so they can independently rank for "[city] homes
  for rent" searches too — that's additive to the hub pages, not a
  replacement for them. **All pre-build decisions resolved (Sep 11), nothing
  blocking the other 19 pages from being scripted:** the multi-ZIP
  aggregation rule (average across each area's full ZIP list — see
  `red-door-rentcast-zip-mapping.md`; 50 distinct ZIPs total, on the
  **approved RentCast Foundation plan, $74/mo**; the Indianapolis page pulls
  the 37 standard-delivery ZIPs, not all 56; ZIP 46183 confirmed PO-Box-only
  and excluded everywhere, including from Decatur Township's list); the raw
  RentCast JSON field names (verified against Avon's real pull — see
  `red-door-homes-for-rent-data-schema.md`); and the monthly refresh
  mechanism (a Cloudflare Worker on its own Cron Trigger pulls RentCast and
  writes to KV/D1, and the Astro build reads that store rather than calling
  RentCast itself — decouples the pull from rebuild timing). See the Avon
  page's own review notes and the todo file for detail. **Pull with
  `dataType=All`, not `dataType=Rental`** — one call returns both
  `rentalData` and `saleData` at no extra cost, confirmed against the real
  Avon pull. `saleData` isn't used on this page, but is stored in the same
  per-city data file and feeds the `-property-management` pages' sales
  snapshot (see above and `red-door-homes-for-rent-data-schema.md`).
- **`-market-reports` pages — new page type, not built yet.** One per city
  with active recurring market-report production, and only those cities — see
  the todo for the open item on getting that city list.
- **Blog** — monthly market reports plus guidance posts.
### Confirmed defects to fix, not replicate
 
**Decision: no changes will be made to the live PMW site. All fixes are
forward-only, applied during migration.**
 
`content-fixes.csv` holds 173 verified title and meta replacements, validated
across two passes. **This file is a required build input.** `pillar-page-seo-fixes.csv`
holds 7 more (title/meta rewrites for pillar pages that were either over the
60-character limit or, for `/tenants` and `/contact` specifically, rewritten
for click-through rather than length — both were ranking top-5 with near-zero
CTR). **Any import that reads from `archive/` must join BOTH files on `url`**
and use `new_title` / `new_meta` where a row exists in either. Skip this and
those fixes are lost silently.
 
Covered by that file:
 
- **58 blog posts had duplicate titles.** 41 shared one identical
  keyword-stuffed string. All rewritten, all unique across the full 387.
- **All 40 city pages were missing meta descriptions.** All written.
- **116 pages missing meta descriptions** overall. Addressed.
- One Fair Housing violation ("strong schools") found and removed. **Not the
  only one** — see the "ethnically diverse" finding under Fair Housing above,
  found Sep 10 directly on the live site, after this audit was already
  considered complete.
- 25 metas remain at 162–199 characters. Accepted as-is — they are complete
  sentences that read fine when truncated. Do not spend time on these.
Still to handle during migration:
 
- **`/owners` and `/indianapolis-property-management` are byte-identical**
  (same title, H1, 2,936 words, 8 images). Keep the latter, 301 the former.
- **`/index` duplicates the homepage.** 301 to `/`.
- **20 `-homes-for-rent` city pages — see Content structure above.** Decided
  Sep 11 (final): all 20 are kept and rebuilt from the locked Avon template.
- **143 blog titles exceed 60 characters** (longest 148) and 17 use clickbait
  phrasing ("EXPLODES!", "MUST-HAVE"). Not urgent — long titles are truncated,
  not penalised — but they clash with the writing style below. Fold into
  migration rewrites.
- **3 blog posts have no `<title>`**, two substantial (2,949 and 2,438 words).
  `/advanced-marketing-platform` has neither title nor H1.
- **Do not migrate:** `/google39077c6dc4a063eb.html`, `/landing`, `/test`,
  `/carousel-test`, `/signatures`, `/signatures/signatures`. Serve 410, not 404.
- **`/success`, `/amp-success`, `/thank-you`, `/LP-success`** are form
  confirmations. Migrate with `noindex`.
## Third-party integrations
 
All external links or embeds — none are locked to the current platform.
 
- **RentEngine** — listings. **Use the public API (`/units`), not the iframe
  widget.** Iframed content isn't indexed as pages on our domain, and listing
  detail pages earn real organic traffic. Generate a static page per listing at
  build time; use a webhook on the `units` table to trigger rebuilds.
  **Wire the webhook directly to a rebuild on every INSERT/UPDATE/DELETE — no
  debounce, no queue, no Durable Object, no Cron batching.** Decided against
  batching because Workers Paid's 5,000 builds/month gives enough headroom at
  our portfolio size (22 available + 8 on-hold units currently, per the live
  `/units` pull) plus 13 monthly blog publishes. Revisit only if monthly build
  count trends toward that ceiling.
  Docs: docs.rentengine.io. Use a **read-only token**, split by feature — the
  listings-build key and the rental-analysis-tool key are deliberately
  separate credentials, not shared.
  **Never call `GET /market-tool/comps` from the listings build — it costs
  $0.50 per call.** That endpoint is the rental-analysis tool's, not this
  feature's. The old `/_system/listings/` URLs were PMW's and cannot be
  preserved.
  **Every listing detail page's title, meta, H1, and schema must include the
  city plainly** (Sep 11) — individual listings are supposed to rank for
  "[city] homes for rent" searches *in addition to* their city's own
  homes-for-rent hub page (all 20 are kept, see Content structure above), so
  the city can't just live in the URL path either way.
- **AppFolio** — owner and tenant portals
- **PropertyMeld** — maintenance requests
- **Findigs** — rental applications
- **Google Tag Manager** — reuse the same container ID so historical data stays continuous
## Known issues
 
Still open:
 
- **Rental analysis tool — fully scoped, not yet built (Sep 13).** The form
  previously had no `action` and silently discarded submissions; that's now
  superseded by a full custom build on RentEngine's comps API, not a simple
  form-wiring fix. All ten build decisions (comp-selection logic, fallback
  rule, estimate math, accuracy validation, report/email design, lead
  capture + business-development alerting, API credentials, hosting/
  implementation scope, confidence score, bedroom-count adjustment) are
  final, including the external inputs that were still open as of Sep 11
  (Resend as the email vendor, the `mail.reddoorrents.com` sending subdomain
  and its DNS records, the Calendly link, sender identity, and the Zapier
  webhook). Nothing external is left blocking it. Full detail and current
  status: `claude/rental-analysis-tool-build.md`.
- The homepage has no JSON-LD at all. `LocalBusiness` schema matters far more
  here than `FAQPage` — Google deprecated FAQ rich results in May 2026, so FAQ
  markup no longer produces any Google result. It's still parsed by Bing and
  various AI crawlers, so it's harmless to include, just not a priority.
Already fixed in the current homepage base:
 
- Hero converted to WebP (2.3MB → 205KB) and wired into the CSS.
- `og:image` now uses an absolute URL. `red-door-og-image.png` must be deployed
  to the domain root or link previews break.
## Writing style for site copy
 
Plain and direct. The audience is owners deciding whether to hand over a
significant asset, so competence reads better than enthusiasm. Avoid marketing
inflation ("seamless", "cutting-edge", "we're passionate about"). Concrete
specifics beat adjectives — "21 days to lease" beats "fast leasing".
 
**Property-management and market-reports pages for the same city must target
different search intent, so they don't compete against each other** (Sep 11).
Property-management pages write to transactional/"hire us" intent —
"Fishers property management," "property manager in Fishers." Market-reports
pages write to informational/data intent — "Fishers rental market,"
"Fishers rent prices," "Fishers rent trends." If a sentence would work equally
well on either page, it's probably not specific enough to either one.
 