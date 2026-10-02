import { formatCurrency } from "../../lib/calculators/format";
import type { MarketData } from "../../lib/rent-reduction/model";

function monthYear(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function RecentRentals({ market }: { market: MarketData }) {
  if (market.comparables.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">Recently rented homes like yours</h3>
        <p className="mt-2 text-sm text-muted">No close matches rented nearby in the last 12 months.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">Recently rented homes like yours</h3>
      <p className="mt-1 text-sm text-muted">
        The most recent matches near you — final asking rent and how long each took to lease.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-3 font-semibold">Address</th>
              <th className="py-2 pr-3 text-right font-semibold">Rent</th>
              <th className="py-2 pr-3 text-right font-semibold">Bd / Ba</th>
              <th className="py-2 pr-3 text-right font-semibold">Sq ft</th>
              <th className="py-2 pr-3 text-right font-semibold">Leased</th>
              <th className="py-2 text-right font-semibold">Days</th>
            </tr>
          </thead>
          <tbody>
            {market.comparables.map((c, i) => (
              <tr key={`${c.address}-${i}`} className="border-b border-border/60 text-foreground">
                <td className="py-2 pr-3">{c.address}</td>
                <td className="py-2 pr-3 text-right font-semibold tabular-nums">{formatCurrency(c.price)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {c.beds ?? "—"} / {c.baths ?? "—"}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{c.sqft ? c.sqft.toLocaleString() : "—"}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{monthYear(c.removedDate)}</td>
                <td className="py-2 text-right tabular-nums">{c.daysOnMarket}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
