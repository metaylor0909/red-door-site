import { Scale, TrendingDown } from "lucide-react";
import WizardNav from "../calculator-ui/WizardNav";
import { formatCurrency } from "../../lib/calculators/format";
import {
  breakEvenDaysSooner,
  forecastDaysOnMarket,
  marketPosition,
  type MarketData,
  type ModelSettings,
} from "../../lib/rent-reduction/model";
import MarketMeter from "./MarketMeter";
import type { PropertyInputs } from "./Wizard";

interface PriceStepProps {
  data: PropertyInputs;
  market: MarketData;
  settings: ModelSettings;
  reduction: number;
  onReductionChange: (value: number) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function PriceStep({ data, market, settings, reduction, onReductionChange, onBack, onContinue }: PriceStepProps) {
  // Up to 20% of the asking rent, in $25 steps.
  const maxReduction = Math.max(100, Math.round((data.askingRent * 0.2) / 25) * 25);
  const cut = Math.min(reduction, maxReduction);
  const adjusted = Math.max(0, data.askingRent - cut);
  const currentDays = forecastDaysOnMarket(data.askingRent, market, settings);
  const yearOne = breakEvenDaysSooner(data.askingRent, adjusted, currentDays, 12);
  const tenancy = breakEvenDaysSooner(data.askingRent, adjusted, currentDays, settings.tenancyYears * 12);

  return (
    <section className="rounded-3xl border border-border bg-surface px-6 py-10 shadow-sm sm:px-10 sm:py-14">
      <div className="mx-auto max-w-xl text-center">
        <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          <TrendingDown className="h-3.5 w-3.5" />
          Price Change
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground sm:text-[28px]">Try a rent reduction</h2>
        <p className="mt-2 text-sm text-muted">
          See where a lower rent puts you against the market, and how much faster it would need to lease to be worth it.
        </p>

        <div className="mt-10 rounded-2xl border border-border bg-surface-muted px-6 py-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Adjusted asking rent</p>
          <p className="mt-2 text-4xl font-bold tabular-nums text-foreground">
            {formatCurrency(adjusted)}
            <span className="ml-1 text-sm font-medium text-muted">/mo</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Down {formatCurrency(cut)} from {formatCurrency(data.askingRent)}
          </p>

          <label className="mt-6 block text-left">
            <span className="flex items-baseline justify-between text-sm font-semibold text-foreground">
              Monthly rent reduction
              <span className="tabular-nums text-brand">{formatCurrency(cut)}</span>
            </span>
            <input
              type="range"
              className="mt-3"
              min={0}
              max={maxReduction}
              step={25}
              value={cut}
              onChange={(e) => onReductionChange(Number(e.target.value))}
              aria-label="Monthly rent reduction"
            />
            <span className="mt-1 flex justify-between text-[11px] font-medium text-muted">
              <span>$0</span>
              <span>{formatCurrency(maxReduction)}</span>
            </span>
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface px-6 py-6 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Market position</p>
          <div className="mt-3">
            <MarketMeter position={marketPosition(adjusted, market.marketRent)} />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-brand/30 bg-brand/5 px-6 py-5 text-left">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
            <Scale className="h-3.5 w-3.5" /> Break-even
          </p>
          {yearOne == null || tenancy == null ? (
            <p className="mt-2 text-sm text-foreground">Move the slider to test a reduction.</p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              A {formatCurrency(cut)}/mo cut pays for itself only if the home leases at least{" "}
              <strong>{Math.ceil(yearOne)} days sooner</strong> over the first year, or{" "}
              <strong>{Math.ceil(tenancy)} days sooner</strong> over a typical {settings.tenancyYears}-year tenancy. Similar
              homes in {market.areaName} take a median of <strong>{market.localMedianDays} days</strong> to lease.
            </p>
          )}
        </div>
      </div>

      <WizardNav onBack={onBack} onNext={onContinue} nextLabel="See My Forecast" />
    </section>
  );
}
