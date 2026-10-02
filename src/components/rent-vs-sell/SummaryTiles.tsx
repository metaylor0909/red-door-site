
import { Crown, Home, Rocket, Sparkles, TrendingUp } from "lucide-react";
import { formatCurrency } from "../../lib/calculators/format";
import type { WealthProjection, YearSnapshot } from "../../lib/rent-vs-sell/wealthArchitect";

interface SummaryTilesProps {
  projection: WealthProjection;
  snapshot: YearSnapshot;
  horizon: number;
}

export default function SummaryTiles({
  projection,
  snapshot,
  horizon,
}: SummaryTilesProps) {
  const isRefiMode = projection.scenarioMode === "refi";
  const stockLabel = projection.debtSplit
    ? "Sell & Pay Off Debt"
    : "Sell & Reinvest";

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Tile
        tone="muted"
        eyebrow="Stock Market"
        sublabel={stockLabel}
        icon={<TrendingUp className="h-5 w-5" />}
        value={formatCurrency(snapshot.sellNetWorth)}
        tooltip={`This is your net worth after ${horizon} years if you sell the property and invest the proceeds in the stock market.`}
      />

      <Tile
        tone="keep"
        eyebrow="Keep As-Is"
        sublabel="Managed rental, do nothing"
        icon={<Home className="h-5 w-5" />}
        value={formatCurrency(snapshot.keepNetWorth)}
        tooltip={`This is your net worth after ${horizon} years if you hold the real estate as-is.`}
      />

      <Tile
        tone="premium"
        eyebrow={isRefiMode ? "Refi & Reinvest" : "Leverage Hold"}
        sublabel={
          isRefiMode && projection.property2
            ? "Two compounding doors"
            : "Hold strategy"
        }
        icon={<Rocket className="h-5 w-5" />}
        value={formatCurrency(snapshot.thirdNetWorth)}
        tooltip={
          isRefiMode
            ? `This is your net worth after ${horizon} years if you refinance to access your equity and reinvest it into another rental house.`
            : `This is your net worth after ${horizon} years if you hold and let leverage compound your equity until you qualify to refinance.`
        }
        proTip={isRefiMode}
      />
    </section>
  );
}

interface TileProps {
  tone: "muted" | "keep" | "premium";
  eyebrow: string;
  sublabel: string;
  icon: React.ReactNode;
  value: string;
  tooltip: string;
  proTip?: boolean;
}

function Tile({
  tone,
  eyebrow,
  sublabel,
  icon,
  value,
  tooltip,
  proTip,
}: TileProps) {
  const shell =
    tone === "muted"
      ? "border-stock/40 bg-surface text-foreground"
      : tone === "keep"
        ? "border-pillar-appreciation/30 bg-surface text-foreground"
        : "border-brand bg-gradient-to-br from-brand to-[#8b0000] text-white shadow-lg";
  const iconBg =
    tone === "muted"
      ? "bg-stock/15 text-stock"
      : tone === "keep"
        ? "bg-pillar-appreciation/10 text-pillar-appreciation"
        : "bg-white/20 text-white";
  const eyebrowTone =
    tone === "premium" ? "text-white/90" : "text-muted";
  const sublabelTone =
    tone === "premium" ? "text-white/70" : "text-muted/80";

  return (
    <article
      className={`group relative overflow-visible rounded-3xl border-2 px-6 py-5 transition-shadow hover:shadow-xl focus-within:shadow-xl ${shell}`}
      tabIndex={0}
      aria-describedby={`tile-${eyebrow.replace(/\s+/g, "-")}-tooltip`}
    >
      {proTip && <ProTipRibbon />}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[11px] font-bold uppercase tracking-[0.18em] ${eyebrowTone}`}
          >
            {eyebrow}
          </p>
          <p className={`mt-1 text-[11px] font-medium ${sublabelTone}`}>
            {sublabel}
          </p>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 text-4xl font-extrabold tabular-nums leading-none">
        {value}
      </p>

      <span
        role="tooltip"
        id={`tile-${eyebrow.replace(/\s+/g, "-")}-tooltip`}
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-3 w-64 -translate-x-1/2 rounded-xl border border-border bg-foreground px-3.5 py-2.5 text-xs leading-relaxed text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <span
          aria-hidden="true"
          className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-border bg-foreground"
        />
        {tooltip}
      </span>
    </article>
  );
}

function ProTipRibbon() {
  return (
    <>
      {/* Hoverable badge with its own tooltip */}
      <span className="protip-badge absolute -top-3 left-1/2 z-20 -translate-x-1/2">
        <button
          type="button"
          aria-describedby="protip-tooltip"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand shadow-md ring-2 ring-brand/20 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
        >
          <Crown className="h-3 w-3" />
          PRO TIP
          <Sparkles className="h-3 w-3" />
        </button>
        <span
          role="tooltip"
          id="protip-tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 w-72 -translate-x-1/2 rounded-xl border border-brand/40 bg-foreground px-3.5 py-2.5 text-xs leading-relaxed text-white opacity-0 shadow-2xl transition-opacity duration-150 [.protip-badge:hover_&]:opacity-100 [.protip-badge:focus-within_&]:opacity-100"
        >
          <span
            aria-hidden="true"
            className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-brand/40 bg-foreground"
          />
          This is a secret of the ultra wealthy. Refinancing to access your
          equity doesn&apos;t trigger any taxes. You then put this equity back
          to work by purchasing another asset and compound the wealth building.
        </span>
      </span>
      {/* Sparkle accents */}
      <Sparkles
        className="pointer-events-none absolute right-4 top-3 h-3 w-3 text-white/40"
        aria-hidden="true"
      />
      <Sparkles
        className="pointer-events-none absolute bottom-4 left-4 h-2.5 w-2.5 text-white/30"
        aria-hidden="true"
      />
      {/* Subtle radial glow behind the value */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_60%)]"
      />
    </>
  );
}
