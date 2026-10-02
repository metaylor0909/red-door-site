// Rent reduction (vacancy break-even) model. Pure functions; the UI only
// presents what this returns.
//
// Two kinds of output, deliberately kept apart:
//   - Break-even days: pure arithmetic. How many days sooner a lower rent
//     must lease to earn back the reduction over a given window. No
//     assumption about how the market reacts to price.
//   - Forecast days on market: an ESTIMATE. Starts from the real local
//     median days on market (RentCast, by city and bedroom count) and
//     scales it by how far the rent sits above or below market rent, using
//     the adjustable sensitivities below. Shown as an estimate, never as
//     the headline.

/** A recently rented comparable home (a RentCast listing removed in the
 * last 12 months), with its final asking rent. */
export interface Comparable {
  address: string;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  removedDate: string;
  daysOnMarket: number;
}

export type MarketRentSource = "comps" | "market-average";

export interface MarketData {
  /** e.g. "Carmel" */
  areaName: string;
  /** What comparable homes rent for: median of matched recent rentals, or
   * the area's average rent for this bedroom count when too few match. */
  marketRent: number;
  marketRentSource: MarketRentSource;
  marketRentCount: number;
  /** Real median days on market for this area and bedroom count, from
   * homes rented in the last 12 months. */
  localMedianDays: number;
  localMiddleHalfDays: [number, number];
  localDaysCount: number;
  /** e.g. "Carmel 3-bedroom homes" */
  localDaysLabel: string;
  comparables: Comparable[];
  dataAsOf: string | null;
}

export interface ModelSettings {
  /** Each 1% above market rent adds this many % to days on market. */
  overpricingSensitivity: number;
  /** Each 1% below market rent removes this many % from days on market. */
  underpricingSensitivity: number;
  /** A home priced below market still needs showings, applications and
   * screening, so the forecast never drops below this share of the local
   * median (or below MIN_DAYS). */
  fastestShareOfMedian: number;
  /** Expected tenancy length. 4 years = a 75% annual renewal rate,
   * matching the Rent vs. Sell calculator. */
  tenancyYears: number;
}

export const DEFAULT_SETTINGS: ModelSettings = {
  overpricingSensitivity: 4,
  underpricingSensitivity: 2,
  fastestShareOfMedian: 0.5,
  tenancyYears: 4,
};

const MIN_DAYS = 7;
const DAYS_PER_MONTH = 30;

export type MarketTier =
  | "Well Above Market"
  | "Above Market"
  | "At Market"
  | "Below Market"
  | "Well Below Market";

/** Rent relative to market rent: +0.05 = 5% above. */
export function marketPosition(rent: number, marketRent: number): number {
  return marketRent > 0 ? (rent - marketRent) / marketRent : 0;
}

export function tierForPosition(position: number): MarketTier {
  if (position >= 0.1) return "Well Above Market";
  if (position >= 0.04) return "Above Market";
  if (position > -0.04) return "At Market";
  if (position > -0.1) return "Below Market";
  return "Well Below Market";
}

/** 0–100 for the position meter; ±20% from market spans the full meter. */
export function meterValue(position: number): number {
  return Math.max(0, Math.min(100, 50 + position * 250));
}

export function dailyCostOfVacancy(monthlyRent: number): number {
  return monthlyRent / DAYS_PER_MONTH;
}

export function forecastDaysOnMarket(
  rent: number,
  market: MarketData,
  settings: ModelSettings = DEFAULT_SETTINGS,
): number {
  const position = marketPosition(rent, market.marketRent);
  const base = market.localMedianDays;
  const multiplier =
    position >= 0
      ? 1 + settings.overpricingSensitivity * position
      : Math.max(
          settings.fastestShareOfMedian,
          1 - settings.underpricingSensitivity * -position,
        );
  return Math.max(MIN_DAYS, base * multiplier);
}

/** Rent collected over a window that starts the day the home is listed,
 * with the vacancy at the front of it. */
export function revenueOverWindow(
  monthlyRent: number,
  daysOnMarket: number,
  windowMonths: number,
): number {
  const leasedMonths = Math.max(0, windowMonths - daysOnMarket / DAYS_PER_MONTH);
  return monthlyRent * leasedMonths;
}

/**
 * How many days sooner the lower rent must lease to break even over the
 * window. From: current × (W − d₁/30) = reduced × (W − (d₁ − s)/30),
 * solved for s. Returns null when there is no reduction.
 */
export function breakEvenDaysSooner(
  currentRent: number,
  reducedRent: number,
  currentDays: number,
  windowMonths: number,
): number | null {
  const reduction = currentRent - reducedRent;
  if (reduction <= 0 || reducedRent <= 0) return null;
  return (reduction * (DAYS_PER_MONTH * windowMonths - currentDays)) / reducedRent;
}

export type ScenarioLabel = "Current" | "Owner Adjusted" | "Aggressive";

export interface ScenarioRow {
  label: ScenarioLabel;
  monthlyRent: number;
  marketPosition: number;
  tier: MarketTier;
  forecastDays: number;
  vacancyCost: number;
  firstYearRevenue: number;
  tenancyRevenue: number;
  /** vs. Current; null for the Current row itself. */
  breakEvenDaysFirstYear: number | null;
  breakEvenDaysTenancy: number | null;
}

/** Default "Aggressive" scenario: 10% below current, or 30% deeper than
 * the owner's own reduction if that's already past 10%. */
export function aggressiveRent(currentRent: number, ownerRent: number): number {
  const ownerReduction = Math.max(0, currentRent - ownerRent);
  return Math.max(0, currentRent - Math.max(currentRent * 0.1, ownerReduction * 1.3));
}

export function buildScenarios(input: {
  currentRent: number;
  ownerRent: number;
  aggressiveRent: number;
  market: MarketData;
  settings?: ModelSettings;
}): ScenarioRow[] {
  const settings = input.settings ?? DEFAULT_SETTINGS;
  const tenancyMonths = settings.tenancyYears * 12;
  const currentDays = forecastDaysOnMarket(input.currentRent, input.market, settings);

  const row = (label: ScenarioLabel, rent: number): ScenarioRow => {
    const days = forecastDaysOnMarket(rent, input.market, settings);
    const position = marketPosition(rent, input.market.marketRent);
    const isCurrent = label === "Current";
    return {
      label,
      monthlyRent: rent,
      marketPosition: position,
      tier: tierForPosition(position),
      forecastDays: days,
      vacancyCost: dailyCostOfVacancy(rent) * days,
      firstYearRevenue: revenueOverWindow(rent, days, 12),
      tenancyRevenue: revenueOverWindow(rent, days, tenancyMonths),
      breakEvenDaysFirstYear: isCurrent ? null : breakEvenDaysSooner(input.currentRent, rent, currentDays, 12),
      breakEvenDaysTenancy: isCurrent ? null : breakEvenDaysSooner(input.currentRent, rent, currentDays, tenancyMonths),
    };
  };

  return [
    row("Current", input.currentRent),
    row("Owner Adjusted", input.ownerRent),
    row("Aggressive", input.aggressiveRent),
  ];
}
