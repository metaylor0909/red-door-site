// One-time extraction: pulls the real, already-approved per-city content
// (hero copy, RentCast stat tiles, "What to Expect" facts, curated "Homes
// Available Nearby" links, CTA copy) out of the 19 hand-built static
// reference pages at the repo root (avon-homes-for-rent.html + the other 18
// *-homes-for-rent.html files, Indianapolis excluded) into
// src/data/homes-for-rent-content.json, consumed by
// src/pages/[city]-homes-for-rent.astro. Re-run this if any of those root
// HTML files are revised with new approved copy.
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = readdirSync(ROOT).filter(
  (f) => f.endsWith('-homes-for-rent.html') && f !== 'indianapolis-homes-for-rent.html'
);

const result = {};

for (const file of files) {
  const slug = file.replace('-homes-for-rent.html', '');
  const html = readFileSync(path.join(ROOT, file), 'utf-8');
  const $ = cheerio.load(html);

  const metaTitle = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() ?? '';
  const h1 = $('.page-hero h1').text().trim();
  const heroDek = $('.page-hero .lead').text().trim();
  const dataAsOf = $('.data-asof').text().trim();

  const statTiles = $('.stat-tile')
    .map((i, el) => ({
      label: $(el).find('.stat-label').text().trim(),
      value: $(el).find('.stat-value').text().trim(),
      sub: $(el).find('.stat-sub').text().trim(),
    }))
    .get();

  const snapshotDetail = $('.snapshot-detail')
    .map((i, el) => $(el).text().trim())
    .get();

  // "What to Expect" section = first .content-section (not .is-soft) after .snapshot
  const whatToExpectSection = $('.content-section').first();
  const whatToExpectHeading = whatToExpectSection.find('h2').text().trim();
  const whatToExpectItemsHtml = whatToExpectSection
    .find('li')
    .map((i, el) => $(el).html().trim())
    .get();

  // "Currently Available ..." heading (is-soft content-section)
  let currentlyAvailableHeading = '';
  // "Homes Available Nearby" section
  let nearby = [];
  let nearbyDek = '';
  $('.content-section').each((i, section) => {
    const heading = $(section).find('h2').text().trim();
    if (heading.startsWith('Currently Available')) {
      currentlyAvailableHeading = heading;
    }
    if (heading === 'Homes Available Nearby') {
      nearbyDek = $(section).find('.section-dek').text().trim();
      nearby = $(section)
        .find('.nearby-link')
        .map((j, el) => {
          const $el = $(el);
          const isLink = $el.is('a');
          return {
            label: $el.text().trim(),
            href: isLink ? $el.attr('href') : null,
          };
        })
        .get();
    }
  });

  const ctaHeading = $('.cta-band h2').text().trim();
  const ctaText = $('.cta-band p').text().trim();
  const propertyManagementHref = $('.cta-band .btn-ghost').attr('href') ?? '';

  result[slug] = {
    citySlug: slug,
    cityName: h1.replace(/ Homes for Rent$/, ''),
    metaTitle,
    metaDescription,
    h1,
    heroDek,
    dataAsOf,
    statTiles,
    snapshotDetail,
    whatToExpectHeading,
    whatToExpectItemsHtml,
    currentlyAvailableHeading,
    nearbyDek,
    nearby,
    ctaHeading,
    ctaText,
    propertyManagementHref,
  };
}

writeFileSync(
  path.join(ROOT, 'src/data/homes-for-rent-content.json'),
  JSON.stringify(result, null, 2) + '\n'
);

console.log('Extracted', Object.keys(result).length, 'cities:', Object.keys(result).join(', '));
