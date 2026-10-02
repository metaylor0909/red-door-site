import { AlertTriangle, CalendarClock, DollarSign, RefreshCw } from "lucide-react";
import InfoTooltip from "../calculator-ui/InfoTooltip";
import WizardNav from "../calculator-ui/WizardNav";
import { formatCurrency, formatCurrencyCents, formatPercent } from "../../lib/calculators/format";
import { dailyCostOfVacancy, marketPosition, tierForPosition, type MarketData } from "../../lib/rent-reduction/model";
import type { PropertyInputs } from "./Wizard";

interface MarketStepProps {
  data: PropertyInputs;
  market: MarketData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function MarketStep({ data, market, loading, error, onRetry, onBack, onContinue }: MarketStepProps) {
  const daily = dailyCostOfVacancy(data.askingRent);
  const position = market ? marketPosition(data.askingRent, market.marketRent) : 0;

  return (
    <section className="rounded-3xl border border-border bg-surface px-6 py-10 shadow-sm sm:px-10 sm:py-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Your Market</p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground sm:text-[28px]">
          What a vacant day costs, and what your market looks like
        </h2>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="rounded-2xl border border-loss/30 bg-loss/5 px-6 py-8 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-loss">
            Cost of each vacant day
            <InfoTooltip label="How the daily cost is calculated">
              Your monthly rent divided by 30 — the rent you give up for each day the home sits empty.
            </InfoTooltip>
          </p>
          <p className="mt-3 text-5xl font-bold tabular-nums text-foreground">
            {formatCurrencyCents(daily)}
            <span className="ml-1 text-base font-medium text-muted">/day</span>
          </p>
          <p className="mt-3 text-sm text-muted">
            At {formatCurrency(data.askingRent)}/mo, a 30-day vacancy costs{" "}
            <span className="font-semibold text-loss">{formatCurrency(daily * 30)}</span>.
          </p>
        </div>

        <div className="mt-6">
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-36 animate-pulse rounded-2xl bg-surface-muted" />
              <div className="h-36 animate-pulse rounded-2xl bg-surface-muted" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-loss/40 bg-loss/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-loss" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">Market data unavailable</h3>
                  <p className="mt-1 text-sm text-muted">{error}</p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-loss/40 bg-surface px-3 py-1.5 text-sm font-semibold text-loss transition-colors hover:bg-loss/10"
                  >
                    <RefreshCw className="h-4 w-4" /> Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && market && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface-muted p-5 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted">
                    <CalendarClock className="h-4 w-4 text-accent" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Typical time to lease</span>
                    <InfoTooltip label="About time to lease">
                      Median days on market for {market.localDaysLabel} rented in the last 12 months. Listings
                      up 3 days or less or over 180 days are left out as unreliable.
                    </InfoTooltip>
                  </div>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{market.localMedianDays} days</p>
                  <p className="mt-1 text-xs text-muted">
                    {market.localDaysLabel} · {market.localDaysCount.toLocaleString()} rentals
                  </p>
                  <p className="text-xs text-muted">
                    Middle half: {market.localMiddleHalfDays[0]}–{market.localMiddleHalfDays[1]} days
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface-muted p-5 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Market rent</span>
                    <InfoTooltip label="About market rent">
                      {market.marketRentSource === "comps"
                        ? `Median final asking rent of ${market.marketRentCount} recently rented homes with ${data.bedrooms} bedrooms and about ${data.bathrooms} baths near you.`
                        : `Too few close matches nearby, so this is the average rent for ${data.bedrooms}-bedroom homes across ${market.areaName}.`}
                    </InfoTooltip>
                  </div>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                    {formatCurrency(market.marketRent)}
                    <span className="ml-1 text-sm font-medium text-muted">/mo</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {market.marketRentSource === "comps"
                      ? `Median of ${market.marketRentCount} similar homes rented recently`
                      : `${market.areaName} average for ${data.bedrooms}-bedroom homes`}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-center text-sm text-muted">
                Your asking rent is{" "}
                <span className="font-semibold text-foreground">
                  {Math.abs(position) < 0.005
                    ? "right at market"
                    : `${formatPercent(Math.abs(position), 1)} ${position > 0 ? "above" : "below"} market`}
                </span>{" "}
                ({tierForPosition(position).toLowerCase()}).
              </p>
            </>
          )}
        </div>
      </div>

      <WizardNav onBack={onBack} onNext={onContinue} nextDisabled={loading || !!error || !market} nextLabel="Test a Price Change" />
    </section>
  );
}
