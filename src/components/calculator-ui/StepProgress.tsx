import { Check } from "lucide-react";

export interface WizardStep {
  number: 1 | 2 | 3 | 4;
  label: string;
}

export interface SubProgress {
  current: number;
  total: number;
}

interface StepProgressProps {
  steps: WizardStep[];
  current: 1 | 2 | 3 | 4;
  /** Partial-fill state for the currently-active step (e.g. 3/6 sub-slides). */
  subProgress?: SubProgress | null;
}

function pillFillPercent(
  step: WizardStep,
  current: number,
  subProgress: SubProgress | null | undefined,
): number {
  if (step.number < current) return 100;
  if (step.number > current) return 0;
  if (subProgress && subProgress.total > 0) {
    return Math.min(
      100,
      Math.max(0, (subProgress.current / subProgress.total) * 100),
    );
  }
  return 100;
}

export default function StepProgress({
  steps,
  current,
  subProgress,
}: StepProgressProps) {
  return (
    <nav aria-label="Wizard progress" className="w-full">
      <ol className="flex items-start gap-2 sm:gap-3">
        {steps.map((step) => {
          const isDone = step.number < current;
          const isActive = step.number === current;
          const fill = pillFillPercent(step, current, subProgress);
          return (
            <li key={step.number} className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                    isDone
                      ? "bg-accent text-white"
                      : isActive
                        ? "bg-brand text-white"
                        : "bg-surface-muted text-muted"
                  }`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isDone ? <Check className="h-3 w-3" /> : step.number}
                </span>
                <span
                  className={`hidden text-sm font-medium transition-colors sm:inline ${
                    isActive ? "text-foreground" : "text-muted"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ease-out ${
                    isDone ? "bg-accent" : isActive ? "bg-brand" : "bg-transparent"
                  }`}
                  style={{ width: `${fill}%` }}
                />
              </div>
              <p
                className={`mt-1.5 text-[11px] font-medium sm:hidden ${
                  isActive ? "text-foreground" : "text-muted"
                }`}
              >
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
