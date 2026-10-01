# Blog summary drafting: source-post notes (Oct 1, 2026)

Notes recorded while drafting the `summary` field for 163 market-report posts (`scripts/data/blog-summaries.json`). They describe problems in the **posts themselves** — contradictions between the written section and the video transcript, garbled figures, leftover placeholders, and Fair Housing language — for the blog content cleanup. Posts listed as null got no summary; 7 more were dropped in review (single-number summaries, the best-neighborhoods guide, and `lebanons-economic-surge--what-it-signals-for-indy-real-estate-investors`, whose body is actually the Indianapolis June 2025 report).


## Batch 1

NULL SLUGS
- avon-indiana-million-dollar-views-for-less-housing-market-exposed---april-2024: no market numbers at all; generic promo copy pointing to a video. (Body also contains Fair Housing violations: "family-friendly amenities", "highly-rated school system ... families seeking quality education for their children".)
- whitestown-indiana-soaring-rents-or-hidden-gems-april-2024-market-exposed: no market numbers; generic promo copy. (Body also contains Fair Housing violations: "Top-Rated Schools ... families seeking a quality education for their children", "renter seeking a charming community with good schools".)
- dont-miss-indianapolis-rental-market-march-2024-renting-trends-in-fishers-noblesville--more: no market numbers; generic promo copy. Body still contains a literal placeholder "([Insert YouTube video link here])".
- click-here-westfield-rental-market-update-december-2023-you-must-not-miss: no concrete numbers (only "active homes have doubled" and directional claims). Also pushes short-term rentals, a service the new site has retired.
- upgrades-to-maximize-your-rental-income: not a market report; general upgrade/renovation advice with no market data.

OTHER FLAGS
- indianapolis-rental-market-holds-strong-in-june-2025-amid-seasonal-shifts: written section and transcript contradict on sales data. Written: avg sales price $254,215, 35 days on market, 1,000 homes sold. Transcript: avg sales price $309,000, 26 days on market, 4,360 active homes. Summary uses the written-section figures; worth confirming which is correct. Written section also lists "$112 per sq ft" / "$114 per sq ft" for rentals (almost certainly $1.12 / $1.14) - not used. Sentence "The average home sales price$254,215" is missing a word/space.
- indianapolis-indiana-rental-market-update-march-2023: post writes rent as "1381" and inventory as "1714" (no $ / no comma), so the summary uses them verbatim ("came in at 1381", "1714 homes"). If a "$" / comma is acceptable, change to "$1,381" and "1,714".
- noblesville-rental-market-update-november-2023: summary written, but the post is thin - its only concrete number is "$1900" average rent; the rest is directional. Post is framed around short-term rentals (retired service) and uses inflated language ("Explodes", "skyrocketing"). Caller may prefer null. Its claim that Noblesville's avg sale price exceeded Fishers' is stated without numbers.
- indianapolis-rental-market-report--january-2025-trends--investment-insights: source text is truncated mid-transcript (ends at "[02:04"); written sections are complete, so summary uses those. Written sections label days on market as "Vacancy rate: N days".
- fishers-indiana-rental-market-update-november-2022: post says new listings are "homes that hit the market in November" then "32 new homes hit the market ... in the month of October" - internal inconsistency; the 32 figure was not used. Post also contains "it is a safe market, it's got great schools" (Fair Housing issue in body; not used).
- westfield-market-update-october-2025-...: body says "exceptional schools" and transcript "great schools" (not used). Transcript says sales price down "about 3.5% month over month" while written section says "down slightly MoM" (not used).
- greenwood-july-2025-rental--sales-market-report: body mentions "solid schools" and "first-time buyers"; transcript mentions school calendar seasonality (not used). Sales price only given as "$334,000+ range".
- why-greenwood-is-a-top-rental-market-in-2025--full-may-data-breakdown: "Number of Homes Sold: +4% MoM | -2.5% YoY" duplicates the sales-price change figures and no count is given, so no homes-sold number used. Transcript says rental price per sq ft "$19" vs written "$1.19".
- is-noblesville-...-july-2026 and indianapolis-market-updates-rents-hold-...: bodies mention "respected school system" / "good school districts" (not used).
- lebanon-in-rental-market-update--june-2025: "Average Rent ... down 25% year-over-year" omitted from summary (post attributes it to a prior anomaly).


## Batch 2

NULL SLUGS
- august-2024-market-report-indianapolis-real-estate-insights: generic promo text only (list of covered cities + hashtags); no market numbers at all.
- brownsburg-indiana-the-sleepy-giant-is-waking-up-market-secrets-revealed---april-2024: no numbers; marketing filler. Also contains Fair Housing violations in the body ("Excellent Schools ... top choice for families seeking a quality education for their children").
- indianapolis-market-update-rents--sales-on-the-rise-april-2024-report: no numbers; only vague "rents rising / prices rising" claims.
- click-here-safe-bet-or-risky-move-fishers-market-deep-dive-dec-2023-with-red-doors: no numbers; only qualitative pros/cons. Body also says "Diverse Appeal" (refers to activities, but the word is risky) and promotes short-term rentals.
- how-to-spot-a-profitable-noblesville-rental-investment: general buying-guide post from 2021, not a market report, no market numbers. Body contains Fair Housing violations ("Tenants with children will be looking at school districts", "commuters, students, and families").

BORDERLINE / THIN
- noblesville-market-report-investor-alert-solid-market-with-high-roi-potential-feb-2024: only one number in the post (34 average days on market). Summary written from that plus the post's qualitative claims; drop to null if you want a numbers-only standard. Post also promotes Airbnb/short-term rentals (service retired per site plan).
- indianapolis-market-updates-carmel-fishers-credit-scores--vacancy-math and 2025-market-shifts-airport-hotels-ev-plants--a-carmel-cap-that-changes-everything-: economic updates, not rent/sales reports. Summaries use the policy/permit/jobs numbers instead.
- lebanons-economic-surge--what-it-signals-for-indy-real-estate-investors: title is about Lebanon (Caterpillar expansion, transcript only), but the written body is the Indianapolis June 2025 rent/sales report, so the summary covers Indianapolis. Title/content mismatch is worth fixing. Body also links "Airbnb Property Management in Indianapolis" (retired URL, 301s to /).

CONTRADICTIONS / DATA ISSUES SPOTTED
- 2025-market-shifts...: airport hotel cost is "$25 million" in the written body but "$205 million" twice in the transcript (left out of the summary). Body also says Home Place offers "desirable schools" and "early-stage gentrification" (Fair Housing risk); kept out of the summary.
- indianapolis-market-updates-carmel-fishers...: the written section says one price reduction averaged ~22 days on market; the transcript also says one reduction adds "an additional 21 days". The summary avoids the one-reduction figure. Body cites "schools, safety perception" as demand drivers, and transcript says Carmel tenants are "a little more white collar"; both are Fair Housing risks, kept out of the summary.
- noblesville-july-2025: price-bracket counts (78 / 190 / 258 homes sold) far exceed the 99 homes sold that month; they look like 12-month figures, but the post doesn't say so. Left out of the summary.
- whitestown-rental-market-update--june-2025: "Vacancy Rate:" label is attached to a days-on-market figure. "Price per Square Foot (Apartments): $1.97" is the only per-sq-ft line, and the transcript says just 8 apartments. Body says "its pricing and tenant demographics increasingly reflect" a luxury market (Fair Housing risk, "tenant demographics"). Kept out of the summary.
- noblesville-indiana-rental-market-update-february-2023: days on market are "45" and the month-over-month increase is also "45%". Both are in the post; the summary uses both, which reads oddly but is accurate.
- greenwood-november-2022: price-point range is garbled ("1000and 52,001, 500"), so it's left out.
- westfield-rental-market-update-november-2023: the body frames everything as a "short-term rental" market, but the metrics (active homes, average rent, days on market) look like standard rental data. The summary avoids the short-term framing. Body also has marketing inflation ("explosive", "booming").
- fishers-market-report-safe-does-not-mean-sleepy: title and body repeatedly call Fishers "safe" (meaning a stable investment, but the word is on the Fair Housing avoid list). The summary doesn't use it.
- greenfield-housing-market-report-1940...: transcript mentions "good schools"; kept out of the summary.
- westfield-market-updates-high-rent...: body and FAQ cite "schools" / "strong schools" / "tenant profile" as reasons to buy; kept out of the summary.


## Batch 3

BATCH 3 NOTES

NULL SLUGS
- indianapolis--surrounding-areas-real-estate-market-update-july-2024: video promo only. No market numbers, just a list of areas covered and a call to watch the video.
- fishers-indiana-renting-or-buying-we-expose-the-market-secrets-april-2024: no market numbers, generic promo copy. It also has Fair Housing violations in the body ("Highly-Rated Schools ... top choice for families seeking a quality education for their children").
- plainfield-indiana-strong-rental-market--surprising-sales-growth-march-2024-report: no market numbers, generic promo copy. It has several Fair Housing violations in the body ("excellent schools", "major draw for families", "Safe and Secure ... for families", "attracting desirable residents", "strong school system ... attract high-quality residents").

FAIR HOUSING PROBLEMS IN POST BODIES (the summaries leave all of this out, but the posts need attention)
- best-neighborhoods-to-invest-in-property: has a section headed "Diversity and Inclusion: Crooked Creek" that says to "attract renters who care about family-friendly activities, diversity, and inclusion" and mentions "highly rated school districts". This is the same pattern as the Broad Ripple "ethnically diverse" finding. I wrote a summary that leaves Crooked Creek out entirely. It is a neighborhood guide, not a monthly report, so you may prefer null for it.
- indianapolis-rental-property-market-2021-forecast: has a "Population and Demographics" section (per-capita and median income) and the line "demographics lean towards millennial renters". The summary leaves both out.
- fishers-market-insight-strong-rent-better-tenants-...(March 2026): school references run all through the body and FAQ ("school system", "stronger schools", "school-driven demand", and FAQ answers citing "strong schools").
- west-side-market-updates-...(May 2026): the body says "good schools", and the transcript says "stellar school systems" and "amazing tenants".
- westfield-july-2025-rental--sales-market-report: the body says "strong schools", and the transcript mentions "schools started".
- indianapolis-indiana-rental-market-update-november-2022: the transcript intro mentions "kids going back to school".

NUMBER ISSUES AND JUDGMENT CALLS
- greenfield (April 2026): the post says 47 homes sold, but also says 68 sold under $200,000 and 114 sold between $200,000 and $250,000. The price-range chart must cover a longer period than the month. I left the 68 and 114 out so they don't contradict the 47.
- fishers (March 2026): the 81 homes sold conflicts with the transcript's 332 homes at $300k–$350k and 93 at $250k–$300k (again a longer-period chart). Those are not used. The transcript also says rent was up "5% ... year over year" while the body gives no year-over-year figure, so no rent year-over-year number is used.
- fishers (May 2025): the body says the average sale price was $368,100, but the transcript reads "368. 180 1", which may mean $368,181. The summary uses the body's $368,100. Also, this post's 2026 rental-cap advice ("now is the time to act") may be stale. The March 2026 Fishers post says the rental cap is "no longer really being much of a consideration".
- anderson (June 2025): the 26% year-over-year sale-price gain is in the body, but the transcript says that month's comparison was distorted by an odd month. I left the 26% out and kept only "up 9% month over month".
- anderson (May 2025): the body lists the single-family rent price per sq ft as "$13 (down 37% MoM)", which is almost certainly a data error (other months show about $0.89). It is not used. The post gives no count of homes sold.
- anderson (October 2025): the body says the sale price was "approximately $182,000", while the transcript states $182,306 clearly. The summary uses $182,306.
- westfield (Feb 2024): the post gives "average days on market (84)" without saying whether it is the rental or sales figure, so the summary doesn't say either. The "active homes" figure is also unlabeled.
- indianapolis (Dec 2023): "Days on market: 66" is not labeled rental or sales, and "Active homes: 21,645" is implausibly high for rentals and also unlabeled. The 66 is used without a label and the 21,645 is left out. The rent is $1,325, which is well below the ~$1,488 to $1,750 range in the other Indy reports, so it may come from a different data source.
- indianapolis (Nov 2022): the post gives average rent as "1488, right around $1,500". The summary uses "right around $1,500" because the bare "1488" has no dollar formatting. The transcript also says 339 rented homes were "up 21% from November", which is garbled (probably year over year), so it is not used.
- indianapolis (Jan 2023): "1808" (active rentals) and "2.2" (absorption rate) are used as written. The transcript's prior-year days-on-market figure, "1520", is garbled and not used.
- westfield (Feb 2023): average rent "2300" appears only in a spoken aside, so it is not used.
- indianapolis-rental-property-market-2021-forecast: the post states no data period, so the summary says "heading into 2021" (it is a 2021 forecast published Dec 2020).


## Batch 4

NULL SLUGS
- evolving-landscape-what-investors-need-to-know-about-new-construction: general new-construction explainer, not a market report; only stats are two citywide figures (46% rent, 96% apartment occupancy). Post body also describes areas by demographics (students, retirees, young professionals, families) - Fair Housing issue in the post itself.
- greenwood-indiana-booming-or-busting-renting-vs-buying-in-april-2024-exposed: promotional text only, no market numbers.
- anderson-indiana-real-estate-hidden-gem-for-investors--renters-march-2024-report: promotional text only, no market numbers.
- fishers-market-report-rents-up-days-down-great-investment-opportunity---feb-2024: no numbers; body also says "Top-Rated Schools ... attracting families" (Fair Housing issue in the post itself).
- indy-rental-market-explodes-december-2023-updates-in-noblesville-fishers-westfield--mccordsville: video promo blurb only, no market numbers.

DELIBERATE OMISSIONS (rule 4 verbatim-format)
- fishers-indiana-rental-market-update-april-2023: average rent appears only as "2129" (no $ or comma); omitted rather than reformat. Average sale price is garbled ("around 359, 368 ... 359") - omitted.
- greenwood-indiana-rental-market-update-february-2023: average rent appears only as "1680"; omitted. No active-home count stated. Summary is thin (DOM 26, -44% MoM; rent -1% MoM) - consider null if too sparse.
- noblesville-indiana-rental-market-update-december-2022: average rent appears only as "right around 1760"; omitted.
- may-2025-rental-market-trends-in-indianapolis-...: active homes stated only in transcript as "1147"; omitted. Homes-sold count never stated (only % changes).
- noblesville-market-update-...(March 2026): sales "Reported market count: 92" is ambiguous (not labeled homes sold); omitted.

CONTRADICTIONS / DATA ODDITIES IN POSTS
- noblesville March 2026: transcript says 193 homes sold between $250k-$300k in March, while the reported count is 92 - inconsistent (193 is probably a 12-month figure).
- fishers June 2025: price-bracket counts (39 / 132 / 275 homes) far exceed the 90 total sold in June - likely 12-month figures but presented as if monthly.
- may-2025-lebanon: rental "Price per Sq. Ft.: $123" is clearly wrong (should be ~$1.23; sales is $180). Not used.
- noblesville Dec 2022: absorption rate stated as both 1.0 and 1.1. Also "up from 8% just the prior month" is garbled. Summary says "near 1.0".
- noblesville Nov 2022: 30 active homes vs 108 the next month (Dec 2022) - the Dec post says tracking methodology changed, so not directly comparable.
- westside July 2025: Avon sales DOM listed without change in written section; transcript says up 17% MoM. Not used.
- westfield Aug 2025: written section says "Published: Aug 2025" but post date is 2025-09-29; Bottom Line references "demographics" (Fair Housing wording in the post).
- greenwood Oct 2025 and westside July 2025 posts mention "strong schools"/"family-driven market" in body copy - Fair Housing issues in the posts themselves (excluded from summaries).
- may-2026 economic update: not a rental report; summarized on Indiana/metro sales data. "April" period stated without year in the post (published May 2026).


## Batch 5

NULL SLUGS
- -red-door-property-management-guiding-you-through-the-indianapolis-rental-market: client-review/services promo post; no market data at all.
- indianapolis-market-booming-renting-or-buying-you-need-this-update-april-2024: no numbers anywhere; only generic claims ("soaring", "sizzle").
- greenwood-indiana-real-estate-market-explodes-perfect-for-investors--renters-march-2024-report: no numbers; also contains Fair Housing violations in body ("highly-rated schools ... desirable location for families", "Safe and Stable Community") and promotes Airbnb management (service retired per CLAUDE.md).
- noblesville-hot-trends-you-cant-miss-december-2023-data: no numbers; generic STR/promo copy; body mentions "excellent schools" and "families" (Fair Housing).

FORMATTING FLAGS (old transcript-style posts write rents without $ or comma)
- indianapolis-indiana-rental-market-update-february-2023: post writes "1395" and "1677"; summary uses "$1395" (dollar sign added, digits unchanged) and "1677". Change to bare "1395" if a strict verbatim check is required.
- westfield-indiana-rental-market-update-december-2022: post writes "1950"; summary uses "$1950". Same caveat.

CONTRADICTIONS / DATA ISSUES IN POSTS
- westside-roundup ... october-2025: Brownsburg avg sales price is $346,920 in the written section but $346,692 in the transcript. Omitted Brownsburg price from summary.
- westside-rental-market-roundup ... may-2025: written section says Avon sales "Average Days on Market: 33"; transcript says DOM "increased by 33%" (33 is likely a percent, not days). Omitted. Written Brownsburg rent says "10.5% YoY"; transcript just says "dropped over 10.5%" with no period. Rent/sq ft figures in transcript are garbled ($111, $17, $15). Intro calls the trends "diverse" (not a Fair Housing issue, just noting).
- noblesville-indiana-rental-market-update-march-2023: average rent stated as "1800" in one place and "$800 average monthly rent" in another; sale price given only as "225" (unit unclear). Both omitted from summary.
- indianapolis-indiana-rental-market-update-february-2023: intro calls it the "March 2023 rental market report" but numbers are for February (title also February). Active homes section repeats the DOM change percentages, so those were not attached to inventory.
- westfield-indiana-rental-market-update-november-2022: no actual average rent or DOM figures, only percent changes; price range given as "$2 001 to $2,500" (garbled), omitted.
- greenfield-market-updates ... : single-family rent per sq ft "$3 [unclear]" (likely transcript error). Price-bracket counts (116 sold $200K-$250K, 68 under $200K) exceed the 53 homes sold figure - presumably a longer window; not used.
- greenwood-market-report-2000-rent ... (May 2026): transcript bracket counts (180 sold $200K-$250K) exceed the 129 homes sold; not used.
- greenwood-indiana-rental-market-update--june-2025: SFH rent per sq ft "$1.70" looks like a garbled $1.07; not used. No sales price figure given.
- whitestown-july-2025: transcript gives "$1.7" per sq ft vs written $1.07; sales price "$3698.90" in transcript vs written $369,890 (used written).
- fishers-rental-market-report--august-2025: most figures are "~" approximations; summary says "about".
- indianapolis-having-steady-growth--investor-opportunities-feb-2024: thin post, only one number (58 days on market). Summary written but could reasonably be nulled. Body uses "Gentrification Progress" (avoided).

FAIR HOUSING ISSUES IN POST BODIES (not carried into summaries; may need fixing in migrated copy)
- greenwood-market-report-2000-rent ... : body "school-driven appeal"; transcript "high-quality tenants, good schools".
- greenfield-market-updates ... : body "school influence".
- whitestown-july-2025: body "family-driven rental demand", "higher-income tenants".
- westside-roundup ... october-2025: body "schools, amenities, and appreciation potential"; transcript "great schools".
- greenwood-indiana-rental-market-update--june-2025: transcript "schools starting".
- Indianapolis-Metro-Area-Economic-Update-April-2025: body "school-year homebuying rush"; transcript mentions kids/school.
- westfield-indiana-rental-market-update-december-2022: transcript "good schools".
- indianapolis-rental-market-insight-march-2026: discusses "C-class renter", theft, squatters, tenant quality by area.


## Batch 6

BATCH 6 NOTES

NULL SLUGS
- fishers-rental-market-high-rents-low-vacancy-is-it-a-good-investment---may-2024-report: no market numbers at all; generic copy only.
- noblesville-indiana-the-secret-is-out-amazing-rental--sales-market---april-2024: no market numbers at all; generic promotional copy.
- westfield-property-management-market-questions--opportunities-beats-indianapolis-rentals: no market numbers at all; generic copy.
- avon-rental-market-update-november-2023: the only figures are truncated/garbled ("average rents at $187", "average sales prices at $352"), so no reliable rent or price can be quoted; only percentages remain.
- how-does-remote-working-impact-the-housing-market: general article about remote work, not a market report; no local rent/sales figures.

DATA ISSUES / CONTRADICTIONS
- noblesville-market-report--december-2025: written section has no numbers; all figures came from the transcript (clearly stated). Written copy calls sale prices "relatively flat year-over-year" while the transcript says $343,509 is "down year over year". The summary uses the written "relatively flat" wording.
- noblesville-rental-market-report--august-2025...: snapshot says rent "~$2,330", transcript says "2,333". Summary uses "about $2,330".
- fishers-october-2025...: townhome price per sq ft is "~$1.40/sf" in the snapshot but "$1.14" in the transcript (not used in the summary). Transcript first gives the average sale price as $460,262; the corrected investor-cap figure $364,544 was used.
- westside-market-report-avon-brownsburg-and-plainfield-converge (Apr 2026): no Plainfield sales figures in the written section (transcript says "$341 [unclear]"), so Plainfield sales were left out. Snapshot omits apartment/townhome counts that the transcript gives. There is a stray unclosed "[" in the body ("using [a leasing process").
- june-2025-westside...: Avon and Brownsburg sales prices are broken in the body ("Sales Price: $Ticking Down 4% MoM", "$Up 2.8% MoM"), and days on market is mislabeled "Vacancy Rate". Active-home counts appear only in the transcript and were not used.
- whitestown-rental-market-update--may-2025...: rental price per sq ft is "$6" in the body and "$16" in the transcript, both clearly wrong (not used). Body says the sweet spot is $250K-$300K but also says most sales fall at $350K-$400K; the summary states both, as the post does.
- fishers-indiana-rental-market-update-february-2023: title says February 2023, but the body says "Fishers market report here. March 2023" once.
- fishers-indiana-rental-market-update-march-2023 and -december-2022: average rent appears only as unformatted transcript text ("2093", "1995"), so I left the dollar figure out instead of reformatting it. The December post's year-over-year rent change is garbled ("up from 1.5% in December of 2021") and was not used.
- fishers-market-explodes-in-2024... (Jan 2024): very thin, only rent and days on market. The summary is 2 short sentences.

FAIR HOUSING PROBLEMS IN THE POSTS THEMSELVES (summaries avoid all of these; the post bodies may need cleanup before migration)
- fishers-october-2025: "demand tied to schools", "Schools, lifestyle amenities, and consistent household formation", "scarcity + top-tier schools"; the transcript mentions "good school systems".
- fishers-july-2025: "elite schools", "top-tier schools", "A+ schools"; the transcript says "Everybody's rushing to get into this market before school starts".
- fishers-may-2024: "excellent schools", "Safe Haven", "High-Quality Tenants", "Low Tenant Risk".
- noblesville-april-2024: "Excellent Schools ... top choice for families seeking a quality education for their children".
- westfield-march-2024: "High-Quality Renters", "Safe and Stable Community". It also promotes Airbnb management, a retired service, and has a leftover drafting note: "(Optional: If your company offers this service)".
- avon-november-2023: "excellent schools", "families and young professionals"; it also promotes short-term rental management.
- lebanon-march-2026: lists "schools" among reasons renters pay for a house.
- greenwood-june-2026 transcript: "It's incredibly safe", "a safe market".
- westfield-may-2026: "youth sports" in the body; the transcript mentions "my kids".
- Indianapolis-april-2025: "high-turnover zones", "lower-tier neighborhoods"; the transcript says "you're gonna have crime, you're gonna have squatters".
- fishers-march-2023 / february-2023: "driven by the school systems", "good quality tenants", "amazing school systems".
- noblesville-august-2025 transcript: "renting is trending up even in older demographics".


## Batch 7

NULL SLUGS
- plainfield-indiana-steal-vs-sell-out-renting-vs-buying-in-april-2024-exposed: no market numbers at all; the body is generic promo copy aimed at renters/buyers. It also has Fair Housing problems: "Highly-Rated Schools ... top choice for families seeking a quality education for their children" and "renter seeking a charming community with excellent schools". Clickbait title ("STEAL vs. SELL OUT", "EXPOSED").
- understanding-the-impact-of-urban-development-on-rental-markets: not a market report and has no rent, days-on-market, or sales numbers (the only figure is a 2021 ULI ranking of 36th). If a summary is still wanted, a possible draft: "Indianapolis development projects, including the Bottleworks District, the Mass Ave Arts District, the 16 Tech Innovation District, and expanded public transit, have increased rental demand near key developments, according to the post. It advises investors to target areas with ongoing or planned development and to track construction pipelines for signs of oversupply." Fair Housing problems in the post itself: "driven by diverse demographics ... young professionals, students, and even empty nesters", "Retirees are selling...", "families seeking a vibrant urban environment", "public safety", and gentrification/"lower-income residents" passages. Also two paragraphs are duplicated verbatim (the "balancing act between growth..." and "environmental impact of urban expansion" paragraphs each appear twice).
- indianapolis-market-report-january-2024---rents-up-days-on-market-increase-should-you-be-worried: no numbers, only bullet-point directions (rents rising, inventory up, DOM up) and a CTA.

FORMATTING DEVIATIONS (please review)
- noblesville-indiana-rental-market-update-january-2023: post writes rent as "1795" (no $ or comma); summary uses "$1,795". Same digits, same metric.
- indianapolis-indiana-rental-market-update-december-2022-: post writes "1390"; summary uses "$1,390". The post calls it "average rent" then corrects itself to "the median rent is going to be 1390", so the summary says median.
- indianapolis-rental-market-report--october-2022: post writes "$1531"; summary uses "$1,531".
  If strict verbatim is required, swap these back to the post's raw form.

LOW-CONTENT SUMMARY
- indianapolis-rental-market-booming-average-days-on-market-plummets-may-2024-report: only one concrete number (DOM down 27% MoM); no rent, DOM, or inventory levels. Summary kept to 2 factual sentences. The post is written for renters ("Great news for renters"), not owners; consider null if a fuller summary is the bar. Title uses "BOOMING!" / "PLUMMETS".

CONTRADICTIONS / DATA ISSUES IN POSTS
- indianapolis-october-2025...: written section says 996 homes sold under $500K; transcript says "96". Apartments: written 993, transcript 933. Summary uses the written 996.
- indianapolis-july-2025...: SFH price per sq ft written as "$112" and townhomes "$114" (almost certainly $1.12 / $1.14). Not used in summary.
- indianapolis-indiana-rental-market-update-december-2022-: active homes stated as 1833, then 833, then "1800" — omitted from summary. Also DOM "up 50% from last year" vs 18 days to 36 days (that is a doubling) — summary uses the 18 and 36 figures only, not the 50%.
- westside-market-updates...: Plainfield sales price $330,891 comes from the written snapshot only; transcript says "[unclear]".
- westfield-indiana-rental-market-update-march-2023: average sales price written as "487.239" (garbled); not used. Rental DOM level is never stated, only % changes (150% MoM, 136% YoY).
- dont-miss-out-february-2025...: Fishers avg sale price written $366,000 vs transcript "360 6"; Noblesville rent listed as down MoM & YoY (transcript says down 13% YoY). Not used beyond rent/DOM.
- may-2025-noblesville...: written says rent up 8% YoY; transcript says "up almost 8%". Summary uses the written figure. The post's resources list links "Airbnb Management Services in Noblesville" — Airbnb pages are retired (301 to /) per CLAUDE.md.
- fishers-rental-market-update-november-2023: oddly framed throughout as "short-term rental" investing although the data is ordinary rental-market data; summary avoids the STR framing.

FAIR HOUSING ISSUES IN POST BODIES (summaries avoid them; flagging for the migration)
- westfield-market-report-2800...: "Strong schools and long-term growth help".
- westside-market-updates...: "strong school-driven demand", "good school district", "strong schools", "strong school systems", "school demand, tenant profile" (FAQ), "tenant profile is often more stable".
- noblesville-market-report-30-day...: transcript "Talk about safe markets".
- noblesville-rental-market-report--june-2025...: transcript "closer to when schools are going to start".
- noblesville-indiana-rental-market-update-january-2023: "driven by the school system".
- fishers-rental-market-update-november-2023: "strong school system, making it attractive to families".
- indianapolis-rental-market-report--october-2022: "kids are back in school".
- indianapolis-rental-market-report--august-2025...: transcript remarks on renter ages ("old people now are turning to rentals").
- plainfield... and understanding-the-impact... : see null notes above.


## Batch 8

NULL SLUGS
- anderson-indiana-hidden-gem-alert-rentals-sales--more---april-2024-report: generic marketing copy, no market numbers at all.
- westfield-indiana-is-it-worth-the-hype-renting-vs-buying-in-april-2024: generic marketing copy, no market numbers; also contains Fair Housing problems ("Family-Friendly Atmosphere", "haven for families with excellent schools") that should be fixed in the body.
- indianapolis-rental-market-march-2024-rents-up-inventory-down--prices-soaring-property-management: only directional claims (rents up, inventory down), no actual figures.
- -january-2024-market-report-indianapolis--surrounding-areas---is-the-boom-still-on: teaser for a video, no market numbers; body mentions "millennial interest" (Fair Housing age/life-stage reference).
- indianapolis-rental-market-update-november-2023: short-term-rental tips post, no market numbers.

FLAGS / CONTRADICTIONS
- noblesville-rental--sales-market-update-october-2025...: written snapshot says average SFH rent "~$2,285 (~+4.3% MoM)", transcript says "$2,085, up just over 4.25% month over month". Contradiction, so the summary omits the rent figure. $2,085 looks more consistent with the April 2026 Noblesville report ($2,110, up ~1.5% YoY). Body also cites "Schools" as a demand driver (Fair Housing).
- fishers-market-updates-strong-rent-fast-sales-and-rental-cap-risk (May 2026): hosts say on camera the YoY rent % is a typo and the days-on-market chart may show April data. Summary uses only MoM rent change and the stated figures. Body line "Owners see good schools..." is a Fair Housing problem.
- westfield-rental-market-report--may-2025: written text says rent up 7.5% YoY, transcript says "nearly 8%" (summary uses 7.5%). Written says "16% increase in active listings" with no period; transcript says MoM. Homes-sold count is never given.
- indianapolis-market-report--december-2025: all figures come from the transcript (the written section has no numbers). They are stated clearly ($1,665, 63 days, 1,415 homes, $246,000, 853 sold, 50 days). Transcript also says "school-calendar driven" (Fair Housing).
- anderson-market-updates... (March 2026): the post itself hedges its figures ("roughly $193,000", "about 80 days"), and the summary keeps those hedges.
- anderson-july-2025: the average sale price is given only as "$200,000+" / "over $200,000", so the summary says "topped $200,000".
- brownsburg-indiana-rental-market-update-march-2023: rent ("1600") and sale price ("around 374") are written without $ formatting (374 presumably means $374K), so both are left out. The DOM box was marked not applicable. Body says the market is "driven by the school systems" (Fair Housing).
- avon-indiana-rental-market-update-december-2022-: rent written as "1975" with no $, so it's left out. Only the % changes are used.
- fishers-indiana-rental-market-update-january-2023: body says Fishers rents easily "due to the great school systems" (Fair Housing).
- indianapolis-real-estate-market-report-2022: the data covers August 2022 (published November 2022). Rent is written "$1589" with no comma, and the summary copies that exactly. Body blames "resumption of offline education" for supply (school reference). Absorption-rate definition in the body is mathematically inverted (rented/available gives a percentage, not months).
- july-2025-indianapolis-rental-market--economic-update: no monthly rent/DOM data, only economic news, and the summary reflects that. Body says Brownsburg park project aims to "attract families" and the transcript mentions "Carmel schools", "millennials", and median buyer age (Fair Housing).
- buyers-market-finally-coming-to-indianapolis--economic-report-february-2025: economic commentary, no rent/DOM data. The permit, transaction, and median-price figures come from the transcript, where they are clearly stated. Transcript mentions median buyer age 38 and "raise a family in".

