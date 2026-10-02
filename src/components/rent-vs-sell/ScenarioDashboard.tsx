
import { useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  Calculator,
  Clock,
  Coins,
  Crown,
  Home,
  Landmark,
  LineChart,
  PiggyBank,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatPercent } from "../../lib/rent-vs-sell/format";
import type { WealthProjection } from "../../lib/rent-vs-sell/wealthArchitect";
import SummaryTiles from "./SummaryTiles";
import PillarBarChart from "./PillarBarChart";
import NetWorthTimeline from "./NetWorthTimeline";
import HorizonSelect from "./HorizonSelect";

interface ScenarioDashboardProps {
  projection: WealthProjection;
  homeValue: number;
}

function taxEffectLabel(taxEffect: number): string {
  return taxEffect >= 0
    ? `Includes ${formatCurrency(taxEffect)} in tax savings`
    : `After ${formatCurrency(-taxEffect)} in income tax`;
}

type Horizon = 5 | 10 | 15;
const HORIZONS: Horizon[] = [5, 10, 15];

export default function ScenarioDashboard({
  projection,
  homeValue,
}: ScenarioDashboardProps) {
  // One year selection drives every section (cards, pillars chart, milestones,
  // timeline marker), whichever control the user changes.
  const [horizon, setHorizon] = useState<Horizon>(10);
  const changeHorizon = (y: number) => setHorizon(y as Horizon);

  const snapshot = useMemo(() => {
    return (
      projection.snapshots.find((s) => s.year === horizon) ??
      projection.snapshots[projection.snapshots.length - 1]
    );
  }, [projection.snapshots, horizon]);

  const {
    scenarioMode,
    ltv,
    altLabel,
    altReturnRate,
    sale,
    refi,
    leverage,
    debtSplit,
    property2,
  } = projection;

  const recaptureRow =
    sale.depreciationRecaptureTax > 0
      ? [
          {
            label: "Depreciation recapture",
            value: `− ${formatCurrency(sale.depreciationRecaptureTax)}`,
          },
        ]
      : [];

  const isDebt = debtSplit !== null;
  const path1Title = isDebt ? "Sell & Pay Off Debt" : "Sell & Reinvest";
  const path1Icon = isDebt ? (
    <PiggyBank className="h-5 w-5" />
  ) : (
    <TrendingUp className="h-5 w-5" />
  );

  return (
    <div className="space-y-6">
      {/* Premium summary tiles */}
      <SummaryTiles
        projection={projection}
        snapshot={snapshot}
        horizon={horizon}
      />

      {/* Stacked pillar bar chart */}
      <PillarBarChart
        projection={projection}
        snapshot={snapshot}
        horizon={horizon}
        horizonOptions={HORIZONS}
        onHorizonChange={changeHorizon}
      />

      {/* LTV banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-muted/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
            <Calculator className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Current Loan-to-Value
            </p>
            <p className="text-base font-semibold text-foreground tabular-nums">
              {formatPercent(ltv, 1)}
              <span className="ml-2 text-sm font-medium text-muted">
                ({formatCurrency(homeValue - sale.mortgagePayoff)} equity)
              </span>
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            scenarioMode === "refi"
              ? "bg-gain/10 text-gain"
              : "bg-brand/10 text-brand"
          }`}
        >
          {scenarioMode === "refi" ? (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Refi-Eligible · Scale Path Unlocked
            </>
          ) : (
            <>
              <ShieldAlert className="h-3.5 w-3.5" />
              Leverage Optimization Mode
            </>
          )}
        </span>
      </div>

      {/* Three-column comparison */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-xs leading-relaxed text-muted">
          Net worth on every path is what you&rsquo;d walk away with if you
          cashed out that year &mdash; after selling costs and capital gains tax
          {sale.depreciationRecaptureTax > 0 ? ", including depreciation recapture" : ""}.
        </p>
        <HorizonSelect value={horizon} options={HORIZONS} onChange={changeHorizon} />
      </div>
      <div className="grid gap-5 pt-1 lg:grid-cols-3 [&>*]:min-w-0">
        <ScenarioColumn
          variant="sell"
          icon={path1Icon}
          eyebrow="Path 1"
          title={path1Title}
          subtitle={altLabel}
          netWorth={snapshot.sellNetWorth}
          cashFlow={snapshot.sellCashFlowAnnual}
          horizon={horizon}
          rows={
            debtSplit
              ? [
                  {
                    label: "Net proceeds at sale",
                    value: formatCurrency(sale.netProceeds),
                  },
                  {
                    label: `Debt payoff @ ${formatPercent(debtSplit.debtRate, 0)}`,
                    value: formatCurrency(snapshot.sellDebtBucket),
                  },
                  {
                    label: `Surplus @ ${formatPercent(debtSplit.surplusRate, 0)}`,
                    value: formatCurrency(snapshot.sellSurplusBucket),
                  },
                  {
                    label: "Capital gains tax at sale",
                    value: `− ${formatCurrency(sale.capitalGainsTax)}`,
                  },
                  ...recaptureRow,
                  {
                    label: `Tax on surplus growth at year ${horizon}`,
                    value: `− ${formatCurrency(snapshot.sellLiquidationTax)}`,
                  },
                ]
              : [
                  {
                    label: "Net proceeds at sale",
                    value: formatCurrency(sale.netProceeds),
                  },
                  {
                    label: "Selling costs",
                    value: `− ${formatCurrency(sale.sellingCosts)}`,
                  },
                  {
                    label: "Capital gains tax at sale",
                    value: `− ${formatCurrency(sale.capitalGainsTax)}`,
                  },
                  ...recaptureRow,
                  {
                    label: "Assumed return",
                    value: formatPercent(altReturnRate, 1),
                  },
                  {
                    label: `Tax on growth at year ${horizon}`,
                    value: `− ${formatCurrency(snapshot.sellLiquidationTax)}`,
                  },
                ]
          }
        />

        <KeepColumn snapshot={snapshot} horizon={horizon} />

        {scenarioMode === "refi" && refi ? (
          <ScaleColumn
            refi={refi}
            property2={property2}
            snapshot={snapshot}
            horizon={horizon}
          />
        ) : (
          leverage && (
            <LeverageColumn
              snapshot={snapshot}
              leverage={leverage}
              horizon={horizon}
            />
          )
        )}
      </div>

      {/* Milestone grid */}
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Milestone Comparison
            </p>
            <h3 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
              The compounding difference, year by year
            </h3>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
            {HORIZONS.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setHorizon(y)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  horizon === y
                    ? "bg-brand text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {y} Years
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <MilestoneCell
            icon={<LineChart className="h-4 w-4" />}
            label="Net Worth Δ vs. Sell"
            primary={formatCurrency(
              snapshot.keepNetWorth - snapshot.sellNetWorth,
            )}
            secondary={`Keep · ${formatCurrency(snapshot.keepNetWorth)}`}
            positive={snapshot.keepNetWorth > snapshot.sellNetWorth}
          />
          <MilestoneCell
            icon={<Building2 className="h-4 w-4" />}
            label={
              scenarioMode === "refi"
                ? "Refi & Scale Net Worth"
                : "Leverage Hold Net Worth"
            }
            primary={formatCurrency(snapshot.thirdNetWorth)}
            secondary={`vs. Sell · ${formatCurrency(
              snapshot.thirdNetWorth - snapshot.sellNetWorth,
            )}`}
            positive={snapshot.thirdNetWorth > snapshot.sellNetWorth}
          />
          <MilestoneCell
            icon={<Coins className="h-4 w-4" />}
            label="Annual Cash Flow (Keep)"
            primary={formatCurrency(snapshot.keepCashFlowAnnual)}
            secondary={taxEffectLabel(snapshot.keepAnnualTaxEffect)}
            positive={snapshot.keepCashFlowAnnual > 0}
          />
        </div>

        <NetWorthTimeline projection={projection} highlightYear={horizon} />
      </section>
    </div>
  );
}

interface ScenarioColumnProps {
  variant: "sell";
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  netWorth: number;
  cashFlow: number;
  horizon: number;
  rows: Array<{ label: string; value: string }>;
}

function ScenarioColumn({
  icon,
  eyebrow,
  title,
  subtitle,
  netWorth,
  cashFlow,
  horizon,
  rows,
}: ScenarioColumnProps) {
  return (
    <article className="relative flex h-full flex-col rounded-3xl border-2 border-stock/40 bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stock/15 text-stock">
          {icon}
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            {eyebrow}
          </p>
          <h4 className="text-base font-bold leading-tight text-foreground">
            {title}
          </h4>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">{subtitle}</p>

      <div className="mt-5 rounded-2xl bg-surface-muted/60 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Net Worth at year {horizon}
        </p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums text-foreground">
          {formatCurrency(netWorth)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted">
          <Banknote className="h-3.5 w-3.5" />
          {formatCurrency(cashFlow)} / yr passive growth
        </p>
      </div>

      <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-3"
          >
            <dt className="text-xs font-medium text-muted">{row.label}</dt>
            <dd className="text-sm font-semibold tabular-nums text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function KeepColumn({
  snapshot,
  horizon,
}: {
  snapshot: WealthProjection["snapshots"][number];
  horizon: number;
}) {
  return (
    <article className="relative flex h-full flex-col rounded-3xl border-2 border-pillar-appreciation/30 bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pillar-appreciation/10 text-pillar-appreciation">
          <Home className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            Path 2
          </p>
          <h4 className="text-base font-bold leading-tight text-foreground">
            Keep As-Is
          </h4>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Managed rental — equity, rent, paydown, and the depreciation tax shield
        all compounding together.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-surface-muted/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Future Property Value
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
            {formatCurrency(snapshot.homeValue)}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            Year {horizon} appreciated value
          </p>
        </div>
        <div className="rounded-2xl bg-brand/[0.06] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">
            Net Worth at Year {horizon}
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
            {formatCurrency(snapshot.keepNetWorth)}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            Equity + cash flow, after costs to sell
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 rounded-xl bg-gain/5 px-3 py-2 text-xs font-medium text-gain">
        <Banknote className="h-3.5 w-3.5" />
        {formatCurrency(snapshot.keepCashFlowAnnual)} /yr cash flow ·{" "}
        {taxEffectLabel(snapshot.keepAnnualTaxEffect).toLowerCase()}
      </div>

      <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs font-medium text-muted">
            Equity at year {horizon}
          </dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency(snapshot.keepEquity)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs font-medium text-muted">
            Cumulative cash flow
          </dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency(snapshot.keepCumCashFlow)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs font-medium text-muted">
            Selling costs &amp; taxes if sold at year {horizon}
          </dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">
            − {formatCurrency(snapshot.keepLiquidationCost)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs font-medium text-muted">Engine</dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">
            Cash + Apprec + Paydown + Tax
          </dd>
        </div>
      </dl>
    </article>
  );
}

function ScaleColumn({
  refi,
  property2,
  snapshot,
  horizon,
}: {
  refi: NonNullable<WealthProjection["refi"]>;
  property2: WealthProjection["property2"];
  snapshot: WealthProjection["snapshots"][number];
  horizon: number;
}) {
  return (
    <article className="relative flex h-full min-w-0 flex-col rounded-3xl border-2 border-brand bg-gradient-to-br from-brand to-[#8b0000] p-6 text-white shadow-xl">
      <span className="absolute -top-3 left-6 right-6 inline-flex w-fit max-w-[calc(100%-3rem)] items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand shadow-md">
        <Crown className="h-3.5 w-3.5" />
        <span className="truncate">Pro Tip · Tax-Free Cash-Out</span>
      </span>
      <div className="flex items-center gap-3 pt-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
          <Rocket className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
            Path 3 · Wealth Architect Pick
          </p>
          <h4 className="text-base font-bold leading-tight">
            Tax-Free Refi &amp; Scale
          </h4>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/85">
        Pulling equity out via a refinance is{" "}
        <span className="font-bold text-white">not a taxable event</span> —
        you skip capital gains entirely and redeploy the raw capital into a
        second compounding asset.
      </p>

      <div className="mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
            Combined Net Worth at year {horizon}
          </p>
          <ShieldCheck className="h-4 w-4 text-white/80" />
        </div>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">
          {formatCurrency(snapshot.scaleNetWorth)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/85">
          <Banknote className="h-3.5 w-3.5" />
          {formatCurrency(snapshot.scaleCashFlowAnnual)} / yr from both
          properties
        </p>
      </div>

      {property2 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
              <Home className="h-3 w-3" /> Property #1
            </p>
            <p className="mt-1 text-base font-bold tabular-nums">
              {formatCurrency(snapshot.p1Equity)}
            </p>
            <p className="text-[10px] text-white/70">
              Equity · 75% LTV refi
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
              <Building2 className="h-3 w-3" /> Property #2
            </p>
            <p className="mt-1 text-base font-bold tabular-nums">
              {formatCurrency(snapshot.p2Equity)}
            </p>
            <p className="text-[10px] text-white/70">
              Equity · acquired with refi cash-out
            </p>
          </div>
        </div>
      )}

      <dl className="mt-5 space-y-2.5 border-t border-white/20 pt-4 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs font-medium text-white/70">
            Tax-free cash-out
          </dt>
          <dd className="text-sm font-semibold tabular-nums">
            {formatCurrency(refi.cashOut)}
          </dd>
        </div>
        {property2 && (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-xs font-medium text-white/70">
                Property #2 purchase
              </dt>
              <dd className="text-sm font-semibold tabular-nums">
                {formatCurrency(property2.purchasePrice)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-xs font-medium text-white/70">
                Property #2 starting rent
              </dt>
              <dd className="text-sm font-semibold tabular-nums">
                {formatCurrency(property2.monthlyRent)} /mo
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-xs font-medium text-white/70">
                Property #2 P&amp;I
              </dt>
              <dd className="text-sm font-semibold tabular-nums">
                {formatCurrency(property2.monthlyPayment)} /mo
              </dd>
            </div>
          </>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <dt className="flex items-center gap-1 text-xs font-medium text-white/70">
            <Landmark className="h-3 w-3" /> Total tenant paydown · yr {horizon}
          </dt>
          <dd className="text-sm font-semibold tabular-nums">
            {formatCurrency(snapshot.scaleTenantPaydown)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function LeverageColumn({
  snapshot,
  leverage,
  horizon,
}: {
  snapshot: WealthProjection["snapshots"][number];
  leverage: NonNullable<WealthProjection["leverage"]>;
  horizon: number;
}) {
  const multiplier = leverage.appreciationOnEquityYear1;
  return (
    <article className="relative flex h-full min-w-0 flex-col rounded-3xl border-2 border-brand bg-gradient-to-br from-brand to-[#8b0000] p-6 text-white shadow-xl">
      <span className="absolute -top-3 left-6 right-6 inline-flex w-fit max-w-[calc(100%-3rem)] items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand shadow-md">
        <Crown className="h-3.5 w-3.5" />
        <span className="truncate">Pro Tip · Leverage Multiplier Active</span>
      </span>
      <div className="flex items-center gap-3 pt-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
          <Rocket className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
            Path 3 · Recommended
          </p>
          <h4 className="text-base font-bold leading-tight">
            Leverage Optimization Hold
          </h4>
        </div>
      </div>
      <p className="mt-3 text-xs text-white/85">
        Your high leverage is your superpower. A{" "}
        {+(leverage.appreciationRate * 100).toFixed(2)}% appreciating asset
        returns{" "}
        <span className="font-bold text-white">
          {formatPercent(multiplier, 1)}
        </span>{" "}
        on your current equity — sell now and you sacrifice that compounding
        force.
      </p>

      <div className="mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
          Net Worth at year {horizon}
        </p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">
          {formatCurrency(snapshot.thirdNetWorth)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/85">
          <Banknote className="h-3.5 w-3.5" />
          {formatCurrency(snapshot.thirdCashFlowAnnual)} / yr cash flow
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-white/20 bg-white/10 p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/80">
          <Clock className="h-3.5 w-3.5" />
          Time until 25% equity (refi-eligible)
        </div>
        <p className="mt-1.5 text-2xl font-extrabold tabular-nums">
          {leverage.yearsToTwentyFiveEquity > 0
            ? `${leverage.yearsToTwentyFiveEquity} ${leverage.yearsToTwentyFiveEquity === 1 ? "year" : "years"}`
            : "Already qualified"}
        </p>
        <p className="mt-1 text-xs text-white/70">
          Equity grows via paydown + appreciation. We&apos;ll revisit cash-out
          then.
        </p>
      </div>

      <dl className="mt-5 space-y-2.5 border-t border-white/20 pt-4 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs font-medium text-white/70">Equity today</dt>
          <dd className="text-sm font-semibold tabular-nums">
            {formatCurrency(leverage.currentEquity)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs font-medium text-white/70">
            Effective leverage multiplier
          </dt>
          <dd className="text-sm font-semibold tabular-nums">
            {formatPercent(multiplier, 1)} on equity
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs font-medium text-white/70">Current LTV</dt>
          <dd className="text-sm font-semibold tabular-nums">
            {formatPercent(leverage.currentLtv, 1)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function MilestoneCell({
  icon,
  label,
  primary,
  secondary,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  secondary: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/50 p-4">
      <div
        className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${
          positive ? "text-gain" : "text-muted"
        }`}
      >
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums text-foreground">
        {primary}
      </p>
      <p className="mt-1 text-xs text-muted">{secondary}</p>
    </div>
  );
}
