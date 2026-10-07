// Recent market reports for one city, for the "recent reports" strip on
// that city's property-management page. Kept out of topics.ts because
// that module is also imported by the Sanity schema, which can't load
// the Astro-only sanity:client.
import { sanityClient } from 'sanity:client';
import { MARKETS } from '../market-reports/markets';
import { POST_CARD_PROJECTION, type PostCardData } from './topics';

interface Options {
  limit?: number;
  /** Hide the strip entirely when the newest report is older than this. */
  maxAgeDays?: number;
  /** Hide it when fewer reports than this match (no lone card). */
  minimum?: number;
}

/** The `limit` most recent Market Reports posts about one city, newest
 * first. Show three whenever three exist, even if the third is older
 * (Michael, 2026-10-07 — e.g. Avon's 2024 report).
 *
 * Matched by title the same way the -market-reports pages are (see
 * loadMarketReportPosts), not by city tag: tags over-match (a Noblesville
 * report also carries an Indianapolis tag; metro roundups carry a Carmel
 * tag). A city in a cluster market (Avon -> Westside) matches that
 * market's patterns; others match their own name. Titles naming another
 * market are excluded, so a Noblesville report never lands on the
 * Indianapolis page. Matching uses the cleaned SEO title when a post has
 * one (they follow "{City} Rental Market Report — {Month Year}"): original
 * headlines sometimes name a second city ("...Near Indianapolis"), which
 * wrongly excluded Noblesville's newest report.
 *
 * Empty when the newest report is over a year old: a page leading with
 * stale reports reads as neglect, not expertise. */
export async function loadRecentCityReports(
  citySlug: string,
  cityName: string,
  { limit = 3, maxAgeDays = 365, minimum = 2 }: Options = {}
): Promise<PostCardData[]> {
  const market = MARKETS.find((m) => m.slug === citySlug || m.serviceAreaChips.includes(cityName));
  const matches = market ? market.postTitleMatches : [cityName];
  const excludes = MARKETS.flatMap((m) => m.postTitleMatches).filter((p) => !matches.includes(p));
  const any = (patterns: string[]) =>
    patterns.map((p) => `coalesce(seo.title, title) match ${JSON.stringify(`*${p}*`)}`).join(' || ');
  try {
    const posts: PostCardData[] = await sanityClient.fetch(
      `*[_type == "post"
          && "Market Reports" in categories[]->title
          && (${any(matches)})
          && !(${any(excludes)})
        ] | order(publishedAt desc) [0...$limit] ${POST_CARD_PROJECTION}`,
      { limit }
    );
    if (posts.length < minimum) return [];
    const newest = Date.parse(posts[0].publishedAt);
    return Date.now() - newest <= maxAgeDays * 86_400_000 ? posts : [];
  } catch (err) {
    console.warn(`[city-reports] Could not load reports for ${cityName}:`, err);
    return [];
  }
}
