// Compiles data/property-management/local-facts.json from the research
// passes in this folder (owner-facts-*.json, 2026-10-20). Only facts the
// research verified against a source it opened are written here; each
// area's `unverified` list stays in the research files and is summarized
// for the team in claude/city-local-facts-review.md.
//
// Run: node claude/research/compile-local-facts.mjs
import fs from 'node:fs';

const SRC = {
  indyRegistry: { label: 'Indianapolis landlord registration', url: 'https://www.indy.gov/activity/landlord-registration-program' },
  ch851: { label: 'Indianapolis Code Ch. 851', url: 'https://library.municode.com/in/indianapolis_-_marion_county/codes/code_of_ordinances?nodeId=TITIVBUCORELI_CH851INLAREPR' },
  ch852: { label: 'Indianapolis Code Ch. 852 (short-term rentals)', url: 'https://library.municode.com/in/indianapolis_-_marion_county/codes/code_of_ordinances?nodeId=TITIVBUCORELI_CH852INSHRMREPEPR' },
  dlgfCaps: { label: 'Indiana DLGF circuit-breaker caps', url: 'https://www.in.gov/dlgf/files/240429-Fact-Sheet-Circuit-Breaker-Caps.pdf' },
  courtBrochure: { label: 'Marion County small claims courts brochure', url: 'https://www.warrentownshiptrustee.org/wp-content/uploads/2023/09/Small-Claims-Court-Brochure-2023.pdf' },
  citizens: { label: 'Citizens Energy Group', url: 'https://info.citizensenergygroup.com/company/divisions' },
  aes: { label: 'AES Indiana service area', url: 'https://www.aesindiana.com/sites/aesvault.com/files/2026-07/Service-Area-Description-46258-Effective-07-27-26.pdf' },
  centerCourt: { label: 'Center Township Small Claims Court', url: 'https://www.in.gov/townships/center49/small-claims-court/about-the-court/' },
  decaturCourt: { label: 'Decatur Township Small Claims Court', url: 'http://www.in.gov/townships/decatur49/departments/small-claims-court/' },
  franklinCourt: { label: 'Franklin Township courts', url: 'https://franklintownshipindiana.org/courts/' },
  perryCourt: { label: 'Perry Township Small Claims Court', url: 'https://www.perrytownship-in.gov/court-information.html' },
  waynCourt: { label: 'Wayne Township Small Claims Court', url: 'https://www.waynetwp.org/small-claims-court/' },
  speedwayOrd: { label: 'Speedway Ordinance 1057', url: 'https://www.speedwayin.gov/ordinances/pages/ordinance-no-1057' },
  speedwayPermits: { label: 'Speedway licenses and permits', url: 'https://www.speedwayin.gov/clerk-treasurer/pages/business-licenses-and-other-permits' },
  lawrenceUtil: { label: 'Lawrence Utilities', url: 'https://www.cityoflawrence.org/utilities/water-sewer' },
  lawrenceCode: { label: 'City of Lawrence code', url: 'https://codelibrary.amlegal.com/codes/lawrence/latest/overview' },
  citizensStep: { label: 'Citizens septic-to-sewer program', url: 'https://info.citizensenergygroup.com/projects/step' },
  clermont: { label: 'Town of Clermont ordinances', url: 'http://www.in.gov/towns/clermont/government/ordinances/' },
};

// Ends a sentence on an address without doubling an abbreviation's period.
const endSentence = (text) => (text.endsWith('.') ? text : `${text}.`);

// ---- Marion County (shared) --------------------------------------------
const INDY_REGISTRY =
  'Rental owners in the City of Indianapolis must register with the city’s Department of Business and Neighborhood Services, naming an Indiana-resident manager and an agent for service of process. Registration renews every year, and a new owner has 30 days to register after buying. The ordinance (Code Chapter 851) does not create a routine rental inspection program.';
const INDY_STR =
  'Each short-term rental unit needs its own annual city permit under Code Chapter 852, in effect since January 2025: $150 for the first permit, no fee to renew.';
const MARION_TAX =
  'A rental isn’t a homestead, so Indiana caps its property tax at 2% of assessed value, against 1% for an owner-occupied home. The Marion County Treasurer bills in two installments, due each May and November.';
const STD_INDY_UTIL = 'AES Indiana for electric; Citizens Energy Group for gas, water, and sewer.';
const court = (township, address) =>
  `Marion County eviction cases are filed in the small claims court of the township where the rental is located: here, the ${township} Township Small Claims Court, ${endSentence(address)}`;
const registryFaq = (area, a) => ({ q: `Do I need to register a rental property in ${area}?`, a });
const courtFaq = (area, township, address) => ({
  q: `Where are evictions filed for a ${area} rental?`,
  a: `In the ${township} Township Small Claims Court, ${endSentence(address)} In Marion County, landlord-tenant cases go to the small claims court of the township where the property sits, so ${area} cases are heard there.`,
});
const INDY_REGISTRY_FAQ =
  'Yes. Rental homes in the City of Indianapolis must be registered with the city’s Department of Business and Neighborhood Services, with an Indiana-resident manager and an agent for service of process named, and the registration renewed every year. A short-term rental needs a separate annual permit for each unit.';
const MARION_BASE = [SRC.indyRegistry, SRC.ch851, SRC.ch852, SRC.dlgfCaps];

const facts = {};

facts['center-township'] = {
  facts: [
    { label: 'Rental registration', text: INDY_REGISTRY },
    { label: 'Short-term rentals', text: INDY_STR },
    { label: 'Eviction filings', text: court('Center', 'Julia M. Carson Government Center, 300 E. Fall Creek Pkwy. N. Dr., Suite 130') },
    { label: 'Property tax', text: MARION_TAX },
    { label: 'Utilities', text: STD_INDY_UTIL },
    {
      label: 'Location',
      text: 'The center of Marion County, taking in downtown and historic districts including the Old Northside, Lockerbie Square, Chatham Arch, Cottage Home, Fletcher Place, and Fountain Square. The Cultural Trail and Canal Walk run through it, and the IndyGo Red Line connects it north to Broad Ripple.',
    },
  ],
  faqs: [
    registryFaq('Center Township', INDY_REGISTRY_FAQ),
    courtFaq('Center Township', 'Center', 'at 300 E. Fall Creek Pkwy. N. Dr., Suite 130'),
  ],
  sources: [...MARION_BASE, SRC.centerCourt, SRC.citizens],
};

facts['downtown-indianapolis'] = {
  facts: [
    { label: 'Rental registration', text: INDY_REGISTRY },
    { label: 'Short-term rentals', text: `${INDY_STR} In a building with several units on Airbnb or Vrbo, each unit needs its own permit.` },
    { label: 'Eviction filings', text: court('Center', 'Julia M. Carson Government Center, 300 E. Fall Creek Pkwy. N. Dr., Suite 130') },
    { label: 'Property tax', text: MARION_TAX },
    {
      label: 'Utilities',
      text: `${STD_INDY_UTIL} Some larger downtown buildings also take steam heat and chilled water from Citizens Thermal, which shows up in condo association costs rather than an owner’s own bills.`,
    },
    {
      label: 'Location',
      text: 'The Mile Square, bounded by North, South, East, and West streets with Monument Circle at its center, plus surrounding districts such as Mass Ave, the Wholesale District, Lockerbie Square, and Fletcher Place. I-65 and I-70 form an inner loop around it; Lucas Oil Stadium, Gainbridge Fieldhouse, White River State Park, and the Cultural Trail are all within it.',
    },
  ],
  faqs: [
    registryFaq('Downtown Indianapolis', INDY_REGISTRY_FAQ),
    courtFaq('Downtown Indianapolis', 'Center', 'at 300 E. Fall Creek Pkwy. N. Dr., Suite 130'),
  ],
  sources: [...MARION_BASE, SRC.centerCourt, SRC.citizens],
};

facts['lawrence-township'] = {
  facts: [
    {
      label: 'Rental registration',
      text: 'It depends on the address. The City of Lawrence is an excluded city with its own government, so homes inside it are exempt from the Indianapolis landlord registry, and Lawrence’s published code has no rental registration or inspection chapter of its own. In the rest of the township, the Indianapolis registry applies: register with the city, name an Indiana-resident manager and an agent for service of process, and renew every year.',
    },
    { label: 'Short-term rentals', text: `Outside the City of Lawrence: ${INDY_STR.charAt(0).toLowerCase()}${INDY_STR.slice(1)}` },
    { label: 'Eviction filings', text: court('Lawrence', '4455 McCoy St.') },
    { label: 'Property tax', text: MARION_TAX },
    {
      label: 'Utilities',
      text: 'Inside the City of Lawrence, water and sewer come from Lawrence Utilities, the city’s own utility, with a $75 meter deposit for new residential water customers. Gas is Citizens Energy Group and electric is AES Indiana. Outside the city, Citizens provides water and sewer too.',
    },
    {
      label: 'Location',
      text: 'The northeast corner of Marion County. Pendleton Pike runs diagonally across it, I-465 and I-69 cross it, and Fall Creek runs through it. Fort Harrison State Park, about 1,700 acres on the former Fort Benjamin Harrison, has trails and a golf course, and the Oaklandon Historic District is in the northeast corner.',
    },
  ],
  faqs: [
    registryFaq(
      'Lawrence Township',
      'It depends on the address. Homes inside the City of Lawrence are exempt from the Indianapolis landlord registry, and Lawrence’s published code has no rental registration chapter. Homes elsewhere in the township are in the City of Indianapolis and must be registered with its Department of Business and Neighborhood Services every year.'
    ),
    courtFaq('Lawrence Township', 'Lawrence', 'at 4455 McCoy St.'),
  ],
  sources: [...MARION_BASE, SRC.lawrenceCode, SRC.lawrenceUtil, SRC.courtBrochure],
};

facts['warren-township'] = {
  facts: [
    {
      label: 'Rental registration',
      text: `${INDY_REGISTRY} The small part of Beech Grove inside the township is an excluded city and is exempt.`,
    },
    { label: 'Short-term rentals', text: INDY_STR },
    { label: 'Eviction filings', text: court('Warren', 'Warren Township Government Center, 501 N. Post Rd.') },
    { label: 'Property tax', text: MARION_TAX },
    { label: 'Utilities', text: STD_INDY_UTIL },
    {
      label: 'Location',
      text: 'The east side of Marion County, crossed by I-465, I-70, and I-74 and by Washington Street, the old National Road. It includes Irvington, laid out in 1870 with curving streets about five miles from Monument Circle, the Shadeland Avenue corridor, and the west half of Cumberland, which grew up as a National Road stop.',
    },
  ],
  faqs: [
    registryFaq(
      'Warren Township',
      `${INDY_REGISTRY_FAQ} The small part of Beech Grove inside Warren Township is an excluded city and is exempt from the Indianapolis registry.`
    ),
    courtFaq('Warren Township', 'Warren', 'at the Warren Township Government Center, 501 N. Post Rd.'),
  ],
  sources: [...MARION_BASE, SRC.courtBrochure, SRC.citizens],
};

facts['washington-township'] = {
  facts: [
    { label: 'Rental registration', text: INDY_REGISTRY },
    { label: 'Short-term rentals', text: INDY_STR },
    { label: 'Eviction filings', text: court('Washington', '5302 N. Keystone Ave., Suite E') },
    { label: 'Property tax', text: MARION_TAX },
    { label: 'Utilities', text: STD_INDY_UTIL },
    {
      label: 'Location',
      text: 'North-central Marion County, running up to the Hamilton County line at 96th Street. The White River, Fall Creek, and the Central Canal cross it, the Monon Trail runs its full length, and Keystone Avenue, College Avenue, and 86th Street are its main corridors. Butler University, the State Fairgrounds, Glendale, Nora, and The Fashion Mall at Keystone are all in the township.',
    },
  ],
  faqs: [
    registryFaq('Washington Township', INDY_REGISTRY_FAQ),
    courtFaq('Washington Township', 'Washington', 'at 5302 N. Keystone Ave., Suite E'),
  ],
  sources: [...MARION_BASE, SRC.courtBrochure, SRC.citizens],
};

facts['broad-ripple'] = {
  facts: [
    { label: 'Rental registration', text: INDY_REGISTRY },
    { label: 'Short-term rentals', text: INDY_STR },
    { label: 'Eviction filings', text: court('Washington', '5302 N. Keystone Ave., Suite E') },
    { label: 'Property tax', text: MARION_TAX },
    { label: 'Utilities', text: STD_INDY_UTIL },
    {
      label: 'Location',
      text: 'About six miles north of downtown, between the White River, Kessler Boulevard, and Meridian Street, with the Central Canal running through it. It is one of Indianapolis’s designated cultural districts. The Monon Trail, 62-acre Broad Ripple Park, and the Indianapolis Art Center are here, and the IndyGo Red Line runs to downtown.',
    },
  ],
  faqs: [
    registryFaq('Broad Ripple', INDY_REGISTRY_FAQ),
    courtFaq('Broad Ripple', 'Washington', 'at 5302 N. Keystone Ave., Suite E'),
  ],
  sources: [...MARION_BASE, SRC.courtBrochure, SRC.citizens],
};

facts['decatur-township'] = {
  facts: [
    { label: 'Rental registration', text: INDY_REGISTRY },
    { label: 'Short-term rentals', text: INDY_STR },
    { label: 'Eviction filings', text: court('Decatur', '3730 S. Foltz St.') },
    { label: 'Property tax', text: MARION_TAX },
    {
      label: 'Utilities',
      text: `${STD_INDY_UTIL} Much of the township is still farmland, so some homes are on private wells or septic; Citizens’ Utility Availability Request shows what serves a specific address.`,
    },
    {
      label: 'Location',
      text: 'The southwest corner of Marion County, with the White River on its eastern edge. I-465 and I-70 cross its northern part, State Road 67 (Kentucky Avenue) runs through it, and the Ronald Reagan Parkway links the AmeriPlex industrial park to I-70 near Indianapolis International Airport, whose terminal is in the township. Southwestway Park sits along the White River.',
    },
  ],
  faqs: [registryFaq('Decatur Township', INDY_REGISTRY_FAQ), courtFaq('Decatur Township', 'Decatur', 'at 3730 S. Foltz St.')],
  sources: [...MARION_BASE, SRC.decaturCourt, SRC.citizens, SRC.citizensStep],
};

facts['franklin-township'] = {
  facts: [
    {
      label: 'Rental registration',
      text: `${INDY_REGISTRY} The eastern part of Beech Grove inside the township is an excluded city and is exempt.`,
    },
    { label: 'Short-term rentals', text: INDY_STR },
    { label: 'Eviction filings', text: court('Franklin', '4531 Independence Square') },
    { label: 'Property tax', text: MARION_TAX },
    {
      label: 'Utilities',
      text: `${STD_INDY_UTIL} The township holds a large share of Marion County’s remaining farmland, so rural homes may be on private wells or septic. In Beech Grove, sewer is the city’s own utility.`,
    },
    {
      label: 'Location',
      text: 'The southeast corner of Marion County, about 42 square miles. I-74 runs through it along Southeastern Avenue and I-65 runs along its western edge, with Southport Road and Franklin Road as its main local roads. Southeastway Park, a 188-acre nature park on Buck Creek, is off I-74 at Acton Road, and newer subdivisions sit beside working farmland.',
    },
  ],
  faqs: [
    registryFaq(
      'Franklin Township',
      `${INDY_REGISTRY_FAQ} The part of Beech Grove inside Franklin Township is an excluded city and is exempt from the Indianapolis registry.`
    ),
    courtFaq('Franklin Township', 'Franklin', 'at 4531 Independence Square'),
  ],
  sources: [...MARION_BASE, SRC.franklinCourt, SRC.citizens, SRC.citizensStep],
};

facts['perry-township'] = {
  facts: [
    {
      label: 'Rental registration',
      text: `${INDY_REGISTRY} Southport and the part of Beech Grove inside the township are excluded cities and are exempt; Southport’s city site lists no rental registration program of its own. Homecroft is an included town, so Indianapolis rules apply there.`,
    },
    { label: 'Short-term rentals', text: INDY_STR },
    { label: 'Eviction filings', text: court('Perry', '4925 Shelby St., Suite 100') },
    { label: 'Property tax', text: MARION_TAX },
    { label: 'Utilities', text: `${STD_INDY_UTIL} In Beech Grove, sewer is the city’s own utility.` },
    {
      label: 'Location',
      text: 'Directly south of downtown, with the White River on its west side and Greenwood to the south. I-65 and I-465 cross it, and Madison Avenue, Meridian Street, US 31, and SR 37 are its main commuter roads. The University of Indianapolis, the historic Southport commercial district, and Perry Park, home to Indy Parks’ only indoor ice rink, are here.',
    },
  ],
  faqs: [
    registryFaq(
      'Perry Township',
      `${INDY_REGISTRY_FAQ} Southport and the part of Beech Grove inside Perry Township are excluded cities and are exempt from the Indianapolis registry.`
    ),
    courtFaq('Perry Township', 'Perry', 'at 4925 Shelby St., Suite 100'),
  ],
  sources: [...MARION_BASE, SRC.perryCourt, SRC.citizens],
};

facts['pike-township'] = {
  facts: [
    {
      label: 'Rental registration',
      text: `${INDY_REGISTRY} Part of Clermont lies in the township; it is an included town, so Indianapolis rules apply there too.`,
    },
    { label: 'Short-term rentals', text: INDY_STR },
    { label: 'Eviction filings', text: court('Pike', '5665 Lafayette Rd., Suite B') },
    { label: 'Property tax', text: MARION_TAX },
    { label: 'Utilities', text: STD_INDY_UTIL },
    {
      label: 'Location',
      text: 'The northwest corner of Marion County, bordering Boone and Hamilton counties. I-65 and I-465 meet at its north end, and Lafayette Road, Michigan Road, 86th Street, and Zionsville Road are its main corridors. Eagle Creek Park, about 5,000 acres around a 1,400-acre reservoir, is one of the largest city parks in the country; Park 100 and the Pyramids office buildings are here too.',
    },
  ],
  faqs: [registryFaq('Pike Township', INDY_REGISTRY_FAQ), courtFaq('Pike Township', 'Pike', 'at 5665 Lafayette Rd., Suite B')],
  sources: [...MARION_BASE, SRC.clermont, SRC.courtBrochure, SRC.citizens],
};

facts['wayne-township'] = {
  facts: [
    {
      label: 'Rental registration',
      text: `${INDY_REGISTRY} Speedway is different: it is an excluded town, exempt from the Indianapolis registry, and requires its own landlord license before a home is occupied, plus a rental unit permit for each unit renewed every year. The license includes a landlord training course, and units can be inspected.`,
    },
    {
      label: 'Short-term rentals',
      text: `${INDY_STR} In Speedway, a short-term rental needs the town’s own $150 permit, valid for a year and renewable at no charge.`,
    },
    { label: 'Eviction filings', text: court('Wayne', 'Wayne Township Government Center, 5401 W. Washington St.') + ' That includes homes in Speedway.' },
    { label: 'Property tax', text: MARION_TAX },
    {
      label: 'Utilities',
      text: `${STD_INDY_UTIL} Speedway runs its own water and sewer utility, billed by the town Clerk-Treasurer, and parts of the west side are served by the Ben Davis Conservancy District’s sewer lines; check by address.`,
    },
    {
      label: 'Location',
      text: 'The west side of Marion County, between Center Township and Hendricks County. I-70, I-74, I-465, and US 40 (Washington Street, the old National Road) run through it. The Indianapolis Motor Speedway, the north half of Indianapolis International Airport and its FedEx hub, and the Park Fletcher office park are here.',
    },
  ],
  faqs: [
    registryFaq(
      'Wayne Township',
      'It depends on the address. Homes in the City of Indianapolis part of the township must be registered with the city’s Department of Business and Neighborhood Services every year. Homes in the Town of Speedway are exempt from the Indianapolis registry but need a Speedway landlord license and an annual rental unit permit for each unit instead.'
    ),
    courtFaq('Wayne Township', 'Wayne', 'at 5401 W. Washington St.'),
  ],
  sources: [...MARION_BASE, SRC.speedwayOrd, SRC.speedwayPermits, SRC.waynCourt, SRC.citizens],
};

// ---- Outside Marion County: filled in from the Hamilton and
// Hendricks/Boone/Johnson research passes. ------------------------------
const outside = fs.existsSync(new URL('./outside-marion-facts.mjs', import.meta.url))
  ? (await import('./outside-marion-facts.mjs')).default
  : {};
Object.assign(facts, outside);

const out = new URL('../../data/property-management/local-facts.json', import.meta.url);
fs.writeFileSync(out, JSON.stringify(facts, null, 2) + '\n');
console.log(`Wrote ${Object.keys(facts).length} areas: ${Object.keys(facts).join(', ')}`);
