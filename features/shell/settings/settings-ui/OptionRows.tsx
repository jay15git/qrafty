import { CUELUME_TOGGLE } from "@/features/shell/audio/cuelume";
import { cn } from "@/lib/utils";

export function PresetList({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string;
  onSelect: (item: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <button
          key={item}
          className={cn(
            "ds-preset-item ds-control-surface w-full px-2.5 text-left ds-type-chip ds-squircle-xs",
            selected === item && "text-[var(--fg)]",
          )}
          type="button"
          aria-pressed={selected === item}
          {...CUELUME_TOGGLE}
          onClick={() => onSelect(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
