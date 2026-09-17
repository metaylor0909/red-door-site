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

---

## Where things stand

387 pages total (309 blog, 40 city, 24 pillar/catch-all, 14 other), fully
archived locally and backed up to Google Drive. Content audit complete —
`content-fixes.csv` (173 fixes) and `pillar-page-seo-fixes.csv` (7 fixes,
reviewed and approved) hold every verified title/meta replacement. Homepage
base is built. Logo is the real vector, brand colors finalized. Hosting
(Cloudflare Workers Paid), CMS, the city three-page content model, the
listings API architecture, and the CMA tool are all decided. What's left is
a handful of small open sub-decisions (mostly listings-specific) plus the
actual build phases.

---

## Genuinely open — do these next

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
- [ ] **Six listings-specific open items** — all detailed in
      `claude/listings-build-notes.md`, "Open items summary": the `?areas=all`
      query-param convention + canonical tag, the real "Schedule a showing"
      destination, the `accepts_vouchers` mismatch, confirming Apply now's
      target, `On Hold` unit handling, and hotlink-vs-cache for listing
      photos.
- [ ] **Per-listing title/meta/H1/schema generation**, templated from
      address, beds, baths, city (currently these pages have none).
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

**1 page left: Indianapolis.** Unlike the other 8, Indianapolis already has
its own built, real `/indianapolis-property-management` page with existing
content — that page (not fresh web research) is the right source to pull
from for the market-reports intro, since re-researching Indianapolis from
scratch would risk drifting from what's already been said about it
elsewhere on the site. Once built, all 9 confirmed market-reports pages
are done as templates — remaining work becomes real-data wiring
(RentCast pipeline) and blog-tag population once that CMS import exists,
not more page-building.

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
      `claude/rental-analysis-tool-build.md` under "Still open."

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
- [ ] **203 blog titles still unfixed**, 148 over 60 characters, 4 with no
      title at all (3 of those substantial posts, 2,949 and 2,438 words;
      `/advanced-marketing-platform` has neither title nor H1). Lower
      priority — long titles truncate rather than incur a penalty. Fold into
      migration rewrites.

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
coverage — city list still needed). Full detail, RentCast pipeline
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

**Registrar/DNS:** nameserver access confirmed, GoDaddy is the current
registrar/DNS host. Cloudflare Registrar (at-cost domains) worth considering
after launch, not now.

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

## Listings experience — mostly designed, build still ahead

Full research, API findings, and design iteration history:
`claude/listings-build-notes.md`. Summary status:

- [x] Listings index/search page — drafted and iterated through v3.
- [x] Listing detail page template — drafted and iterated through v4.
- [x] Empty/thin-inventory handling — resolved into the city-page
      architecture (default-city + "homes nearby" fallback).
- [ ] Rebuild as 20 genuine per-city server-rendered pages (same work item as
      the homes-for-rent page rebuild in the three-page model above).
- [ ] Sorting UI, pagination/infinite-scroll (not urgent at 22 listings).
- [ ] Live Mapbox GL JS embed (provider decided, integration not built).
- [ ] The six open sub-decisions listed under "Genuinely open" above.

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
- [ ] Header and footer with final navigation — **partially built (Sep 17)
      on the homepage:** sticky-on-scroll CTA and button color are done
      (see "Homepage mockup review" above). Still missing from the actual
      nav markup: the "Owner Portal"/"Tenant Portal" dropdown entries, and
      removing the utility bar's "Owner Login | Tenant Login" links —
      both locked Sep 17 but not yet built into the header component
      itself. Footer not started.
- [ ] Component library: hero, CTA band, testimonial carousel, service card,
      video embed, FAQ accordion, form
- [ ] Self-host Literata + Inter as woff2, two weights per family max

### Templates and migration
- [ ] Pillar page template, port the 8 existing pillar pages
- [ ] City pages: three-page model per `CLAUDE.md`/listings notes — not a
      name-swap template
- [ ] One-off pages: About, Contact, Testimonials, Tenants, verification
      pages, Eviction Protection, Guaranteed Lease, Airbnb
- [ ] Blog index, post template, categories, migrate all posts (join
      `content-fixes.csv` AND `pillar-page-seo-fixes.csv` on `url` during
      import — see build dependency note)
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
