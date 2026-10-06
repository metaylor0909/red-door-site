// Pet policy for listing cards, reduced from RentEngine's two pet fields.
//
// `pets_allowed` is a short string ("Yes", "No", "Dogs only" in live data),
// and `pet_restrictions` is free text that sometimes narrows a "Yes" — e.g.
// "No cats allowed, 2 small dogs allowed" — so both are read. Size and
// count limits ("small dogs", "Maximum of 3 pets") don't change which
// species are allowed and are left to the listing detail page.
import type { RentEngineUnit } from './types';

export type PetPolicy = 'dogs-cats' | 'dogs' | 'cats' | 'none' | 'ask';

export const PET_LABELS: Record<PetPolicy, string> = {
  'dogs-cats': 'Dogs and cats allowed',
  dogs: 'Dogs only',
  cats: 'Cats only',
  none: 'No pets',
  ask: 'Ask about pets',
};

export function petPolicy(unit: Pick<RentEngineUnit, 'pets_allowed' | 'pet_restrictions'>): PetPolicy {
  const allowed = (unit.pets_allowed ?? '').trim().toLowerCase();
  const notes = (unit.pet_restrictions ?? '').toLowerCase();
  if (!allowed) return 'ask';
  if (/^no\b|no pets/.test(allowed)) return 'none';

  const dogs = !/cats only/.test(allowed) && !/dogs? not allowed|no dogs/.test(notes);
  const cats = !/dogs only/.test(allowed) && !/cats? not allowed|no cats/.test(notes);
  if (dogs && cats) return 'dogs-cats';
  if (dogs) return 'dogs';
  if (cats) return 'cats';
  return 'none';
}

const PAW_PATHS =
  '<ellipse cx="5.6" cy="10" rx="2.1" ry="2.6" transform="rotate(-18 5.6 10)"/>' +
  '<ellipse cx="9.6" cy="5.6" rx="2.1" ry="2.7"/>' +
  '<ellipse cx="14.4" cy="5.6" rx="2.1" ry="2.7"/>' +
  '<ellipse cx="18.4" cy="10" rx="2.1" ry="2.6" transform="rotate(18 18.4 10)"/>' +
  '<path d="M12 11.6c-2.6 0-5.6 3.4-5.6 6 0 1.7 1.3 2.7 2.9 2.7 1.1 0 1.8-.6 2.7-.6s1.6.6 2.7.6c1.6 0 2.9-1 2.9-2.7 0-2.6-3-6-5.6-6z"/>';

/** Inline paw icon. "No pets" gets a slash, drawn over a white halo so it
 * separates cleanly from the toes. */
export function pawIconSvg(policy: PetPolicy): string {
  const slash =
    policy === 'none'
      ? '<line x1="3" y1="21" x2="21" y2="3" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>' +
        '<line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
      : '';
  return `<svg class="pet-paw" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${PAW_PATHS}${slash}</svg>`;
}

/** Paw with a hover tooltip (CSS, from data-tip) and the same text for
 * screen readers. */
export function petBadgeHtml(policy: PetPolicy): string {
  const label = PET_LABELS[policy];
  return `<span class="pet-badge is-${policy}" data-tip="${label}">${pawIconSvg(policy)}<span class="sr-only">${label}</span></span>`;
}

/** Every policy's badge and drawer markup, keyed by policy, for the
 * client-side card and map-drawer rendering. */
export const PET_BADGES = Object.fromEntries(
  (Object.keys(PET_LABELS) as PetPolicy[]).map((p) => [p, petBadgeHtml(p)])
) as Record<PetPolicy, string>;

export const PET_DRAWER_HTML = Object.fromEntries(
  (Object.keys(PET_LABELS) as PetPolicy[]).map((p) => [p, `${pawIconSvg(p)}<span>${PET_LABELS[p]}</span>`])
) as Record<PetPolicy, string>;
