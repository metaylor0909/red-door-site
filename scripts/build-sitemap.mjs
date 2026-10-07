// Writes dist/client/sitemap.xml from the pages the build actually
// produced, so it can never list a page that doesn't exist or miss one
// that does. Runs after `astro build` (see package.json "build").
//
// For each built index.html:
//   - skipped if it has <meta name="robots" content="...noindex...">
//     (thank-you pages, expired-report page, etc.);
//   - skipped for paginated listing pages (/blog/2, /blog/topic/x/3) —
//     page 1 of each list is enough for discovery;
//   - the URL is the page's own <link rel="canonical">, so the sitemap
//     uses exactly the URL each page declares;
//   - lastmod comes from the page's JSON-LD dateModified/datePublished
//     when it has one (blog posts). Other pages get no lastmod rather than
//     a build date, which would be the same meaningless date every time.
//
// Server-rendered pages (rental analysis reports, API routes, /studio)
// aren't in dist and are never listed.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist/client';
const SKIP_PATHS = [/^\/studio(\/|$)/, /^\/404$/, /^\/blog\/\d+$/, /^\/blog\/topic\/[^/]+\/\d+$/];

function* htmlFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name === 'index.html') yield full;
  }
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const entries = [];
let skippedNoindex = 0;
for (const file of htmlFiles(DIST)) {
  const route = '/' + path.relative(DIST, path.dirname(file)).replace(/\\/g, '/');
  const pagePath = route === '/' ? '/' : route.replace(/\/$/, '');
  if (SKIP_PATHS.some((re) => re.test(pagePath))) continue;

  const html = fs.readFileSync(file, 'utf8');
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) {
    skippedNoindex++;
    continue;
  }
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  if (!canonical) {
    console.warn(`[sitemap] ${pagePath} has no canonical link — skipped.`);
    continue;
  }
  const date = html.match(/"dateModified":"([^"]+)"/)?.[1] ?? html.match(/"datePublished":"([^"]+)"/)?.[1];
  entries.push({ loc: canonical, lastmod: date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString().slice(0, 10) : null });
}

// One entry per URL, sorted so diffs between builds stay readable.
const unique = [...new Map(entries.map((e) => [e.loc, e])).values()].sort((a, b) => a.loc.localeCompare(b.loc));
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  unique
    .map((e) => `  <url><loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`)
    .join('\n') +
  '\n</urlset>\n';

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml);
console.log(`[sitemap] Wrote ${unique.length} URLs to ${DIST}/sitemap.xml (${skippedNoindex} noindex pages left out).`);
