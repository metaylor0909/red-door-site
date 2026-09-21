// Real blog-post cards for the market-reports pages' "Recent Reports &
// Videos" grid. The static mockups this project ports from (Sep 17)
// explicitly labeled this section as illustrative placeholder content,
// "will pull live from posts... once the blog import is complete" — the
// blog import IS complete now (309/309 posts confirmed live), so this
// queries Sanity for real posts instead of porting the placeholder
// cards verbatim.
//
// There's no dedicated "video" document type or city/tag field in the
// current Sanity schema (see red-door-website-todo.md's "Market report
// data points — design for now, implement later": structured city/
// category fields are still future work) — market-report posts are
// ordinary blog posts, some of which embed a YouTube video via a
// `youtubeEmbed` body block. Matched here by title text (e.g. "Fishers",
// "Westside") rather than a real taxonomy, since that's the only
// reliable signal that exists today; confirmed via a live query before
// building this that every one of the 9 markets has multiple real,
// recent posts this way — see markets.ts's own postTitleMatches per
// market.
import { sanityClient } from 'sanity:client';

export interface MarketReportPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  hasVideo: boolean;
  /** YouTube thumbnail URL, derived from the post's first youtubeEmbed
   * block, when present — same i.ytimg.com/vi/<id>/hqdefault.jpg pattern
   * already used by LandlordLibrary.astro's hardcoded posts. */
  thumbnailUrl: string | null;
}

interface RawPost {
  title: string;
  slug: string;
  publishedAt: string;
  excerpt?: string;
  hasVideo: boolean;
  videoUrl?: string | null;
}

function youtubeThumbnail(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;
  const match = videoUrl.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function formatPostDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// Real Fair Housing violations found live in the Sanity blog corpus
// while building this page — CLAUDE.md's Fair Housing section
// documents this exact "strong schools"/"school-driven" pattern as
// already-flagged-and-supposedly-fixed elsewhere, but these two posts'
// excerpts weren't part of that earlier pass. This is a stopgap at the
// display layer, not a fix — the actual posts in Sanity still need
// correcting (flagged separately; see this feature's own commit/PR
// notes). Never surface an excerpt containing one of these patterns;
// fall back to no excerpt at all rather than a doctored rewrite of
// content this project doesn't own the authorship of.
const FAIR_HOUSING_RISK_PATTERNS = [/school-driven/i, /strong schools?\b/i, /school-calendar/i, /family-oriented/i];

function safeExcerpt(excerpt: string | undefined): string {
  if (!excerpt) return '';
  return FAIR_HOUSING_RISK_PATTERNS.some((pattern) => pattern.test(excerpt)) ? '' : excerpt;
}

/** Returns up to `limit` real recent posts matching any of the given
 * title patterns, excluding posts that also match another market's
 * name — found via a real cross-contamination bug while building this:
 * "Is Noblesville, Indiana the Best Rental Market Near Indianapolis?"
 * matched Indianapolis's own `title match "*Indianapolis*"` purely
 * because of the "Near Indianapolis" phrasing, which would have shown a
 * Noblesville-focused post as if it were Indianapolis content. `exclude`
 * should be every OTHER market's postTitleMatches, flattened — see how
 * [market]-market-reports.astro's getStaticPaths calls this. Empty
 * array (not an error) when Sanity has nothing yet or the fetch fails —
 * callers should render their existing "view all posts" link either way
 * rather than show a broken grid. */
export async function loadMarketReportPosts(titleMatches: string[], exclude: string[], limit = 6): Promise<MarketReportPost[]> {
  const matchClauses = titleMatches.map((pattern) => `title match "*${pattern}*"`).join(' || ');
  const excludeClauses = exclude.map((pattern) => `title match "*${pattern}*"`).join(' || ');
  const filter = excludeClauses ? `(${matchClauses}) && !(${excludeClauses})` : matchClauses;
  const query = `*[_type == "post" && ${filter}] | order(publishedAt desc) [0...${limit}] {
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    "hasVideo": count(body[_type == "youtubeEmbed"]) > 0,
    "videoUrl": body[_type == "youtubeEmbed"][0].url
  }`;

  try {
    const raw = (await sanityClient.fetch(query)) as RawPost[];
    return raw.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: safeExcerpt(post.excerpt),
      publishedAt: formatPostDate(post.publishedAt),
      hasVideo: post.hasVideo,
      thumbnailUrl: youtubeThumbnail(post.videoUrl),
    }));
  } catch (err) {
    console.warn('[market-reports] Could not reach Sanity for real posts — grid will be empty.', err);
    return [];
  }
}
