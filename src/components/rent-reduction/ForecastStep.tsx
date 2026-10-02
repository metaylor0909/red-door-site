import { Download, Scale } from "lucide-react";
import WizardNav from "../calculator-ui/WizardNav";
import { formatCurrency } from "../../lib/calculators/format";
import { aggressiveRent, buildScenarios, type MarketData, type ModelSettings, type ScenarioRow } from "../../lib/rent-reduction/model";
import Assumptions from "./Assumptions";
import RecentRentals from "./RecentRentals";
import RevenueChart from "./RevenueChart";
import ScenarioCards from "./ScenarioCards";
import type { PropertyInputs } from "./Wizard";

interface ForecastStepProps {
  data: PropertyInputs;
  market: MarketData;
  settings: ModelSettings;
  onSettingsChange: (s: ModelSettings) => void;
  reduction: number;
  onBack: () => void;
  onDownload: () => Promise<void> | void;
}

export function forecastScenarios(data: PropertyInputs, market: MarketData, settings: ModelSettings, reduction: number) {
  const ownerRent = Math.max(0, data.askingRent - reduction);
  return buildScenarios({
    currentRent: data.askingRent,
    ownerRent,
    aggressiveRent: aggressiveRent(data.askingRent, ownerRent),
    market,
    settings,
  });
}

/** Plain-language verdict for one window, comparing the owner's reduction
 * with holding the current rent. */
export function verdict(current: ScenarioRow, owner: ScenarioRow, window: "year" | "tenancy", tenancyYears: number): string {
  const cut = current.monthlyRent - owner.monthlyRent;
  const span = window === "year" ? "the first 12 months" : `a typical ${tenancyYears}-year tenancy`;
  const diff = window === "year" ? owner.firstYearRevenue - current.firstYearRevenue : owner.tenancyRevenue - current.tenancyRevenue;
  const needed = window === "year" ? owner.breakEvenDaysFirstYear : owner.breakEvenDaysTenancy;
  // Rounded the same way the scenario cards round, so the numbers agree.
  const sooner = Math.round(current.forecastDays) - Math.round(owner.forecastDays);
  if (cut <= 0 || needed == null) return "";
  const neededText = `${Math.ceil(needed)} days sooner`;
  if (diff > 0) {
    return `Over ${span}, the ${formatCurrency(cut)}/mo reduction comes out ahead by about ${formatCurrency(diff)}: it's estimated to lease ${sooner} days sooner, more than the ${neededText} it needs to break even.`;
  }
  return `Over ${span}, holding your current rent comes out ahead by about ${formatCurrency(-diff)}: the ${formatCurrency(cut)}/mo reduction would need to lease ${neededText} to break even, and it's estimated to lease only ${Math.max(0, sooner)} days sooner.`;
}

export default function ForecastStep({ data, market, settings, onSettingsChange, reduction, onBack, onDownload }: ForecastStepProps) {
  const scenarios = forecastScenarios(data, market, settings, reduction);
  const [current, owner] = scenarios;
  const tenancyText = verdict(current, owner, "tenancy", settings.tenancyYears);
  const yearText = verdict(current, owner, "year", settings.tenancyYears);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-brand/30 bg-brand/5 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
            <Scale className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">The bottom line</p>
            {tenancyText ? (
              <>
                <p className="mt-1 text-lg font-semibold leading-snug text-foreground">{tenancyText}</p>
                <p className="mt-2 text-sm text-muted">{yearText}</p>
              </>
            ) : (
              <p className="mt-1 text-lg font-semibold leading-snug text-foreground">
                Go back and choose a rent reduction to compare it with holding your current rent.
              </p>
            )}
            <p className="mt-3 text-xs text-muted">
              Days-to-lease figures are estimates: they start from the {market.localMedianDays}-day median for{" "}
              {market.localDaysLabel} and adjust for where each rent sits against the{" "}
              {formatCurrency(market.marketRent)} market rent. The break-even days are exact arithmetic.
            </p>
          </div>
        </div>
      </section>

      <ScenarioCards scenarios={scenarios} tenancyYears={settings.tenancyYears} />

      <RevenueChart scenarios={scenarios} tenancyYears={settings.tenancyYears} />

      <Assumptions settings={settings} onChange={onSettingsChange} />

      <RecentRentals market={market} />

      <WizardNav
        onBack={onBack}
        rightSlot={
          <button
            type="button"
            onClick={() => void onDownload()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-foreground/90"
          >
            <Download className="h-4 w-4" />
            Download Report (PDF)
          </button>
        }
      />
    </div>
  );
}
