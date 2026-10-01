// Writes the post `summary` field from scripts/data/blog-summaries.json
// (slug -> summary). The summaries were drafted from each post's own text:
// every number appears verbatim in the post, and none use Fair Housing
// prohibited terms (see CLAUDE.md). Kept in the repo so they can be
// re-applied if a re-migration ever wipes CMS fields again.
//
// Usage:
//   node scripts/apply-blog-summaries.mjs            # dry run
//   node scripts/apply-blog-summaries.mjs --write    # ACTUALLY writes
//
// Idempotent: a plain patch().set() per post, safe to re-run.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = !process.argv.includes('--write');

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

const summaries = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'blog-summaries.json'), 'utf8'));

async function main() {
  const entries = Object.entries(summaries);
  console.log(`${DRY_RUN ? '[DRY RUN] ' : '[WRITE] '}Applying ${entries.length} summaries...\n`);

  const tooLong = entries.filter(([, s]) => s.length > 600);
  if (tooLong.length) throw new Error(`${tooLong.length} summaries over 600 chars — aborting: ${tooLong.map(([k]) => k).join(', ')}`);

  const posts = await client.fetch(`*[_type == "post" && slug.current in $slugs]{_id, "slug": slug.current}`, {
    slugs: entries.map(([slug]) => slug),
  });
  const idBySlug = new Map(posts.map((p) => [p.slug, p._id]));
  const notFound = entries.filter(([slug]) => !idBySlug.has(slug)).map(([slug]) => slug);

  let tx = client.transaction();
  for (const [slug, summary] of entries) {
    const id = idBySlug.get(slug);
    if (id) tx = tx.patch(id, (p) => p.set({ summary }));
  }
  if (!DRY_RUN) await tx.commit();

  console.log(`Applied: ${entries.length - notFound.length} / ${entries.length}`);
  if (notFound.length) console.warn(`Not found in Sanity: ${notFound.join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
