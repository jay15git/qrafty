import { useId } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { IconComponent, IconComponentProps } from "@/lib/icon-context";
import { ContentTypeGridIcon } from "@/features/qr/content/ContentTypeGridIcon";
import {
  normalizeContentTypeForPicker,
  PICKER_QR_INPUT_TYPES,
  QR_INPUT_OPTIONS,
  type QrInputType,
} from "@/features/qr/content/input-options";
import { useMobileInspectorDensity } from "@/features/shell/inspector/MobileInspectorDensityContext";
import { SegmentTabs } from "@/features/shell/inspector/SettingsSegmentTabs";
import { useInspectorTheme } from "@/features/shell/inspector/settings-ui/Shared";
import { inspectorPortalClass } from "@/features/shell/inspector/settings-ui/utils";
import { cn } from "@/lib/utils";

export function SettingsLabeledSelect({
  items,
  label,
  onChange,
  placeholder,
  value,
}: {
  items: readonly string[];
  label?: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const theme = useInspectorTheme();
  const mobileDensity = useMobileInspectorDensity();
  const mobilePersistKey = useId();

  if (mobileDensity) {
    return (
      <SegmentTabs
        items={[...items]}
        persistKey={mobilePersistKey}
        scrollable={items.length > 3}
        value={value}
        onChange={onChange}
      />
    );
  }

  return (
    <div
      className={cn(
        "ds-content-type-select w-full min-w-0",
        label && "ds-content-type-select--split",
      )}
    >
      {label ? (
        <span className="ds-row-label-text shrink-0 pl-[var(--row-px)]">{label}</span>
      ) : null}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="ds-content-type-select-trigger w-full min-w-0 ds-squircle-sm"
          placeholder={placeholder}
          variant="borderless"
        />
        <SelectContent
          className={cn(
            "ds-portal-surface ds-popover-content overflow-hidden p-0 ds-squircle-md",
            theme === "dark" && "dark",
          )}
          data-theme={theme}
        >
          {items.map((item, index) => (
            <SelectItem key={item} index={index} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function createContentTypeSelectIcon(type: QrInputType): IconComponent {
  function ContentTypeSelectIcon({ className }: IconComponentProps) {
    return <ContentTypeGridIcon className={cn("!size-4 shrink-0", className)} type={type} />;
  }

  ContentTypeSelectIcon.displayName = `ContentTypeSelectIcon_${type}`;
  return ContentTypeSelectIcon;
}

const CONTENT_TYPE_SELECT_ICONS = Object.fromEntries(
  PICKER_QR_INPUT_TYPES.map((type) => [type, createContentTypeSelectIcon(type)]),
) as Record<(typeof PICKER_QR_INPUT_TYPES)[number], IconComponent>;

const QR_COLOR_PART_OPTIONS = ["Module", "Eye", "Frame", "Logo"] as const;

export type QrColorPartOption = (typeof QR_COLOR_PART_OPTIONS)[number];

export function QrColorPartBrowser({
  onSelect,
  selected,
}: {
  onSelect: (part: QrColorPartOption) => void;
  selected: string;
}) {
  const normalizedSelected = QR_COLOR_PART_OPTIONS.includes(selected as QrColorPartOption)
    ? (selected as QrColorPartOption)
    : "Module";

  return (
    <SettingsLabeledSelect
      items={QR_COLOR_PART_OPTIONS}
      placeholder="Part"
      value={normalizedSelected}
      onChange={(next) => onSelect(next as QrColorPartOption)}
    />
  );
}

export function ContentTypeBrowser({
  onAfterSelect,
  selected,
  onSelect,
}: {
  onAfterSelect?: () => void;
  selected: QrInputType;
  onSelect: (type: QrInputType) => void;
}) {
  const mobileDensity = useMobileInspectorDensity();
  const theme = useInspectorTheme();
  const normalizedSelected = normalizeContentTypeForPicker(selected);
  const types = PICKER_QR_INPUT_TYPES.map((type) => QR_INPUT_OPTIONS[type]);

  if (!mobileDensity) {
    const selectedIcon = CONTENT_TYPE_SELECT_ICONS[normalizedSelected];

    return (
      <div className="ds-content-type-select w-full min-w-0">
        <Select
          value={normalizedSelected}
          onValueChange={(next) => {
            onSelect(next as QrInputType);
            onAfterSelect?.();
          }}
        >
          <SelectTrigger
            className="ds-content-type-select-trigger w-full min-w-0 ds-squircle-sm"
            icon={selectedIcon}
            placeholder="Content type"
            variant="borderless"
          />
          <SelectContent
            className={inspectorPortalClass(
              theme,
              "ds-portal-surface ds-popover-content overflow-hidden p-0 ds-squircle-md",
            )}
            data-theme={theme}
          >
            {types.map((option, index) => (
              <SelectItem
                key={option.value}
                icon={CONTENT_TYPE_SELECT_ICONS[option.value]}
                index={index}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <SegmentTabs
      persistKey="content-type"
      scrollable
      items={types.map((option) => ({
        id: option.value,
        label: option.label,
        icon: <ContentTypeGridIcon className="ds-content-type-segment-icon" type={option.value} />,
      }))}
      value={normalizedSelected}
      onChange={(next) => {
        onSelect(next as QrInputType);
        onAfterSelect?.();
      }}
    />
  );
}
