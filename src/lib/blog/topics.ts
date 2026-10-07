// Blog topics, post cards, and related-post selection.
//
// Every post carries exactly one of six topic categories (assigned Sep 19,
// see claude/blog-migration-notes.md) plus optional city categories — both
// are Sanity `category` documents. The category documents have no slugs
// in Sanity, so topic URLs are defined here by title instead.
//
// City categories deliberately get no archive pages of their own: each
// served market's /[city]-market-reports page already lists that city's
// reports, and a /blog/fishers page listing the same posts would compete
// with it in search.

export interface BlogTopic {
  title: string;
  slug: string;
  heading: string;
  intro: string;
  description: string;
}

export const BLOG_TOPICS: BlogTopic[] = [
  {
    title: 'Market Reports',
    slug: 'market-reports',
    heading: 'Rental Market Reports',
    intro:
      'Monthly rent, inventory, and days-on-market reports for Indianapolis and the surrounding Central Indiana markets Red Door serves, written for owners deciding how to price, prepare, or hold a rental.',
    description:
      'Monthly rental market reports for Indianapolis and Central Indiana: rents, inventory, and days on market from Red Door Property Management.',
  },
  {
    title: 'Landlord Tips',
    slug: 'landlord-tips',
    heading: 'Landlord Tips',
    intro:
      'Practical guidance for rental owners on pricing, leasing, renewals, maintenance, and avoiding the mistakes that cost landlords the most.',
    description:
      'Practical guidance for Indianapolis-area rental owners on pricing, leasing, renewals, and maintenance from Red Door Property Management.',
  },
  {
    title: 'Tenant Resources',
    slug: 'tenant-resources',
    heading: 'Tenant Resources',
    intro:
      'Guidance for residents on applying, moving in, paying rent, requesting maintenance, and moving out of a Red Door-managed home.',
    description:
      'Resources for Red Door residents on applications, move-in, rent payments, maintenance requests, and move-out.',
  },
  {
    title: 'Investment Strategy',
    slug: 'investment-strategy',
    heading: 'Investment Strategy',
    intro:
      'How to evaluate, buy, finance, and hold rental property in Central Indiana, from reserves and cash flow to when to sell.',
    description:
      'Rental property investment strategy for Central Indiana owners: evaluating deals, reserves, cash flow, and when to hold or sell.',
  },
  {
    title: 'Property Maintenance',
    slug: 'property-maintenance',
    heading: 'Property Maintenance',
    intro:
      'Seasonal upkeep, preventative maintenance, and repair decisions that protect a rental home and keep turnover costs down.',
    description:
      'Seasonal and preventative maintenance guidance for rental homes from Red Door Property Management.',
  },
  {
    title: 'Client Stories',
    slug: 'client-stories',
    heading: 'Client Stories',
    intro: 'Real examples of how Red Door has handled leasing, maintenance, and service for owners and residents.',
    description: 'Real client stories from Red Door Property Management owners and residents.',
  },
];

export const BLOG_TOPIC_TITLES = BLOG_TOPICS.map((t) => t.title);
const TOPIC_TITLES = new Set(BLOG_TOPIC_TITLES);

export function topicFor(categories: string[] | null | undefined): BlogTopic | undefined {
  const title = (categories ?? []).find((c) => TOPIC_TITLES.has(c));
  return BLOG_TOPICS.find((t) => t.title === title);
}

export function cityTagsFor(categories: string[] | null | undefined): string[] {
  return (categories ?? []).filter((c) => !TOPIC_TITLES.has(c));
}

export function topicPath(topic: BlogTopic): string {
  return `/blog/topic/${topic.slug}`;
}

/** GROQ projection for anything that renders a post card. */
export const POST_CARD_PROJECTION = `{
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  "authorName": author->name,
  "mainImageUrl": mainImage.asset->url,
  "youtubeUrl": body[_type == "youtubeEmbed"][0].url,
  "categories": categories[]->title
}`;

export interface PostCardData {
  title: string;
  slug: string;
  publishedAt: string;
  excerpt?: string;
  authorName?: string;
  mainImageUrl?: string;
  youtubeUrl?: string;
  categories?: string[];
}

// Same fallback as the blog index always used: most posts without a
// featured image are video market reports, so use the video thumbnail.
export function cardThumbnail(post: PostCardData): string | null {
  if (post.mainImageUrl) return post.mainImageUrl;
  const match = post.youtubeUrl?.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

// 78 posts still contain Fair Housing problem wording (see the blog audit
// in red-door-website-todo.md). Until those posts are cleaned up, never
// put a flagged excerpt on a listing page; show no excerpt instead.
// Broader than market-reports/posts.ts's list because these cards show
// every topic, not just market reports.
const FAIR_HOUSING_RISK_PATTERNS = [
  /\bschools?\b/i,
  /school-driven/i,
  /school-calendar/i,
  /\bfamilies\b/i,
  /family-(oriented|friendly)/i,
  /\bchildren\b/i,
  /\bkids\b/i,
  /\bdivers(e|ity)\b/i,
  /\bsafe (and|&) secure\b/i,
];

export function safeExcerpt(excerpt: string | undefined): string {
  if (!excerpt) return '';
  return FAIR_HOUSING_RISK_PATTERNS.some((p) => p.test(excerpt)) ? '' : excerpt;
}

/** Up to `limit` posts to show under a post, always from the same
 * topic: posts sharing a city come first, then the posts published closest
 * in time. Closest-in-time (rather than newest) means a market report links
 * to the neighboring months' reports for its city, and links spread across
 * the whole archive instead of every post pointing at the same three new
 * ones. Metro-wide roundups (4+ city tags) don't count as a city match. */
export function relatedPosts(post: PostCardData, all: PostCardData[], limit = 3): PostCardData[] {
  const topic = topicFor(post.categories)?.title;
  if (!topic) return [];
  const cities = cityTagsFor(post.categories);
  const cityScope = cities.length <= 3 ? new Set(cities) : new Set<string>();
  const when = Date.parse(post.publishedAt);
  return all
    .filter((p) => p.slug !== post.slug && topicFor(p.categories)?.title === topic)
    .map((p) => {
      const pCities = cityTagsFor(p.categories);
      const sharedCity = pCities.length <= 3 && pCities.some((c) => cityScope.has(c));
      return { p, sharedCity, gap: Math.abs(Date.parse(p.publishedAt) - when) };
    })
    .sort((a, b) => Number(b.sharedCity) - Number(a.sharedCity) || a.gap - b.gap)
    .slice(0, limit)
    .map((s) => s.p);
}
