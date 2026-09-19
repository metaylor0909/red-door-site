# Blog Migration — Reference Notes

Standing context for the blog migration to Astro + Sanity — the first real
use of that stack in this repo. Everything else built so far (homepage,
pillar pages, all city pages, all 28 RentEngine listings) is standalone
static HTML, "ready to drop into Astro later." The blog is where that
actually started happening. Read this before touching the blog again.

---

## Where the real source content actually lives

**Not in this repo.** `red-door-site/archive/blog/` and `archive/pages/`
are empty placeholder files only (`.gitkeep`) — the "fully archived
locally" note elsewhere in this project's docs is stale/wrong for this
folder specifically.

The real, complete scrape lives in a **separate sibling project**:
`C:\Users\mtayl\red-door-pmw-website-scrape\`. Confirmed present there:

- `archive/blog/*.html` — all **309** real post files. Clean structure:
  `<h1 class="post-title">`, `<div class="post-details">Author -
  Weekday, Month DD, YYYY</div>`, `<div class="post-body">` with the real
  article HTML.
- `archive/images/` — **329 real image binaries** (jpg/png/webp), matching
  what the posts reference.
- `content-fixes.csv` — **173 rows total, 106 of them blog URLs** — the
  title/meta SEO fixes CLAUDE.md describes. Also not in this repo; also
  real and present in the scrape project.
- `red-door-migration-plan.csv`, `red-door-inventory-analysis.md` — the
  full per-URL migration plan for all 387 pages.

If a future session needs the raw source again, look there first before
assuming it needs to be re-scraped.

---

## Source data quality findings (confirmed by direct inspection, not assumed)

- **5 distinct raw author strings**, not more, not fewer:
  Michael Taylor (92), RAIZEL ANN NAME (64), Carlos Piñón (58), Chris
  Knight (51), System (44). 92+64+44 = 200 real Michael Taylor posts once
  the mapping below is applied; 200+58+51 = 309, confirmed exactly against
  the live Sanity dataset after import.
- **"RAIZEL ANN NAME" and "System" are not real bylines.** The former
  reads like an unfilled template field on the old site; the latter is
  presumably auto-generated content. **Michael's decision (Sep 19): both
  map to Michael Taylor.** Not guessed at — asked and answered before the
  migration script ran.
- **No tags or categories exist anywhere in the source.** Every post's
  `blog-tag-list` div scraped empty across all 309 files. The Sanity
  schema (`category.ts`) supports categories so the door isn't closed, but
  none were invented or assigned — that's a real, separate decision if
  Red Door wants a taxonomy later.
- **All 309 posts have a real `<meta name="description">`** — used as the
  `excerpt` field and as the SEO description fallback when
  `content-fixes.csv` doesn't have a better one for that post.
- **3 posts have no `<title>` tag** (matches CLAUDE.md's count) but all 3
  still have a real `<h1 class="post-title">`, so the post's displayed
  title was never actually at risk — `post.title` is sourced from the H1
  universally, not the `<title>` tag, which is only used indirectly via
  `content-fixes.csv`'s `new_title` for the SEO `<title>` override.
- **Image references: 4,179 `<img>` tags across all posts, 3,869 matched
  a real file.** Of the 310 unmatched, nearly all are the same
  `/images/google-review.png?v2` — a shared "Google review" CTA graphic
  embedded in almost every post (once per post), not editorial content.
  **Deliberately excluded from the migration** (see
  `SKIP_IMAGE_BASENAMES` in the script) rather than uploaded 309 times and
  left cluttering every post body. One post references a literal
  placeholder filename, `your-image-of-fishers-or-community.jpg`, that
  never existed on the live site either — skipped, not fabricated.
- **URL slugs preserve the live site's actual, inconsistent casing.**
  Some post filenames are all-lowercase
  (`5-tips-for-getting-the-best-return-on-your-investment-property.html`),
  others are mixed-case
  (`How-Much-Does-Property-Management-Cost-In-Indianapolis.html`) —
  confirmed this is real (the live URL list in `scripts/urls.txt` matches
  the scraped filename casing exactly), not a scraper artifact. The
  migration never lowercases or otherwise normalizes the slug — it's used
  verbatim from the filename to preserve every existing URL exactly, per
  the site's hard rule. Only the internal Sanity document `_id` gets
  lowercased/sanitized (that's just Sanity's internal key, not a public
  URL).

---

## Sanity schema (`schemaTypes/`)

- `post.ts` — title, slug (exact, see above), publishedAt, author
  (reference), categories (array of references, unused for now), mainImage,
  excerpt, body (Portable Text), a shared `seo` object (title/description
  overrides), and two migration-only fields kept for QA traceability but
  not shown on the site: `legacyUrl` (the exact old `reddoorrents.com` URL)
  and `legacyAuthorRaw` (the unedited scraped author string, e.g. "System"
  or "RAIZEL ANN NAME" — so the real mapping decision stays auditable after
  the fact).
- `author.ts` / `category.ts` — plain, small document types.
- `blockContent.ts` — the Portable Text schema. Scoped to what the real
  archive actually contains, confirmed by surveying tag frequency across
  all 309 post bodies (not guessed at): paragraphs, h2-h4 (h1 inside a body
  folds to h2 since the post's own title is the page's real h1; h5 folds to
  h4 since the schema doesn't have a separate style for it), bullet/numbered
  lists, bold/italic/underline, links, blockquotes, inline images, a real
  custom `youtubeEmbed` object type (218 iframe embeds found across the
  archive), and a real custom `table` object type (29 tables — mostly
  WYSIWYG 3-column "feature" layouts, not real tabular data, but the actual
  text needed a home).
- `seo.ts` — shared SEO title/description object, reused on `post`.

---

## The migration script (`scripts/migrate-blog.mjs`)

Not a scratchpad one-off — committed to the repo, because unlike the
static-HTML build scripts elsewhere in this project (`build_listing_detail.js`
etc., whose *output* is what matters and gets committed), this script reads/
writes through the project's own `.env` and Sanity client and has real
ongoing value if content ever needs re-importing or the mapping logic needs
revisiting.

Usage:
```
node scripts/migrate-blog.mjs                  # dry run, all 309, no writes
node scripts/migrate-blog.mjs --limit 3         # dry run, first 3 only
node scripts/migrate-blog.mjs --limit 3 --write # ACTUALLY writes 3 posts
node scripts/migrate-blog.mjs --write           # ACTUALLY writes all 309
```
Always validate with a small `--write` batch before running the full,
unlimited `--write` pass — that's exactly how this was actually run (dry
run → 3-post real write, checked visually in a live preview → full 309
write → two more bugs found only at full scale → both fixed → full 309
write run again).

**Idempotent by design.** Both posts and authors use deterministic `_id`
values (`post-{slug}`, `author-{name}`) and `createOrReplace`/
`createIfNotExists`, so re-running the script after a fix doesn't create
duplicates — it just overwrites the same documents with corrected content.
Confirmed directly: re-running the full write after a bug fix still shows
exactly 309 posts and 156 image assets in the live dataset, not double.

**Image dedup is automatic.** Sanity's asset pipeline hashes uploaded
binaries and returns the existing asset if an identical one already
exists — re-running the script re-"uploads" the same 156 images without
creating duplicates or orphaned assets (confirmed: 0 orphaned assets after
two full write runs).

### Real bugs found while building this, in the order they surfaced

1. **HTML tag survey was initially wrong.** A first attempt at surveying
   which tags appear in post bodies scanned the *whole* HTML file
   (including `<head>`, `<nav>`, chrome) instead of just the `post-body`
   div, wildly overcounting things like `<i>`/`<b>` that only appear in
   site-chrome icon fonts, not real article content. Fixed by writing a
   proper balanced-div extractor before trusting any tag-frequency numbers
   used to scope the schema.
2. **Table cells with internal paragraph structure lost their formatting.**
   `$(td).text()` concatenates a cell's child elements with no separator at
   all — a heading immediately followed by a paragraph inside the same
   `<td>` (common in the source's WYSIWYG 3-column layouts) came out as one
   run-on sentence. Fixed with a `cellText()` helper that joins direct
   block-level children with `\n\n` instead of flattening blindly.
3. **YouTube embeds nested inside a `<p>` were silently dropped.** The
   real markup is `<p><span class="fr-video ..."><iframe
   src="...youtube.com/embed/..."></iframe></span></p>` — a Froala-editor
   video-embed wrapper. The block-level walker only checked for `<iframe>`
   as a *direct* child of a container, never inside the inline/paragraph
   walker, so nested embeds produced nothing. Fixed by adding the same
   iframe-detection branch to both walkers.
4. **A stray `export` keyword landed on the wrong declaration.** While
   temporarily exporting two functions for standalone testing, an `Edit`
   call's search string matched *inside* an already-modified line rather
   than the intended one, leaving `export` dangling before a comment and
   stripping it from the function that actually needed it. Caught
   immediately by re-running the direct-execution path before trusting the
   "fixed" inspector output — worth remembering that a partial-string
   match right after a previous edit can land somewhere unintended.
5. **Two bugs only surfaced at full scale (309 posts), not in the 3-post
   validation batch:**
   - Body images *beyond* the first one (the one promoted to `mainImage`)
     had no Astro-side Portable Text renderer registered at all —
     `astro-portabletext` doesn't ship a default for arbitrary object
     types like `image`, only for the "core" block/list/mark types. Fixed
     by adding `src/components/portabletext/ImageBlock.astro` and
     resolving the asset URL directly in the GROQ query
     (`_type == "image" => { "asset": asset->{ url } }`) rather than an
     N+1 fetch per image at render time.
   - A link containing a `<br>` mid-tag (found in a leftover page-chrome
     CTA grid scraped into one post's body, `<a><span>Text<br
     />More</span></a>`) left its `markDef` scoped to the block *before*
     the `<br>` split, while the split-off second block's spans still
     referenced that mark key — a dangling reference Astro warned about
     as "components.mark is missing {key}". Fixed by accumulating all
     markDefs for the *whole* paragraph-like element in one array and
     filtering it down to what each resulting block's own spans actually
     use, rather than resetting the accumulator on every `<br>`-triggered
     flush.

Both full-scale bugs were fixed, then the full 309-post write was re-run
(idempotent, see above) and the entire site was rebuilt locally with zero
warnings or console errors across all 311 pages (309 posts + blog index +
Studio).

---

## Astro front-end pieces built alongside the schema (Phase 0)

- `src/layouts/BaseLayout.astro`, `src/components/SiteHeader.astro` /
  `SiteFooter.astro` / `MobileSticky.astro` — extracted directly from
  `index.html` (the canonical source) via a one-off Node script, not
  hand-retyped, so there's no risk of drift from the shared design system.
  Logo/footer image `src` attributes rewritten from relative to
  root-absolute paths to match how the static pages already handle this.
- `src/pages/blog/index.astro` — real index, queries Sanity at build time,
  degrades to an honest "no posts yet" empty state if Sanity is
  unreachable (this is how the very first version of this page was tested,
  before any real project existed).
- `src/pages/blog/[slug].astro` — real post template, `BlogPosting`
  JSON-LD tied to the same `Organization` `@id` already published in
  `index.html`'s structured data (not a disconnected one).
- **A real, unrelated bug found and fixed while building the hero band on
  the blog index:** adding an `.eyebrow` kicker above the hero `<h1>`
  collided with a sitewide `h1 { transform: translateY(-58px); }` rule
  that's only ever been used on the homepage's hero, which has no eyebrow
  above it — a combination never exercised elsewhere in the codebase.
  Fixed by matching the homepage's actual hero structure exactly (no
  eyebrow) instead of inventing a new one.

---

## Two real Astro/Vite tooling bugs, unrelated to the content itself

1. **`astro.config.mjs` never saw the real `.env` values.** Astro doesn't
   auto-load `.env` before evaluating its own config file — `SANITY_PROJECT_ID`
   read as `undefined` there even with a real `.env` present. Fixed with an
   explicit `import 'dotenv/config'` at the top of the config.
2. **The embedded Sanity Studio config can't use `process.env` at all.**
   `sanity.config.ts` gets bundled and shipped to the *browser* (it's the
   live Studio app, not just a build-time reference) — browsers have no
   `process.env`, so this threw a hard `ReferenceError` on load and left
   Studio stuck pointed at the placeholder project. Fixed by switching to
   Vite's `import.meta.env.PUBLIC_*` convention, which *is* available
   client-side, and requires the `PUBLIC_` prefix on those two env vars.
3. **`npm run dev` cannot currently run the embedded Studio at all** —
   Vite's dev-mode dependency pre-bundler throws hundreds of false
   `MISSING_EXPORT` errors on the `sanity`/`@sanity/vision` packages (the
   exports genuinely exist on disk; this is a pre-bundler analysis bug),
   and even after excluding those from `optimizeDeps`, a second, deeper
   React 19 compiler-runtime incompatibility follows right behind it.
   **Not worth chasing further right now** — `npm run build` +
   `npm run preview` (the real production pipeline, not the dev-mode
   optimizer) works perfectly and is what's actually been used for every
   verification in this migration. Use build+preview for local Studio use
   until this is worth revisiting.

---

## Phase 2.5 (Sep 19): categories and the remaining 141 SEO titles

Both closed out in the same session, after the core migration above. Full
scripts: `scripts/categorize-blog.mjs`, `scripts/apply-seo-titles.mjs`
(reads its title-fix data from `scripts/data/`, committed alongside it so
the script is re-runnable without any scratchpad dependency).

### Categories

The source archive has zero tags/categories — confirmed again here, not
assumed. A 6-topic taxonomy was derived from actually surveying all 309
real titles (not invented up front): **Market Reports, Landlord Tips,
Tenant Resources, Investment Strategy, Property Maintenance, Client
Stories**. Michael's decision: every Market Reports post also gets a city
tag (the 13 real cities that appear + a "Westside" cluster for the
Avon/Brownsburg/Plainfield reports, matching the existing
`/westside-market-reports` branding elsewhere in this project) — every
other post gets a city tag too if one is unambiguous, but that's a bonus,
not a requirement. Verified directly against the live dataset: 309/309
posts categorized, 0 Market Reports posts missing their city tag.

**Two real classification bugs found by testing against actual content,
not by inspecting the regex:**

1. First pass matched Client Stories against title+excerpt combined. A
   genuine landlord-advice post ("Streamline Move-In for Indianapolis
   Tenants") got miscategorized because its *excerpt* said "ensure a
   smooth move-in experience" — testimonial language that also shows up
   in ordinary advice copy. Fixed by matching title only.
2. The tightened title-only rule then swung too far the other way and
   missed real testimonials: "⭐⭐⭐⭐⭐ A Big Thank You to Paula and the Red
   Door Team!" has words between the emoji and "Thank You" that an
   anchored `^\W*(thank you)` pattern didn't allow for; "Another 5-Star
   Review," "Another Happy Tenant Thanks to JC Sison," and "Raving Review
   Alert from Shakyra Johnson" used phrasing the first pass's keyword list
   simply didn't include. Found by deliberately searching every post NOT
   yet tagged Client Stories for review/testimonial-shaped language,
   rather than trusting the first pass's own output. One post — "Red Door
   Property Management: Guiding You Through the Indianapolis Rental
   Market," which is actually a client quote from Brian Kelly — has no
   testimonial signal in its title at all (only in the excerpt) and
   needed a manual one-off category override; no keyword rule could have
   caught it, and none should try to.

### SEO titles (the 141 with no existing content-fixes.csv fix)

The real current count, checked directly against live data, not the older
"143"/"148" figures in CLAUDE.md and this file's own earlier passes (those
predate the 106 posts `content-fixes.csv` already covers, and don't
exactly reconcile with each other — always recount from the live dataset
rather than trust a written figure here).

**56 follow a real recurring pattern** — variations on "{City} [Indiana]:
{hook} ({Month Year} Report)" — shortened to a systematic template:
`{City} Rental Market Report — {Month Year}`. The subject month is pulled
from each post's own excerpt first, falling back to the title, falling
back to `publishedAt` only if neither mentions one — checked in that order
deliberately, since one post was published in May 2024 about March 2024
data, and `publishedAt` alone would have gotten the report's own subject
period wrong.

**City detection bugs, both found by checking for duplicate output
titles, not by eyeballing the list:**
- Picking the first city name found via array order (not text position)
  attributed "Is Noblesville, Indiana the Best Rental Market Near
  Indianapolis?" to Indianapolis, since that name happened to come later
  in the same title. Fixed to pick whichever city name appears earliest
  in the actual title text.
- Even after that fix, a few genuine same-city-same-month collisions
  remained (two different Greenfield posts, two different Lebanon posts)
  — resolved by preferring the month embedded in each post's own excerpt
  over a shared `publishedAt` month, which the two posts in each pair
  actually differed on once checked.
- Two posts matched the market-report regex and had a real city name in
  the title, but weren't actually monthly data reports at all: one is
  thematic ("Understanding the Impact of Urban Development on Rental
  Markets"), the other is the Brian Kelly testimonial mentioned above,
  which the *title-length* pass doesn't know is a testimonial (the
  category fix above is a separate script). Both pulled out of the
  mechanical template and given real one-off titles instead of being
  force-fit into it.

**85 are one-off evergreen articles with no common pattern** — each read
individually (title + excerpt) and rewritten by hand against this
project's writing-style rule (plain, direct, concrete specifics, no
marketing inflation). Common, mechanically-obvious wins folded in here
rather than treated as a separate pass: stripping a redundant
" | Indianapolis Property Management" suffix repeated across several
titles, and removing clickbait phrasing ("EXPOSED," "HIDDEN GEM ALERT,"
"STEAL vs. SELL OUT") in favor of saying the real thing plainly.

**One more collision found only at the very end, against a title outside
either batch:** "Indianapolis Rental Market Report — March 2024" already
existed as a *pre-existing* `content-fixes.csv` fix (from before this
session) on a different post than the one this pass generated the exact
same title for by coincidence — both were real Indianapolis, March 2024
posts. Resolved by adjusting the newly-generated one
("Indianapolis Rents & Prices Report — March 2024") rather than touching
the already-approved CSV-sourced fix.

**Final verification, against the live dataset, not script output:**
309/309 posts have a unique effective SEO title, 0 over 60 characters. A
full local build of all 311 pages succeeds with no errors, and the
generated `<title>` tag was spot-checked in a live preview to confirm it
shows the new short title while the post's own on-page H1/body stays
exactly as scraped — the fix only touches the SEO override field, never
the real editorial content.

---

## Still open

- **Not deployed anywhere yet.** Everything above is `npm run build` +
  local `npm run preview` only — the real Astro build isn't wired into
  Cloudflare Pages deployment.
- **The other 93 static HTML pages still aren't part of this Astro
  project.** Two systems currently run side by side: static HTML files at
  the repo root, and a real Astro app in `src/`. Folding the rest of the
  site into Astro is real, separate, unscoped work.
- The `SANITY_API_WRITE_TOKEN` used for this migration should be treated
  like the RentCast/RentEngine keys elsewhere in this project once the
  migration work is done for a while — consider rotating it.
