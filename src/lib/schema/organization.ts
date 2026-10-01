export const ORGANIZATION_ID = 'https://www.reddoorrents.com/#organization';

// Schema.org @id references only resolve within a page, so every page that
// cites the organization (publisher, provider) must include this node itself.
export const ORGANIZATION_JSONLD = {
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: 'Red Door Property Management',
  url: 'https://www.reddoorrents.com/',
  logo: { '@type': 'ImageObject', url: 'https://www.reddoorrents.com/red-door-logo-horizontal.svg' },
  telephone: '+1-317-660-1626',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '3815 River Crossing Pkwy, Suite 100',
    addressLocality: 'Indianapolis',
    addressRegion: 'IN',
    postalCode: '46240',
    addressCountry: 'US',
  },
  sameAs: [
    'https://www.youtube.com/@reddoorrents',
    'https://www.facebook.com/RedDoorPropertyManagement/',
    'https://www.linkedin.com/company/red-door-property-management/',
    'https://www.instagram.com/reddoorrents/',
    'https://www.tiktok.com/@reddoorrents',
  ],
};
