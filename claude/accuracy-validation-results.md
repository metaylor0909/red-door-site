# Rental-Analysis-Tool: Accuracy Validation (Decision #4)

**Date run:** 2026-09-12
**Source:** RentEngine `market-tool/comps` API, live calls against 7 recently-leased Red Door properties (all leased within the last 2 weeks of this run).
**API spend:** 11 successful calls × $0.50 = **$5.50** (well under the 40-call/24hr cap).

## Method

- Geocoded each address via the US Census Bureau geocoder (all 7 matched cleanly; no Nominatim fallback needed).
- Called the comps endpoint centered on each property, filtered to `min_beds=max_beds` (exact bed match) and `baths ±0.5`.
- Started at `radius_miles=1`; widened stepwise (2, 3, 5, 10, 25) only until ≥5 `Rented`-status comps were found, or 25mi was reached.
- **Excluded self-matches**: RentEngine's data includes the subject properties themselves as comps (they're in its underlying dataset). Every comp set was filtered to drop any comp at the subject's own address before computing statistics. For two multi-unit buildings, this required the specific unit number/letter (see Data Quality Notes) rather than a building-level address match.
- Computed median rent of `Rented` comps (primary estimate under test), median rent of `Available` comps (proposed fallback), and 25th/75th percentiles on the Rented set.

## Results

| # | Address | Beds/Baths | Radius Used | #Rented | #Available | Rented-Median Est. | Available-Median Est. | Actual Lease Rent | Rented % Error | Available % Error |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 424 S Main St, Lapel | 3/1 | 10 mi* | 99 | 20 | $1,200 | $1,250 | $1,545 | **−22.3%** | −19.1% |
| 2 | 412 N Merrill St, Fortville | 3/3 | 1 mi | 5 | 0 | $2,100 | N/A | $2,250 | **−6.7%** ✅ | N/A |
| 3 | 10301 Medallion Dr #150, Indianapolis | 2/1 | 1 mi | 35 | 8 | $1,418 | $1,435 | $995 | **+42.5%** | +44.2% |
| 4 | 737 Muirfield Dr, Brownsburg | 3/2 | 1 mi | 33 | 6 | $1,915 | $1,920 | $2,045 | **−6.4%** ✅ | −6.1% ✅ |
| 5 | 8620 Bluff Point Dr, Camby | 3/2 | 1 mi | 30 | 14 | $1,663 | $1,660 | $1,675 | **−0.7%** ✅ | −0.9% ✅ |
| 6 | 55 W Fall Creek Pkwy S Dr Unit D, Indianapolis | 2/1 | 1 mi | 99 | 39 | $1,150 | $1,206 | $995 | **+15.6%** | +21.2% |
| 7 | 1509 Nelson Ave, Indianapolis | 3/1 | 1 mi | 67 | 6 | $1,350 | $1,313 | $1,500 | **−10.0%** (borderline) | −12.5% |

✅ = within ±10% ("reasonably close" marker, not a pass/fail cutoff — your call on the real threshold)

*Property 1 detail: at 1mi only the self-match was returned (0 usable comps); at 2mi and 3mi, 2 Rented comps gave a median of **$1,372.50 (−11.2% error)**; only at 10mi did the set clear 5 comps (99 found), but the estimate got *worse*, not better — see verdict below.

### Comp-set recency (Rented comps, all properties)

| # | DOM range | date_rented range |
|---|---|---|
| 1 | 0–352 days | 2026-03-09 → 2026-09-08 |
| 2 | 1–40 days | 2025-08-11 → 2026-06-02 |
| 3 | 0–352 days | 2025-06-22 → 2026-07-24 |
| 4 | 0–202 days | 2025-06-04 → 2026-07-24 |
| 5 | 4–86 days | 2025-06-22 → 2026-07-26 |
| 6 | 0–491 days | 2025-06-12 → 2026-07-24 |
| 7 | 0–147 days | 2025-06-04 → 2026-07-24 |

Every comp set spans **12+ months**, several beyond 400 days DOM — none of the comp pulls were implicitly date-limited.

## Data quality notes (found live, not anticipated in the plan)

1. **RentEngine includes the subject property as a comp.** Confirmed on property 1 (424 S Main St) — the API returned that exact address with a rent matching the actual lease exactly. You confirmed this reflects a real earlier tenancy at that address (early move-out, re-leased), not bad data — but it still had to be excluded, since a property can't validate against itself.
2. **Two of the 7 properties are units in multi-unit buildings** (10301/10291 Medallion Dr, and 55 W Fall Creek Pkwy S Dr) where RentEngine returns many separately-listed units at the same street address. A building-level address match would have wrongly excluded *other* units in the same building as if they were the subject — those are actually excellent comps, not self-matches. Fixed by matching on the specific unit number/letter you provided (Medallion #150, Fall Creek Unit D) instead of the base address.
3. **A coordinate-proximity fallback for self-match detection was tried and dropped mid-run.** On property 5 (8620 Bluff Point Dr), a ~160ft threshold wrongly excluded three legitimate next-door comps (65–140ft away), while the true self-match itself sat ~200ft from the Census-geocoded point — the geocoder isn't precise enough to distinguish adjacent houses on a short street. Address-text matching alone proved sufficient and precise in every case observed; all results above use that method only.
4. **Property 3's address was given as a range** ("10301-10291 Medallion Drive") without a unit number initially — needed a follow-up to get the actual unit (#150) before self-exclusion could be done correctly. Same for property 6 (needed the unit letter, D).

## Verdict

**Does median-of-Rented-comps hold up?** Partially. Three properties (Fortville, Muirfield, Bluff Point — all single-family homes with ample nearby same-bed/bath inventory) landed within ~7% of actual, which is a reasonable result for an automated estimate. But the method missed badly on the other four, and the misses aren't random noise — they cluster into two identifiable failure modes:

1. **Thin local inventory forces radius-widening that trades geographic relevance for sample size.** Lapel (small town) had only 2 usable comps out to 3mi (−11.2% error) but had to widen to 10mi to clear the 5-comp threshold — at which point the estimate got *worse* (−22.3%), almost certainly because 10mi from a small town pulls in a different, cheaper sub-market (Anderson-area inventory). The widening rule as specified optimizes for comp-count, not accuracy, and here those two goals pointed opposite directions.
2. **Multi-unit buildings show real unit-level rent variance that a beds/baths/radius filter can't see.** Both apartment-complex properties (Medallion, Fall Creek) missed by 15–44%, in both directions relative to their own building/area rate. A 2bd/1ba filter treats every unit in a 100+ unit complex as interchangeable, but actual unit-level rents clearly aren't (floor, condition, income-restriction, lease vintage, etc. — no way to tell from this data which factor is driving it here).

**Does the Rented→Available fallback make sense?** As specified, yes but with a caveat: in every property, the Available median tracked within a few dollars/percent of the Rented median — it's a coherent proxy when Rented comps run short, and it never contradicts the Rented estimate. But it also **doesn't fix either failure mode above** — it inherits the same small-town dilution and same-complex unit variance, since it's drawn from the same geographically-filtered pool. Treat it as "same estimate, less certain," not as an independent check.

**What I'd change about comp-selection, based on what I actually saw:**

- **Cap the radius-widening more conservatively for thin markets**, or weight nearer comps more heavily (distance-weighted median) instead of jumping straight to whatever radius clears 5 comps — the Lapel case shows widening for count alone can actively hurt accuracy.
- **For multi-unit buildings, bias toward same-building comps first** before falling back to area-wide market rate — Medallion had 30+ same-building comps available; using those preferentially (rather than treating the whole area/property-type pool as equally relevant) would likely track actual unit economics better than a blanket 1-mile radius pull.
- **Bed/bath tolerance (exact beds, ±0.5 baths) seems fine** — it wasn't the bottleneck in any of the 7 cases; the failures were geographic (small-town dilution) and building-type (multi-unit variance), not filter tightness.
- **Comp recency wasn't constrained** in this test (some sets span 400+ days DOM) — worth deciding a date window (e.g., last 6–12 months) once comp-selection logic is actually designed, since year-old leases may not reflect current asking/signing rents, especially in a market that's moved.

---
*Scope note: this run covers accuracy validation only, per the build brief. Comp-selection logic, the fallback rule, estimate math, and report design remain open decisions — the findings above are inputs to those decisions, not decisions themselves.*
