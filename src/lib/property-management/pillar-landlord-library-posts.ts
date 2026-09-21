// The Landlord Library post set shared by the Indianapolis property-
// management page and the 7 pillar pages (confirmed byte-identical
// across all 8 via diff) — a DIFFERENT 3 posts than the homepage's and
// the 18 simple -property-management pages' own set (LandlordLibrary.astro's
// own DEFAULT_POSTS), confirmed via diff too. The live site apparently
// doesn't keep this block in sync across page types either — see
// red-door-website-todo.md's "Pillar pages" section.
import type { Post } from '../../components/LandlordLibrary.astro';

export const PILLAR_LANDLORD_LIBRARY_POSTS: Post[] = [
  {
    slug: 'westfield-market-report-leasing-improves-as-rental-supply-drops-52--august-2026',
    thumbnail: 'https://i.ytimg.com/vi/H1syUd2uJfE/hqdefault.jpg',
    thumbnailAlt: "Westfield market report video thumbnail from Red Door's blog",
    title: 'Westfield Market Report: Leasing Improves as Rental Supply Drops 52%',
    dek: 'Westfield finally delivered some relief in August — rental days on market dropped sharply while active rental inventory continued falling.',
    date: 'August 2026',
  },
  {
    slug: 'greenwood-market-report-rents-hold-as-home-prices-fall-nearly-8--august-2026',
    thumbnail: 'https://i.ytimg.com/vi/t6v_HJ0A1YA/hqdefault.jpg',
    thumbnailAlt: "Greenwood market report video thumbnail from Red Door's blog",
    title: 'Greenwood Market Report: Rents Hold as Home Prices Fall Nearly 8%',
    dek: 'Greenwood is showing two different market stories at the same time — steady rental pricing alongside softer year-over-year home sale prices.',
    date: 'August 2026',
  },
  {
    slug: 'why-professional-rental-property-photos-matter-before-the-first-showing',
    thumbnail: 'https://i.ytimg.com/vi/2CqrHkZik6g/hqdefault.jpg',
    thumbnailAlt: "Rental property photography article thumbnail from Red Door's blog",
    title: 'Why Professional Rental Property Photos Matter Before the First Showing',
    dek: 'For most rental properties, the first showing happens online, before a prospective tenant ever walks through the front door.',
    date: '2026',
    category: 'Owner Guidance',
  },
];
