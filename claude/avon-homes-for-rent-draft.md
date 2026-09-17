# Avon Homes for Rent — draft v2

> **Back in play (Sep 11, later same day).** The "no per-city homes-for-rent
> pages" call this draft was marked superseded by turned out to rest on a
> wrong assumption — Michael confirmed both `-property-management` and
> `-homes-for-rent` pages already exist per city, so there's no
> "resurrecting a page that shouldn't exist" problem here. Decision now:
> keep all 20 `-homes-for-rent` pages. `red-door-website-todo.md` and
> `CLAUDE.md` still say otherwise as of this edit — **not updated yet, on
> Michael's explicit instruction, until the plan settles.** Don't treat
> this file as contradicting them; it's ahead of them on purpose.
>
> This version adds real RentCast market data for Avon (zip 46123), pulled
> by Michael Sep 11 since this environment can't reach `api.rentcast.io`
> directly (network policy blocks it — see the open items at the bottom).
> That block is specific to this chat's sandbox, not the eventual production
> build — a Cloudflare Worker or build-time script will have normal outbound
> internet access, so the monthly refresh job itself isn't blocked by this,
> only my ability to test it live from here is.

Pilot page for the 20-city `-homes-for-rent` rewrite. Purpose of this draft: agree on
structure and voice before the other 19 get written. Everything marked **[TEAM
INPUT]** is a spot where Red Door's own knowledge of this submarket should
replace or confirm what's here — per the migration rule, specificity is the
whole point and a wrong claim is worse than no claim.

Fair Housing pass applied throughout: no school, crime, or demographic
references. Growth and population figures are used as neutral size/scale facts
(how many people, not who they are) — same category the old site's pages
already used without issue; the only violation found in the existing pages was
demographic *characterization* ("ethnically diverse"), not the presence of a
population number.

---

## Suggested title & meta (draft, not final)

**Title:** `Avon, IN Homes for Rent | Red Door Property Management` (48 chars)
**Meta:** `See available rental homes in Avon, IN, managed by Red Door. Single-family homes near Indianapolis, updated as availability changes.` (135 chars)

Keeps the literal city + intent keyword match the old title had (it's still
doing real SEO work), drops the keyword-stuffed repetition ("Avon Homes for
Rent, Houses for Rent in Avon, IN, Avon, Indianapolis Rental Homes").

---

## H1

**Avon, IN Homes for Rent**

---

## Section 1 — Opening / local snapshot

Avon sits about 13 miles west of downtown Indianapolis on US-36, in Hendricks
County — one of the fastest-growing suburbs on the west side of the metro. The
town's population has roughly doubled twice over in the last two decades: 6,248
in 2000, 12,446 in 2010, 21,474 in 2020, and an estimated 23,437 as of 2024.
Avon wasn't incorporated as a town until 1995, even though the area was
settled in the 1830s, so most of what's actually built here is recent —
[TEAM INPUT: confirm — I'd expect this reads as newer subdivisions and fewer
older/historic homes than, say, Broad Ripple or downtown, but I don't have
hard data on housing stock age and don't want to assert it without your
team's read on what you actually see in this submarket].

## Section 2 — Rental market snapshot

**Real data now, from Michael's Sep 11 pull of RentCast's `/markets` endpoint
for zip 46123 — the actual numbers, not a placeholder.** One caveat before
the copy: I'm working from Michael's written summary, not the raw JSON file
(it wasn't attached to this chat) — the numbers below should hold up, but I'd
still want to see the raw response once before this goes live, mainly to
confirm exact field names for whoever builds the data pipeline. Noted as an
open item below.

Draft copy:

> Rents for Avon's 89 currently listed rentals average $2,148/month (median
> $2,075), ranging from $1,107 to $3,080. Single-family homes — the large
> majority of what's available, and Red Door's focus — rent higher than the
> Avon average, at $2,211. Typical size is around 1,954 sq ft ($1.18/sq ft),
> with listings ranging from 676 to 4,360 sq ft.
>
> By bedroom count, rent rises in a fairly clean ladder: roughly $1,282 for a
> 1-bedroom up to $2,813 for a 5-bedroom.
>
> Half of Avon's current rental listings lease within 10 days; some sit far
> longer, up to several months, which is why the average (32 days) reads
> higher than the median.

Honest inventory note, because Avon won't always have listings live: most of
Red Door's current availability sits in Indianapolis proper, so Avon listings
turn over less often than the metro's core. When nothing's available here
right now, the page shows nearby homes in Brownsburg, Plainfield, and
Indianapolis rather than a dead end. [This should read as a natural part of
the copy, not just fine print under an empty grid — it's the same logic
already locked into the page architecture, just said in plain language up
front so it doesn't feel like a surprise when the grid is thin.]

### What I'm holding back from the copy, and why

RentCast's response also includes 6 months of history (April–September
2026) with the same full breakdown for each month — property type, bedroom
ladder, the works. That's a real asset (a trend line beats a snapshot), but
I'm not writing it into the page copy yet: the median days-on-market Michael
reported for those months is 10 → 1 → 1 → 1 → 9 → 10. A 1-day median for
three straight months is the kind of number that's either a genuinely
remarkable fact or a small-sample artifact — Avon is one ZIP code, and a
given month's *new* listings (the slice a monthly median is computed over)
could be a much smaller count than the 89-listing snapshot suggests. I don't
know which without seeing how many listings fed each month's number, and
publishing "homes in Avon typically lease in 1 day" if it's actually "3 new
listings happened to lease fast that month" would be the kind of overstated
claim CLAUDE.md's writing style explicitly warns against. Worth checking the
per-month sample sizes in the raw file before this becomes a headline stat
anywhere, including the homepage Areas Served panel this same data could
eventually feed.

## Section 3 — What to expect renting in Avon

- **Location:** Avon borders Brownsburg to the north, Danville (the Hendricks
  County seat) to the west, Plainfield to the south, and Indianapolis to the
  east. US-36 is the main corridor through town; Danville is about 7 miles
  west.
- **Housing stock:** Partially answered by RentCast now — 79 of 89 current
  Avon rental listings (about 9 in 10) are single-family homes, which lines
  up with Red Door's own focus, and the bedroom ladder in Section 2 gives a
  real size distribution. **Still [TEAM INPUT NEEDED]** for what the API
  can't tell us: subdivision vs. standalone, age of construction, yard/garage
  norms. This is exactly the kind of detail the "if it could be pasted onto
  another city unnoticed, cut it" rule is aimed at, and it's the piece no API
  or web search fills in responsibly — it needs your team's actual read on
  the portfolio.
- **Leasing season:** [TEAM INPUT — if Avon follows the same summer leasing
  season pattern as the rest of the metro, worth saying so directly; if it
  doesn't, that's a more interesting fact than the generic version.]

## Section 4 — Available homes in Avon

*[LISTINGS MODULE — the map+search+filter component already drafted for the
listings rebuild, filtered to Avon, with the nearby-homes fallback beneath.
No copy needed here beyond a short label, e.g. "Currently available in Avon"
above the grid and "Homes available nearby" above the fallback section.]*

## Section 5 — How renting with Red Door works

Shared across all 20 pages — this is genuinely useful process information, not
filler, so it doesn't count against "thin" content the way the old
boilerplate did.

- Browsing and applying: view details on any listing, apply directly through
  Red Door's tenant portal.
- Screening criteria (pulled from the real, live `min_resident_qualifications`
  text already confirmed in the listings build): income at least 3× rent,
  minimum 580 credit score, maximum 55% debt-to-income, no disqualifying
  felonies, no aggressive dog breeds, plus standard rental-history checks.
- Showings are self-guided via digital lockbox once an application clears
  initial screening.

## Section 6 — Own a rental home in Avon?

Cross-sell to the owner-facing page — this traffic is tenant-intent, but a
meaningful share of visitors on any given city page are landlords checking
what's listed nearby, or homeowners weighing whether to rent out a property
here.

> Thinking about renting out a home in Avon instead? See how Red Door manages
> Avon rental properties → [link to `/avon-property-management`]

## Section 7 — FAQ (optional)

Low SEO value now that Google deprecated FAQ rich results, but harmless and
genuinely useful to a reader. Skip for the pilot unless you want it; easy to
add uniformly later if we decide it's worth the writing time across 20 pages.

---

## Open items before this becomes the template for all 20

1. **See the raw RentCast response, not just the summary.** Michael's
   description (Sep 11) is detailed and I've drafted against it, but I
   haven't seen the actual JSON — worth attaching `bob2mnmz3.txt` (or the
   file itself) to this chat once, mainly to confirm exact field names
   (`averageRent` vs `rentAverage` etc.) before anyone builds a data pipeline
   against assumed names, and to check per-month sample sizes behind the
   6-month history — see the "what I'm holding back" note in Section 2.
2. **Decide how the monthly refresh actually runs.** This chat's environment
   can't reach `api.rentcast.io` directly — confirmed Sep 11, a network
   policy block, not a bad key. Doesn't block the real site (the Cloudflare
   build/Worker environment will have normal internet access), but it does
   mean I can't test additional cities live from here until either that's
   resolved (an org Owner can allow the domain under Admin settings →
   Capabilities) or Michael runs the calls and shares results, same as this
   one.
3. **Multi-ZIP aggregation rule for cities that aren't one clean ZIP like
   Avon.** Several of the other 19 — especially the Marion County
   townships — will span multiple ZIPs. Not decided: average across ZIPs,
   population-weight them, or pick the dominant one.
4. **Free tier is 50 requests/month; one `/markets` call per city, done
   monthly, is 20 requests — fits comfortably.** Confirmed real now, not
   just estimated from the docs: Michael's single call for Avon returned the
   full current snapshot AND 6 months of history together, so the history
   doesn't cost extra requests. Refreshing weekly instead of monthly would
   not fit the free tier.
5. **Housing-stock and leasing-season specifics** — flagged inline above.
   Now partially answered by real data (single-family share, bedroom mix);
   the remaining gaps are still worth your team's time, not mine.
6. **Confirm the growth/population figures** — sourced from Data USA (2024
   estimate) and Wikipedia (2020 census, citing the Census Bureau). Worth a
   sanity check but these are standard public figures, lower risk than the
   housing-stock claims.
7. **RentCast vs. RentRange, still unreconciled in the todo file.** Flagging
   again since it's still true: `red-door-website-todo.md` has RentRange as
   the decided vendor for the owner-facing rental-analysis tool. RentCast
   here is a different tool for a different feature (public market context
   vs. an on-demand estimate emailed to an owner) — fine to run both, just
   don't want the two documents to look like they disagree with each other
   once this gets folded back into the todo.
