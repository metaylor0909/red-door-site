// Researched local facts for each [city]-property-management page
// (Michael, 2026-10-20): the rules, courts, taxes, and utilities an owner
// deals with in that specific place. Compiled from public sources by
// research passes in claude/research/, then reduced to the facts that
// were verified against a primary source (city code, county or court
// site, utility site). Anything unverified stays in the research files
// and does not render. Team review list: claude/city-local-facts-review.md.
//
// Describes places, rules, and costs only, never the people who live
// there (CLAUDE.md Fair Housing rules).

import localFacts from '../../../data/property-management/local-facts.json';

export interface LocalFact {
  label: string;
  text: string;
}

export interface CityLocalFacts {
  facts: LocalFact[];
  faqs: Array<{ q: string; a: string }>;
  sources: Array<{ label: string; url: string }>;
}

const FACTS = localFacts as Record<string, CityLocalFacts>;

export function getCityLocalFacts(slug: string): CityLocalFacts | null {
  const entry = FACTS[slug];
  return entry && entry.facts.length ? entry : null;
}
