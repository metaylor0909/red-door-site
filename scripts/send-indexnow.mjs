// Tells IndexNow (Bing and the other engines that share it) about blog
// posts published or changed since the last successful deploy. Google
// doesn't take part in IndexNow; it finds posts through sitemap.xml.
//
// Runs after `wrangler deploy` (.github/workflows/deploy.yml), so every URL
// it sends is already live. INDEXNOW_SINCE is when the last successful run
// of that workflow started. The key is public by design: IndexNow checks it
// against public/<key>.txt, so it isn't a secret.
//
// It must never send the whole site, so it sends nothing at all when:
//   - INDEXNOW_SINCE is missing (no earlier deploy to compare against);
//   - more than MAX_URLS posts changed. Changes are read from Sanity's
//     _updatedAt, so a bulk script looks like every post changed (one
//     touched 306 posts on 2026-10-01). Those pages are still in
//     sitemap.xml with their lastmod.
//
// Only URLs in this build's sitemap are sent: a post published after the
// build started goes out with the next deploy, whose window covers it.
//
// Each send leaves a "IndexNow sent" notice on the GitHub Actions run,
// listing its URLs. A refused send fails the step, so that run doesn't count
// as successful and the next deploy sends the same posts again. The site
// itself has already deployed by then.
//
// Usage (after a build; it reads dist/client/sitemap.xml):
//   INDEXNOW_SINCE=2026-10-30T00:00:00Z node scripts/send-indexnow.mjs         # dry run
//   INDEXNOW_SINCE=2026-10-30T00:00:00Z node scripts/send-indexnow.mjs --send  # ACTUALLY sends

import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const SITE = 'https://www.reddoorrents.com';
const KEY = '39a0ce051797e1e44ee6404a6a108654';
const MAX_URLS = 25;

const DRY_RUN = !process.argv.includes('--send');
const since = process.env.INDEXNOW_SINCE;

if (!since || Number.isNaN(Date.parse(since))) {
  console.log('[indexnow] No earlier deploy to compare against — nothing sent.');
  process.exit(0);
}
if (!process.env.SANITY_PROJECT_ID) {
  console.error('SANITY_PROJECT_ID is not set — check your .env file.');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  perspective: 'published',
  useCdn: false,
});

const slugs = await client.fetch(
  `*[_type == "post" && defined(slug.current) && dateTime(_updatedAt) > dateTime($since)].slug.current`,
  { since: new Date(since).toISOString() }
);

const sitemap = fs.readFileSync('dist/client/sitemap.xml', 'utf8');
const built = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
const changed = slugs.map((slug) => `${SITE}/blog/${slug}`);
const urls = changed.filter((url) => built.has(url));
for (const url of changed.filter((u) => !built.has(u))) {
  console.log(`[indexnow] Not in this build's sitemap, skipped: ${url}`);
}

if (urls.length === 0) {
  console.log(`[indexnow] No blog posts changed since ${since} — nothing sent.`);
  process.exit(0);
}
if (urls.length > MAX_URLS) {
  console.log(`::warning title=IndexNow skipped::${urls.length} posts changed since ${since}, over the limit of ${MAX_URLS} — nothing sent.`);
  process.exit(0);
}
if (DRY_RUN) {
  console.log(`[indexnow] Dry run, would send ${urls.length}:\n${urls.join('\n')}`);
  process.exit(0);
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: new URL(SITE).host,
    key: KEY,
    keyLocation: `${SITE}/${KEY}.txt`,
    urlList: urls,
  }),
  signal: AbortSignal.timeout(30_000),
});
await response.body?.cancel();

if (!response.ok) {
  console.log(`::error title=IndexNow refused::IndexNow answered ${response.status} for ${urls.length} URLs. The next deploy sends them again.`);
  process.exit(1);
}
console.log(`::notice title=IndexNow sent::${urls.join('%0A')}`);
