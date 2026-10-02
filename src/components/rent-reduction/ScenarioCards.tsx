import { formatCurrency } from "../../lib/calculators/format";
import type { ScenarioRow } from "../../lib/rent-reduction/model";
import { SCENARIO_COLOR, SCENARIO_NAME } from "./scenarioColors";

interface ScenarioCardsProps {
  scenarios: ScenarioRow[];
  tenancyYears: number;
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-border/60 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className={`tabular-nums text-foreground ${strong ? "font-bold" : "font-semibold"}`}>{value}</span>
    </div>
  );
}

export default function ScenarioCards({ scenarios, tenancyYears }: ScenarioCardsProps) {
  // Best is judged over the full tenancy, and any scenario can win —
  // including keeping the current rent.
  const best = scenarios.reduce((a, b) => (b.tenancyRevenue > a.tenancyRevenue ? b : a));

  return (
    <div className="grid gap-4 pt-1 sm:grid-cols-3 [&>*]:min-w-0">
      {scenarios.map((s) => (
        <div key={s.label} className="relative rounded-2xl border border-border bg-surface p-4 shadow-sm">
          {s.label === best.label && (
            <span className="absolute -top-2.5 right-3 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
              Highest over {tenancyYears} yrs
            </span>
          )}
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SCENARIO_COLOR[s.label] }} />
            {SCENARIO_NAME[s.label]}
          </p>
          <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
            {formatCurrency(s.monthlyRent)}
            <span className="ml-1 text-sm font-normal text-muted">/mo</span>
          </p>
          <p className="mt-1 text-xs font-medium text-muted">{s.tier}</p>

          <div className="mt-3">
            <Stat label="Est. days to lease" value={`${Math.round(s.forecastDays)} days`} />
            <Stat label="Vacancy cost" value={formatCurrency(s.vacancyCost)} />
            <Stat label="First 12 months" value={formatCurrency(s.firstYearRevenue)} />
            <Stat label={`Over ${tenancyYears} years`} value={formatCurrency(s.tenancyRevenue)} strong />
          </div>
        </div>
      ))}
    </div>
  );
}
