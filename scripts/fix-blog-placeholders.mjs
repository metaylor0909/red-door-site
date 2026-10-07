// One-off (2026-10-07): fix two placeholder links left in migrated posts'
// own text. Run without --write to preview; --write saves to Sanity.
//   1. tenant review: a "contact us today" link whose href is the literal
//      "[Insert Contact Us Page URL]" -> /contact
//   2. March 2024 Indianapolis report: the literal text
//      "([Insert YouTube video link here])" -> removed (the video is
//      already embedded in the post)
import 'dotenv/config';
import { createClient } from '@sanity/client';

const WRITE = process.argv.includes('--write');
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const SLUGS = [
  'another-happy-tenant-thanks-to-jc-sison',
  'dont-miss-indianapolis-rental-market-march-2024-renting-trends-in-fishers-noblesville--more',
];

for (const slug of SLUGS) {
  const ids = await client.fetch(`*[_type == "post" && slug.current == $slug]._id`, { slug });
  for (const id of ids) {
    const doc = await client.getDocument(id);
    const sets = {};
    for (const block of doc.body ?? []) {
      if (block._type !== 'block') continue;
      let changed = false;
      const next = structuredClone(block);
      for (const def of next.markDefs ?? []) {
        if (def._type === 'link' && /\[Insert Contact Us Page URL\]|Insert%20Contact/i.test(def.href ?? '')) {
          console.log(`${id}: link "${def.href}" -> "/contact"`);
          def.href = '/contact';
          changed = true;
        }
      }
      for (const child of next.children ?? []) {
        if (typeof child.text === 'string' && child.text.includes('[Insert YouTube video link here]')) {
          const before = child.text;
          child.text = child.text.replace(/\s*\(\[Insert YouTube video link here\]\)/, '').replace(/\s*\[Insert YouTube video link here\]/, '');
          console.log(`${id}: text\n   before: ${JSON.stringify(before)}\n   after:  ${JSON.stringify(child.text)}`);
          changed = true;
        }
      }
      if (changed) sets[`body[_key=="${block._key}"]`] = next;
    }
    if (Object.keys(sets).length === 0) {
      console.log(`${id}: nothing to change`);
      continue;
    }
    if (WRITE) {
      await client.patch(id).set(sets).commit();
      console.log(`${id}: saved`);
    }
  }
}
if (!WRITE) console.log('\nDry run — re-run with --write to save.');
