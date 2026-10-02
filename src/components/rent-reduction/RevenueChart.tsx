import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompact, formatCurrency } from "../../lib/calculators/format";
import type { ScenarioRow } from "../../lib/rent-reduction/model";
import { SCENARIO_COLOR, SCENARIO_NAME } from "./scenarioColors";

type Range = "year" | "tenancy";

interface ChartRow {
  name: string;
  label: ScenarioRow["label"];
  monthlyRent: number;
  revenue: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: ChartRow; value?: number }> }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{row.name}</p>
      <p className="mt-0.5 text-muted">{formatCurrency(row.monthlyRent)}/mo asking rent</p>
      <p className="mt-1 flex items-center justify-between gap-4">
        <span className="text-muted">Rent collected</span>
        <span className="font-semibold tabular-nums text-foreground">{formatCurrency(row.revenue)}</span>
      </p>
    </div>
  );
}

export default function RevenueChart({ scenarios, tenancyYears }: { scenarios: ScenarioRow[]; tenancyYears: number }) {
  const [range, setRange] = useState<Range>("tenancy");
  const data: ChartRow[] = scenarios.map((s) => ({
    name: SCENARIO_NAME[s.label],
    label: s.label,
    monthlyRent: s.monthlyRent,
    revenue: Math.round(range === "year" ? s.firstYearRevenue : s.tenancyRevenue),
  }));
  const options: Array<[Range, string]> = [
    ["tenancy", `${tenancyYears}-year tenancy`],
    ["year", "First 12 months"],
  ];

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Rent collected</h3>
          <p className="mt-1 text-sm text-muted">
            Counting from today: the vacancy comes first, then the lease. A lower rent leases sooner but earns less every
            month after.
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-muted p-1" role="group" aria-label="Time window">
          {options.map(([value, text]) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => setRange(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === value ? "bg-brand text-white shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }}
            />
            <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} width={56} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-muted)" }} />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={96} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.label} fill={SCENARIO_COLOR[d.label]} />
              ))}
              <LabelList
                dataKey="revenue"
                position="top"
                formatter={(v: unknown) => (typeof v === "number" ? formatCurrency(v) : "")}
                fill="var(--foreground)"
                fontSize={12}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
