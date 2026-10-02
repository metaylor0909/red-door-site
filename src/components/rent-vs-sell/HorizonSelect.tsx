interface HorizonSelectProps {
  value: number;
  options: readonly number[];
  onChange: (year: number) => void;
}

export default function HorizonSelect({ value, options, onChange }: HorizonSelectProps) {
  return (
    <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-foreground">
      <span className="text-muted">Show year</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground outline-none focus-visible:border-accent"
      >
        {options.map((y) => (
          <option key={y} value={y}>
            {y} years
          </option>
        ))}
      </select>
    </label>
  );
}
