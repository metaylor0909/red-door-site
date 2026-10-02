import { formatCurrency } from "../../lib/calculators/format";
import type { MarketData, ModelSettings } from "../../lib/rent-reduction/model";
import { forecastScenarios, verdict } from "./ForecastStep";
import { SCENARIO_NAME } from "./scenarioColors";
import type { PropertyInputs } from "./Wizard";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-1.5 text-sm" style={{ borderColor: '#e5e5e5' }}>
      <span style={{ color: '#525252' }}>{label}</span>
      <span className="font-semibold tabular-nums" style={{ color: '#171717' }}>{value}</span>
    </div>
  );
}

// Off-screen printable node captured by html2canvas for the PDF. Colors are
// inline hex: html2canvas can't parse the oklch() colors Tailwind's palette
// uses, or reliably resolve CSS variables.
export default function Report({ data, market, settings, reduction }: { data: PropertyInputs; market: MarketData; settings: ModelSettings; reduction: number }) {
  const scenarios = forecastScenarios(data, market, settings, reduction);
  const [current, owner] = scenarios;
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="p-10" style={{ backgroundColor: '#ffffff', color: '#171717', width: 816 }}>
      <header className="border-b-2 pb-3" style={{ borderColor: '#171717' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#737373' }}>Red Door Property Management</p>
        <h1 className="mt-1 text-2xl font-bold">Rent Reduction Report</h1>
        <p className="mt-1 text-sm" style={{ color: '#525252' }}>
          Prepared {date} · ZIP {data.zip} · {data.bedrooms} bed / {data.bathrooms} bath
        </p>
      </header>

      <section className="mt-5 rounded-lg border p-4 text-sm leading-relaxed" style={{ borderColor: '#d4d4d4', color: '#262626' }}>
        <p>{verdict(current, owner, "tenancy", settings.tenancyYears)}</p>
        <p className="mt-2">{verdict(current, owner, "year", settings.tenancyYears)}</p>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide">Your property</h2>
          <div className="mt-2">
            <Row label="ZIP" value={data.zip} />
            <Row label="Bedrooms / bathrooms" value={`${data.bedrooms} / ${data.bathrooms}`} />
            <Row label="Current asking rent" value={`${formatCurrency(data.askingRent)}/mo`} />
            <Row label="Reduction tested" value={`${formatCurrency(reduction)}/mo`} />
          </div>
        </section>
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide">Local market</h2>
          <div className="mt-2">
            <Row label="Market rent" value={`${formatCurrency(market.marketRent)}/mo`} />
            <Row label="Typical time to lease" value={`${market.localMedianDays} days`} />
            <Row label="Based on" value={`${market.localDaysCount.toLocaleString()} ${market.localDaysLabel}`} />
            <Row label="Middle half" value={`${market.localMiddleHalfDays[0]}–${market.localMiddleHalfDays[1]} days`} />
          </div>
        </section>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide">Scenario comparison</h2>
        <table className="mt-3 w-full border text-sm" style={{ borderColor: '#d4d4d4' }}>
          <thead className="text-xs uppercase tracking-wide" style={{ backgroundColor: '#f5f5f5', color: '#525252' }}>
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Scenario</th>
              <th className="px-3 py-2 text-right font-semibold">Rent / mo</th>
              <th className="px-3 py-2 text-right font-semibold">Est. days to lease</th>
              <th className="px-3 py-2 text-right font-semibold">First 12 months</th>
              <th className="px-3 py-2 text-right font-semibold">Over {settings.tenancyYears} years</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => (
              <tr key={s.label} className="border-t" style={{ borderColor: '#e5e5e5' }}>
                <td className="px-3 py-2 font-semibold">{SCENARIO_NAME[s.label]}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(s.monthlyRent)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{Math.round(s.forecastDays)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(s.firstYearRevenue)}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">{formatCurrency(s.tenancyRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {market.comparables.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide">Recently rented homes like yours</h2>
          <table className="mt-3 w-full border text-sm" style={{ borderColor: '#d4d4d4' }}>
            <thead className="text-xs uppercase tracking-wide" style={{ backgroundColor: '#f5f5f5', color: '#525252' }}>
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Address</th>
                <th className="px-3 py-2 text-right font-semibold">Rent</th>
                <th className="px-3 py-2 text-right font-semibold">Leased</th>
                <th className="px-3 py-2 text-right font-semibold">Days</th>
              </tr>
            </thead>
            <tbody>
              {market.comparables.map((c, i) => (
                <tr key={`${c.address}-${i}`} className="border-t" style={{ borderColor: '#e5e5e5' }}>
                  <td className="px-3 py-2">{c.address}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(c.price)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.removedDate}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.daysOnMarket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p className="mt-6 text-xs leading-relaxed" style={{ color: '#737373' }}>
        Educational illustration only — not financial or investment advice. Lease times and rents come from RentCast
        rental listings removed in the last 12 months; days-to-lease figures are estimates.
      </p>
    </div>
  );
}
