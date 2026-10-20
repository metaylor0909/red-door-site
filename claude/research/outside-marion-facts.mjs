// Local facts for the areas outside Marion County, imported by
// compile-local-facts.mjs. Verified facts only (see that file's header).

const SRC = {
  dlgfCaps: { label: 'Indiana DLGF circuit-breaker caps', url: 'https://www.in.gov/dlgf/files/240429-Fact-Sheet-Circuit-Breaker-Caps.pdf' },
  dlgfRates2026: { label: 'DLGF 2026 certified tax rates', url: 'https://www.in.gov/dlgf/files/2026-reports/2026_Certifed_Tax_Rates_By_District.pdf' },
  hamiltonRules: { label: 'Hamilton County court rules (LR 103.40)', url: 'https://www.hamiltoncounty.in.gov/201/Administrative-Rules' },
  hea1210: { label: 'HEA 1210 (2026)', url: 'https://iga.in.gov/legislative/2026/bills/house/1210/details' },
  carmelRental: { label: 'Carmel rental registration', url: 'https://www.carmel.in.gov/government/departments-services/rental-registration' },
  carmelFaq: { label: 'Carmel rental FAQ', url: 'https://www.carmel.in.gov/m/faq?cat=27' },
  carmelUtil: { label: 'Carmel Utilities', url: 'https://carmelutilities.com/' },
  fishersRental: { label: 'Fishers rental registration & permitting', url: 'https://fishersin.gov/government/administrative/rental-registration-permitting/' },
  fishersUtil: { label: 'Fishers new-resident utilities', url: 'https://fishersin.gov/services-resources/resident-resources/new-residents/' },
  noblesvilleCode: { label: 'Noblesville code of ordinances', url: 'https://codelibrary.amlegal.com/codes/noblesville/latest/overview' },
  noblesvilleUtil: { label: 'Noblesville Utilities', url: 'https://www.noblesville.in.gov/273/Utilities' },
  westfieldCode: { label: 'Westfield code of ordinances', url: 'https://codelibrary.amlegal.com/codes/westfieldin/latest/westfield_in/' },
  citizensWestfield: {
    label: 'Citizens Westfield',
    url: 'https://info.citizensenergygroup.com/hubfs/site/rights%20and%20responsibilities%20documents/Rights-and-Responsibilities-Insert-Westfield-(combined).pdf',
  },
};

// ---- Hamilton County (shared) ------------------------------------------
const HAMILTON_COURT =
  'Hamilton County eviction cases are filed in Hamilton Superior Court No. 4, 6, or 7, all at One Hamilton County Square in Noblesville (county Local Rule 103.40).';
const hamiltonTax = (district, rate, extra = '') =>
  `A rental isn’t a homestead, so Indiana caps its property tax at 2% of assessed value, against 1% for an owner-occupied home. Hamilton County bills in May and November installments; the 2026 certified rate for the ${district} district was ${rate} per $100 of assessed value${extra}.`;
const hamiltonCourtFaq = (city) => ({
  q: `Where are evictions filed for a ${city} rental?`,
  a: `In Hamilton Superior Court No. 4, 6, or 7, at One Hamilton County Square in Noblesville. Under the county’s Local Rule 103.40, all Hamilton County eviction and small claims cases go to those three courts, wherever in the county the rental is.`,
});
const CAP_NOTE =
  'A 2026 state law (HEA 1210) bars cities from restricting owners from renting their homes, which is expected to phase the cap out; check its current status before buying a rental in a capped subdivision.';
const HAMILTON_BASE = [SRC.hamiltonRules, SRC.dlgfCaps, SRC.dlgfRates2026];

const facts = {};

facts['carmel'] = {
  facts: [
    {
      label: 'Rental registration',
      text: 'Required. Under Ordinance D-2770-25, every single-family home or townhome rented for more than 30 days must be registered and permitted through the city, at $5 per property per year; condos are not covered, and there are no inspections tied to the permit. Late fees are $100 at 30 days and $200 at 60 days.',
    },
    {
      label: 'Rental cap',
      text: `Carmel caps permits at 10% of the homes in a subdivision of ten or more lots; homes registered by January 31, 2026 kept their permits as “legacy” rentals. HOA covenants can be stricter. ${CAP_NOTE}`,
    },
    { label: 'Eviction filings', text: HAMILTON_COURT },
    { label: 'Property tax', text: hamiltonTax('Carmel', '2.0167') },
    {
      label: 'Utilities',
      text: 'Water and sewer for most of the city come from Carmel Utilities, the city-owned utility; parts of western Carmel are on the TriCo Regional Sewer Utility, and some edges of the city get water from Citizens. Check the address.',
    },
    {
      label: 'Location',
      text: 'About 15 miles north of downtown Indianapolis by Keystone Parkway or US 31 (Meridian Street). The Monon Greenway runs through the city and through the center of the Carmel Arts & Design District in Old Town, a certified Indiana cultural district of galleries, design showrooms, and restaurants.',
    },
  ],
  faqs: [
    {
      q: 'Do I need to register a rental property in Carmel?',
      a: 'Yes. Since February 1, 2026, every single-family home or townhome in Carmel rented for more than 30 days needs a city rental registration and permit, at $5 per property per year. Permits are capped at 10% of the homes in subdivisions of ten or more lots, with homes registered by January 31, 2026 kept as legacy rentals; a 2026 state law is expected to phase the cap out.',
    },
    hamiltonCourtFaq('Carmel'),
  ],
  sources: [SRC.carmelRental, SRC.carmelFaq, SRC.hea1210, ...HAMILTON_BASE, SRC.carmelUtil],
};

facts['fishers'] = {
  facts: [
    {
      label: 'Rental registration',
      text: 'Required. Fishers Code Chapter 163, in effect since January 1, 2026, requires every single-family home, townhome, or platted condo rented long-term in the city to be registered and permitted. There is no fee, and the permit lasts until the home is sold. Fines run $250 for failing to register and $1,000 for renting without a permit, higher for repeat violations.',
    },
    {
      label: 'Rental cap',
      text: `Rentals are capped at 10% per subdivision. The city publishes a capacity map of full subdivisions, and buyers can get a 60-day pre-approval. ${CAP_NOTE}`,
    },
    { label: 'Eviction filings', text: HAMILTON_COURT },
    { label: 'Property tax', text: hamiltonTax('Fishers', '2.1994', ' (2.1684 in the Fall Creek Township portion)') },
    {
      label: 'Utilities',
      text: 'Water comes from Citizens Energy Group or Indiana American Water depending on the address. The city runs sewer and stormwater, and sewer and the citywide trash service are billed monthly to the property owner, not the tenant. Electric is Duke Energy or NineStar Power, depending on location.',
    },
    {
      label: 'Location',
      text: 'About 16 miles northeast of downtown Indianapolis by I-69. Conner Prairie, the living-history museum on Allisonville Road, and the Fishers Event Center arena, opened in 2024, are both in the city.',
    },
  ],
  faqs: [
    {
      q: 'Do I need to register a rental property in Fishers?',
      a: 'Yes. Since January 1, 2026, every single-family home, townhome, or platted condo rented long-term in Fishers needs a city registration and permit. There is no fee and the permit lasts until the home is sold, but renting without one carries a $1,000 fine. Rentals are capped at 10% per subdivision for now; a 2026 state law is expected to phase the cap out.',
    },
    hamiltonCourtFaq('Fishers'),
  ],
  sources: [SRC.fishersRental, SRC.hea1210, ...HAMILTON_BASE, SRC.fishersUtil],
};

facts['noblesville'] = {
  facts: [
    {
      label: 'Rental registration',
      text: 'None. Noblesville’s code of ordinances (current through September 2026) has no rental registration, licensing, or inspection requirement and no rental cap. The city’s housing and property maintenance code applies to all property, rented or not.',
    },
    { label: 'Eviction filings', text: `${HAMILTON_COURT} Noblesville is the county seat, so the courts are downtown.` },
    { label: 'Property tax', text: hamiltonTax('Noblesville City', '2.5549') },
    {
      label: 'Utilities',
      text: 'Water comes from Indiana American Water. Sewer is Noblesville Utilities, the city utility, which also bills city trash service.',
    },
    {
      label: 'Location',
      text: 'About 24 miles north-northeast of downtown Indianapolis by SR 37 and I-69. Downtown is built around the Hamilton County Courthouse square, completed in 1879 and on the National Register since 1978, and Ruoff Music Center is in the city.',
    },
  ],
  faqs: [
    {
      q: 'Do I need to register a rental property in Noblesville?',
      a: 'No. As of September 2026, Noblesville’s city code has no rental registration, licensing, or inspection requirement and no rental cap. Rentals are held to the same housing and property maintenance code as any other home, and HOA covenants can add their own rules.',
    },
    hamiltonCourtFaq('Noblesville'),
  ],
  sources: [SRC.noblesvilleCode, ...HAMILTON_BASE, SRC.noblesvilleUtil],
};

facts['westfield'] = {
  facts: [
    {
      label: 'Rental registration',
      text: 'None for long-term rentals. Westfield’s code of ordinances has no rental registration, licensing, or inspection requirement and no rental cap.',
    },
    { label: 'Eviction filings', text: HAMILTON_COURT },
    { label: 'Property tax', text: hamiltonTax('Westfield', '2.3448') },
    {
      label: 'Utilities',
      text: 'Water and sewer come from Citizens Westfield, part of Citizens Energy Group, which bought the city’s systems in 2014. Gas is Citizens Westfield in part of the city and CenterPoint Energy (formerly Vectren) in the rest.',
    },
    {
      label: 'Location',
      text: 'About 20 miles north of downtown Indianapolis by US 31 (Meridian Street). Grand Park Sports Campus, more than 400 acres with 26 diamonds, is in Westfield, and the Monon Trail runs through the city.',
    },
  ],
  faqs: [
    {
      q: 'Do I need to register a rental property in Westfield?',
      a: 'Not for a long-term rental. Westfield’s city code has no rental registration, licensing, or inspection requirement and no rental cap. HOA covenants can add their own rules, so check them before renting.',
    },
    hamiltonCourtFaq('Westfield'),
  ],
  sources: [SRC.westfieldCode, ...HAMILTON_BASE, SRC.citizensWestfield],
};

// ---- Hendricks, Boone, and Johnson counties ----------------------------
const WS = {
  icTitle6: { label: 'Indiana Code Title 6 (2% cap)', url: 'https://iga.in.gov/laws/2026/ic/titles/6' },
  hendricksRules: { label: 'Hendricks County local rules', url: 'https://www.in.gov/courts/files/hendricks-local-rules.pdf' },
  hendricksTreasurer: { label: 'Hendricks County Treasurer', url: 'https://www.co.hendricks.in.us/department/index.php?structureid=22' },
  avonCode: { label: 'Avon Municipal Code and UDO', url: 'https://avon.municipalcodeonline.com/book?type=ordinances' },
  avonUtil: { label: 'Avon local utilities', url: 'https://www.avonindiana.gov/439/Local-Utilities' },
  brownsburgCode: { label: 'Brownsburg code of ordinances', url: 'https://codelibrary.amlegal.com/codes/brownsburg/latest/brownsburg_in' },
  brownsburgUtil: { label: 'Brownsburg utility service application', url: 'https://www.brownsburg.org/242/Service-Application' },
  brownsburgTrails: { label: 'Brownsburg trails', url: 'https://www.brownsburg.org/547/Trails' },
  zionsvilleCode: { label: 'Zionsville code of ordinances', url: 'https://codelibrary.amlegal.com/codes/zionsville/latest/overview' },
  zionsvilleUtil: { label: 'Zionsville trash and utilities', url: 'https://www.zionsville-in.gov/691/Trash-and-Utilities' },
  booneCourt: { label: 'Boone Superior Court II', url: 'https://boonecounty.in.gov/offices/superior-court-II' },
  greenwoodCode: { label: 'Greenwood code of ordinances', url: 'https://codelibrary.amlegal.com/codes/greenwood/latest/greenwood_in' },
  greenwoodSewer: { label: 'Greenwood Sanitation Department', url: 'https://www.greenwood.in.gov/division/blocks.php?structureid=269' },
  johnsonRules: { label: 'Johnson County local rules', url: 'https://www.in.gov/courts/files/johnson-local-rules.pdf' },
};
const countyTax = (county) =>
  `A rental isn’t a homestead, so Indiana caps its property tax at 2% of assessed value, against 1% for an owner-occupied home (voter-approved referendum levies sit outside the cap). The ${county} County Treasurer bills in May and November installments.`;
const HENDRICKS_COURT =
  'Hendricks County eviction cases are filed in Hendricks Superior Court No. 1, 3, 4, or 5, assigned at random, at the courthouse in Danville.';
const hendricksCourtFaq = (town) => ({
  q: `Where are evictions filed for a ${town} rental?`,
  a: `In Hendricks Superior Court No. 1, 3, 4, or 5 at the Hendricks County Courthouse, 51 W. Main St., Danville. Under the county’s local rules, eviction cases are assigned among those four courts at random.`,
});

facts['avon'] = {
  facts: [
    {
      label: 'Rental registration',
      text: 'None. Avon’s municipal code and development ordinance have no registration, licensing, or inspection requirement for long-term rentals. The one rental-specific rule (Code 7-87): in a rented home, the owner or manager must install the required smoke detectors and repair or replace one within two business days of written notice.',
    },
    {
      label: 'Short-term rentals',
      text: 'A town permit is required before a home is used as a short-term rental (UDO 4.11). The owner must post a 24/7 contact who has a key and can be on site within three hours, along with the maximum occupancy and parking instructions.',
    },
    { label: 'Eviction filings', text: HENDRICKS_COURT },
    { label: 'Property tax', text: countyTax('Hendricks') },
    {
      label: 'Utilities',
      text: 'Per the town, water is Citizens Energy Group, sewer is the West Central Conservancy District, and gas is CenterPoint Energy. Electric depends on location: Duke Energy, Hendricks Power Cooperative, or AES Indiana. Avon has no town trash service; owners or tenants hire a private hauler.',
    },
    {
      label: 'Location',
      text: 'About 13 miles west of downtown Indianapolis on US 36, the main east-west road through town, with the Ronald Reagan Parkway running north-south through it. The White Lick Creek Trail runs along the creek through Washington Township Park.',
    },
  ],
  faqs: [
    {
      q: 'Do I need to register a rental property in Avon?',
      a: 'No. Avon has no registration, licensing, or inspection requirement for long-term rentals. The town does require owners of rented homes to install smoke detectors and fix one within two business days of written notice, and a short-term rental needs a town permit.',
    },
    hendricksCourtFaq('Avon'),
  ],
  sources: [WS.avonCode, WS.hendricksRules, WS.hendricksTreasurer, WS.icTitle6, WS.avonUtil],
};

facts['brownsburg'] = {
  facts: [
    {
      label: 'Rental registration',
      text: 'None. Brownsburg’s code of ordinances (current through August 2026) has no rental registration, licensing, or inspection requirement.',
    },
    { label: 'Eviction filings', text: HENDRICKS_COURT },
    { label: 'Property tax', text: countyTax('Hendricks') },
    {
      label: 'Utilities',
      text: 'The town runs water and sewer on one monthly bill. A tenant opening an account provides a copy of the lease and pays a $100 sewer deposit on top of the $75 water meter deposit.',
    },
    {
      label: 'Location',
      text: 'About 13 miles west-northwest of downtown Indianapolis, with I-74 exits at Green Street (SR 267) and the Ronald Reagan Parkway, and US 136 running through town. The 8.2-mile B&O Trail, the White Lick Creek Greenway to Arbuckle Acres Park, and the Bicentennial Trail link to Avon, which borders Brownsburg to the south.',
    },
  ],
  faqs: [
    {
      q: 'Do I need to register a rental property in Brownsburg?',
      a: 'No. As of August 2026, Brownsburg’s town code has no rental registration, licensing, or inspection requirement. When a tenant opens the water and sewer account, the town asks for a copy of the lease and a $100 sewer deposit in addition to the $75 water meter deposit.',
    },
    hendricksCourtFaq('Brownsburg'),
  ],
  sources: [WS.brownsburgCode, WS.hendricksRules, WS.hendricksTreasurer, WS.icTitle6, WS.brownsburgUtil, WS.brownsburgTrails],
};

facts['zionsville'] = {
  facts: [
    {
      label: 'Rental registration',
      text: 'None. Zionsville’s code of ordinances has no rental registration, licensing, or inspection requirement.',
    },
    {
      label: 'Eviction filings',
      text: 'Boone County eviction cases are filed in Boone Superior Court II, which hears all of the county’s small claims, at the Boone County Courthouse, 112 Courthouse Square, Lebanon.',
    },
    { label: 'Property tax', text: countyTax('Boone') },
    {
      label: 'Utilities',
      text: 'Water is Citizens Water. Sewer is the town’s own utility, billed at a flat residential rate ($56.85 a month as of January 2025), with trash and recycling in the town’s urban service district on the same bill.',
    },
    {
      label: 'Location',
      text: 'About 15 miles northwest of downtown Indianapolis, served by I-65 and I-865, with US 421 (Michigan Road) along its east side. The paved Big-4 Rail Trail is the five-mile spine of more than 20 miles of connected paths, and the historic brick Main Street village is the town center.',
    },
  ],
  faqs: [
    {
      q: 'Do I need to register a rental property in Zionsville?',
      a: 'No. Zionsville’s town code has no rental registration, licensing, or inspection requirement. HOA covenants can add their own rules, so check them before renting.',
    },
    {
      q: 'Where are evictions filed for a Zionsville rental?',
      a: 'In Boone Superior Court II at the Boone County Courthouse, 112 Courthouse Square, Lebanon. That court has exclusive jurisdiction over all Boone County small claims cases, including evictions.',
    },
  ],
  sources: [WS.zionsvilleCode, WS.booneCourt, WS.icTitle6, WS.zionsvilleUtil],
};

facts['greenwood'] = {
  facts: [
    {
      label: 'Rental registration',
      text: 'None. Greenwood’s code of ordinances (current through July 2026) has no rental registration, licensing, or inspection requirement.',
    },
    {
      label: 'Eviction filings',
      text: 'Johnson County eviction cases are filed in the Johnson Circuit and Superior Courts, assigned at random and heard by the courts’ magistrate, at the courthouse in Franklin. Greenwood City Court does not hear evictions.',
    },
    { label: 'Property tax', text: countyTax('Johnson') },
    {
      label: 'Utilities',
      text: 'City sewer bills go to the property owner every month, not the tenant, and service is started or stopped through the water provider. Water is Indiana American Water or Bargersville Water depending on the address, and city trash is added to the sewer account.',
    },
    {
      label: 'Location',
      text: 'About 11 miles south of downtown Indianapolis, with three I-65 exits on the east side, I-69 just west of city limits, and US 31 and SR 135 as the main north-south streets. The city lists more than 50 miles of multi-use trails and runs the Freedom Springs aquatic center and Greenwood Sports Park.',
    },
  ],
  faqs: [
    {
      q: 'Do I need to register a rental property in Greenwood?',
      a: 'No. As of July 2026, Greenwood’s city code has no rental registration, licensing, or inspection requirement. City sewer is billed to the property owner monthly, not the tenant, so it belongs in an owner’s operating budget.',
    },
    {
      q: 'Where are evictions filed for a Greenwood rental?',
      a: 'In the Johnson Circuit and Superior Courts at the Johnson County Courthouse in Franklin, where small claims cases, including evictions, are assigned at random and heard by the magistrate. Greenwood City Court does not handle evictions.',
    },
  ],
  sources: [WS.greenwoodCode, WS.johnsonRules, WS.icTitle6, WS.greenwoodSewer],
};

export default facts;
