import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface WizardNavProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  rightSlot?: ReactNode;
}

export default function WizardNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  nextLoading,
  rightSlot,
}: WizardNavProps) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {rightSlot}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || nextLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-brand/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-sm"
          >
            {nextLoading ? "Loading…" : nextLabel}
            {!nextLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
