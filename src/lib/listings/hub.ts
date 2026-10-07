// Which homes-for-rent hub page a listing belongs to (Michael, 2026-10-07):
// the listing's own city page when one exists, otherwise the Indianapolis
// page. Used for the listing detail page's breadcrumb and "see all" links,
// and by src/middleware.ts to redirect a removed listing's URL.
//
// Indianapolis's page shows Indianapolis listings by default, so the
// fallback opens its all-areas view; someone coming from an Anderson or
// Pendleton listing should still see the homes in those areas.
import { loadCityContentMap } from './homes-for-rent-content';

export interface HomesForRentHub {
  href: string;
  /** For link text: "Avon Homes for Rent", "Indianapolis-Area Homes for Rent". */
  label: string;
  /** True when the city has no hub page of its own. */
  isFallback: boolean;
}

export const FALLBACK_HUB_HREF = '/indianapolis-homes-for-rent?areas=all';

export function homesForRentHub(citySlug: string, cityName: string): HomesForRentHub {
  if (citySlug === 'indianapolis') {
    return { href: '/indianapolis-homes-for-rent', label: 'Indianapolis Homes for Rent', isFallback: false };
  }
  if (loadCityContentMap()[citySlug]) {
    return { href: `/${citySlug}-homes-for-rent`, label: `${cityName} Homes for Rent`, isFallback: false };
  }
  return { href: FALLBACK_HUB_HREF, label: 'Indianapolis-Area Homes for Rent', isFallback: true };
}
