import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatCurrency } from "../../lib/calculators/format";
import type { WealthProjection } from "../../lib/rent-vs-sell/wealthArchitect";

interface NetWorthTimelineProps {
  projection: WealthProjection;
  highlightYear: number;
}

// Validated with the dataviz palette checker (lightness, chroma, CVD
// separation, contrast) against a white surface.
const SERIES_COLORS = {
  sell: "#b45309",
  keep: "#2563eb",
  third: "#bc1719",
} as const;

type SeriesKey = keyof typeof SERIES_COLORS;

interface Point {
  year: number;
  sell: number;
  keep: number;
  third?: number;
}

const yearLabel = (y: number) => (y === 0 ? "Today" : `Yr ${y}`);

interface TooltipEntry {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
}

function TimelineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const rows = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs shadow-lg">
      <p className="font-semibold text-foreground">
        {label === 0 ? "Today" : `Year ${label}`}
      </p>
      <div className="mt-1.5 space-y-1">
        {rows.map((r) => (
          <div key={r.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: r.color }} />
              {r.name}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {formatCurrency(r.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NetWorthTimeline({
  projection,
  highlightYear,
}: NetWorthTimelineProps) {
  // End-of-line labels need ~100px of right margin; on phones that squeezes
  // the plot, so they're dropped there and the legend names the lines.
  const [showEndLabels, setShowEndLabels] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setShowEndLabels(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const isRefi = projection.scenarioMode === "refi";
  const sellName = projection.debtSplit ? "Sell & Pay Off Debt" : "Sell & Reinvest";

  // Year 0 is the decision point: every path starts from what a sale would
  // net today.
  const start = projection.sale.netProceeds;
  const data: Point[] = [
    { year: 0, sell: start, keep: start, ...(isRefi ? { third: start } : {}) },
    ...projection.snapshots.map((s) => ({
      year: s.year,
      sell: s.sellNetWorth,
      keep: s.keepNetWorth,
      ...(isRefi ? { third: s.scaleNetWorth } : {}),
    })),
  ];

  const series: Array<{ key: SeriesKey; name: string }> = [
    { key: "sell", name: sellName },
    { key: "keep", name: "Keep As-Is" },
    ...(isRefi ? [{ key: "third" as const, name: "Refi & Scale" }] : []),
  ];

  // Nudge end-of-line labels apart when two paths finish close together.
  const last = data[data.length - 1];
  const span = Math.max(...series.map((s) => last[s.key] ?? 0)) - Math.min(0, ...series.map((s) => last[s.key] ?? 0));
  const labelOffset: Partial<Record<SeriesKey, number>> = {};
  let prev: { value: number; dy: number } | null = null;
  for (const s of [...series].sort((a, b) => (last[b.key] ?? 0) - (last[a.key] ?? 0))) {
    const value = last[s.key] ?? 0;
    const dy: number = prev && prev.value - value < span * 0.07 ? prev.dy + 14 : 0;
    labelOffset[s.key] = dy;
    prev = { value, dy };
  }

  const endLabel =
    (key: SeriesKey, name: string) =>
    (props: { index?: number; x?: number | string; y?: number | string }) => {
      if (props.index !== data.length - 1) return null;
      return (
        <text
          x={Number(props.x) + 8}
          y={Number(props.y) + (labelOffset[key] ?? 0)}
          dy={4}
          fontSize={11}
          fontWeight={600}
          fill="var(--foreground)"
        >
          {name}
        </text>
      );
    };

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h4 className="text-base font-bold text-foreground">Net worth over time</h4>
      <p className="mt-1 text-sm text-muted">
        What you&rsquo;d walk away with on each path if you cashed out in that
        year{isRefi ? "" : " — your equity is too thin for the refi path yet, so it isn't shown"}.
      </p>

      <div className="mt-4 h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: showEndLabels ? 108 : 12, left: showEndLabels ? 8 : 0, bottom: 4 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, 15]}
              ticks={[0, 5, 10, 15]}
              tickFormatter={yearLabel}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatCompact}
              tickLine={false}
              axisLine={false}
              width={showEndLabels ? 64 : 48}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
            />
            <Tooltip
              content={<TimelineTooltip />}
              cursor={{ stroke: "var(--muted)", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="plainline"
              wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
            />
            <ReferenceLine
              x={highlightYear}
              stroke="var(--muted)"
              strokeDasharray="4 4"
              label={{
                value: `Year ${highlightYear}`,
                position: "insideTopLeft",
                fill: "var(--muted)",
                fontSize: 11,
              }}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={SERIES_COLORS[s.key]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
                isAnimationActive={false}
                label={showEndLabels ? endLabel(s.key, s.name) : false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-muted hover:text-foreground">
          View the numbers
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-xs tabular-nums">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-1.5 pr-3 font-semibold">Year</th>
                {series.map((s) => (
                  <th key={s.key} className="py-1.5 pr-3 text-right font-semibold">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.year} className="border-b border-border/60 text-foreground">
                  <td className="py-1.5 pr-3">{d.year === 0 ? "Today" : d.year}</td>
                  {series.map((s) => (
                    <td key={s.key} className="py-1.5 pr-3 text-right">
                      {formatCurrency(d[s.key] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
