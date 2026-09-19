// Blog migration script (Phase 2 of the blog migration — see
// claude/listings-build-notes.md-style writeup in the project chat history
// and red-door-website-todo.md for the full plan).
//
// Reads all 309 real posts from the sibling red-door-pmw-website-scrape
// project (NOT part of this repo — see that project's archive/blog/*.html),
// converts each to a Sanity `post` document (Portable Text body, real
// author, real images uploaded to Sanity's asset pipeline), joins
// content-fixes.csv for the SEO title/meta fixes where one exists, and
// writes everything to the real Sanity project via the API.
//
// Usage:
//   node scripts/migrate-blog.mjs                  # dry run, all 309 posts, no writes
//   node scripts/migrate-blog.mjs --limit 3         # dry run, first 3 posts only
//   node scripts/migrate-blog.mjs --limit 3 --write # ACTUALLY writes 3 posts to Sanity
//   node scripts/migrate-blog.mjs --write           # ACTUALLY writes all 309 posts
//
// Always run a small --limit batch with --write first and check it in
// Sanity Studio before running the full, unlimited --write pass.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { createClient } from '@sanity/client';

const SCRAPE_ROOT = 'C:\\Users\\mtayl\\red-door-pmw-website-scrape';
const BLOG_DIR = path.join(SCRAPE_ROOT, 'archive', 'blog');
const IMAGES_DIR = path.join(SCRAPE_ROOT, 'archive', 'images');
const CONTENT_FIXES_CSV = path.join(SCRAPE_ROOT, 'content-fixes.csv');

const DRY_RUN = !process.argv.includes('--write');
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

// Michael's decision (2026-09-19): the source archive has 5 distinct raw
// author strings. Two of them aren't real bylines — "RAIZEL ANN NAME" reads
// like an unfilled template field on the old site, and "System" is
// presumably auto-generated content with no real author. Both map to
// Michael Taylor rather than being imported as literal fake authors.
const AUTHOR_MAP = {
  'Michael Taylor': 'Michael Taylor',
  'RAIZEL ANN NAME': 'Michael Taylor',
  System: 'Michael Taylor',
  'Carlos Piñón': 'Carlos Piñón',
  'Chris Knight': 'Chris Knight',
};

// This exact image is a shared "Google review" CTA graphic embedded in
// nearly every post's body (309 occurrences, always referenced with a
// "?v2" cache-busting suffix) — it's site boilerplate, not editorial
// content, so it's deliberately excluded rather than uploaded 309 times
// and left cluttering every post's body.
const SKIP_IMAGE_BASENAMES = new Set(['google-review.png', 'google-review-1.png']);

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

function randKey() {
  return crypto.randomBytes(6).toString('hex');
}

function slugifyId(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

function splitAuthorDate(text) {
  const idx = text.indexOf(' - ');
  if (idx === -1) return [text.trim(), ''];
  return [text.slice(0, idx).trim(), text.slice(idx + 3).trim()];
}

function parsePublishedAt(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function normalizeYoutubeUrl(src) {
  const m = src.match(/embed\/([a-zA-Z0-9_-]+)/);
  return m ? `https://www.youtube.com/watch?v=${m[1]}` : src;
}

// --- minimal CSV parser (content-fixes.csv has quoted fields with commas/quotes inside) ---
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c === '\r') {
      // skip
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadContentFixes() {
  const text = fs.readFileSync(CONTENT_FIXES_CSV, 'utf8');
  const rows = parseCsv(text);
  const header = rows[0];
  const urlIdx = header.indexOf('url');
  const newTitleIdx = header.indexOf('new_title');
  const newMetaIdx = header.indexOf('new_meta');
  const map = new Map();
  for (const row of rows.slice(1)) {
    if (!row[urlIdx]) continue;
    const m = row[urlIdx].match(/\/blog\/(.+)$/);
    if (!m) continue;
    map.set(m[1], { newTitle: row[newTitleIdx] || '', newMeta: row[newMetaIdx] || '' });
  }
  return map;
}

// --- image asset resolution, cached so a shared image is only uploaded once ---
const assetCache = new Map(); // basename -> Sanity asset _id, or null if skipped/missing

async function resolveImageAsset(src) {
  const clean = decodeURIComponent(src.split('?')[0]);
  const basename = path.basename(clean);
  if (SKIP_IMAGE_BASENAMES.has(basename)) return null;
  if (assetCache.has(basename)) return assetCache.get(basename);

  const filePath = path.join(IMAGES_DIR, basename);
  if (!fs.existsSync(filePath)) {
    assetCache.set(basename, null);
    return null;
  }
  if (DRY_RUN) {
    assetCache.set(basename, `dry-run-asset-${basename}`);
    return assetCache.get(basename);
  }
  const buffer = fs.readFileSync(filePath);
  const asset = await client.assets.upload('image', buffer, { filename: basename });
  assetCache.set(basename, asset._id);
  return asset._id;
}

// --- HTML -> Portable Text ---

function blocksFromParagraphLike($, el, style) {
  const blocks = [];
  let curSpans = [];
  // Accumulated across the WHOLE call, never reset by flush(): a <br> inside
  // an <a> tag would otherwise clear the link's markDef between the two
  // resulting blocks while the second block's spans still reference it,
  // producing a dangling mark key. Each block below only keeps the markDefs
  // its own spans actually use.
  const allMarkDefs = [];

  function flush() {
    const filtered = curSpans.filter((s) => s.text.length > 0);
    if (filtered.length) {
      const usedKeys = new Set(filtered.flatMap((s) => s.marks));
      blocks.push({
        _type: 'block',
        _key: randKey(),
        style,
        markDefs: allMarkDefs.filter((d) => usedKeys.has(d._key)),
        children: filtered.map((s) => ({ _type: 'span', _key: randKey(), text: s.text, marks: s.marks })),
      });
    }
    curSpans = [];
  }

  function walkInline(node, marks) {
    if (node.type === 'text') {
      if (node.data) curSpans.push({ text: node.data, marks });
      return;
    }
    if (node.type !== 'tag') return;
    const tag = node.tagName.toLowerCase();
    const $node = $(node);

    if (tag === 'br') {
      flush();
      return;
    }
    if (tag === 'strong' || tag === 'b') {
      $node.contents().each((_, c) => walkInline(c, [...marks, 'strong']));
      return;
    }
    if (tag === 'em' || tag === 'i') {
      $node.contents().each((_, c) => walkInline(c, [...marks, 'em']));
      return;
    }
    if (tag === 'u') {
      $node.contents().each((_, c) => walkInline(c, [...marks, 'underline']));
      return;
    }
    if (tag === 'a') {
      const href = $node.attr('href') || '';
      const key = `lnk${randKey()}`;
      allMarkDefs.push({ _type: 'link', _key: key, href });
      $node.contents().each((_, c) => walkInline(c, [...marks, key]));
      return;
    }
    if (tag === 'img') {
      flush();
      blocks.push({ __pendingImage: $node.attr('src'), alt: $node.attr('alt') || '' });
      return;
    }
    if (tag === 'iframe') {
      const src = $node.attr('src') || '';
      if (/youtube\.com|youtu\.be/.test(src)) {
        flush();
        blocks.push({ __pendingYoutube: src });
      }
      return;
    }
    // span and any other unrecognized inline wrapper: transparent, recurse
    $node.contents().each((_, c) => walkInline(c, marks));
  }

  el.contents().each((_, node) => walkInline(node, []));
  flush();
  return blocks;
}

// A table cell that itself contains block-level children (a heading
// followed by a paragraph is common in the source WYSIWYG "3-column
// feature" tables) needs those joined with a real separator — plain
// $(td).text() concatenates them with no space at all.
function cellText($, $td) {
  const blockChildren = $td.children('p,h1,h2,h3,h4,h5,div,li').toArray();
  if (!blockChildren.length) return $td.text().trim();
  return blockChildren
    .map((el) => $(el).text().trim())
    .filter(Boolean)
    .join('\n\n');
}

export function blocksFromBody($, bodyEl) {
  const blocks = [];

  function walk($container) {
    $container.contents().each((_, node) => {
      if (node.type !== 'tag') {
        if (node.type === 'text' && node.data.trim()) {
          blocks.push(...blocksFromParagraphLike($, $(node.parent), 'normal'));
        }
        return;
      }
      const tag = node.tagName.toLowerCase();
      const $node = $(node);

      switch (tag) {
        case 'p':
          blocks.push(...blocksFromParagraphLike($, $node, 'normal'));
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5': {
          // h1 shouldn't repeat inside body (the post title is already the
          // page's own h1); h5 isn't in the schema — both fold down a level.
          const style = tag === 'h1' ? 'h2' : tag === 'h5' ? 'h4' : tag;
          blocks.push(...blocksFromParagraphLike($, $node, style));
          break;
        }
        case 'blockquote':
          blocks.push(...blocksFromParagraphLike($, $node, 'blockquote'));
          break;
        case 'ul':
        case 'ol': {
          const listItem = tag === 'ul' ? 'bullet' : 'number';
          $node.children('li').each((_, li) => {
            const liBlocks = blocksFromParagraphLike($, $(li), 'normal');
            liBlocks.forEach((b) => {
              if (b._type === 'block') {
                b.listItem = listItem;
                b.level = 1;
              }
            });
            blocks.push(...liBlocks);
          });
          break;
        }
        case 'img':
          blocks.push({ __pendingImage: $node.attr('src'), alt: $node.attr('alt') || '' });
          break;
        case 'iframe': {
          const src = $node.attr('src') || '';
          if (/youtube\.com|youtu\.be/.test(src)) {
            blocks.push({ __pendingYoutube: src });
          }
          break;
        }
        case 'table': {
          const rows = [];
          $node.find('tr').each((_, tr) => {
            const cells = [];
            $(tr)
              .find('td,th')
              .each((_, td) => cells.push(cellText($, $(td))));
            rows.push({ _type: 'row', _key: randKey(), cells });
          });
          blocks.push({ _type: 'table', _key: randKey(), rows });
          break;
        }
        case 'br':
        case 'hr':
        case 'link':
        case 'script':
        case 'style':
          break; // no visible content to migrate
        default:
          // div, span, section, article, header, footer, main, and anything
          // else unrecognized: transparent container, recurse into it.
          walk($node);
      }
    });
  }

  walk(bodyEl);
  return blocks;
}

export async function resolvePending(rawBlocks) {
  const out = [];
  for (const b of rawBlocks) {
    if (b.__pendingImage) {
      const assetId = await resolveImageAsset(b.__pendingImage);
      if (assetId) {
        out.push({
          _type: 'image',
          _key: randKey(),
          alt: b.alt || '',
          asset: { _type: 'reference', _ref: assetId },
        });
      }
      continue;
    }
    if (b.__pendingYoutube) {
      out.push({ _type: 'youtubeEmbed', _key: randKey(), url: normalizeYoutubeUrl(b.__pendingYoutube) });
      continue;
    }
    out.push(b);
  }
  return out;
}

// --- main ---

async function main() {
  const contentFixes = loadContentFixes();
  const allFiles = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.html'));
  const files = allFiles.slice(0, LIMIT);

  console.log(`${DRY_RUN ? '[DRY RUN] ' : '[WRITE] '}Processing ${files.length} of ${allFiles.length} posts...\n`);

  const authorIds = {};
  for (const name of new Set(Object.values(AUTHOR_MAP))) {
    const id = `author-${slugifyId(name)}`;
    authorIds[name] = id;
    if (!DRY_RUN) {
      await client.createIfNotExists({ _id: id, _type: 'author', name });
    }
  }

  const results = { created: [], noDate: [], errors: [] };

  for (const file of files) {
    try {
      const slug = file.replace(/\.html$/, '');
      const html = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const $ = cheerio.load(html);

      const title = $('h1.post-title').first().text().trim();
      const detailsText = $('div.post-details').first().text().trim();
      const [rawAuthor, rawDate] = splitAuthorDate(detailsText);
      const publishedAt = parsePublishedAt(rawDate);
      const authorName = AUTHOR_MAP[rawAuthor] || 'Michael Taylor';
      const metaDescription = $('meta[name="description"]').attr('content') || '';

      const bodyDiv = $('div.post-body').first();
      const rawBlocks = blocksFromBody($, bodyDiv);
      const blocks = await resolvePending(rawBlocks);

      let mainImage = null;
      if (blocks[0] && blocks[0]._type === 'image') {
        mainImage = blocks.shift();
      }

      const fix = contentFixes.get(slug);

      const doc = {
        _id: `post-${slugifyId(slug)}`,
        _type: 'post',
        title: title || slug,
        slug: { _type: 'slug', current: slug },
        publishedAt: publishedAt || undefined,
        author: { _type: 'reference', _ref: authorIds[authorName] },
        excerpt: metaDescription || undefined,
        mainImage: mainImage
          ? { _type: 'image', alt: mainImage.alt, asset: mainImage.asset }
          : undefined,
        body: blocks,
        seo: {
          title: fix?.newTitle || undefined,
          description: fix?.newMeta || metaDescription || undefined,
        },
        legacyUrl: `https://www.reddoorrents.com/blog/${slug}`,
        legacyAuthorRaw: rawAuthor,
      };

      if (!publishedAt) results.noDate.push(slug);

      if (!DRY_RUN) {
        await client.createOrReplace(doc);
      }
      results.created.push({
        slug,
        title: doc.title,
        author: authorName,
        blocks: blocks.length,
        hasMainImage: !!mainImage,
        hasSeoFix: !!fix,
      });
    } catch (err) {
      results.errors.push({ file, error: err.message });
    }
  }

  console.log(`Created${DRY_RUN ? ' (dry run, nothing written)' : ''}: ${results.created.length}`);
  console.log(`Posts with an unparseable date: ${results.noDate.length}`, results.noDate);
  console.log(`Errors: ${results.errors.length}`);
  if (results.errors.length) console.log(JSON.stringify(results.errors, null, 2));
  if (files.length <= 10) {
    console.log('\nPer-post detail:');
    console.log(JSON.stringify(results.created, null, 2));
  }

  const outIdx = process.argv.indexOf('--out');
  if (outIdx !== -1) {
    fs.writeFileSync(process.argv[outIdx + 1], JSON.stringify(results, null, 2));
    console.log(`\nFull results written to ${process.argv[outIdx + 1]}`);
  }
}

const isMainModule = process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
if (isMainModule) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
