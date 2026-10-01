
interface ChoiceCardProps<T extends string | number> {
  value: T;
  label: string;
  caption?: string;
  isSelected: boolean;
  onSelect: (value: T) => void;
}

export default function ChoiceCard<T extends string | number>({
  value,
  label,
  caption,
  isSelected,
  onSelect,
}: ChoiceCardProps<T>) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={isSelected}
      className={`group flex h-full min-h-[88px] flex-col items-center justify-center rounded-2xl border-2 px-4 py-5 text-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
        isSelected
          ? "border-brand bg-brand/5 text-brand shadow-sm"
          : "border-border bg-surface text-foreground hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-sm"
      }`}
    >
      <span className="text-xl font-bold tabular-nums">{label}</span>
      {caption && (
        <span
          className={`mt-1 text-[11px] font-medium uppercase tracking-wide ${
            isSelected ? "text-brand/80" : "text-muted"
          }`}
        >
          {caption}
        </span>
      )}
    </button>
  );
}
