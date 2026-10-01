
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  HelpCircle,
  PiggyBank,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import SlideShell from "./SlideShell";
import ChoiceCard from "./ChoiceCard";
import type { SubProgress } from "./StepProgress";
import {
  DEBT_TYPE_RATES,
  estimateNetProceeds,
  type AltChoice,
  type DebtType,
} from "../../lib/rent-vs-sell/wealthArchitect";
import { formatCurrency } from "../../lib/rent-vs-sell/format";

export interface IntakeData {
  homeValue: number;
  mortgageBalance: number;
  mortgageRate: number;
  mortgageYearsRemaining: number;
  purchasePrice: number;
  purchaseYear: number;
  monthlyRent: number;
  altChoice: AltChoice | null;
  expectedReturn: number;
  debtType: DebtType;
  debtPayoff: number;
}

interface IntakeStepProps {
  data: IntakeData;
  onChange: (patch: Partial<IntakeData>) => void;
  onContinue: () => void;
  onSubProgress: (progress: SubProgress | null) => void;
}

type StepId =
  | "value"
  | "balance"
  | "loan"
  | "purchase"
  | "rent"
  | "alt"
  | "debtType"
  | "return"
  | "debtAmount";

const AUTO_ADVANCE_MS = 240;
const CURRENT_YEAR = new Date().getFullYear();

const bigInputClass =
  "w-full rounded-xl border-2 border-border bg-surface px-4 py-5 text-center text-3xl font-semibold tabular-nums text-foreground outline-none transition-colors placeholder:text-muted/40 focus:border-accent";

const ALT_CHOICES: Array<{
  value: AltChoice;
  label: string;
  caption: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "stocks",
    label: "Stock Market",
    caption: "Index funds, brokerage",
    icon: TrendingUp,
  },
  {
    value: "syndication",
    label: "Real Estate Syndication",
    caption: "Passive LP investment",
    icon: Building2,
  },
  {
    value: "debt",
    label: "Pay Down Debt",
    caption: "Eliminate balances",
    icon: PiggyBank,
  },
  {
    value: "other",
    label: "Other",
    caption: "Business, alts, crypto",
    icon: Sparkles,
  },
  {
    value: "not-sure",
    label: "Not Sure",
    caption: "Compare against 10% baseline",
    icon: HelpCircle,
  },
];

const DEBT_TYPES: Array<{
  value: DebtType;
  label: string;
  caption: string;
}> = [
  { value: "high", label: "High Interest", caption: "Credit cards (~20%)" },
  { value: "moderate", label: "Moderate", caption: "Auto / personal (~7%)" },
  { value: "low", label: "Low Interest", caption: "Student / HELOC (~4%)" },
];

export default function IntakeStep({
  data,
  onChange,
  onContinue,
  onSubProgress,
}: IntakeStepProps) {
  const [step, setStep] = useState<StepId>("value");
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDebt = data.altChoice === "debt";
  // The loan question is skipped for homes owned outright; the branch steps
  // only exist once an alternative has been picked.
  const sequence: StepId[] = [
    "value",
    "balance",
    ...(data.mortgageBalance > 0 ? (["loan"] as StepId[]) : []),
    "purchase",
    "rent",
    "alt",
    ...(isDebt
      ? (["debtType", "debtAmount"] as StepId[])
      : needsReturn(data.altChoice)
        ? (["return"] as StepId[])
        : []),
  ];
  const stepIndex = Math.max(0, sequence.indexOf(step));
  const nextStep = sequence[stepIndex + 1];
  const stepEyebrow = `Wealth Architect · Step ${stepIndex + 1} of ${sequence.length}`;
  const purchaseYearValid =
    data.purchaseYear >= 1950 && data.purchaseYear <= CURRENT_YEAR;

  const estimatedProceeds = estimateNetProceeds({
    homeValue: data.homeValue,
    mortgageBalance: data.mortgageBalance,
    purchasePrice: data.purchasePrice,
    yearsOwned: Math.max(0, CURRENT_YEAR - data.purchaseYear),
  });

  useEffect(() => {
    onSubProgress({ current: stepIndex + 1, total: sequence.length });
  }, [stepIndex, sequence.length, onSubProgress]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const goTo = useCallback((next: StepId) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setStep(next);
  }, []);

  const scheduleAdvance = useCallback((next: StepId) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => setStep(next), AUTO_ADVANCE_MS);
  }, []);

  const scheduleContinue = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(onContinue, AUTO_ADVANCE_MS);
  }, [onContinue]);

  const handleAltSelect = (value: AltChoice) => {
    if (value === "not-sure") {
      onChange({ altChoice: value, expectedReturn: 0.1 });
      scheduleContinue();
    } else if (value === "debt") {
      onChange({ altChoice: value });
      scheduleAdvance("debtType");
    } else {
      onChange({ altChoice: value });
      scheduleAdvance("return");
    }
  };

  const handleDebtTypeSelect = (value: DebtType) => {
    onChange({ debtType: value });
    // Pre-seed debt payoff to the full proceeds when blank.
    if (data.debtPayoff <= 0 && estimatedProceeds > 0) {
      onChange({ debtPayoff: Math.round(estimatedProceeds) });
    }
    scheduleAdvance("debtAmount");
  };

  return (
    <section className="rounded-3xl border border-border bg-surface px-6 py-12 shadow-sm sm:px-10 sm:py-16">
      <div className="relative">
        <div className="absolute -top-4 left-0">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => goTo(sequence[stepIndex - 1])}
              aria-label="Back to previous question"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {step === "value" && (
            <SlideShell
              key="1a"
              motionKey="1a"
              eyebrow={stepEyebrow}
              title="What's your home's estimated market value today?"
              subtitle="An informed guess is fine — comparable sales will refine this later."
            >
              <CurrencyInput
                value={data.homeValue}
                onChange={(v) => onChange({ homeValue: v })}
                placeholder="350,000"
              />
              <RangeSlider
                value={data.homeValue}
                min={100_000}
                max={1_500_000}
                step={5_000}
                onChange={(v) => onChange({ homeValue: v })}
                leftLabel="$100K"
                rightLabel="$1.5M"
              />
              <ContinueButton
                onClick={() => goTo(nextStep)}
                disabled={data.homeValue <= 0}
                label="Continue"
              />
            </SlideShell>
          )}

          {step === "balance" && (
            <SlideShell
              key="1b"
              motionKey="1b"
              eyebrow={stepEyebrow}
              title="What's your remaining mortgage balance?"
              subtitle="Just the payoff figure on your most recent statement. Enter 0 if owned outright."
            >
              <CurrencyInput
                value={data.mortgageBalance}
                onChange={(v) => onChange({ mortgageBalance: v })}
                placeholder="220,000"
              />
              {data.homeValue > 0 && (
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
                  Implied equity ·{" "}
                  <span className="text-foreground tabular-nums">
                    {formatCurrency(
                      Math.max(0, data.homeValue - data.mortgageBalance),
                    )}
                  </span>
                </p>
              )}
              <ContinueButton
                onClick={() => goTo(nextStep)}
                disabled={data.mortgageBalance < 0}
                label="Continue"
              />
            </SlideShell>
          )}

          {step === "loan" && (
            <SlideShell
              key="1b-loan"
              motionKey="1b-loan"
              eyebrow={stepEyebrow}
              title="What's your mortgage interest rate?"
              subtitle="And roughly how many years are left on the loan. A 3% loan and a 7% loan make for very different rentals."
            >
              <PercentInput
                value={data.mortgageRate}
                onChange={(v) => onChange({ mortgageRate: v })}
                placeholder="6.5"
                step={0.125}
              />
              <SmallNumberField
                label="Years remaining on the loan"
                value={data.mortgageYearsRemaining}
                onChange={(v) => onChange({ mortgageYearsRemaining: v })}
                min={1}
                max={40}
              />
              <ContinueButton
                onClick={() => goTo(nextStep)}
                disabled={data.mortgageRate < 0 || data.mortgageYearsRemaining <= 0}
                label="Continue"
              />
            </SlideShell>
          )}

          {step === "purchase" && (
            <SlideShell
              key="1b-purchase"
              motionKey="1b-purchase"
              eyebrow={stepEyebrow}
              title="What did you pay for the property, and when?"
              subtitle="Your purchase price sets the tax basis for depreciation and capital gains."
            >
              <CurrencyInput
                value={data.purchasePrice}
                onChange={(v) => onChange({ purchasePrice: v })}
                placeholder="250,000"
              />
              <SmallNumberField
                label="Year purchased"
                value={data.purchaseYear}
                onChange={(v) => onChange({ purchaseYear: v })}
                min={1950}
                max={CURRENT_YEAR}
              />
              <ContinueButton
                onClick={() => goTo(nextStep)}
                disabled={data.purchasePrice <= 0 || !purchaseYearValid}
                label="Continue"
              />
            </SlideShell>
          )}

          {step === "rent" && (
            <SlideShell
              key="1c"
              motionKey="1c"
              eyebrow={stepEyebrow}
              title="What's the current or target monthly gross rent?"
              subtitle="The sticker rent — we model vacancy and maintenance separately."
            >
              <CurrencyInput
                value={data.monthlyRent}
                onChange={(v) => onChange({ monthlyRent: v })}
                placeholder="2,400"
                suffix="/mo"
              />
              <ContinueButton
                onClick={() => goTo(nextStep)}
                disabled={data.monthlyRent <= 0}
                label="Continue"
              />
            </SlideShell>
          )}

          {step === "alt" && (
            <SlideShell
              key="1d"
              motionKey="1d"
              eyebrow={stepEyebrow}
              title="If you sold today, what would you do with the proceeds?"
              subtitle="This is the alternative we'll compare your rental against."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ALT_CHOICES.map((opt) => {
                  const Icon = opt.icon;
                  const selected = data.altChoice === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => handleAltSelect(opt.value)}
                      className={`group flex h-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                        selected
                          ? "border-brand bg-brand/5 text-brand shadow-sm"
                          : "border-border bg-surface text-foreground hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-sm"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          selected
                            ? "bg-brand text-white"
                            : "bg-surface-muted text-brand"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="flex flex-col">
                        <span className="text-base font-semibold leading-tight">
                          {opt.label}
                        </span>
                        <span
                          className={`text-xs ${
                            selected ? "text-brand/80" : "text-muted"
                          }`}
                        >
                          {opt.caption}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </SlideShell>
          )}

          {step === "debtType" && (
            <SlideShell
              key="1e-debt"
              motionKey="1e-debt"
              eyebrow="Debt Profile"
              title="What kind of debt would you pay off?"
              subtitle="We'll treat the avoided interest as your alternative return."
            >
              <div className="grid grid-cols-1 gap-3">
                {DEBT_TYPES.map((opt) => (
                  <ChoiceCard
                    key={opt.value}
                    value={opt.value}
                    label={`${opt.label} · ${(DEBT_TYPE_RATES[opt.value] * 100).toFixed(0)}%`}
                    caption={opt.caption}
                    isSelected={data.debtType === opt.value}
                    onSelect={handleDebtTypeSelect}
                  />
                ))}
              </div>
            </SlideShell>
          )}

          {step === "return" && (
            <SlideShell
              key="1e-return"
              motionKey="1e-return"
              eyebrow="Expected Return"
              title="What annual return do you expect from this alternative?"
              subtitle="The long-term, after-fee number. Stocks have averaged ~10%."
            >
              <PercentInput
                value={data.expectedReturn}
                onChange={(v) => onChange({ expectedReturn: v })}
              />
              <RangeSlider
                value={data.expectedReturn * 100}
                min={1}
                max={20}
                step={0.5}
                onChange={(v) => onChange({ expectedReturn: v / 100 })}
                leftLabel="1%"
                rightLabel="20%"
              />
              <ContinueButton
                onClick={onContinue}
                disabled={data.expectedReturn <= 0}
                label="See My Wealth Map"
              />
            </SlideShell>
          )}

          {step === "debtAmount" && (
            <SlideShell
              key="1f-debt-amount"
              motionKey="1f-debt-amount"
              eyebrow="Debt Payoff Amount"
              title="Total debt you'll pay off with the proceeds?"
              subtitle={
                estimatedProceeds > 0 ? (
                  <>
                    Capped at your estimated net proceeds of{" "}
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatCurrency(estimatedProceeds)}
                    </span>
                    . Anything beyond compounds at the 10% stock baseline.
                  </>
                ) : (
                  "Enter the balance you'd retire with the sale proceeds."
                )
              }
            >
              <CurrencyInput
                value={data.debtPayoff}
                onChange={(v) =>
                  onChange({
                    debtPayoff: Math.min(v, Math.round(estimatedProceeds)),
                  })
                }
                placeholder={Math.round(estimatedProceeds).toLocaleString()}
              />
              {estimatedProceeds > 0 && (
                <RangeSlider
                  value={Math.min(data.debtPayoff, estimatedProceeds)}
                  min={0}
                  max={Math.max(1000, Math.round(estimatedProceeds))}
                  step={500}
                  onChange={(v) => onChange({ debtPayoff: v })}
                  leftLabel="$0"
                  rightLabel={formatCurrency(estimatedProceeds)}
                />
              )}
              {data.debtPayoff > 0 && estimatedProceeds > 0 && (
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
                  Surplus reinvested at 10% ·{" "}
                  <span className="text-foreground tabular-nums">
                    {formatCurrency(
                      Math.max(0, estimatedProceeds - data.debtPayoff),
                    )}
                  </span>
                </p>
              )}
              <ContinueButton
                onClick={onContinue}
                disabled={data.debtPayoff < 0}
                label="See My Wealth Map"
              />
            </SlideShell>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function needsReturn(choice: AltChoice | null): boolean {
  return (
    choice === "stocks" || choice === "syndication" || choice === "other"
  );
}

interface CurrencyInputProps {
  value: number;
  onChange: (v: number) => void;
  placeholder: string;
  suffix?: string;
}

function CurrencyInput({
  value,
  onChange,
  placeholder,
  suffix,
}: CurrencyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-2xl font-semibold text-muted">
        $
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1000}
        value={value || ""}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        placeholder={placeholder}
        className={`${bigInputClass} pl-12 ${suffix ? "pr-16" : ""}`}
        autoFocus
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-sm font-medium text-muted">
          {suffix}
        </span>
      )}
    </div>
  );
}

function PercentInput({
  value,
  onChange,
  placeholder = "10.0",
  step = 0.5,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  step?: number;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="decimal"
        min={0}
        max={50}
        step={step}
        value={value > 0 ? Number((value * 100).toFixed(3)) : ""}
        onChange={(e) =>
          onChange(Math.max(0, Number(e.target.value) || 0) / 100)
        }
        placeholder={placeholder}
        className={`${bigInputClass} pr-14`}
        autoFocus
      />
      <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-xl font-semibold text-muted">
        %
      </span>
    </div>
  );
}

function SmallNumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="mt-5 flex items-center justify-between gap-4 rounded-xl border-2 border-border bg-surface px-4 py-3 text-left">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value || ""}
        onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value) || 0)))}
        className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-right text-lg font-semibold tabular-nums text-foreground outline-none focus:border-accent"
      />
    </label>
  );
}

interface RangeSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}

function RangeSlider({
  value,
  min,
  max,
  step,
  onChange,
  leftLabel,
  rightLabel,
}: RangeSliderProps) {
  return (
    <div className="mt-6">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(Math.max(value, min), max)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label="Adjust value"
      />
      <div className="mt-2 flex justify-between text-[11px] font-medium uppercase tracking-wide text-muted">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

interface ContinueButtonProps {
  onClick: () => void;
  disabled: boolean;
  label: string;
}

function ContinueButton({ onClick, disabled, label }: ContinueButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-brand/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-sm"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
