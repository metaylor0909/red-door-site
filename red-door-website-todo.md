# Red Door Property Management — Website Rebuild

Living to-do list. Last updated: September 17, 2026 — added Michael's
homepage mockup review (nav, header, reviews, areas-served) and the
market-reports page design. Prior merge (Sep 14) was from two diverged
branches (main chat + listings-build chat)
plus the city-pages chat's CLAUDE.md updates. Nothing was discarded;
detailed listings research moved to its own file so this one stays
scannable.

**Same-day update (Sep 17, later pass):** four of the homepage mockup-review
items below are now built and pushed to `index.html` — header/CTA sticky
behavior, button color, reviews auto-scroll, and the full Areas Served
rebuild. Two bugs were also found and fixed along the way (not previously
tracked as open items): see "Resolved this pass" for detail.

**Same-day update (Sep 17, later still):** the header nav now matches the
locked Sep 17 structure (Owner Portal added, utility-bar logins removed,
"Application" dropped from Tenants per Michael's decision — see "Header
navigation" below). Two brand-new standalone pages were also built:
`application-criteria.html` (fair-housing-researched; see that section
below) and all 9 confirmed `-market-reports` pages (see "Market-reports
page design" below) — `indianapolis-`, `fishers-`, `noblesville-`,
`westfield-`, `greenwood-`, `westside-`, `anderson-`, `lebanon-`, and
`greenfield-market-reports.html`. All of this is committed and pushed to
`main`.

**Same-day update (Sep 17, final pass):** all 20 `-homes-for-rent` pages
are now built, using real RentCast market data pulled that day — see
"Homes-for-rent pages — all 20 built" below for the full list and open
items. Committed locally (not yet pushed).

**Three standing documents govern this project:**

- **This file** — status and open items.
- **`CLAUDE.md`** — brand tokens, typography, stack, Fair Housing rules,
  content structure, locked structural decisions. Read by Claude Code
  automatically.
- **`claude/rental-analysis-tool-build.md`** — the CMA tool's full 10-decision
  build brief. Self-contained; don't re-litigate anything marked FINAL there.
- **`claude/listings-build-notes.md`** — the listings feature's full research
  and decision record (API schema, real data findings, city-page
  architecture, map provider, design iteration history). Self-contained;
  read before touching listings work.
- **`claude/blog-migration-notes.md`** — the blog migration's full record
  (where the real source content actually lives, source data-quality
  findings, the Sanity schema, real bugs found building the migration
  script, Astro/Vite tooling gotchas). Self-contained; read before touching
  the blog again — this is the first real Astro + Sanity work in the repo,
  everything else is still static HTML.

---

## Where things stand

387 pages total (309 blog, 40 city, 24 pillar/catch-all, 14 other), fully
archived locally and backed up to Google Drive. Content audit complete —
`content-fixes.csv` (173 fixes) and `pillar-page-seo-fixes.csv` (7 fixes,
reviewed and approved) hold every verified title/meta replacement. Homepage
base is built, including the Sep 17 header/nav/Areas Served rebuild. Logo
is the real vector, brand colors finalized. Hosting (Cloudflare Workers
Paid), CMS, the city three-page content model, the listings API
architecture, and the CMA tool are all decided. What's left is a handful
of small open sub-decisions (mostly listings-specific) plus the actual
build phases.

✅ **Homepage ported into real Astro (2026-09-21) — `src/pages/index.astro`,
live at the real deployment.** First of the static mockups below to
actually move off "standalone static HTML" and into the real site.
Header/footer/nav/reveal-scroll were already componentized from earlier
work and reused as-is. One real content change from the mockup: its
`#rental-analysis` section was a placeholder form that predated the real
rental-analysis tool already built at `/rental-analysis` — replaced with
a condensed pitch + CTA to the real page (every same-page
`#rental-analysis` anchor sitewide now points there instead). Also fills
the "homepage has no JSON-LD" gap noted elsewhere in this file — the
mockup already had correct `Organization`/`LocalBusiness` schema
written, just needed porting.

**Real pages built so far (all standalone static HTML, matching one shared
design system, ready to drop into Astro templates later — except
`index.html`, now superseded by the real Astro port above):** `index.html`
(homepage), `application-criteria.html`, all 9 confirmed `-market-reports`
pages (Indianapolis, Fishers, Noblesville, Westfield, Greenwood, Westside,
Anderson, Lebanon, Greenfield), **all 20 `-homes-for-rent` pages**,
**all 19 `-property-management` pages** (Sep 17), and **all 8 pillar
pages** (Sep 18 — see the three sections below for each). The full city
three-page model and the pillar-page set are both now fully built.

### Pillar pages — all 8 built (Sep 18)

✅ **All 8 now ported into real Astro (2026-09-21)** —
`src/pages/market-readiness-assessment.astro`, `marketing-process.astro`,
`tenant-screening.astro`, `leasing-process.astro`, `maintenance.astro`,
`communication.astro`, `pricing.astro` (all live at the real
deployment), plus `indianapolis-property-management.astro` (built
separately, see the "Property-management pages" section above). Same
relationship as the homepage/property-management sections above: this
section describes the approved static-mockup design work; the pages
themselves now actually exist as real Astro pages.

6 of the 7 (all but `pricing`) share a `PropertyManagementJourneyCarousel`
component (confirmed byte-identical across all of them, including
Indianapolis's own page, via diff) and a `LandlordLibrary` post set
different from the homepage/18-simple-property-management-page one
(`src/lib/property-management/pillar-landlord-library-posts.ts`).
`pricing.astro` is structurally its own thing — no carousel, no
Landlord Library, but a genuinely working interactive self-manage/
poor-management cost calculator (verified live: slider changes and
mode switching both recalculate every line correctly), a services-
comparison table, a fee-structure-comparison table, and its own
20-question FAQ. Two stale project notes corrected in the process: the
calculator's "Poor Management" mode was assumed unbuilt (it's fully
implemented in the actual current mockup) and the FAQ was assumed to
have 18 questions (it has 20) — both ported faithfully as actually
found in the file, not as previously assumed.

Added a real chunk of previously-missing CSS to `global.css` in the
process — the full `step-grid`/`step-card`/`step-icon` rule set (the
version already in `global.css` from the Indianapolis page was
confirmed dead/unused there), the `video-section` YouTube-embed
styling, and — for `pricing.astro` alone — ~150 lines covering the
calculator, both comparison tables, and the Calendly-embed section,
none of which existed anywhere in the shared stylesheet before.

Same `#rental-analysis` → `/rental-analysis` fix as the homepage and
every property-management page: each mockup's old placeholder 6-step
form is replaced with a condensed pitch + CTA to the real tool.

`tenant-screening.astro`'s eviction-language fix (see "Two deliberate
departures" below) was independently re-verified byte-for-byte against
the source mockup rather than just trusted — confirmed correct.

**Content is migrated from the live site, not rewritten, per Hard Rule
1** — read directly from `reddoorrents.com` (the 8 URLs Michael sent
Sep 18, since the archive/crawl in this repo doesn't actually contain
their content — `archive/pages` is empty placeholder files only, despite
what "Where things stand" above implies about a full local archive).
Restyled into the shared design system, reusing the exact header,
footer, script, and base CSS extracted from `index.html` (same
extraction approach as the property-management build), plus two new
reusable components: a numbered `step-card` grid for process
breakdowns, and `plain-list`/`two-col-list` styles for feature bullets.

Two deliberate departures from pure "move as-is," both already
reported to Michael and confirmed before building:

- **Tenant Screening's eviction language was fixed, not ported as-is.**
  The live page said applicants with "eviction filings" are "generally
  declined" — this conflicts with the FHCCI-researched standard already
  locked on `application-criteria.html` (eviction *judgments* only). Per
  Michael's explicit choice, the new page uses the judgments-only
  standard and the same case-by-case criminal-history language, with a
  link to the full Tenant Qualification Criteria page.
- **`indianapolis-property-management.html` was rebuilt, not left as
  the thin city-template version**, per Michael's confirmation — real
  ~2,900-word content (the 9-item differentiator list, a 6-section
  process deep-dive linking to the now-real pillar pages, "What's
  Included," "Owner Standards," all 10 FAQs) replaces the generic
  accordion, while keeping the Rental & Sales Snapshot and areas-served
  sections from the property-management build since those don't
  conflict with anything on the real live page.

Other things found and resolved while migrating:

- **The live site is internally inconsistent on the lease-renewal
  window** — `leasing-process`'s own body copy says "90 days" in one
  place but its FAQ (and the `communication` page) says "110 days."
  Standardized on 110 everywhere in the new pages, since that's what's
  already published across every homepage/property-management page
  built this session.
- **Phone number discrepancy, not yet resolved:** every page built
  this session (homepage onward) uses `317.660.1626`, but the live
  site's header/footer show `317.922.0215`. Flagging for Michael to
  confirm which is current — didn't change anything without
  confirmation.
- **The Landlord Library block is identical across all 8 live pillar
  pages** (same 3 real posts: Westfield, Greenwood, and a photography
  guidance piece) — confirmed via DOM inspection before reusing it, so
  the new pages match that rather than reusing the *different* 3 posts
  shown on the homepage/property-management pages (which are real too,
  just a different selection — the live site apparently doesn't keep
  this block in sync across page types either).
- **Pricing's "hidden cost" calculator was built as a genuinely working
  client-side tool**, not a static mockup — verified its default output
  matches the live page's own example exactly (owner time cost $4,800,
  extra vacancy cost $840, Red Door management cost &minus;$1,944,
  estimated annual impact $3,696) and that it recalculates correctly on
  input change. Only the "Self-Managing" comparison tab was built — the
  live page also has a "Poor Management" tab whose underlying
  assumptions weren't visible in the crawled content, so it was left
  out rather than guessed at.
- **The criminal-history clause still needs attorney sign-off before
  launch** (same open item as `application-criteria.html`, not
  resolved by this pass — see "Decided, not yet executed" above).

### Property-management pages — all 19 built (Sep 17)

✅ **All 19 of 19 now ported into real Astro (2026-09-21) —
`src/pages/[city]-property-management.astro`** (18 simple cities) **and
`src/pages/indianapolis-property-management.astro`** (the flagship,
built separately once the 18 simple pages were confirmed working) — both
live at the real deployment. Same relationship as the homepage above:
this section describes the approved static-mockup design work; the
pages themselves now actually exist as real, D1-wired Astro pages, not
just standalone HTML. Indianapolis's own mockup used a meaningfully
different, richer design — its own self-contained 3D "journey" carousel
(`src/components/IndianapolisJourneyCarousel.astro`, ported verbatim
from the mockup's own clearly-labeled drop-in-widget source blocks) in
place of the plain journey-wrap, six detailed process-detail sections,
a "What Makes Red Door Different" list, a "What's Included" list, an
"Owner Standards" list, and a real 10-question FAQ accordion — same
"build the flagship page separately" pattern already used for
`indianapolis-homes-for-rent.astro`. The carousel's desktop 3D animation
couldn't be interactively verified in this session (the browser pane
was backgrounded, which stops `requestAnimationFrame` from firing at
all — unrelated to the code); its mobile static fallback, initialization
state, and every other section were verified working on a live deploy.
Worth a real click-through once someone can see the live page.

The Rental & Sales Market Snapshot section below is now genuinely live
data, not the Sep 17 snapshot the rest of this section describes — it
reads the same `rentcast_city_cache` D1 rows the homes-for-rent pages
already read (every property-management city slug is a confirmed subset
of the homes-for-rent slug list, so no new data pipeline was needed).
Shared sections (accordion, guarantee cards, reviews carousel, areas-
served grid, journey/process cards, landlord library) were extracted
into `src/components/` and are now used by both these 18 pages and the
homepage, rather than duplicated — see the "Build the homepage" commit
and this build's own commit for the full list of what's byte-identical
everywhere versus what needed explicit per-page text (nothing was
silently guessed from a city name where the homepage's and the property-
management pages' already-approved copy genuinely differ, e.g. the
accordion's rental-market-activity sentence).

Per CLAUDE.md, this was already the highest-priority page type on the
site (Sep 11 decision) because the old 20-page set was found to be almost
entirely identical service-description boilerplate copied city to city,
with only a short area-history blurb as real per-page content.

Built from a locked Avon template (`avon-property-management.html`,
built and manually verified first — hero, nav, browser console, mobile
menu, the new snapshot section, and the areas-grid "you are here" badge
all checked before replicating). The template reuses the homepage's
brand system, 6-stage process cards, guarantee cards, real reviews
carousel (unchanged pool — none are tagged to a specific city, matching
the Sep 11 pilot's finding), and multi-step rental-analysis form
byte-for-byte, extracted programmatically from `index.html` rather than
hand-retyped so there's no risk of the shared CSS/header/footer/script
drifting between pages. See
`claude/avon-property-management-pilot-notes.md` for the original Sep 11
pilot reasoning this build followed.

Genuinely new per page: the H1/hero, a "Why [City] Rental Owners Choose
Red Door" accordion, and a new **Rental & Sales Market Snapshot**
section — two side-by-side panels (Rental Market: average/median rent,
active listings, link out to that city's homes-for-rent page; Sales
Market: average/median sale price, active listings, days-on-market
framed as owner sell-vs-rent context) built from the same real RentCast
`rentalData`/`saleData` already pulled for the homes-for-rent build
(Sep 17 snapshot, not yet on a refresh cycle — see the homes-for-rent
section above). The current page's own entry in the areas-served grid
(including inside the collapsible townships panel) shows a "You are
here" badge instead of linking to itself.

List: `avon-`, `brownsburg-`, `carmel-`, `fishers-`, `greenwood-`,
`noblesville-`, `westfield-`, `zionsville-`, `broad-ripple-`,
`indianapolis-` (the 10 non-township pages), plus all 9 Marion County
township pages (`lawrence-township-`, `warren-township-`,
`wayne-township-`, `perry-township-`, `franklin-township-`,
`pike-township-`, `washington-township-`, `decatur-township-`,
`center-township-`) = **19 total, not 20** — Downtown Indianapolis does
not get its own property-management page (falls back to
`/indianapolis-property-management`), matching the homes-for-rent
convention already established for it. CLAUDE.md's "= 20" arithmetic for
this page type appears to be a slip (10 + 9 = 19); flagging rather than
quietly fixing CLAUDE.md, since it's Michael's file to correct.

Judgment calls / generalizations applied to all 19 pages, carried
forward from the Sep 11 pilot decisions plus a few made during this
build:
- **Two section headings were generalized off "Indianapolis"** — the
  process section is now "The Red Door Property Management Process"
  (was "Follow the Indianapolis Property Management Journey," which
  read oddly reused on a city page — the Sep 11 pilot's own
  recommendation) and the Landlord Library is now "The Red Door
  Landlord Library" (same reasoning, applied consistently here since
  its 3 real posts are about Westfield/Noblesville/Fishers, not
  whichever city the page is for).
- **Two homepage CTA buttons that pointed to
  `/indianapolis-property-management`** (redundant on a page that IS
  already that page for its own city) were changed to point to
  `/pricing` or removed outright, rather than left as self-links.
- **The Landlord Library's 3 real posts are identical on every page** —
  there aren't enough per-city market-report posts to rotate a unique
  set per page (only 9 cities have active market-reports coverage at
  all), so all 19 pages show the same 3 real posts, matching what the
  homepage itself already does.
- **Same open items as the homes-for-rent pages carry over here too:**
  unweighted vs. listing-count-weighted ZIP averaging still unresolved,
  the RentCast API key should still be rotated, and none of these pages
  are wired to a refresh mechanism yet.

### Homes-for-rent pages — all 20 built (Sep 17)

All 20 locked pages exist as real files, each with real RentCast market
data (pulled Sep 17 via the approved RentCast Foundation plan) and
team-confirmed local facts from `claude/red-door-city-facts-research.md` —
not templated name-swaps. List: `avon-`, `brownsburg-`, `carmel-`,
`fishers-`, `greenwood-`, `noblesville-`, `westfield-`, `zionsville-`,
`broad-ripple-`, `downtown-indianapolis-` (the 10 standalone
suburbs/neighborhoods), the 9 Marion County township pages
(`lawrence-township-`, `warren-township-`, `wayne-township-`,
`perry-township-`, `franklin-township-`, `pike-township-`,
`washington-township-`, `decatur-township-`, `center-township-`), and
`indianapolis-homes-for-rent.html` (the countywide umbrella, rolling up
37 of Marion County's 56 ZIPs — the rest are PO-Box-only or otherwise
non-residential and excluded; one of the 37, 46282, returned no RentCast
data and is flagged in that page's copy and its underlying data file
rather than silently dropped). Raw per-city data lives in
`data/homes-for-rent/*.json` (20 files), pulled via a one-off Node script
(not committed — lived in the session scratchpad) using
`process.env.RENTCAST_KEY`; **the RentCast API key was pasted directly in
chat and should be rotated** since it now persists in conversation
history — it was never written to any file in this repo (verified via
repo-wide grep before every commit).

Judgment calls / open items carried forward from this build:
- **Multi-ZIP averaging is unweighted** (simple arithmetic mean across a
  township's ZIPs, not weighted by each ZIP's listing count). Flagged
  twice now as an unresolved house-style question — Michael hasn't ruled
  on unweighted vs. listing-count-weighted yet.
- **Avon's page had its "Typical move-in fees" list removed** per
  Michael's explicit request (Sep 17) — Resident's Benefits Package
  ($45/mo) and Lease Preparation Fee ($195) no longer appear there; the
  other 19 pages were built without that section from the start.
- **Perry Township's page required extra Fair Housing care** — the
  facts-file source material for Perry included demographic/racial
  content that was deliberately excluded; the page sticks to borders,
  history, and landmarks only.
- ✅ **"Currently Available" now shows real RentEngine listings (Sep 18) —
  see "Listings — real data wired" below for the full build.** Superseded:
  every page previously showed an honest "not connected yet" placeholder;
  17 of 20 now show real listing cards, the other 3 (Brownsburg, Fishers,
  Zionsville — genuinely zero current inventory) show an updated honest
  "nothing available right now" message instead of the old "not connected"
  wording.
- **Thin bedroom-count samples (roughly n<10) are flagged inline** in the
  snapshot prose as "a rough signal, not a firm number" rather than
  presented with false precision — this shows up on several
  lower-inventory pages (Zionsville, Westfield's 2BR rung, most
  townships' 5BR+ rungs).
- **Not yet wired to a monthly refresh mechanism** — the Cloudflare
  Worker/Cron approach is decided (see `CLAUDE.md`) but not built; these
  20 pages currently reflect a single Sep 17 snapshot, dated as such in
  each page's data-as-of line.
- 🐛 **Fixed (Sep 22): listing detail links 404'd on every city page
  except Indianapolis's.** Michael caught this live — clicking any
  listing card gave a 404. Root cause: `RENTENGINE_ACCOUNT_ID` was
  declared as a bare top-level `const` in each page's own frontmatter,
  the same recurring Astro gotcha already documented above (top-level
  frontmatter consts aren't reliably visible inside that file's own
  `getStaticPaths()` for a DYNAMIC route). It threw `ReferenceError:
  RENTENGINE_ACCOUNT_ID is not defined`, silently caught by the existing
  try/catch and logged as a warning instead of failing the build — so
  `[city]-homes-for-rent.astro` built all 19 non-Indianapolis city hub
  pages with **zero live listings** (not genuinely empty inventory, as
  it first appeared), and `homes-for-rent/[city]/[slug].astro` built
  **zero listing-detail pages at all**, while CI stayed green the whole
  time. `indianapolis-homes-for-rent.astro` is a plain non-dynamic route
  and never hit this, which is why it alone looked correct and why this
  went unnoticed. Fixed by moving `RENTENGINE_ACCOUNT_ID` into
  `src/lib/listings/rentengine.ts` as a real exported constant, imported
  by all three pages instead of redeclared. Confirmed fixed: rebuilt,
  30 listing-detail pages now generate (up from 0), Avon's hub page now
  shows its real listing, and a live click-through from a listing card
  to its detail page works end to end.
- 🐛 **Fixed (Sep 22): sitewide hero H1 overlap + homes-for-rent filter
  bar wrapping.** Michael reported both on the homes-for-rent hero
  (kicker text overlapping the H1) and filter row (beds/price/sqft/pets
  scattered across multiple lines instead of sitting in one row).
  Root-caused to two more bare, unscoped rules bleeding across the site
  — the same class of bug as the `RENTENGINE_ACCOUNT_ID` fix above:
  - `h1 { transform: translateY(-58px) }` was written unscoped instead
    of `.hero h1`, so the homepage's deliberate 2-line-hero lift was
    shifting up the H1 on **every other page on the site** —
    application-criteria, all 9 market-reports, all 20 homes-for-rent
    (the reported bug), residents-benefits-package, and, worse, blog
    posts and the rental-analysis pages, where it wasn't just an overlap
    but genuinely **invisible white-on-white text shifted up into the
    header** (confirmed live on a real blog post in production). Fixed
    by scoping to `.hero h1` (its true intended target) and adding real
    (previously entirely missing) h1 styling for
    `.content-block > h1` (blog posts), `.report-address + h1` and
    `.analysis-grid h1` (rental-analysis pages) — all three had been
    silently depending on the leaked rule and had no styling of their
    own once it was properly scoped away.
  - `input, select, textarea { width: 100% }` was written unscoped
    instead of `label input/select/textarea` (the real-form pattern),
    so it forced the homes-for-rent filter bar's `#filter-beds`/
    `#filter-pets` `<select>` elements (which use `aria-label`, not a
    wrapping `<label>`) to full width inside `.filter-row`'s flex
    layout, pushing each onto its own row. Fixed by scoping to
    `label input/select/textarea`, matching every real dependent
    (rental-analysis's form, the price/sqft range popovers' Min/Max
    fields) which are all genuinely `<label>`-wrapped.
  - **Found in the course of fixing the above, same root cause:** all 20
    `-property-management` pages' hero also had the eyebrow overlapping
    the H1, and indianapolis-property-management's long single-sentence
    H1 was overflowing off the right edge of the viewport entirely
    (forced `white-space: nowrap` on a long span). `.hero-pillar
    .eyebrow + h1 { transform: none; margin-top: 6px }` already existed
    for the 7 pillar pages but was scoped too narrowly — confirmed via
    this file's own comment that pricing.html's original source
    `<style>` had this as a general `.hero .eyebrow + h1` rule, and
    porting it only through the `.hero-pillar`-scoped copy silently
    missed the plain-`.hero` property-management pages. Broadened to
    `.hero .eyebrow + h1` and added `white-space: normal` on that span.
  - Verified across the board after the fix: homes-for-rent (both the
    hero and the filter row), application-criteria,
    indianapolis-property-management (both the overlap and the text
    overflow), avon-property-management, a blog post (title now visible
    and properly sized), rental-analysis, the homepage, and a pillar
    page (marketing-process) — all pixel-checked, no regressions.

---

## Genuinely open — do these next

- [ ] **🚨 PRE-LAUNCH BLOCKER: remove the temporary sitewide noindex
      before (or immediately at) DNS cutover to the real domain.**
      Added 2026-09-21 alongside `public/robots.txt` (`Disallow: /`) and
      `public/_headers` (`X-Robots-Tag: noindex, nofollow` on `/*`) —
      both exist solely because the site is now deployed for real at
      `https://red-door-site.mtaylor-0d7.workers.dev` while
      `reddoorrents.com`'s DNS still points at the old PMW platform, to
      stop that stray public preview URL (mostly 404s today, content
      that will duplicate the real site once more pages are built) from
      getting crawled and indexed before launch. **If this ships to the
      real domain without being removed, the live site becomes
      invisible to every search engine** — both files have their own
      header comment flagging this, but it's easy to miss in a real
      launch's checklist, hence the loud flag here too. At launch:
      delete or replace `public/robots.txt` with a real, permissive one,
      and delete `public/_headers`' `X-Robots-Tag` block (keep the
      Cloudflare-adapter-managed `/_astro/*` Cache-Control block above
      it).
- [ ] **🚨 PRE-LAUNCH BLOCKER: analytics/tracking audit — tagging, GTM
      continuity, and conversion tracking, before going live.** Flagged
      by Michael 2026-09-22; nothing here has been researched or built
      yet. Three distinct pieces, all currently open:
      - ✅ **`/contact` and `/contact-thank-you` built for real (Sep 22).**
        `/contact` didn't exist as a real Astro page at all before this
        (confirmed via a live 404) — built from `contact.html`, wired to
        a real `POST /api/contact/submit` (Turnstile + D1 storage in the
        new `contact_submissions` table, migration applied to the real
        remote D1 database), redirecting to `/contact-thank-you`
        (`noindex`) on success. Reuses the rental-analysis tool's
        Turnstile/Resend helpers directly rather than duplicating them.
        Lead delivery, per Michael (2026-09-22): one HTML notification
        email to `cknight@rdpmindy.com`, CC'd to LeadSimple's own
        Web-Forms inbound address (`new-leadfc2ef89f93@newlead.leadsimple.com`,
        which LeadSimple itself sent Michael instructions for). **This is
        a different LeadSimple mechanism than the rental-analysis tool's
        own LeadSimple integration** — that one uses LeadSimple's manual
        email-to-lead parser (strict format: subject exactly `New Lead`,
        labeled plain-text body, sent alone to a dedicated address; see
        `claude/rental-analysis-tool-build.md` decision #6). This one is
        LeadSimple's separate "Web Forms" feature, which — per
        LeadSimple's own setup instructions, forwarded verbatim by
        Michael — expects to be CC'd directly on the regular
        notification email instead. **Confirmed working end-to-end
        (Sep 22)** after a separate Turnstile sitekey bug (see "Rental
        analysis / contact — Turnstile" below) was found and fixed —
        Michael's real test submission passed the spam check, landed in
        D1, reached `cknight@rdpmindy.com`, and the lead appeared in
        LeadSimple.
        Rental-analysis's own thank-you-page item (below) is still
        separately open — while researching this, found that the old
        site's real `/thank-you` and `/success` pages (same generic
        template) embed a Loom video
        (`loom.com/embed/8975328b37a64d55bab0c7d16876cbe5`); Michael
        confirmed that's the rental-analysis one, not contact's — worth
        reusing when that item gets built.
      - **Audit the old site's actual Google Tag Manager container
        before reinstalling it.** CLAUDE.md and the old launch
        checklist below both already say "reuse the same GTM container
        ID so historical data stays continuous," but that's only the
        container shell — nobody has actually looked inside it yet at
        what tags/triggers/variables it holds. Michael specifically
        flagged one he half-remembers, possibly tied to a "Paperclip"
        vendor integration (unconfirmed name, not found anywhere in
        this repo or in `claude/` research docs — needs Michael to
        check the GTM dashboard directly, since nobody else has access).
        Needs a full export/review of the container's tags before
        launch so nothing silently stops firing.
      - **Add Google Analytics (GA4) tracking to the new site.** No GA4
        measurement ID or gtag.js/GTM-tag wiring exists anywhere in this
        repo yet — need to confirm whether the old site's GA4 property
        should be reused (continuity, matching the GTM container
        decision) or a new one created, then wire it in (likely as a
        GTM tag, once the container audit above is done, rather than a
        second separate snippet). Also worth confirming during the same
        pass whether anything beyond the domain property already added
        to Search Console (see below) is needed for tracking purposes
        specifically, vs. that property's existing SEO/crawl-data
        purpose.
- [ ] **Confirm whether the Guaranteed Lease Program still exists.** The
      About page (`about.html`, migrated as-is Sep 18) mentions "a very
      unique Guaranteed Lease Program" for owners moving up without
      selling, but there is no corresponding page on the live site
      anymore — `/guaranteed-lease-program` and `/guaranteed-lease` both
      404, and it doesn't appear in the live site's own `/sitemap`.
      Confirmed stale per Michael (Sep 18); skipped rather than building
      a page with no real source content. If the program still exists,
      get real content and build the page; if it's been discontinued,
      the About page's mention should be removed too.
- [ ] **Build `tenant-verification.html` and `employment-verification.html`.**
      The live pages just embed a single Adobe/EchoSign eSign widget iframe
      each (`secure.echosign.com/public/widget?f=...`), tied to a specific
      document instance rather than a generic reusable form — not something
      to port as static mockup content. Deferred per Michael's decision
      (Sep 18) rather than embed a possibly broken/session-specific iframe.
      Needs a real decision on what these pages should actually do (request
      a fresh signable document per visit? link out to AppFolio instead?)
      before building. Not currently linked from `tenants.html` either, to
      avoid a dead link.
- [ ] **Build `self-manage-vs-pm-calculator.html`** — a standalone, fuller
      version of the "What does self-management or bad management really
      cost you?" widget now embedded on `pricing.html` (Sep 18 rebuild).
      The live site links "See the full breakdown & adjust every
      assumption" from the embedded widget to this dedicated page; that
      link was deliberately left out of the rebuilt `pricing.html` rather
      than point to a page that doesn't exist yet. Once built, add the
      link back in (`pricing.html`'s `.rd-calc-output`, after
      `.calculator-cta-row`) and update `data-track`/`href` to match.
- [ ] **Read the PMW contract** — notice period, whether content export is
      included.
- [ ] **Decide what happens to blog posts published during migration.** At
      12–13/month, a six-week migration window means ~20 posts land mid-move.
      Not blocking the build — revisit closer to actual cutover.
- ✅ **Market-reports market list — confirmed (Sep 17).** 9 pages total:
  Indianapolis, Fishers, Noblesville, Westfield, Greenwood, West Side
  (the Avon/Brownsburg/Plainfield cluster — one page, per the Sep 17
  scoping decision below), Anderson, Lebanon, Greenfield. All 8 non-cluster
  entries are single-city pages. **Flag:** Michael wrote "West Side" (two
  words); the existing blog series is branded "Westside Market Report"
  (one word). Confirm the intended slug/heading before build —
  `/westside-market-reports` (matches existing content branding) vs.
  `/west-side-market-reports` — small thing, easy to get inconsistent
  across nav links, page title, and the blog tag it pulls from.
  **Note:** Carmel is a served city (Homes for Rent + Property Management
  pages, shown in the Areas Served county cards) but isn't on this list —
  expected, since market-reports pages are opt-in based on active
  recurring report coverage, not every served city.
- [ ] **One listings-specific open item remains** (five of the original
      six resolved Sep 18 — see "Listings — real data wired" above): the
      `accepts_vouchers` mismatch (still null on every real unit despite
      marketing copy advertising Section 8 acceptance on at least one
      listing). Full detail in `claude/listings-build-notes.md`, "Open
      items summary."
- ✅ **Per-listing title/meta/H1/schema generation — built (Sep 18).**
      Templated from address, beds, baths, city in `build_listing_detail.js`;
      all 28 real listing pages have it.
- [ ] **Decide delisted-property handling** — recommend 301 to the city
      listings page for both users and link equity.

---

## Homepage mockup review (Sep 17) — new items

Michael sent nav, header, reviews, and areas-served feedback against the
built homepage. Captured here; not yet executed.

### Header navigation — structure captured, 2 details to confirm

Full structure as dictated:

- **Home**
- **Homes for Rent**
- **Owner Services** (dropdown, 9 items in order):
  1. Property Management Overview
  2. Market Readiness Assessment
  3. Marketing
  4. Tenant Screening
  5. Leasing
  6. Maintenance
  7. Communication
  8. Eviction Protection Program
  9. Owner Portal
- **Pricing**
- **Tenants** (dropdown, 4 items — see removal note below):
  1. Tenant Resources
  2. Maintenance Request
  3. Tenant Qualification Criteria
  4. Tenant Portal
- **About Us**
- **Watch & Learn**
- **Free Rental Analysis** (CTA button, not a dropdown)

Matches the locked step order (Maintenance=5, Communication=6).
**LOCKED (Sep 17):**

- ✅ **Pricing stays as its own top-level item**, in its previous spot
  (placed here between Owner Services and Tenants; exact ordering can be
  confirmed against the current live header when the header component is
  built — not worth blocking on).
- ✅ **"Owner Portal" / "Tenant Portal" (in the Owner Services / Tenants
  dropdowns) replace the top utility bar's "Owner Login | Tenant Login."**
  Drop the utility-bar login links entirely — the dropdown entries are the
  only portal links going forward.
- ✅ **"Application" removed from the Tenants dropdown entirely (Sep 17,
  later same-day decision).** Originally dictated as a 5th item — a plain
  link to the live application (RentEngine → AppFolio). Michael later
  decided to drop it rather than pick an interim target while the real
  apply URL is unconfirmed; applicants will apply per-listing via each
  listing's own Apply button once the listings build exists. See
  "Genuinely open" above for the still-open live-site Findigs link this
  doesn't touch.

Nothing left open on nav structure — ready for the header/footer build.

### Header/CTA — sticky on scroll + button color — ✅ DONE (Sep 17)

- ✅ **Header/CTA sticky on scroll.** The homepage header was already
      `position: fixed`, but the desktop nav had no "Free Rental Analysis"
      button at all — only the mobile-sticky bar had one. Added it as the
      last nav item; since it lives inside the fixed header it now stays
      visible at any scroll position, verified at `scrollY: 2000`. The Avon
      pilot page (a separate file, not in this repo) still needs the
      equivalent fix applied to it separately.
- ✅ **Button color.** `.btn-primary` swapped from `--brand` to
      `--brand-mid` (`#bc1719`), matching the sampled mockup color, hover
      now darkens to `--brand`. Affects the hero CTA, mobile-sticky bar,
      and the new header CTA consistently.

### Reviews — ✅ DONE (Sep 17)

- ✅ **Auto-scroll from first view.** Root cause: a single `setTimeout(fn,
      0)` measured card width before the tripled card set had finished
      laying out, so `reviewsCanScroll()` read false and autoplay never
      started until a manual prev/next click or window resize retried it.
      Replaced with retries at 0/250/800ms. Verified in-browser: scrollLeft
      advances on its own with zero interaction.
- (Google reviews source decision — see "Resolved this pass" above: static/
  curated, confirmed.)

### Areas Served / cities-we-serve section — ✅ DONE (Sep 17)

Rebuilt twice this pass. First pass matched only the 6 counties visible in
Michael's cropped screenshot (7 cards including a Boone County add-on for
Zionsville), no blurbs. Michael then supplied the full reference file
(`red-door-homepage-mock-main`, a separate local mockup repo, not part of
this repo) showing the complete, intended version, and asked for as close a
match as possible — the final build replaces the first pass entirely:

- ✅ **9 county cards** (Marion, Hamilton, Madison, Hendricks, Johnson,
  Hancock, Shelby, Boone & Morgan) plus a wide "Indianapolis Neighborhoods"
  card (21 neighborhoods), matching the reference file's visual design
  (card shadows, grid, typography) closely.
- ✅ **Blurbs restored**, matching the reference text, with one fix: the
  Johnson County blurb carried the reference's exact Fair Housing
  violation ("steady demand from families and commuters") — rewritten to
  CLAUDE.md's prescribed phrasing ("steady demand from commuters and
  long-term renters"). Worth a fresh look at the source mockup repo for
  this same pattern elsewhere before assuming it's isolated there too.
- ✅ **Only real pages are linked.** The reference file names ~65 places
  total; only ~20 have an actual `-property-management` page in the
  confirmed build scope (Indianapolis, Carmel, Fishers, Noblesville,
  Westfield, Avon, Brownsburg, Greenwood, Zionsville, Broad Ripple, and the
  9 townships). Everything else (Southport, Beech Grove, Speedway,
  Pendleton, Lapel, Ingalls, Danville, Plainfield, Franklin (IN),
  Whiteland, Bargersville, Greenfield, McCordsville, New Palestine,
  Fortville, Cumberland, all of Shelby County, Whitestown, Lebanon,
  Mooresville, Martinsville, and 20 of the 21 Indianapolis neighborhoods)
  renders as plain gray text, not a link — confirmed decision, to avoid
  both broken links and the doorway-page pattern CLAUDE.md already flags
  as the site's biggest SEO liability. **If any of these are meant to get
  real pages, that's new, unscoped work** — not something this pass
  decided.
- ✅ **9 real township pages** moved into a collapsible `<details>` "+/−"
  panel below the grid, matching the reference file. Verified the toggle
  works on desktop and mobile (tap target).
- ✅ **Responsive verified** at desktop (3-col), tablet/768px (2-col), and
  mobile/375px (1-col) — including the wide neighborhoods card (4→2→1 col)
  and the township panel (3→3→1 col, matches the reference's own
  breakpoints).
- Two reference screenshots (`archive/images/header example.png`,
  `archive/images/areas served example.png`) committed for the record.

This supersedes the "Areas Served panel — deferred to a later revision"
section further down — see the note added there.

### Market-reports page design (Sep 17) — decided, template built

✅ **All 9 ported into real Astro (2026-09-21) —
`src/pages/[market]-market-reports.astro`, one dynamic route, live at
the real deployment.** Same relationship as every other section above:
this describes the approved static-mockup design work; the pages
themselves now actually exist as real, live-data-wired Astro pages.

**The two sections the mockups explicitly self-labeled placeholder ("will
pull from X once Y is wired up") are now genuinely live**, since both
prerequisites are done: the RentCast D1 pipeline (snapshot stats — real
for Indianapolis/Fishers/Noblesville/Westfield/Greenwood/West&nbsp;Side,
correctly absent for Anderson/Lebanon/Greenfield, which have no
RentCast coverage at all) and the full 309-post blog migration (the
"Recent Reports & Videos" grid — matched by title text against each
market's city name(s), no real taxonomy exists yet for this).

**Found and fixed two real issues surfaced only by pulling live data for
the first time:** a title-matching cross-contamination bug (a
Noblesville post was showing on the Indianapolis page because its title
happened to say "...Near Indianapolis"), and — more seriously — two live
Sanity blog posts contain Fair Housing violations matching a pattern
already documented above ("school-driven fundamentals", "strong
schools") that hadn't been caught by any prior review pass. Added a
display-layer filter so neither can render on these new pages; the
underlying Sanity posts themselves still need a real content fix
(flagged separately, not resolved by this build).

✅ **Template built (Sep 17, same day as the design pass):**
`westside-market-reports.html` — standalone static page, first of the 9
confirmed market-reports pages, matching the design system established by
`index.html`/`application-criteria.html`. Built from the original mockup
(https://claude.ai/artifact/UrouCisinFyHKg8MSJiJkm) plus
`claude/red-door-market-reports-mockup.html`, with two corrections:

- **"Nearby markets" was linking to Carmel**, which isn't one of the 9
  confirmed market-reports cities (Carmel has Homes for Rent + Property
  Management pages but no market-reports coverage — see the note under the
  confirmed market list above). Fixed to link the other 8: Indianapolis,
  Fishers, Noblesville, Westfield, Greenwood, Anderson, Lebanon, Greenfield.
- **Slug decided as `/westside-market-reports`** (not
  `/west-side-market-reports`) — matches the existing "Westside Market
  Report" blog branding, per the flag below. Revisit if Michael intended
  otherwise.

**Still placeholder, by design — not a launch blocker for the template
itself:** the live-data snapshot (3 stat tiles) and the report/video cards
are illustrative, clearly labeled as such on the page. Real data needs the
RentCast pipeline wired up (see "Market report data points" further down);
real cards need the blog migration done first.

✅ **Second page built (Sep 17): `fishers-market-reports.html`.** Same
template, genuinely different intro copy — pulled from real researched
Fishers facts in `claude/red-door-city-facts-research.md` (grew from
~38,000 in 2000 to ~105,000 today; didn't incorporate as a city until
January 2015). Also links a real, already-live blog post ("Is Fishers,
Indiana Still a Strong Rental Market for Investors?") as a featured link
under the headline, rather than blending it into the placeholder card grid
where it would sit indistinguishably next to five fake ones — the one real
link and the six illustrative cards are kept visually and structurally
separate so neither misrepresents the other.

✅ **Third page built (Sep 17): `noblesville-market-reports.html`.** Real
Noblesville facts from `claude/red-door-city-facts-research.md` — one of
Hamilton County's oldest cities (founded 1823, city since 1887,
courthouse-square downtown, National Register historic districts),
deliberately framed as the opposite angle from Fishers' "newest
incorporation" story so the two pages don't read as a template with the
city name swapped. Real live blog post ("Is Noblesville, Indiana the Best
Rental Market Near Indianapolis?") linked the same way as Fishers'.

✅ **Fourth page built (Sep 17): `westfield-market-reports.html`.** Real
Westfield facts — one of the fastest-growing suburbs in the metro (up more
than 7x since 2000), Grand Park Sports Complex as the defining landmark.
Deliberately doesn't oversell the growth story: the real linked post's own
headline flags 127 rental days on market, so the intro explicitly notes
that Westfield's growth "doesn't always show up the same way on the rental
side," and the snapshot uses a down arrow on median rent rather than
defaulting to positive trends on every page. Real live blog post ("Is
Westfield, Indiana Still Worth Investing In With 127 Rental Days on
Market?") linked the same way as the other pages.

✅ **Fifth page built (Sep 17): `greenwood-market-reports.html`.** Real
Greenwood facts — steady southside growth (36,000 → 69,000 since 2000,
Greenwood Park Mall, an Amazon fulfillment center) framed deliberately as
"steadier... rather than a dramatic growth story," in contrast to
Fishers/Westfield's explosive-growth framing. No real Greenwood blog post
exists yet (unlike Fishers/Noblesville/Westfield), so this page has no
featured-link line — omitted rather than fabricated.

✅ **Sixth page built (Sep 17): `anderson-market-reports.html`.** Anderson
isn't in `claude/red-door-city-facts-research.md` (that file only covers
the Hamilton/Boone/Johnson suburbs), so facts were verified fresh via web
search rather than assumed: Madison County seat, ~35 mi NE of Indianapolis,
1880s natural gas boom, decades as a major GM manufacturing center,
Anderson University and two hospital systems as current anchor employers.

**Fair Housing note — deliberately left out:** Anderson's Wikipedia
history includes median household income, poverty rate, and population
decline since a 1970 peak — all *demographic/resident* facts, not
property-market facts. None of that made it into the page. What's on the
page instead is framed entirely as a market/property characteristic
("housing stock tends to be older and rents run below the Hamilton County
suburbs") — the safe way to say the same underlying thing without
describing the area by who lives there, per the Fair Housing section of
`CLAUDE.md`.

**No property-management page to link to.** Anderson only has
market-reports coverage (confirmed in the 9-city list), not one of the 20
`-property-management` pages. The CTA band's "See How We Manage" button
points to `/indianapolis-property-management` instead of a nonexistent
`/anderson-property-management` — flag this if Red Door wants a dedicated
Anderson owner page built later.

✅ **Seventh page built (Sep 17): `lebanon-market-reports.html`.** Also not
in the city-facts file — facts verified fresh via web search: Boone County
seat, ~28 mi NW of Indianapolis, population ~17,500, and the genuinely
distinctive story here is the LEAP Innovation and Research District
(Eli Lilly's $3.7B pharma manufacturing campus broke ground 2023, a
planned Meta data center) — one of the largest economic development
projects in state history, right at Lebanon's edge. Framed as forward-
looking but hedged ("typically brings rental demand... over time"), not
an overpromise. **Deliberately left out:** the LEAP water-pipeline eminent
domain controversy that comes up in the same searches — off-topic for a
rental-market page and not something to wade into. No property-management
page exists for Lebanon either, so the CTA falls back to
`/indianapolis-property-management` same as Anderson.

✅ **Eighth page built (Sep 17): `greenfield-market-reports.html`.** Also
web-researched fresh: Hancock County seat, ~14 mi east of Indianapolis,
birthplace of poet James Whitcomb Riley (childhood home preserved as a
museum). The genuinely distinctive current-market angle: Hancock County
was Indiana's fastest-growing county in 2023, driven by new subdivisions
and the $460M Hancock Gateway Park master-planned community near I-70/Mt.
Comfort Road — and one of its newest apartment communities is, fittingly,
named Riley Crossing, which ties the historic and current-growth angles
together instead of treating them as two disconnected facts. No property-
management page exists for Greenfield either, so the CTA falls back to
`/indianapolis-property-management`, same as Anderson and Lebanon.

✅ **Ninth and final page built (Sep 17): `indianapolis-market-reports.html`.**
**Correction to the note above:** there is no `indianapolis-property-management.html`
file anywhere in this repo — that page's real content lives outside this
repo (on the live site / elsewhere), not something to "pull from" as a
file. Built with fresh, verifiable facts instead (state capital, ~911,000
in city limits, Marion County ~992,000) plus one genuinely distinctive,
Red-Door-specific angle sourced from this repo's own
`claude/red-door-rentcast-zip-mapping.md`: this is the broadest market Red
Door tracks — a countywide average across the 37 standard-delivery ZIP
codes, versus a single neighborhood or small cluster on every other page —
and the snapshot note says so explicitly rather than presenting it as a
directly-comparable number. **This page is entirely separate from
`/indianapolis-property-management`** (linked from the CTA band, a real
cross-link since that page exists on the live site) — confirmed with
Michael this is not a replacement or overwrite of that page, just a
same-name-prefix sibling with a different search intent (informational vs.
transactional), per the site's intent-separation rule.

**All 9 confirmed market-reports pages are now built as templates.**
Remaining work is real-data wiring (RentCast pipeline) and blog-tag
population once the CMS import exists, not more page-building. Full list:
`indianapolis-market-reports.html`, `fishers-market-reports.html`,
`noblesville-market-reports.html`, `westfield-market-reports.html`,
`greenwood-market-reports.html`, `westside-market-reports.html`,
`anderson-market-reports.html`, `lebanon-market-reports.html`,
`greenfield-market-reports.html`.

- ✅ **URL/content scoping: one page per cluster, not per city.** The
  recurring report content (e.g. "Westside Market Report") is written at
  the cluster level, covering Avon/Brownsburg/Plainfield jointly. Building
  a separate page per city within that cluster would show the same
  underlying posts on 3 near-identical pages — the doorway-page pattern
  already flagged as this site's biggest SEO liability. One page per
  cluster instead; "nearby markets" links to *other* clusters/markets, not
  sibling cities within the same one. This resolves the open question
  under "Genuinely open" above about how these pages should be scoped —
  the qualifying market list is now confirmed too, see "Resolved this
  pass" / the market-list item above: 9 pages, Indianapolis, Fishers,
  Noblesville, Westfield, Greenwood, West Side (this cluster), Anderson,
  Lebanon, Greenfield.
- ✅ **Page content, top to bottom:** intro (genuinely written for the
  cluster, not templated), a small live data snapshot (see below), a card
  grid of recent blog posts + YouTube vlogs tagged to that cluster, a
  "nearby markets" block linking to other clusters, and an owner-facing
  CTA band (rental analysis + "see how we manage here," linking to the
  relevant `-property-management` pages — ties the informational-intent
  page to the transactional pages per the site's intent-separation rule).
- ✅ **No URL-based pagination.** Expected post/vlog volume per cluster is
  low enough (recurring reports run roughly monthly, per cluster) that
  paginated `/page/2`-style URLs would just create thin, near-duplicate
  subpages — the same doorway-page risk as above, at a smaller scale. Show
  a reasonable recent set (mockup uses 6) with a "View all [cluster] posts"
  link into the blog's tag-filtered archive instead of a second URL for
  this page itself.
- ✅ **Live data snapshot at launch — small, reusing existing
  infrastructure.** Rather than waiting on the full structured
  Sanity market-report schema (still "design now, implement later," see
  below), show 2–3 headline numbers (median rent, YoY change, typical
  home profile) pulled from the same per-city RentCast data file the
  homes-for-rent pages already populate (`claude/red-door-homes-for-rent-
  data-schema.md`) — no new API cost or vendor, keeps the page from
  reading as a pure link list. For a cluster page, this means averaging
  or blending the member cities' RentCast figures — exact aggregation
  method (simple average vs. listing-count-weighted) not yet decided, flag
  when building.
- ✅ **Vlogs live on a YouTube channel.** Card grid treats posts and vlogs
  as the same card type with a "Report"/"Video" tag; vlog cards link out
  to YouTube rather than embedding inline (embedding is a reasonable v2
  enhancement, not required for launch).
- ✅ **Card design — LOCKED (Sep 17): the market-reports mockup's post/vlog
  card is the shared pattern.** Homes for Rent, Property Management, and
  the rental-analysis tool's "From Red Door" carousel all use this same
  card (image or video-thumbnail block, type tag, date, title, excerpt,
  city tag) rather than each getting a separate design. Resolves the open
  reference in "Market report data points" below and
  `claude/rental-analysis-tool-build.md` decision #5, both of which had
  been pointing at "whatever gets finalized elsewhere" with nothing
  actually finalized yet.

### Rental analysis — thank-you/tracking page

- [ ] **Add a thank-you page after rental-analysis form submission, for
      conversion tracking.** Captured in full, with the reconciliation
      question against the existing submit-flow design, in
      `claude/rental-analysis-tool-build.md` under "Still open." Now
      part of a broader pre-launch analytics/tracking item (Michael,
      2026-09-22) that also wanted a `/contact` thank-you page (✅ built,
      see that same 🚨 PRE-LAUNCH BLOCKER entry under "Genuinely open —
      do these next") and a GTM/GA4 audit (still open). While building
      the contact one, found the old site's real `/thank-you` and
      `/success` pages embed a Loom video
      (`loom.com/embed/8975328b37a64d55bab0c7d16876cbe5`) — Michael
      confirmed that's this rental-analysis thank-you page's content,
      not contact's; reuse it when this gets built.

### Rental analysis / contact — Turnstile

- ✅ **Fixed (Sep 22): both forms' spam check was reading a field that
  could never be filled.** Both `contact.astro` and `rental-analysis/
  index.astro`'s Turnstile widgets used a `data-callback` naming a JS
  function (`contactTurnstileDone` / `rentalAnalysisTurnstileDone`)
  that was never actually defined anywhere — meant to copy the solved
  token into a custom `turnstile_token` hidden field, but since that
  callback never ran, the field stayed permanently empty. Invisible
  the whole time `TURNSTILE_SECRET_KEY` was unset on the live Worker
  (verification skipped entirely — see below), so it only surfaced
  once that secret was actually pushed live and every genuine
  submission started failing the spam check for real. Fixed by
  reading Turnstile's own real auto-injected `cf-turnstile-response`
  field server-side on both forms, and removing the dead custom
  field/callback client-side.
- ✅ **Fixed (Sep 22): `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`,
  `MAPBOX_TOKEN`, and `RENTENGINE_RENTAL_ANALYSIS_KEY` were never
  actually pushed to the live Worker.** All four existed locally in
  `.dev.vars` from the original build (confirmed real, non-empty
  values) but `wrangler secret put` had apparently never been run
  against production for any of them — confirmed via `wrangler secret
  list` showing only `GITHUB_PAT`, `REBUILD_WEBHOOK_SECRET`, and
  `RENTCAST_API_KEY`. This meant the rental-analysis form's Mapbox
  geocoding step (a hard requirement) was failing on every real
  production submission with a 500, contact's notification email was
  silently never sending (the bug Michael first reported — thank-you
  page loaded, but nothing reached LeadSimple), and Turnstile was
  unenforced sitewide. All four pushed live from the existing local
  values.
- ✅ **Fixed and confirmed end-to-end (Sep 22): Turnstile error 400020
  was an invalid sitekey, not a hostname problem — correcting both this
  session's and the 2026-09-20 session's misdiagnosis.** Error 400020
  is Cloudflare's own "Invalid sitekey" code (confirmed against
  Cloudflare's official docs), not a hostname-allowlist error as both
  the earlier `localhost` note and this session's first pass assumed.
  Adding hostnames to the widget (done first, didn't help) was the
  wrong fix. The real problem: `PUBLIC_TURNSTILE_SITE_KEY`
  (`0x4AAAAAAE9vQxyuh-6dE7ocM4D0D5ZaGkk`) didn't match any real widget
  in the Cloudflare account — Michael confirmed no such sitekey exists
  in the dashboard. Fixed with the real sitekey
  (`0x4AAAAAAE9vQ5M8AWJTqVhj`, not a secret — safe to reference here),
  pushed as the `PUBLIC_TURNSTILE_SITE_KEY` GitHub Actions repo secret,
  redeployed (added a `workflow_dispatch` trigger to deploy.yml along
  the way, so a secrets-only change can redeploy without a throwaway
  commit next time). **Verified for real**, not just "should work now":
  Michael submitted a real contact-form test after the redeploy — it
  passed Turnstile, the row landed in D1's `contact_submissions`, the
  notification email reached `cknight@rdpmindy.com`, and the lead
  landed in LeadSimple. Both forms share the same sitekey/secret, so
  rental-analysis's submit flow should now work too, but hasn't been
  separately re-tested since this fix — worth a real test before
  relying on it.

---

## Decided, not yet executed

- ✅ **`/application-criteria` written and built (Sep 17).** Standalone
  static page (`application-criteria.html`), matching `index.html`'s design
  system, ready to drop into Astro templates later. Michael provided the
  live application's pre-submission disclosure text, the internal
  Application Score Sheet (Google Sheet), and the pet/screening policy
  language; built from all three plus fair-housing research:
  - **Curated, not the full score sheet.** Two categories were cut
    entirely — "Time on Market" and "Number of Applications Received" —
    since they score the *listing's* market conditions, not the applicant,
    and publishing "your approval depends on who else applied" would
    undercut the page's own fairness argument. Everything else applicant-
    controllable (income, DTI, credit, payment/NSF history, bankruptcy,
    auto credit history) is presented as pass/fail standards, not the
    underlying point values or the 90/75/74 score bands — those stay
    internal.
  - **580 credit score boundary fixed.** The source sheet had a genuine
    off-by-one bug (580–620 band gave points, but "580 and below" was also
    listed as an automatic denial, both including 580). Confirmed with
    Michael: 580 passes, 579 does not.
  - **Criminal history language researched and confirmed compliant, with
    two fixes.** Michael's phrasing ("recent misdemeanors or felonies that
    demonstrate a risk to resident safety/property") traces almost
    verbatim to HUD's June 2022 OGC implementation memo. That memo (and
    the 2016 guidance under it) was rescinded by HUD Dec 9, 2025, but the
    Fair Housing Center of Central Indiana's own fact sheets (dated 2025,
    i.e. current, post-rescission) state the identical standard as a
    matter of Indiana law, so the underlying standard still holds. Fixed
    to specify **convictions only** (not "records" broadly — excludes
    arrests, sealed records, expunged records) and added a stated
    opportunity for the applicant to explain circumstances before a final
    decision. **This clause still needs actual attorney sign-off before
    launch** — flagged to Michael, not yet obtained.
  - **Eviction criterion narrowed.** "No evictions on rental history" →
    "no eviction judgments" — FHCCI guidance is explicit that an eviction
    *filing* that didn't result in a judgment, or a sealed record,
    shouldn't count against an applicant.
  - **Pet policy gained a service/assistance-animal carve-out that didn't
    exist in Michael's draft at all.** Breed restrictions, pet fees, and
    pet deposits legally cannot apply to a documented service or
    assistance animal; the page now states this explicitly.
  - Full research trail (exact HUD/FHCCI quotes, source PDFs) is in this
    conversation, not yet copied into a standing repo file — worth doing
    if this page needs revisiting later.
  - ✅ **Ported to real Astro (Sep 21):** `src/pages/application-criteria.astro`,
    content and structure carried over verbatim from the static mockup
    (no interactive widgets on this page, so no data-wiring needed —
    the CSS-and-content-only pages built fastest this session). The
    "Resident Benefits Package" section's link to
    `/residents-benefits-package` was preserved as-is even though that
    page doesn't exist yet anywhere in the repo (neither as a mockup nor
    an Astro page) — a known gap, not something to fabricate a page for
    speculatively. **Attorney sign-off on the criminal-history clause is
    still outstanding** — unchanged from above, not resolved by this port.
- ✅ **`/residents-benefits-package` built (Sep 22)** —
  `src/pages/residents-benefits-package.astro`. This was the gap flagged
  above: unlike every other page this project has ported, it had no
  static mockup anywhere in the repo (checked `application-criteria.html`,
  the migration CSV/inventory analysis, and `archive/pages`, which is
  empty). The old PMW page at this same URL turned out to be just a
  heading and a linked graphic pointing to a PDF flyer
  (`RDPM_resident-benefit-packager2.pdf`) — no real page text of its own.
  Downloaded that PDF directly from the still-live old site (with
  Michael's explicit permission) and restructured its real content — the
  $20k/$100k/$3k/$3k insurance coverages, the $45/month required fee, the
  mobile app / ACH / credit-reporting / air-filter / fee-waiver /
  maintenance-hotline / commission-discount conveniences, and the
  insurance-disclaimer paragraph — into the site's existing
  `.criteria-content`/`.fee-list`/`.criteria-callout`/`.criteria-note`
  template (application-criteria.astro's own classes, since this is
  effectively that page's sibling). No new CSS needed. Same facts as the
  flyer, laid out as web copy instead of an infographic — nothing
  invented.
- [ ] **Tune header/footer logo sizes.** 52px header, 60px footer are
      unmeasured guesses in the homepage CSS. Visual polish only, not urgent.
- [ ] **Fix the `og:image` tag** — currently a relative path, so social
      previews render blank. Needs the absolute domain URL; can't finalize
      until the domain is live. Launch-time reminder, not a today action.
- [ ] **Update Google Business Profile and social avatars** with
      `red-door-profile-1024.png`. Manual task, whenever convenient.
- [ ] **Real hero photography.** In progress — will take time. Current hero
      is an AI-generated placeholder (already WebP, 205KB) with a responsive
      `srcset` still needed once real photos exist.
- [ ] **Photography shoot.** Half a day, 8–12 managed properties plus team
      photos.
- ✅ **Blog title length/clickbait cleanup — done (Sep 19).** This item was
      stale (a mix of two different older audit passes with drifting
      counts, "148"/"143" vs. the "203 unfixed" framing here). The real
      state, checked directly against the live Sanity data: all 309 blog
      posts now have a unique effective SEO title under 60 characters — see
      "Blog categories and all 141 remaining long/clickbait SEO titles
      fixed" above for the full writeup. The "3 posts with no `<title>` tag"
      part of this old item was also a non-issue in practice: all 3 still
      had a real `<h1>`, which is what the migration actually uses as the
      post title (the missing `<title>` tag only ever affected the old
      site's raw HTML, not the real display title). **`/advanced-marketing-platform`
      is a separate, still-open item** — it's not a blog post, it's one of
      the other static pages, and having neither a title nor an H1 at all
      is a different, unresolved problem from this blog cleanup.

---

## Resolved this pass (previously shown open in one branch or the other)

- ✅ **Step order:** Maintenance = 5, Communication = 6. Matches live site.
  **Correction (Sep 17):** the built homepage actually had this backwards —
  both the Owner Services nav dropdown and the Owner Roadmap section
  labeled Communication as step 5 and Maintenance as step 6, contradicting
  this entry. Fixed in both places plus the roadmap's intro sentence.
- ✅ **Airbnb URLs:** both retired, 301 to `/`. Confirmed no distinct
  Airbnb/short-term-rental service page exists on the new site.
  **Found live in the built homepage nav too (Sep 17):** a "Short-Term
  Rentals" top-level nav item still linked to `/airbnb-management`. Removed
  it — it was also silently causing the nav to overflow past the viewport
  edge once the "Free Rental Analysis" CTA button was added, so this was
  the fix for both problems at once.
- 🚩 **Flagged, not fixed:** the built homepage's `--brand` token is
  `#8c0c03`, not the `#8b0e04` CLAUDE.md documents as canonical (sampled
  from the recovered vector logo). Didn't change it — it touches every use
  of the color sitewide and deserves a deliberate look, not a drive-by fix
  buried in an unrelated pass.
- ✅ **PropertyMeld URL mismatch** — being fixed directly (Michael), no
  longer a to-do item.
- ✅ **Nav mockup received (Sep 17)** — full structure captured below under
  "Homepage mockup review." Two small details still need Michael's
  confirmation before it's locked for the header/footer build; see that
  section. Superseded: "parked pending a new mockup" / "don't act on the
  current mock's nav."
- ✅ **Google reviews approach: confirmed static/curated.** No live Google
  Business Profile feed — use what's currently in the mock as-is, managed
  manually going forward (Sep 17).
- ✅ **Three homepage guarantees** confirmed against the pricing page — match.
- ✅ **Choose the host:** Cloudflare Pages, on **Workers Paid ($5/month,
  5,000 builds/month)** — not the Free tier. See Decisions Locked.
- ✅ **RentEngine rebuild strategy:** direct webhook, no debounce logic — see
  Decisions Locked. (Workers Paid's headroom makes batching unnecessary.)
- ✅ **`/owners` confirmed as a genuine 301** to
  `/indianapolis-property-management` (`curl -sI` verified). Matches the
  locked decision to keep the pillar page canonical.
- ✅ **HTTPS/HTTP — confirmed non-issue on the new site.** Cloudflare Pages
  forces HTTPS and handles the www/non-www redirect by default. Was only ever
  a live-site (PMW) problem; PMW pointed to GoDaddy (confirms GoDaddy is the
  registrar/DNS host) — not pursuing further, it's the old site.
- ✅ **Search Console domain property** — add `reddoorrents.com` (no
  protocol, DNS TXT via GoDaddy) if not already done; the existing export
  only covers `https://www.`.
- ✅ **Pillar-page SEO pass — done, reviewed and approved.** 7 pages actually
  needed fixing (not the originally-listed 10 — `/about` and `/testimonials`
  were already fine, `/leasing-process` was mistakenly on the original list).
  See `pillar-page-seo-fixes.csv`.
- ✅ **Typography: Literata, not Fraunces.** One branch's copy of this file
  still said Fraunces — stale relative to its own project's `CLAUDE.md`,
  which has said Literata since the switch. Fraunces was tried and rejected
  (odd `f`/`g` at display sizes via the `WONK` axis).

---

## Decisions locked — reference, nothing to do here

**Stack:** Astro + Tailwind CSS, Sanity CMS (Free tier), **Cloudflare Pages
on Workers Paid ($5/month, 5,000 builds/month)**, VS Code + Claude Code.
Migration rule: move content as-is first, improve after launch.

**Why Cloudflare over Netlify:** Netlify's credit-based billing (300
credits/month free; a deploy is 15 credits, bandwidth 20/GB) would burn
~195 credits/month on blog-publish rebuilds alone, hard cap, no overage
billing. Workers Paid at $5/month gives 5,000 builds/month, beating Netlify
Personal ($9/month, 1,000 credits) on cost and headroom.

**RentEngine (listings):** public API (`/units`), not the iframe — iframed
content isn't indexed on our domain, and listing pages earn real traffic
(confirmed by inspecting the live PMW iframe directly — see listings notes).
Webhook on `units` triggers a rebuild directly on every INSERT/UPDATE/DELETE,
**no debounce** — Workers Paid's headroom makes batching unnecessary at
current portfolio size (22 Available + 8 On Hold). Read-only token, split by
feature from the CMA tool's key. Never call `GET /market-tool/comps` from the
listings build — $0.50/call, belongs to the CMA tool. Old `/_system/...` URLs
were PMW's, not RentEngine's, and cannot be preserved — matters less than
first assessed, since listings are ephemeral traffic, not durable pages.

**City content — three-page model (LOCKED Sep 11):**
`/[city]-homes-for-rent` (all 20 kept, tenant-transactional, real
per-city pages with a "homes nearby" fallback), `/[city]-property-management`
(owner-transactional, now the highest-priority page type, needs real
strengthening not just a template port — Avon pilot built), and
`/[city]-market-reports` (informational, only for cities with active report
coverage — 9-city list confirmed Sep 17, all 9 built as templates, see
"Market-reports page design" above). Full detail, RentCast pipeline
($74/month Foundation plan), and ZIP mapping in `claude/listings-build-notes.md`.

**Listings SEO/URL architecture (LOCKED Sep 9):** 20 real per-city pages, no
catch-all — `/indianapolis-homes-for-rent` doubles as "see everything" via a
same-page "All areas" control, not a second URL. Full reasoning in the
listings notes file.

**Map provider:** Mapbox GL JS, over Google Maps — better basemap styling
control for brand fit, comparable cost at current traffic.

**Rental analysis / CMA tool:** decided and mostly built — see
`claude/rental-analysis-tool-build.md` for all 10 FINAL decisions. Custom
tool, RentEngine `market-tool/comps` as the sole estimate source, fully
automated delivery, validated against 7 real signed leases. Remaining work is
the build itself (Astro SSR routes on this same Cloudflare Pages project,
Cloudflare D1; ~7.5–11.5 focused days).

**Sanity plan:** Free tier. 100 GB assets vs. 209 MB archive, 10k documents
vs. 387 pages — nothing binds. Real constraint is roles (Administrator/Viewer
only on Free — the publisher must be an Administrator). Growth ($15/seat/mo)
if that becomes a real problem, not pre-emptively.

**Logo:** stays as-is. Original vector recovered from designer April
Eichenberg (Sept 2026) — supersedes the traced redraw (5.5KB vs 69KB).
Typefaces unrecoverable (outlined before export) — "red door" was Helvetica
Neue 77 Bold Condensed (condensed further in Illustrator), "Property
Management" was Futura LT Regular. Both commercial; doesn't change site
typography.

**Typography:** Literata for headings, Inter for body/UI. See `CLAUDE.md`
for weights/tracking.

**Content decisions:** step order Maintenance=5/Communication=6. Listing URL
structure `/homes-for-rent/{city}/{address}` for individual unit pages
(distinct from the `/[city]-homes-for-rent` hub pages above). Airbnb URLs
301 to `/`.

**Registrar/DNS — correction (2026-09-20):** GoDaddy is the registrar, but
**not the actual DNS host** — `reddoorrents.com`'s authoritative
nameservers are `ns1-4.nesthubdns.com` (the PMW-era host), confirmed via
an external DNS checker (dns.email) while debugging why Resend DNS
records added in GoDaddy's own DNS panel never verified: they were being
saved to a zone the domain doesn't actually query. GoDaddy's DNS editor
UI is live and editable, but inert, unless the domain's nameservers are
actually pointed at GoDaddy — right now they aren't. Registrar and DNS
host are two different things and this project conflated them; the
original "GoDaddy is the current registrar/DNS host" note below was
wrong on the second half, right on the first. **Practical effect:** any
DNS record meant to actually resolve for `reddoorrents.com` today needs
to go into whatever panel manages `nesthubdns.com`, not GoDaddy, until/
unless nameservers are deliberately cut over (a real risk to audit
everything currently live at NestHub first, not a quick fix). This is
exactly why the rental-analysis tool's Resend sending domain moved to
`mail.rdpmindy.com` instead — see `claude/rental-analysis-tool-build.md`,
decision #8's sending-domain note — rather than fighting reddoorrents.com's
DNS setup for an email feature that didn't need to live there anyway.

Original note, still correct on the registrar half: nameserver access
confirmed, GoDaddy is the current domain registrar. Cloudflare Registrar
(at-cost domains) worth considering after launch, not now.

### Color tokens

| Token | Value | Role |
|---|---|---|
| `--brand` | `#8b0e04` | Logo, primary buttons, accents on white. 9.71:1 on white. |
| `--brand-mid` | `#bc1719` | Button hover, icon fills, underlines, kicker text. |
| `--brand-light` | `#e2565a` | Links and accents on charcoal backgrounds. 4.67:1 on `#1b1b1e`. |
| `--brand-tint` | `#fcecea` | Section washes, badge backgrounds, row highlights. |
| `--gray` | `#717073` | Brand gray, from the logo. Base for muted text. |
| `--ink` | `#171717` | Body text. |
| `--charcoal` | `#252525` | Dark section backgrounds. |
| `--line` | `#e4e3e6` | Borders and dividers. |
| `--soft` | `#f5f5f6` | Alternating section backgrounds. |

Neither `--brand` nor `--brand-mid` is legible on dark backgrounds — always
use `--brand-light` there.

---

## Search Console findings (Jun 2025 – Sep 2026) — reference

Baseline before migration: **26,775 clicks, 3.72M impressions** (undercount —
only covers `https://www.`).

- **Do NOT consolidate the 20 `-homes-for-rent` pages.** 39.6% of all site
  clicks (10,592). Still templated, still needs rewriting with genuinely
  distinct content — now underway via the three-page model above.
- **Keep `/indianapolis-property-management`, 301 `/owners` into it.**
  Confirmed via `curl` — see Resolved section above.
- **The CTR gap is the largest opportunity on the site.** 14 pages hold 2.2M
  impressions and return 8,794 clicks — `/tenants` (210,978 impr., 0.05%
  CTR), `/indianapolis-property-management` (206,572, 0.06%),
  `/airbnb-management-indianapolis` (156,475, 0.20%), `/contact` (148,468,
  0.17%), `/blog` (44,774, 1 click). Addressed for `/tenants` and `/contact`
  via `pillar-page-seo-fixes.csv`.
- **Indexing is not a problem.** 1,658 of 1,732 "not indexed" URLs are
  `/_system/listings/images/…` — property photos, correctly excluded by
  Google. ~625 of ~619 real content URLs are indexed. The 35 genuine 404s
  indicate broken internal links, worth a look.
- **Traffic distribution:** blog is 80% of pages, 5.4% of clicks (143 posts
  earned zero clicks in 15 months, but are indexed, just not ranking) —
  prioritize migration effort by traffic, not page count. 36% of clicks are
  branded.

---

## Listings — real data wired (Sep 18)

Full research, API findings, and design iteration history:
`claude/listings-build-notes.md` — read it before touching this feature
again, especially the Sep 18 corrections (a real showings/booking API
exists; On Hold and photo-hosting decisions are made).

- [x] Listings index/search page — drafted and iterated through v3
      (mockup only, not rebuilt against real data this pass — see open
      item below).
- [x] Listing detail page template — drafted through v4, **then actually
      built against real data (Sep 18):** 28 real listing detail pages,
      one per currently-Available RentEngine unit, at
      `/homes-for-rent/{city}/{address-slug}.html` (matches the locked
      URL structure in `CLAUDE.md`). Real photos (hotlinked from
      AppFolio's CDN, per the Sep 18 decision), real specs/fees/
      description, Apply Now wired to each unit's real
      `custom_application_url`. Rental Requirements section deliberately
      does **not** render the raw `min_resident_qualifications` API
      field — it's identical across every unit and contains the same
      non-compliant eviction/felony language already fixed on
      `tenant-screening.html`; links to `/application-criteria` instead.
      **v5 rebuild, same day, against the real RentEngine listing page and
      our own real schedule-a-showing flow (not just the reference
      mockup) — see `claude/listings-build-notes.md` for the full
      writeup:** real 1-large+4-thumbnail gallery with a full-screen
      lightbox, Schedule-a-Showing/Apply-Now button order fixed to match
      RentEngine's real page (Schedule primary/first), the old lead-
      capture form removed and replaced with a link out to RentEngine's
      real hosted booking page (`app.rentengine.io/public/schedule-showing/
      {unitId}?accounts={accountId}` — see open item below, this
      supersedes the plan to build a custom booking form), a real
      itemized "Total Move-In Cost" card, a live single-pin Mapbox
      location map, and an "Other Red Door Homes Nearby" section (real
      haversine-ranked units from the same 28-unit dataset). Two real
      bugs found and fixed in this pass: a Mapbox script-load-order bug
      (map silently never initialized) and a lightbox backdrop that
      wasn't fully opaque (page content behind it stayed legible).
      Verified on desktop and a 375px mobile viewport.
- [x] Empty/thin-inventory handling — resolved into the city-page
      architecture (default-city + "homes nearby" fallback), **and now
      live:** each of the 20 `-homes-for-rent` pages either shows real
      matching listing cards or an honest "nothing available right now"
      message (see "Homes-for-rent pages" above).
- [x] **City-to-listing matching solved without geocoding:** RentEngine's
      `/units` only returns a broad city name (e.g. every Indianapolis
      address just says "Indianapolis," no township), so Indianapolis-area
      units are cross-matched to the correct township/neighborhood pages
      by ZIP code against `claude/red-door-rentcast-zip-mapping.md`'s
      already-locked ZIP lists — a unit can and does legitimately appear
      on more than one page (e.g. a shared-ZIP township plus Downtown
      Indianapolis) since each listing is real, not templated content.
      One unit (Pendleton, ZIP 46064) matched no served city page and is
      currently **not linked from anywhere** — Pendleton isn't one of the
      20 served cities; its detail page still exists and is real, just
      not discoverable via city-page browsing yet.
- ✅ **No longer a fixed snapshot (2026-09-20-21) — both listings and
      RentCast city data are now genuinely live-pulled, not the old Sep
      18 one-time snapshot.** All 20 homes-for-rent pages and every
      listing detail page are real Astro `getStaticPaths()` routes that
      call RentEngine's `/units` live at every `npm run build` — the old
      28-unit static snapshot this item originally described no longer
      exists as the data source. Separately, `workers/rentcast-refresh/`
      (a standalone Cloudflare Worker, its own `wrangler.toml`, not part
      of the main site) pulls RentCast's `/v1/markets` for all 50 real
      ZIPs (`claude/red-door-rentcast-zip-mapping.md`), aggregates
      per-area (weighted by `totalListings`, not a plain mean — see the
      Worker's own `aggregate.ts` for the exact method), and writes into
      the shared `rentcast_city_cache` D1 table (same table decision
      #10's bedroom adjustment reads/writes — see
      `claude/rental-analysis-tool-build.md`). Verified against a real
      live pull: 49/50 ZIPs succeeded (46282 genuinely has no RentCast
      data — a real gap, not a bug), all 20 city rows wrote correctly via
      the real D1 binding API, and decision #10 correctly read one back
      (tier 2, thin-sample, on a real Avon row).
- ✅ **`workers/rentcast-refresh` deployed for real (2026-09-21).** A real
      D1 database now exists (`red-door-rental-analysis`,
      `92f2e5cd-3589-4861-86d1-8a96d7d9afb9` — filled into both this
      site's own `wrangler.toml` and the Worker's) with the schema
      migration applied to the **remote** database, not just `--local`
      emulation. The Worker is live at
      `https://red-door-rentcast-refresh.mtaylor-0d7.workers.dev`, its
      Cron Trigger (`0 6 1 * *`, monthly) is registered, and
      `RENTCAST_API_KEY` is set as a real Worker secret (set directly by
      Michael via `wrangler secret put` in his own terminal — never
      passed through chat or a tool call). Verified against two real
      manual-trigger runs (`POST` to the Worker's own `fetch` handler,
      its documented on-demand test path): both wrote all 20 city rows to
      the real remote `rentcast_city_cache` table with sane data (e.g.
      Avon: averageRent $2,140 across 83 listings). Same 46282 gap as the
      earlier local verification (genuinely no RentCast data for that
      ZIP) — the aggregator's graceful-degradation logic absorbed it
      correctly into `indianapolis-in`'s `zipsMissing` rather than
      failing the whole city, exactly as designed.
      **Also wired (prior session, commit `fb4bd89`):** the 19 simple
      homes-for-rent Astro pages now read `rentcast_city_cache` via
      `cloudflare:workers`'s `env.DB` at build time
      (`src/lib/listings/homes-for-rent-content.ts`'s `loadCityMarketData`),
      falling back to the static `data/homes-for-rent/*.json` snapshot
      only when a city has no D1 row yet. The next `npm run build` of the
      main site will pick up this real September 21 data instead of the
      frozen September 17 snapshot.
- ✅ **RentEngine `units`-table webhook → real rebuild, done end-to-end
      (2026-09-21).** The main site is now deployed for real too — not
      just `workers/rentcast-refresh`:
      `https://red-door-site.mtaylor-0d7.workers.dev` (no DNS change;
      `reddoorrents.com` still points at the old platform, so nothing
      public-facing changed). **Real finding: Cloudflare's classic
      "Deploy Hook"** (a POST-able rebuild URL, what this item originally
      assumed) **is a Pages-only feature** — confirmed against current
      Cloudflare docs. This site deploys as a "Worker with static
      assets" via `wrangler deploy`, which uses a different system
      ("Workers Builds") that's Git-push-triggered only, no manual
      webhook/rebuild-URL of its own. Bridged the gap instead with:
      `src/pages/api/rebuild-webhook.ts` (checks a shared secret, then
      calls GitHub's `repository_dispatch` API) +
      `.github/workflows/deploy.yml` (listens for that dispatch, or an
      ordinary push to `main`, and runs the real `npm run build &&
      wrangler deploy`). RentEngine's own Create Webhook dialog sends
      its "API Key" as an `X-API-Key` header (now confirmed, was an open
      question) — registered against the `units` entity, `INSERT` /
      `UPDATE` / `DELETE`, pointing at
      `https://red-door-site.mtaylor-0d7.workers.dev/api/rebuild-webhook`.
      Verified with a real POST all the way through: webhook → GitHub
      dispatch → Actions run → successful deploy. Setup needed 5 real
      credentials Michael created and set himself (never passed through
      chat): `GITHUB_PAT` + `REBUILD_WEBHOOK_SECRET` as Worker secrets,
      and `CLOUDFLARE_API_TOKEN` / `SANITY_PROJECT_ID` /
      `PUBLIC_TURNSTILE_SITE_KEY` / `RENTENGINE_LISTINGS_KEY` as GitHub
      Actions repo secrets. **Also found and fixed a separate, more
      serious bug while deploying**: `astro build`'s `getStaticPaths`
      prerendering resolves the D1 binding through the same local
      Miniflare simulation `wrangler dev` uses by default, not the real
      database — every build was silently falling back to each city's
      frozen Sep 17 static snapshot even though `rentcast_city_cache` had
      fresh rows, which would have made the entire D1-wiring effort
      pointless in production. Fixed via `remote = true` on the D1
      binding in `wrangler.toml` (Cloudflare's "remote bindings"
      feature) — see that file's own comment.
- ✅ **"Schedule a Showing" resolved (Sep 18, v5 rebuild) — links out to
      RentEngine's own real hosted booking page** instead of a custom
      in-page form. Simpler than building against `POST /showings/create`
      directly, and sidesteps a real limitation: the read-only token this
      build uses cannot call that endpoint (it's not read-only), so a
      fully custom flow couldn't actually book anything today anyway. The
      `GET /showings/availability` + `POST /showings/create` API notes in
      `claude/listings-build-notes.md` remain accurate if a custom flow is
      revisited once a write-capable token exists and the full
      prescreening `questionAnswers` set is documented.
- ✅ **Indianapolis page rebuilt as the real search/filter/map experience
      (Sep 18) — the "All areas" control is built.** Michael's call: this
      page (not a separate `/homes-for-rent` catch-all, matching the
      locked architecture) is the site's actual main entry point, so it
      needed real search, filters, and a map, not just a plain grid. The
      other 19 `-homes-for-rent` pages are unchanged — plain grid only,
      by design, per the "not for all city pages" instruction. Built:
      - City pills: Indianapolis (current page) / Westfield / Carmel /
        Fishers / Noblesville are real links to each city's own page;
        "All areas" is the only client-side toggle, exactly per the
        locked reasoning (doesn't dilute the page's own indexed content
        since revealed listings aren't in the initial render). Pendleton
        dropped from the pill row (real listing there, but no served-city
        page to link to — Michael's call, Sep 18).
      - Search (`city, ZIP, or address`) and filters (beds/price/sqft/
        pets) run client-side against all 28 real listings; the 20
        Indianapolis cards are genuinely server-rendered, the other 8
        live in a JSON script blob and only get injected into the DOM
        when a search/filter/"All areas" match needs them.
      - ✅ **`?areas=all` query-param convention decided and built** —
        resolves that open item. Self-referencing canonical tag on the
        bare URL confirmed unaffected. Header nav's "Homes for Rent" link
        updated sitewide (93 pages + the shared header fragment) to
        `/indianapolis-homes-for-rent?areas=all`, per the locked spec.
      - ✅ **Live Mapbox GL JS map, not a static mock** — real interactive
        map with a pin per visible listing (real `address.coordinates`),
        popups with photo/price/address/View details, synced to
        whatever the current search/filter/area state shows. Uses a
        public Mapbox token (pk.…, safe to embed client-side, not a
        secret like the RentCast/RentEngine keys) pasted in chat Sep 18.
      - Found and fixed while building: `history.replaceState` on the
        `?areas=all` URL update needs a try/catch — it can throw in
        some environments (confirmed in this session's own preview
        sandbox, which renders local files via a `data:` URL); wrapped
        so a URL-update failure never blocks the actual filtering.
- [ ] Rebuild the listings **index/search page** design draft (v3
      mockup) into something reusable, or fold it into work on the other
      19 city pages later if they ever need the same treatment — not
      requested this pass.
- [ ] Sorting UI, pagination/infinite-scroll (not urgent at 28 listings).
- [ ] Per-listing sitemap entries (28 real URLs now exist and should be
      in `sitemap.xml` once that's built).
- [ ] The remaining open sub-decisions listed under "Genuinely open"
      above (`accepts_vouchers`
      mismatch — confirmed again in the real Sep 18 pull, still null on
      every unit despite marketing copy advertising Section 8 on at
      least one listing).

---

## Areas Served panel — superseded (Sep 17)

**This section describes an older, evergreen-panel design that was never
built.** The homepage's Areas Served section is now built — see "Homepage
mockup review" → "Areas Served / cities-we-serve section" above for what
actually shipped (9 county cards + neighborhoods card + townships panel,
matching Michael's reference mockup). The items below (rent-range data,
per-city operating notes, tenure tiles) were not part of that build and
remain genuinely open if this richer per-city data layer is still wanted —
kept here for reference, not deleted, since none of it was decided against,
just superseded by a different design direction.

Original framing, unchanged: removed from the homepage base entirely.
Direction: evergreen content, no monthly data maintenance.

- [ ] Build the city data file — one entry per area.
- [ ] Per area: rent **range**, tenure in the market, 2–3 local operating
      notes. Rule: if a bullet could be pasted onto another city unnoticed,
      cut it.
- [ ] Draft with Claude Code, team review before shipping.
- [ ] Keep the city-vs-metro comparison bar. Skip the tenure tile where thin.
      Annual review of rent ranges.

**Fair Housing fixes required before restoring this content** (not live now,
but still in the mock repo):
- Brownsburg blurb: "Family-oriented demand and westside growth" → "Steady
  westside demand and consistent renewals."
- Brownsburg watch-note: "family-oriented presentation" → "move-in
  presentation."
- Fishers watch-note: "School-calendar timing" → "summer leasing season."
- **Also found live on `/broad-ripple-property-management` (Sep 10):**
  "reputation for being socially, economically, and ethnically diverse" —
  describes a neighborhood by resident demographics. Replace with what's
  actually there: cultural district status, restaurants, galleries, Butler
  University, the Monon Trail. This was missed by the original audit because
  it read as area-history trivia rather than marketing copy — a reminder
  that this pattern can hide in unexpected places.

(False positives, no action: "single-family" as property type, CSS
`:last-child`/`font-family`, a customer testimonial mentioning "family.")

**Remaining panel gaps:** no proof-of-presence (tenure/homes-managed) per
city; per-city content sits in `data-*` attributes rather than the shared
data file; "How Red Door helps" is near-identical across all ten cities and
repeats the Owner Roadmap above it.

---

## Market report data points — design for now, implement later

Not built in the initial launch, but the schema needs to support it from day
one.

- [ ] Structured numeric fields in the Sanity blog/market-report schema:
      city, report month, median rent, rent change YoY, median sale price,
      sale change YoY, days to lease.
- [ ] Stamp every figure "Data as of [month]," hide numbers older than ~120
      days.
- [ ] Consider Zillow ZORI/ZHVI CSVs for the external half (asking rent
      caveat applies).
- [ ] Strongest stat is proprietary: days-to-lease from AppFolio, nobody
      else can show it.
- [x] **The rental analysis tool's "From Red Door" post carousel** (see
      `claude/rental-analysis-tool-build.md` decision #5) will read from this
      same schema once it exists — card styling is now decided, see
      "Card design — LOCKED (Sep 17)" under "Market-reports page design"
      above: the market-reports mockup's card is the shared pattern used
      here too.

---

## Build phases

### Design system
- [x] **Header and footer with final navigation — done.** This checklist
      item was stale: checked the actual `index.html` Sep 18 and both the
      "Owner Portal"/"Tenant Portal" dropdown entries and the utility-bar
      login-link removal (both locked Sep 17) were already built, and a
      full 5-column footer (brand/contact, Main Navigation, Owner
      Resources, Tenant Resources, Communities Served, bottom bar with
      Sitemap/Privacy/Accessibility + social links) already existed too —
      just never checked off here. Both are extracted as `frag_header.html`
      / `frag_footer.html` and reused across every built page.
      **Real defect found and fixed while verifying (Sep 18):** the
      footer's YouTube/Instagram/TikTok links (and the matching JSON-LD
      `sameAs` entries) used a handle, `@reddoorpropertymanagement`, that
      isn't Red Door's — YouTube and TikTok 404, and Instagram resolved to
      an unrelated person's account. Fixed sitewide (65 files) to the
      verified real handle `@reddoorrents` (confirmed live on all three
      platforms), and added Facebook + LinkedIn, which the footer was
      missing entirely despite both being real, live Red Door accounts
      linked from the live Contact page. Fixed in the two build scripts
      with hardcoded `sameAs` arrays too (`build_indy_pm.js`,
      `build_pm_page.js`) so future page builds don't regress.
- [ ] Component library: hero, CTA band, testimonial carousel, service card,
      video embed, FAQ accordion, form
- [ ] Self-host Literata + Inter as woff2, two weights per family max

### Templates and migration
- [x] **Pillar page template, port the 8 existing pillar pages — all 8 built
      (Sep 18).** See "Pillar pages — all 8 built" below.
- [x] City pages: three-page model per `CLAUDE.md`/listings notes — not a
      name-swap template. All 9 `-market-reports` pages (Sep 17), all 20
      `-homes-for-rent` pages (Sep 17), and all 19 `-property-management`
      pages (Sep 17) are now built — see "Homes-for-rent pages — all 20
      built" and "Property-management pages — all 19 built" below for the
      full lists, data sourcing, and open items.
- [x] **One-off pages — mostly built (Sep 18).** `about.html`,
      `contact.html`, `testimonials.html` (55 real testimonials),
      `tenants.html`, `notice-to-vacate.html` (rebuilt to direct to the
      Tenant Portal rather than port the live site's stale SSN-collecting
      form), and `eviction-protection-program.html` are all built and
      pushed. Airbnb doesn't need a page — it's a 301, now in
      `_redirects`. Still open: Guaranteed Lease Program (stale, no live
      source content, see "Genuinely open" above) and the two
      eSign-widget verification pages (deferred, see "Genuinely open"
      above).
- ✅ **Blog index, post template, and all 309 posts migrated (Sep 19).**
      This is the first real Astro + Sanity work in the project — everything
      else built so far is still standalone static HTML. Full writeup in
      `claude/blog-migration-notes.md`; short version: a real Astro project
      now lives in this repo (`src/`, `astro.config.mjs`, `package.json`),
      with the header/footer/CSS extracted from `index.html` so it matches
      every other page, an embedded Sanity Studio at `/studio`, and
      `scripts/migrate-blog.mjs` converting all 309 real posts from the
      sibling `red-door-pmw-website-scrape` project into Sanity documents —
      real Portable Text bodies, real uploaded images (156 unique, deduped
      by Sanity automatically), real YouTube embeds, real tables, joined
      against `content-fixes.csv` for the 106 posts with an SEO fix.
      **`pillar-page-seo-fixes.csv` doesn't apply here** — it covers the 8
      pillar pages, not blog posts; only `content-fixes.csv` was relevant
      to this join.
      **Author data quality issue resolved by decision, not by guessing:**
      of 5 raw author strings in the source data, "RAIZEL ANN NAME" (an
      apparent unfilled template field) and "System" (auto-generated
      content, no real byline) both map to Michael Taylor per his explicit
      call (Sep 19), not invented as fake authors.
- ✅ **Blog categories and all 141 remaining long/clickbait SEO titles
      fixed (Sep 19).** Full writeup in `claude/blog-migration-notes.md`.
      A 6-topic taxonomy (Market Reports, Landlord Tips, Tenant Resources,
      Investment Strategy, Property Maintenance, Client Stories) was
      derived from the real 309 titles, not invented — the source archive
      still has zero native tags/categories, this is new. Every Market
      Reports post also gets a city tag (Michael's decision), verified 0
      posts missing one. The 143-long-title item from the earlier audit is
      now fully closed: 106 already had a real fix from `content-fixes.csv`
      (applied during the Sep 19 migration), and the remaining 141 (the
      real current count, not the older "143"/"148" figures floating
      around in this file and CLAUDE.md — always trust a fresh count over
      those) are fixed now too — 56 via a systematic "{City} Rental Market
      Report — {Month Year}" template, 85 hand-rewritten individually.
      **309/309 posts now have a unique effective SEO title, 0 over 60
      characters** — verified directly against the live dataset, not
      assumed from script output.
      **Still open for the blog specifically:** wiring the real Astro
      build into Cloudflare Pages deployment (still building/previewing
      locally only), and folding the other 93 static HTML pages into this
      same Astro project eventually instead of running two separate
      systems side by side.
- [ ] **Listings: build from the RentEngine API — do not use an iframe
      embed.** Index, detail, and city-hub pages per the locked architecture.
- [ ] Re-link external services: AppFolio owner/tenant portals, PropertyMeld,
      Findigs
- [ ] Build the rental-analysis tool per `claude/rental-analysis-tool-build.md`

> **Build dependency:** `archive/` still contains the OLD titles and metas.
> Any import must join **both** `content-fixes.csv` (173 rows) **and**
> `pillar-page-seo-fixes.csv` (7 rows) on `url`, using `new_title` /
> `new_meta` where a row exists in either, or those fixes are lost silently.

### SEO and technical
- [ ] Every old URL exists at the identical path, or has a 301
- [ ] Port all title tags and meta descriptions
- [ ] Add LocalBusiness and FAQ schema markup (LocalBusiness is the priority)
- [ ] Rebuild `sitemap.xml` and `robots.txt`
- [ ] Reinstall Google Tag Manager with the same container ID
- [ ] Accessibility pass — footer publicly commits to WCAG 2.0 Level A
- [ ] Test every form end to end, confirm submissions reach a monitored inbox

### QA and launch
- [ ] Cross-browser and device testing, mobile first
- [ ] Lighthouse scores per template
- [ ] Crawl staging for broken links
- [ ] Staging subdomain review before DNS cutover
- [ ] Launch Tuesday or Wednesday morning, never Friday
- [ ] Resubmit sitemap in Search Console same day
- [ ] Keep PMW live until the new site is verified

### Post-launch
- [ ] Search Console daily for two weeks, then weekly
- [ ] Watch form submission volume closely
- [ ] One-hour CMS walkthrough with the blog-publishing team member

---

## Timeline

| Effort level | Duration |
|---|---|
| Full-time | 3–4 weeks |
| 10–15 hrs/week | 8–10 weeks |
| 5 hrs/week | 4–5 months |

This estimate predates the CMA tool's ~7.5–11.5 day build and the full
listings-experience buildout (index, detail, and 20 city-hub pages plus the
three-page content model), both of which add real time beyond the original
scope this table was based on. Worth recomputing before committing to a
launch date out loud.
