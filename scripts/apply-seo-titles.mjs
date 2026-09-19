// Applies hand-authored seo.title fixes to posts whose current effective
// title is over 60 characters (or otherwise flagged) and that don't
// already have a fix from content-fixes.csv. See
// claude/blog-migration-notes.md for how these were produced: 56 posts
// follow a systematic "{City} Rental Market Report — {Month Year}"
// template (real publishedAt / excerpt-embedded dates, not guessed), and
// 85 are one-off editorial rewrites of genuinely long or clickbait-y
// titles, each read and shortened by hand against the site's writing
// style (plain, direct, concrete specifics, no marketing inflation).
//
// Usage:
//   node scripts/apply-seo-titles.mjs            # dry run
//   node scripts/apply-seo-titles.mjs --write    # ACTUALLY writes
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

const DATA_DIR = path.join(__dirname, 'data');
const marketReport = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'seo-title-fixes-market-reports.json'), 'utf8'));
const other = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'seo-title-fixes-other.json'), 'utf8'));

const fixes = [...marketReport.map((p) => ({ slug: p.slug, newTitle: p.newTitle })), ...other];

async function main() {
  console.log(`${DRY_RUN ? '[DRY RUN] ' : '[WRITE] '}Applying ${fixes.length} SEO title fixes...\n`);

  // sanity check: no dupes, nothing over 60
  const titles = fixes.map((f) => f.newTitle);
  if (new Set(titles).size !== titles.length) throw new Error('Duplicate titles in the fix set — aborting.');
  const tooLong = fixes.filter((f) => f.newTitle.length > 60);
  if (tooLong.length) throw new Error(`${tooLong.length} titles still over 60 chars — aborting: ${JSON.stringify(tooLong)}`);

  let applied = 0;
  let notFound = [];

  for (const fix of fixes) {
    const post = await client.fetch(`*[_type=="post" && slug.current==$slug][0]{_id, "seoTitle": seo.title}`, { slug: fix.slug });
    if (!post) {
      notFound.push(fix.slug);
      continue;
    }
    if (post.seoTitle) {
      // Already has a fix (shouldn't happen — these were pulled from posts
      // without one — but never overwrite an existing fix silently).
      console.warn(`Skipping ${fix.slug} — already has an seo.title: "${post.seoTitle}"`);
      continue;
    }
    if (!DRY_RUN) {
      await client.patch(post._id).set({ 'seo.title': fix.newTitle }).commit();
    }
    applied++;
  }

  console.log(`Applied: ${applied} / ${fixes.length}`);
  if (notFound.length) console.log('Not found (slug mismatch?):', notFound);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
