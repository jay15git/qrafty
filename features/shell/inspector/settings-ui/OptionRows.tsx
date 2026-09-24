import { ScrollArea } from "@/components/ui/scroll-area";
import { CUELUME_TOGGLE } from "@/features/shell/audio/cuelume";
import { OPTION_TILE_SCROLL_ROW } from "@/features/shell/inspector/settings-ui/Shared";
import { cn } from "@/lib/utils";

export function OptionScrollRow({
  fill = false,
  items,
  onSelect,
  persistKey,
  selected,
}: {
  fill?: boolean;
  items: string[];
  onSelect?: (item: string) => void;
  persistKey?: string;
  selected: string;
}) {
  const tiles = items.map((item) => {
    const isSelected = selected === item;

    return (
      <button
        key={item}
        aria-pressed={isSelected}
        className={cn(
          "ds-option-scroll-tile ds-option-tile ds-control-surface shrink-0 px-3 ds-type-chip ds-squircle-xs",
          isSelected && "text-[var(--fg)]",
        )}
        type="button"
        {...CUELUME_TOGGLE}
        onClick={() => onSelect?.(item)}
      >
        {item}
      </button>
    );
  });

  if (fill) {
    return <div className="ds-option-scroll-row ds-option-scroll-row--fill">{tiles}</div>;
  }

  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      persistKey={persistKey}
      scrollFade
      showScrollbar={false}
      viewportClassName="min-w-0"
    >
      <div className={OPTION_TILE_SCROLL_ROW}>{tiles}</div>
    </ScrollArea>
  );
}

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
