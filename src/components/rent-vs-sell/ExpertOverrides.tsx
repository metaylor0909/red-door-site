
import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { WealthInputs } from "../../lib/rent-vs-sell/wealthArchitect";
import { formatCurrency } from "../../lib/rent-vs-sell/format";

export type OverrideValues = Pick<
  WealthInputs,
  | "managementFeeRate"
  | "renewalRate"
  | "vacancyRate"
  | "maintenanceRate"
  | "appreciationRate"
  | "marginalTaxRate"
  | "buildingValuePct"
  | "propertyTaxRate"
  | "annualInsurance"
  | "rentGrowthRate"
  | "capitalGainsTaxRate"
  | "includeDepreciationRecapture"
>;

type NumericOverrideKey = Exclude<keyof OverrideValues, "includeDepreciationRecapture">;

interface ExpertOverridesProps {
  values: OverrideValues;
  onChange: (patch: Partial<WealthInputs>) => void;
}

type FieldKind = "percent" | "dollar";

interface Field {
  key: NumericOverrideKey;
  label: string;
  helper: string;
  kind: FieldKind;
  min: number;
  max: number;
  step: number;
  decimals?: number;
}

const FIELDS: Field[] = [
  {
    key: "managementFeeRate",
    label: "Management Fee",
    helper: "Percent of effective gross income paid to your property manager.",
    kind: "percent",
    min: 0,
    max: 20,
    step: 0.5,
    decimals: 1,
  },
  {
    key: "renewalRate",
    label: "Tenant Renewal Rate",
    helper:
      "Share of tenants who renew each year (75% ≈ a 4-year average tenancy). Each turnover costs the $995 new-lease fee; each renewal, $350.",
    kind: "percent",
    min: 0,
    max: 100,
    step: 5,
    decimals: 0,
  },
  {
    key: "vacancyRate",
    label: "Vacancy Rate",
    helper: "Share of gross rent lost to vacant days between tenants.",
    kind: "percent",
    min: 0,
    max: 15,
    step: 0.5,
    decimals: 1,
  },
  {
    key: "maintenanceRate",
    label: "Annual Maintenance",
    helper: "Repairs and turn costs as a percent of gross rent.",
    kind: "percent",
    min: 0,
    max: 25,
    step: 0.5,
    decimals: 1,
  },
  {
    key: "rentGrowthRate",
    label: "Rent Growth",
    helper: "Year-over-year compound rent increase.",
    kind: "percent",
    min: 0,
    max: 10,
    step: 0.25,
    decimals: 2,
  },
  {
    key: "appreciationRate",
    label: "Property Appreciation",
    helper: "Annual real estate appreciation applied to home value.",
    kind: "percent",
    min: 0,
    max: 10,
    step: 0.25,
    decimals: 2,
  },
  {
    key: "marginalTaxRate",
    label: "Marginal Tax Rate",
    helper: "Federal bracket applied to rental profit, and to losses created by depreciation.",
    kind: "percent",
    min: 0,
    max: 50,
    step: 1,
    decimals: 0,
  },
  {
    key: "buildingValuePct",
    label: "Building Value %",
    helper: "Depreciable portion of the property (land is not depreciable).",
    kind: "percent",
    min: 50,
    max: 95,
    step: 1,
    decimals: 0,
  },
  {
    key: "propertyTaxRate",
    label: "Property Tax Rate",
    helper: "Effective annual property tax as a percent of home value.",
    kind: "percent",
    min: 0,
    max: 3,
    step: 0.05,
    decimals: 2,
  },
  {
    key: "annualInsurance",
    label: "Annual Insurance",
    helper: "Landlord policy premium per year.",
    kind: "dollar",
    min: 0,
    max: 6000,
    step: 50,
  },
  {
    key: "capitalGainsTaxRate",
    label: "Capital Gains Tax",
    helper: "Long-term rate on the gain over your purchase price, and on investment growth when cashed out.",
    kind: "percent",
    min: 0,
    max: 30,
    step: 1,
    decimals: 0,
  },
];

export default function ExpertOverrides({
  values,
  onChange,
}: ExpertOverridesProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-3xl border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-brand">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Advanced
            </p>
            <p className="text-base font-bold text-foreground">
              Expert Overrides
            </p>
            <p className="text-xs text-muted">
              {open
                ? "All 12 modeling parameters · pillar-by-pillar control"
                : "Tune all 12 modeling parameters to your market"}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="grid gap-5 border-t border-border px-6 pb-6 pt-5 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <OverrideField
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={(v) =>
                onChange({ [field.key]: v } as Partial<WealthInputs>)
              }
            />
          ))}
          <div className="space-y-2 sm:col-span-2">
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-foreground">
                Include Depreciation Recapture
              </span>
              <input
                type="checkbox"
                checked={values.includeDepreciationRecapture}
                onChange={(e) =>
                  onChange({ includeDepreciationRecapture: e.target.checked })
                }
                className="h-5 w-5 accent-[var(--brand)]"
              />
            </label>
            <p className="text-xs leading-relaxed text-muted">
              Off by default. Most investors sell through a 1031 exchange into
              another property, which defers the 25% recapture tax on
              depreciation already taken. Turn this on if you&rsquo;d move the
              proceeds out of real estate (stocks, debt payoff), where
              recapture is due at sale.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function OverrideField({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: number;
  onChange: (v: number) => void;
}) {
  const displayValue =
    field.kind === "percent"
      ? `${(value * 100).toFixed(field.decimals ?? 1)}%`
      : formatCurrency(value);
  const sliderValue = field.kind === "percent" ? value * 100 : value;
  const handleSlider = (raw: number) => {
    onChange(field.kind === "percent" ? raw / 100 : raw);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={`override-${field.key}`}
          className="text-sm font-semibold text-foreground"
        >
          {field.label}
        </label>
        <span className="text-sm font-bold tabular-nums text-brand">
          {displayValue}
        </span>
      </div>
      <input
        id={`override-${field.key}`}
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={sliderValue}
        onChange={(e) => handleSlider(Number(e.target.value))}
        className="w-full"
      />
      <p className="text-xs leading-relaxed text-muted">{field.helper}</p>
    </div>
  );
}
