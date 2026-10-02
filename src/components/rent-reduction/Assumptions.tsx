import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { DEFAULT_SETTINGS, type ModelSettings } from "../../lib/rent-reduction/model";

interface Field {
  key: "overpricingSensitivity" | "underpricingSensitivity" | "tenancyYears";
  label: string;
  min: number;
  max: number;
  step: number;
  describe: (v: number) => string;
}

const FIELDS: Field[] = [
  {
    key: "overpricingSensitivity",
    label: "How much overpricing slows leasing",
    min: 0,
    max: 12,
    step: 1,
    describe: (v) => `Each 1% above market adds ${v}% to days on market (10% above → ${Math.round(v * 10)}% longer).`,
  },
  {
    key: "underpricingSensitivity",
    label: "How much underpricing speeds leasing",
    min: 0,
    max: 6,
    step: 0.5,
    describe: (v) =>
      `Each 1% below market removes ${v}% from days on market, never below half the local median — showings, applications and screening still take time.`,
  },
  {
    key: "tenancyYears",
    label: "Typical tenancy",
    min: 1,
    max: 6,
    step: 1,
    describe: (v) => `${v} year${v === 1 ? "" : "s"}. 4 years matches a 75% annual renewal rate.`,
  },
];

export default function Assumptions({ settings, onChange }: { settings: ModelSettings; onChange: (s: ModelSettings) => void }) {
  const [open, setOpen] = useState(false);
  const changed = FIELDS.some((f) => settings[f.key] !== DEFAULT_SETTINGS[f.key]);

  return (
    <section className="rounded-2xl border border-border bg-surface shadow-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-brand">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-base font-bold text-foreground">Forecast assumptions</span>
            <span className="block text-xs text-muted">
              The days-to-lease estimate starts from your local median and adjusts for price. {changed ? "You've changed these." : "Adjust them to your experience."}
            </span>
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="grid gap-5 border-t border-border px-6 pb-6 pt-5 sm:grid-cols-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="block space-y-2">
              <span className="flex items-baseline justify-between gap-2 text-sm font-semibold text-foreground">
                {f.label}
                <span className="tabular-nums text-brand">{settings[f.key]}</span>
              </span>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={settings[f.key]}
                onChange={(e) => onChange({ ...settings, [f.key]: Number(e.target.value) })}
              />
              <span className="block text-xs leading-relaxed text-muted">{f.describe(settings[f.key])}</span>
            </label>
          ))}
          {changed && (
            <button
              type="button"
              onClick={() => onChange(DEFAULT_SETTINGS)}
              className="justify-self-start text-sm font-semibold text-brand hover:underline sm:col-span-3"
            >
              Reset to defaults
            </button>
          )}
        </div>
      )}
    </section>
  );
}
