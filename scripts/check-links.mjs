// Lists every internal link in the built site (dist/client) that doesn't
// resolve to a built page or file. Run after `npm run build`:
//   node scripts/check-links.mjs
// Server-rendered routes (API, rental-analysis reports, /studio, removed
// listings that redirect) aren't in dist, so those prefixes are skipped.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist/client';
const SSR_PREFIXES = ['/api/', '/rental-analysis/', '/studio', '/homes-for-rent/'];

const served = new Set(['/']);
const pages = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else {
      const rel = '/' + path.relative(DIST, full).split(path.sep).join('/');
      if (entry.name === 'index.html') {
        served.add(rel.replace(/\/index\.html$/, '') || '/');
        pages.push(full);
      } else served.add(rel);
    }
  }
})(DIST);

const broken = new Map();
for (const file of pages) {
  const page = '/' + path.relative(DIST, path.dirname(file)).split(path.sep).join('/');
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/href="([^"#?]*)/g)) {
    let url = m[1];
    if (!url.startsWith('/') || url.startsWith('//')) continue;
    url = url.replace(/\/$/, '') || '/';
    if (served.has(url) || SSR_PREFIXES.some((p) => url.startsWith(p))) continue;
    if (!broken.has(url)) broken.set(url, new Set());
    broken.get(url).add(page);
  }
}

console.log(`Pages scanned: ${pages.length}. Broken internal link targets: ${broken.size}`);
for (const [url, from] of [...broken].sort((a, b) => b[1].size - a[1].size)) {
  console.log(`  ${url}  <- ${from.size} page(s), e.g. ${[...from].slice(0, 3).join(', ')}`);
}
process.exitCode = broken.size > 0 ? 1 : 0;
