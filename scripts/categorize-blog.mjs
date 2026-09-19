// Assigns categories to all 309 real blog posts (Phase 2.5 of the blog
// migration — see claude/blog-migration-notes.md). The source archive has
// no tags/categories at all, so this taxonomy and the classification rules
// below were derived from surveying the real 309 post titles, not from any
// existing data.
//
// Every post gets exactly one topic category from the 6 below. Market
// Reports posts additionally get one or more city tags (Michael's
// decision, 2026-09-19) — every other post gets a city tag too if a single
// city is unambiguous in the title/excerpt, but that's a lower-confidence
// bonus, not a requirement.
//
// Usage:
//   node scripts/categorize-blog.mjs                  # dry run, all posts
//   node scripts/categorize-blog.mjs --limit 10        # dry run, first 10
//   node scripts/categorize-blog.mjs --write           # ACTUALLY writes
//
// Idempotent: category documents use deterministic _ids and
// createIfNotExists; post category assignments use a plain patch (set),
// safe to re-run.

import 'dotenv/config';
import { createClient } from '@sanity/client';

const DRY_RUN = !process.argv.includes('--write');
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

if (!process.env.SANITY_PROJECT_ID) {
  console.error('SANITY_PROJECT_ID is not set — check your .env file.');
  process.exit(1);
}
if (!DRY_RUN && !process.env.SANITY_API_WRITE_TOKEN) {
  console.error('--write was passed but SANITY_API_WRITE_TOKEN is not set — check your .env file.');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

function slugifyId(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
}

// --- Topic taxonomy (6), checked in this priority order ---
// Order matters: a post can plausibly match more than one pattern (e.g. a
// market report mentioning "investors"), so the first true match wins.
const TOPIC_RULES = [
  {
    name: 'Market Reports',
    test: (t) =>
      /market report|market update|rental market|housing market|still a (cash flow|strong rental|top rental) market|renting or buying|booming or busting|economic update|real estate market update|market shifts|market insight|becoming a top rental market|emerging rental market|worth investing in/i.test(
        t
      ),
  },
  {
    // Title-only, deliberately stricter than the other rules — testimonial
    // language ("smooth move-in", "happy client") shows up in the excerpt
    // of ordinary landlord-advice posts too (e.g. "ensure a smooth
    // move-in experience for your renters"), which produced false
    // positives when matched against title+excerpt like the rest.
    name: 'Client Stories',
    // Not anchored to the start — "⭐⭐⭐⭐⭐ A Big Thank You to Paula..." has
    // words between the stars and "Thank You", which an earlier anchored
    // version of this rule missed entirely. "thanks to [A-Z]" (a named
    // person) distinguishes a real testimonial from generic "happy
    // tenants" advice copy, which must NOT match here.
    test: (_t, title) =>
      /thank you|huge thanks|happy client|thanks to [A-Z]|red door delivers|client (spotlight|story)|spotlight on client|\d-star review|star review|review alert|raving review|testimonial/i.test(
        title
      ),
  },
  {
    name: 'Tenant Resources',
    test: (t) =>
      /tenant|eviction|screening|lease renewal|emotional support animal|\besa\b|move-in|renter|qualifying (tenants|applicants)|rental application/i.test(
        t
      ),
  },
  {
    name: 'Property Maintenance',
    test: (t) => /maintain|curb appeal|vendor|inspection|hvac|preventative|repair|winteriz/i.test(t),
  },
  {
    name: 'Investment Strategy',
    test: (t) => /1031 exchange|dscr|cash flow|portfolio|cap rate|\broi\b|return on investment|scaled his|new construction|urban development/i.test(t),
  },
  // Landlord Tips is the fallback — everything else about owning/managing
  // a rental that doesn't match a more specific bucket above.
];

const CITIES = [
  'Anderson',
  'Avon',
  'Brownsburg',
  'Carmel',
  'Fishers',
  'Greenfield',
  'Greenwood',
  'Indianapolis',
  'Lebanon',
  'Noblesville',
  'Plainfield',
  'Westfield',
  'Whitestown',
];

function classifyTopic(text, title) {
  for (const rule of TOPIC_RULES) {
    if (rule.test(text, title)) return rule.name;
  }
  return 'Landlord Tips';
}

function detectCities(text) {
  if (/westside/i.test(text)) return ['Westside'];
  return CITIES.filter((c) => text.includes(c));
}

async function main() {
  const topicIds = {};
  for (const rule of TOPIC_RULES.map((r) => r.name).concat('Landlord Tips')) {
    const id = `category-${slugifyId(rule)}`;
    topicIds[rule] = id;
    if (!DRY_RUN) await client.createIfNotExists({ _id: id, _type: 'category', title: rule });
  }
  const cityIds = {};
  for (const city of CITIES.concat('Westside')) {
    const id = `category-city-${slugifyId(city)}`;
    cityIds[city] = id;
    if (!DRY_RUN) await client.createIfNotExists({ _id: id, _type: 'category', title: city });
  }

  const posts = await client.fetch(`*[_type=="post"]{_id, title, "slug": slug.current, excerpt}`);
  const list = posts.slice(0, LIMIT);

  console.log(`${DRY_RUN ? '[DRY RUN] ' : '[WRITE] '}Classifying ${list.length} of ${posts.length} posts...\n`);

  const topicCounts = {};
  const cityCounts = {};
  const preview = [];

  for (const post of list) {
    const text = `${post.title} ${post.excerpt || ''}`;
    const topic = classifyTopic(text, post.title);
    const cities = topic === 'Market Reports' ? detectCities(text) : detectCities(text).slice(0, 1);

    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    cities.forEach((c) => (cityCounts[c] = (cityCounts[c] || 0) + 1));

    const categoryRefs = [
      { _type: 'reference', _ref: topicIds[topic], _key: `cat-${slugifyId(topic)}` },
      ...cities.map((c) => ({ _type: 'reference', _ref: cityIds[c], _key: `cat-city-${slugifyId(c)}` })),
    ];

    preview.push({ slug: post.slug, topic, cities });

    if (!DRY_RUN) {
      await client.patch(post._id).set({ categories: categoryRefs }).commit();
    }
  }

  console.log('Topic distribution:', topicCounts);
  console.log('City tag distribution:', cityCounts);
  if (list.length <= 15) {
    console.log('\nPer-post detail:');
    console.log(JSON.stringify(preview, null, 2));
  }

  const outIdx = process.argv.indexOf('--out');
  if (outIdx !== -1) {
    const fs = await import('node:fs');
    fs.writeFileSync(process.argv[outIdx + 1], JSON.stringify(preview, null, 2));
    console.log(`\nFull results written to ${process.argv[outIdx + 1]}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
