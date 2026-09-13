export function toggle(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

// A row of toggle-able pill buttons. All options start selected; clicking
// one adds/removes it. Deselecting everything in a group is treated by
// callers as "match nothing" (not "match everything").
export default function FilterChips({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs uppercase tracking-wide text-[#ffb3d9]">{label}</span>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-[#ffb3d9] underline hover:text-[#ff006e]"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              aria-pressed={isSelected}
              className={
                isSelected
                  ? "px-3 py-1.5 rounded-full border border-[#ff006e] bg-[#ff006e] text-[#0a0a0a] text-sm font-semibold"
                  : "px-3 py-1.5 rounded-full border border-[#ff006e] bg-transparent text-[#ffb3d9] text-sm hover:bg-[#ff006e]/10"
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
