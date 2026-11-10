# City local facts: team review list

Researched October 20, 2026 for the "Local Rules & Costs" card and FAQ on each
`[city]-property-management` page. Nobody needs to write anything. This is a
**check-and-confirm list**: skim the published facts for your areas, and work
the "call before launch" items.

- **What renders:** `data/property-management/local-facts.json`, compiled by
  `claude/research/compile-local-facts.mjs` (Marion County) and
  `claude/research/outside-marion-facts.mjs` (everything else). To change a fact,
  edit the `.mjs` file and re-run `node claude/research/compile-local-facts.mjs`.
- **Full research, with every source and every unverified item:**
  `claude/research/owner-facts-*.json`.
- **Rule used:** a fact renders only if the research confirmed it from a source it
  actually opened (city code, county or court site, utility site). Anything weaker
  stays out.
- **Each page's card lists its sources** and ends with "Rules change; confirm
  current requirements before acting on them."

## Call before launch (published facts most likely to be wrong or go stale)

1. **Carmel and Fishers rental caps (10% per subdivision).**
   - **Published:** both caps, plus "a 2026 state law (HEA 1210) … is expected to phase the cap out."
   - **Not confirmed:** the "enforceable through January 2028" end date comes from local news (Current, Mar 16, 2026), not the bill text, so it's left out.
   - **Ask:** confirm with each city whether the cap is still being enforced.
2. **Hendricks County eviction courts (Avon, Brownsburg).**
   - **Published:** Superior Courts 1, 3, 4 and 5.
   - **Watch:** the county has posted proposed caseload changes effective **January 1, 2027**. Re-check in January.
3. **Speedway (Wayne Township page).**
   - **Published:** a landlord license and an annual rental unit permit are required (Ordinance 1057, 2006), plus the town's $150 short-term rental permit.
   - **Left out:** the license fees, since the 2006 amounts may be outdated.
   - **Ask:** the Speedway Clerk-Treasurer (317-246-4111) whether the program is still active as written.
4. **Indianapolis landlord registry.**
   - **Published:** registration is required (Code Ch. 851).
   - **Left out:** the **$5 fee**, because it comes from the 2015 launch fact sheet and the city's fee schedules changed Jan 5, 2026.
5. **Property tax rates for the Hamilton County cities.**
   - **Published:** the 2026 certified rates (Carmel 2.0167, Fishers 2.1994, Noblesville 2.5549, Westfield 2.3448).
   - **Upkeep:** these need updating each year when the DLGF publishes new rates.
6. **Zionsville sewer rate** ($56.85/month as of January 2025). Confirm it's still current.
7. **Warren Township court.**
   - **Published:** the address only (501 N. Post Rd.).
   - **Left out:** the suite and phone, because the brochure and the township website disagree.

## Deliberately left off the pages (for the team or attorney to decide)

- **Greenwood short-term rentals.**
  - **The rule:** Greenwood's UDO 10-03-16 G requires the owner to live on site in the RL/RM/RA zones.
  - **The conflict:** state law (IC 36-1-24) bars zoning that effectively prohibits non-owner-occupied short-term rentals, unless an exemption for ordinances older than 2018 applies.
  - **Next step:** this needs the attorney's view before it goes on a page.
- **Carmel short-term rentals.**
  - **The city's FAQ:** still describes a permit plus zoning-board approval.
  - **The mayor (March 2026):** said HEA 1210 had gutted those restrictions.
  - No replacement ordinance has been confirmed.
- **Westfield short-term rentals.**
  - **Status:** a $150 permit ordinance was introduced Sept 28, 2026 and tabled Oct 13 for revisions.
  - **Next step:** re-check in November, and add it to the page if it passes.
- **Fishers short-term rentals.** The city points to UDO Sec. 5.4.6(D), but the research never saw that text.
- **Electric and gas providers for Brownsburg, Zionsville, Greenwood, Carmel and Noblesville.** These came only from third-party guides, builder sheets or outage news.
- **Lawrence (excluded city).**
  - **Short-term rentals:** whether Lawrence's lodging-license chapter covers them is unknown.
  - **Newer ordinances:** whether any rental ordinance passed after its online code's December 2024 date is also unknown.
  - **Who to ask:** Lawrence DPW, 317-545-8787.
- **Beech Grove (parts of Franklin, Perry and Warren townships).** The pages say only that it is exempt from the Indianapolis registry. Its own rental rules, if any, weren't found because its site was unreachable.
- **Included towns** (Cumberland; Meridian Hills, Williams Creek and the other small Washington Township towns).
  - **Likely:** they are under the Indianapolis registry, since only the four excluded cities are exempt.
  - **Not confirmed with BNS:** so the pages don't call them out.
- **SEA 1 (2025) rental property tax deduction.** It exists, but sources disagree on the percentages, so it isn't mentioned.

## Added November 10, 2026 (six new city pages)

Researched November 10, 2026 for the Anderson, Greenfield, Lebanon, Danville,
Fortville and McCordsville pages. Full research: `owner-facts-anderson-lebanon.json`,
`owner-facts-hancock.json`, `owner-facts-danville.json`.

**Call before launch:**

1. **Fortville rental registration (new, Ord. 2026-8A, adopted Aug 17, 2026).**
   - **Published:** registration required, $5 fee waived through Dec 31, 2026, local agent rule, complaint-only inspections (from the town's own registration form).
   - **Left out:** the $250/$500 violation and re-inspection fees and the exemptions. They come from the draft in the council packet, not the signed ordinance, and the draft's dates already differ from the form's.
   - **Ask:** the Clerk-Treasurer for the adopted text. Then **attorney question:** the ordinance exempts only 5+ unit managed communities, so a managed single-family home isn't exempt; how that squares with IC 36-1-20-4.1 (no local inspection of professionally managed units inspected by a third party in the past 12 months) is open. Red Door should register any Fortville homes it manages.
2. **Lebanon's online code stops at December 2020.** The page says "none found" and gives that date. Confirm with the Clerk-Treasurer or Planning that no rental or short-term-rental ordinance has passed since.
3. **Stale online codes elsewhere:** Greenfield (Dec 2024), McCordsville (Feb 2025), Danville (Nov 2024). Each page states its code date.
4. **Danville short-term rentals.** Published as a special exception in residential districts, per the UDO table. Its "additional standards" section doesn't exist in the UDO, and IC 36-1-24-8 bars requiring approval for owner-occupied STRs. Attorney question if it matters.
5. **Anderson electric territory.** Published as Anderson Municipal Light & Power; outlying addresses may be on Duke Energy or a REMC.

**Deliberately left off the pages:** Greenfield's 2024 registration proposal that failed (news source only); Greenfield's pending zoning rewrite (Ord. 2026-28); electric and gas providers for Fortville, Danville and Lebanon (no official source); highway exit numbers sourced only from Wikipedia.

## Areas covered

| Area | Rental registration | Eviction court |
|---|---|---|
| Avon | None (smoke-detector rule only) | Hendricks Superior 1/3/4/5, Danville |
| Brownsburg | None | Hendricks Superior 1/3/4/5, Danville |
| Carmel | Required, $5/yr; 10% cap | Hamilton Superior 4/6/7, Noblesville |
| Fishers | Required, no fee; 10% cap | Hamilton Superior 4/6/7, Noblesville |
| Noblesville | None | Hamilton Superior 4/6/7, Noblesville |
| Westfield | None | Hamilton Superior 4/6/7, Noblesville |
| Zionsville | None | Boone Superior II, Lebanon |
| Greenwood | None | Johnson Circuit/Superior, Franklin |
| Danville | None (smoke-detector rule only) | Hendricks Superior 1/3/4/5, Danville |
| Lebanon | None found (code online only through 2020) | Boone Superior II, Lebanon |
| Anderson | None (vacant-structure penalties apply) | Madison Circuit Div. 4/5, Anderson |
| Greenfield | None (smoke-detector rule only) | Hancock Circuit / Superior 1, Greenfield |
| Fortville | **Required since Aug 2026**, $5 | Hancock Circuit / Superior 1, Greenfield |
| McCordsville | None | Hancock Circuit / Superior 1, Greenfield |
| Center Twp / Downtown | Indianapolis registry | Center Twp Small Claims |
| Broad Ripple / Washington Twp | Indianapolis registry | Washington Twp Small Claims |
| Lawrence Twp | Indianapolis registry, except City of Lawrence (none) | Lawrence Twp Small Claims |
| Warren Twp | Indianapolis registry (Beech Grove part exempt) | Warren Twp Small Claims |
| Decatur Twp | Indianapolis registry | Decatur Twp Small Claims |
| Franklin Twp | Indianapolis registry (Beech Grove part exempt) | Franklin Twp Small Claims |
| Perry Twp | Indianapolis registry (Southport, Beech Grove exempt) | Perry Twp Small Claims |
| Pike Twp | Indianapolis registry | Pike Twp Small Claims |
| Wayne Twp | Indianapolis registry; Speedway has its own license | Wayne Twp Small Claims |

## Upkeep

- **The market paragraphs and the rent and lease-time FAQs** regenerate on their own with each monthly RentCast refresh. They need no review.
- **The Red Door lease count** comes from RentEngine at each build.
  - **What counts:** only homes listed after the January 14, 2026 setup import.
  - **When a city's own count shows:** only once it reaches 5.
- **The local facts are static.** Re-check them once a year, along with the tax rates.
