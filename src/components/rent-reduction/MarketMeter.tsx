import { formatPercent } from "../../lib/calculators/format";
import { meterValue, tierForPosition, type MarketTier } from "../../lib/rent-reduction/model";

// Fixed hues so the meter's neutral middle stays distinct from the brand red.
const TIER_COLOR: Record<MarketTier, string> = {
  "Well Above Market": "#b91c1c",
  "Above Market": "#c2410c",
  "At Market": "#a16207",
  "Below Market": "#15803d",
  "Well Below Market": "#166534",
};

export default function MarketMeter({ position }: { position: number }) {
  const tier = tierForPosition(position);
  // High rent on the left, lower on the right, so the marker moves right
  // as the owner lowers the rent with the slider.
  const left = 100 - meterValue(position);
  const color = TIER_COLOR[tier];

  return (
    <div>
      <div className="relative h-3 rounded-full bg-gradient-to-r from-[#b91c1c] via-[#a16207] to-[#15803d]">
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md transition-[left] duration-200"
          style={{ left: `${left}%`, background: color }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-medium text-muted">
        <span>20%+ above</span>
        <span>At market</span>
        <span>20%+ below</span>
      </div>
      <p className="mt-3 text-sm font-semibold" style={{ color }} aria-live="polite">
        {Math.abs(position) < 0.005
          ? "Right at market rent"
          : `${formatPercent(Math.abs(position), 1)} ${position > 0 ? "above" : "below"} market rent`}{" "}
        · {tier}
      </p>
    </div>
  );
}
