import type { ReactNode } from "react";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  label: string;
  children: ReactNode;
}

/** Small info icon that reveals an explanatory bubble on hover or focus. */
export default function InfoTooltip({ label, children }: InfoTooltipProps) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted/70 transition-colors hover:text-accent focus:text-accent focus:outline-none"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-border bg-foreground px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}
