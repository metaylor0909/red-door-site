import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ChoiceCard from "../calculator-ui/ChoiceCard";
import SlideShell from "../calculator-ui/SlideShell";
import type { SubProgress } from "../calculator-ui/StepProgress";
import type { PropertyInputs } from "./Wizard";

type SubStep = 1 | 2 | 3 | 4;
const TOTAL = 4;
const BEDROOMS = [1, 2, 3, 4, 5] as const;
const BATHROOMS = [1, 1.5, 2, 2.5, 3] as const;
const AUTO_ADVANCE_MS = 220;

const bigInputClass =
  "w-full rounded-xl border-2 border-border bg-surface px-4 py-4 text-center text-2xl font-semibold tabular-nums text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent";

interface PropertyStepProps {
  data: PropertyInputs;
  onChange: (patch: Partial<PropertyInputs>) => void;
  onContinue: () => void;
  onSubProgress: (progress: SubProgress | null) => void;
}

export default function PropertyStep({ data, onChange, onContinue, onSubProgress }: PropertyStepProps) {
  const [subStep, setSubStep] = useState<SubStep>(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onSubProgress({ current: subStep, total: TOTAL });
  }, [subStep, onSubProgress]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const goTo = useCallback((next: SubStep) => {
    if (timer.current) clearTimeout(timer.current);
    setSubStep(next);
  }, []);

  const advanceSoon = useCallback((next: SubStep) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSubStep(next), AUTO_ADVANCE_MS);
  }, []);

  const eyebrow = `Step ${subStep} of ${TOTAL}`;

  return (
    <section className="rounded-3xl border border-border bg-surface px-6 py-12 shadow-sm sm:px-10 sm:py-16">
      <div className="relative">
        <div className="absolute -top-4 left-0">
          {subStep > 1 && (
            <button
              type="button"
              onClick={() => goTo((subStep - 1) as SubStep)}
              aria-label="Back to previous question"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {subStep === 1 && (
            <SlideShell
              key="zip"
              motionKey="zip"
              eyebrow={eyebrow}
              title="What ZIP code is the rental in?"
              subtitle="We compare it with homes rented in your area over the last 12 months."
            >
              <input
                type="text"
                inputMode="numeric"
                value={data.zip}
                onChange={(e) => {
                  const zip = e.target.value.replace(/[^0-9]/g, "").slice(0, 5);
                  onChange({ zip });
                  if (zip.length === 5) advanceSoon(2);
                }}
                placeholder="46220"
                className={`${bigInputClass} tracking-[0.4em]`}
                autoComplete="postal-code"
                autoFocus
              />
              <ContinueButton onClick={() => goTo(2)} disabled={data.zip.length !== 5} label="Continue" />
            </SlideShell>
          )}

          {subStep === 2 && (
            <SlideShell key="beds" motionKey="beds" eyebrow={eyebrow} title="How many bedrooms?">
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {BEDROOMS.map((n) => (
                  <ChoiceCard
                    key={n}
                    value={n}
                    label={n >= 5 ? "5+" : String(n)}
                    isSelected={data.bedrooms === n}
                    onSelect={(value) => {
                      onChange({ bedrooms: value });
                      advanceSoon(3);
                    }}
                  />
                ))}
              </div>
            </SlideShell>
          )}

          {subStep === 3 && (
            <SlideShell
              key="baths"
              motionKey="baths"
              eyebrow={eyebrow}
              title="How many bathrooms?"
              subtitle="Comparable rentals are matched within a half-bath."
            >
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {BATHROOMS.map((n) => (
                  <ChoiceCard
                    key={n}
                    value={n}
                    label={n >= 3 ? "3+" : String(n)}
                    isSelected={data.bathrooms === n}
                    onSelect={(value) => {
                      onChange({ bathrooms: value });
                      advanceSoon(4);
                    }}
                  />
                ))}
              </div>
            </SlideShell>
          )}

          {subStep === 4 && (
            <SlideShell
              key="rent"
              motionKey="rent"
              eyebrow={eyebrow}
              title="What's your current asking rent?"
              subtitle="The monthly rent the home is listed at today."
            >
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-xl font-semibold text-muted">
                  $
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={100}
                  step={25}
                  value={data.askingRent || ""}
                  onChange={(e) => onChange({ askingRent: Math.max(0, Number(e.target.value) || 0) })}
                  placeholder="1800"
                  className={`${bigInputClass} pl-10`}
                  autoFocus
                />
                <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-sm font-medium text-muted">
                  /mo
                </span>
              </div>
              <ContinueButton onClick={onContinue} disabled={data.askingRent < 100} label="See My Market" />
            </SlideShell>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ContinueButton({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
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
