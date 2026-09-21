// Pulled into a real module rather than declared inline in
// [city]-property-management.astro's frontmatter — the Cloudflare
// adapter's prerender step doesn't reliably see top-level consts declared
// directly in an .astro file from inside getStaticPaths() (confirmed
// building this exact page: "ReferenceError: CITIES is not defined").
// Same fix already applied to the homes-for-rent pages — see
// src/lib/listings/homes-for-rent-content.ts's own header comment.

export interface CityEntry {
  slug: string;
  name: string;
}

// The 18 simple cities (Indianapolis excluded — its own mockup uses a
// meaningfully different design, see the .astro file's header comment).
// Same slug set as the -homes-for-rent pages minus downtown-indianapolis.
export const CITIES: CityEntry[] = [
  { slug: 'avon', name: 'Avon' },
  { slug: 'broad-ripple', name: 'Broad Ripple' },
  { slug: 'brownsburg', name: 'Brownsburg' },
  { slug: 'carmel', name: 'Carmel' },
  { slug: 'center-township', name: 'Center Township' },
  { slug: 'decatur-township', name: 'Decatur Township' },
  { slug: 'fishers', name: 'Fishers' },
  { slug: 'franklin-township', name: 'Franklin Township' },
  { slug: 'greenwood', name: 'Greenwood' },
  { slug: 'lawrence-township', name: 'Lawrence Township' },
  { slug: 'noblesville', name: 'Noblesville' },
  { slug: 'perry-township', name: 'Perry Township' },
  { slug: 'pike-township', name: 'Pike Township' },
  { slug: 'warren-township', name: 'Warren Township' },
  { slug: 'washington-township', name: 'Washington Township' },
  { slug: 'wayne-township', name: 'Wayne Township' },
  { slug: 'westfield', name: 'Westfield' },
  { slug: 'zionsville', name: 'Zionsville' },
];
