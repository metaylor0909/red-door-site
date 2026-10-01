
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatCurrency } from "../../lib/rent-vs-sell/format";
import type { WealthProjection, YearSnapshot } from "../../lib/rent-vs-sell/wealthArchitect";

interface PillarBarChartProps {
  projection: WealthProjection;
  snapshot: YearSnapshot;
  horizon: number;
}

const PILLAR_COLORS = {
  equityGrowth: "#2563eb",
  cumulativeCashFlow: "#0d9488",
  tenantPaidAmortization: "#7c3aed",
  cumulativeTaxSavings: "#d97706",
  investmentGrowth: "#94a3b8",
  costToSell: "#b91c1c",
} as const;

const PILLAR_LABELS = {
  equityGrowth: "Equity Growth",
  cumulativeCashFlow: "Cumulative Cash Flow",
  tenantPaidAmortization: "Tenant Paid Amortization",
  cumulativeTaxSavings: "Net Tax Savings",
  investmentGrowth: "Investment Growth (Stocks)",
  costToSell: "Selling Costs & Taxes",
} as const;

interface PathRow {
  path: string;
  investmentGrowth: number;
  equityGrowth: number;
  cumulativeCashFlow: number;
  tenantPaidAmortization: number;
  cumulativeTaxSavings: number;
  costToSell: number;
  total: number;
}

interface TooltipEntry {
  name?: string;
  dataKey?: string;
  value?: number;
  color?: string;
  payload?: PathRow;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload[0]?.payload?.total ?? 0;
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{label}</p>
      <div className="mt-1.5 space-y-1">
        {payload
          .filter((p) => (p.value ?? 0) !== 0)
          .map((p) => (
            <div
              key={p.dataKey}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-1.5 text-muted">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: p.color }}
                />
                {p.name}
              </span>
              <span className="font-medium tabular-nums text-foreground">
                {formatCurrency(p.value as number)}
              </span>
            </div>
          ))}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Net Worth
        </span>
        <span className="text-sm font-bold tabular-nums text-foreground">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}

export default function PillarBarChart({
  projection,
  snapshot,
  horizon,
}: PillarBarChartProps) {
  const isRefi = projection.scenarioMode === "refi";

  const sellRow: PathRow = {
    path: projection.debtSplit ? "Sell & Pay Off Debt" : "Sell & Reinvest",
    investmentGrowth: snapshot.sellGrossValue,
    equityGrowth: 0,
    cumulativeCashFlow: 0,
    tenantPaidAmortization: 0,
    cumulativeTaxSavings: 0,
    costToSell: -snapshot.sellLiquidationTax,
    total: snapshot.sellNetWorth,
  };

  const keepRow: PathRow = {
    path: "Keep As-Is",
    investmentGrowth: 0,
    equityGrowth: snapshot.keepStartingEquity + snapshot.keepAppreciationGain,
    cumulativeCashFlow: snapshot.keepCumOperatingCashFlow,
    tenantPaidAmortization: snapshot.keepPrincipalPaydown,
    cumulativeTaxSavings: snapshot.keepCumTaxEffect,
    costToSell: -snapshot.keepLiquidationCost,
    total: snapshot.keepNetWorth,
  };

  const scaleRow: PathRow = isRefi
    ? {
        path: "Refi & Scale",
        investmentGrowth: 0,
        equityGrowth: snapshot.scaleEquityGrowth,
        cumulativeCashFlow:
          snapshot.p1CumOperatingCashFlow + snapshot.p2CumOperatingCashFlow,
        tenantPaidAmortization: snapshot.scaleTenantPaydown,
        cumulativeTaxSavings: snapshot.scaleCumTaxEffect,
        costToSell: -snapshot.scaleLiquidationCost,
        total: snapshot.scaleNetWorth,
      }
    : {
        path: "Leverage Hold",
        investmentGrowth: 0,
        equityGrowth:
          snapshot.keepStartingEquity + snapshot.keepAppreciationGain,
        cumulativeCashFlow: snapshot.keepCumOperatingCashFlow,
        tenantPaidAmortization: snapshot.keepPrincipalPaydown,
        cumulativeTaxSavings: snapshot.keepCumTaxEffect,
        costToSell: -snapshot.keepLiquidationCost,
        total: snapshot.keepNetWorth,
      };

  const data: PathRow[] = [sellRow, keepRow, scaleRow];

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Year-{horizon} Wealth Pillars
          </p>
          <h3 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
            How real estate compounds four ways at once
          </h3>
          <p className="mt-1 text-sm text-muted">
            Stocks stack one way. Each rental adds equity, cash flow, paydown,
            and tax savings — all at the same time.
          </p>
        </div>
      </div>

      <div className="mt-6 h-80 w-full sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 16, right: 12, left: 8, bottom: 8 }}
            barCategoryGap="22%"
            stackOffset="sign"
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="path"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{
                fill: "var(--foreground)",
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <YAxis
              tickFormatter={formatCompact}
              tickLine={false}
              axisLine={false}
              width={64}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-muted)", opacity: 0.5 }}
              content={<ChartTooltip />}
            />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
              iconType="square"
            />
            <Bar
              dataKey="investmentGrowth"
              stackId="wealth"
              name={PILLAR_LABELS.investmentGrowth}
              fill={PILLAR_COLORS.investmentGrowth}
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="equityGrowth"
              stackId="wealth"
              name={PILLAR_LABELS.equityGrowth}
              fill={PILLAR_COLORS.equityGrowth}
            />
            <Bar
              dataKey="tenantPaidAmortization"
              stackId="wealth"
              name={PILLAR_LABELS.tenantPaidAmortization}
              fill={PILLAR_COLORS.tenantPaidAmortization}
            />
            <Bar
              dataKey="cumulativeCashFlow"
              stackId="wealth"
              name={PILLAR_LABELS.cumulativeCashFlow}
              fill={PILLAR_COLORS.cumulativeCashFlow}
            />
            <Bar
              dataKey="cumulativeTaxSavings"
              stackId="wealth"
              name={PILLAR_LABELS.cumulativeTaxSavings}
              fill={PILLAR_COLORS.cumulativeTaxSavings}
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="costToSell"
              stackId="wealth"
              name={PILLAR_LABELS.costToSell}
              fill={PILLAR_COLORS.costToSell}
              radius={[0, 0, 8, 8]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
