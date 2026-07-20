"use client"

import { FilterMailIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useState } from "react"

import { DesktopInspectorOptionGridScrollArea } from "@/features/desktop-shell/components/DesktopInspectorShell"
import {
  DESKTOP_INSPECTOR_CAPTION_CLASS,
  DESKTOP_INSPECTOR_CONTROL_CLASS,
  DESKTOP_INSPECTOR_FG_TERTIARY,
  DESKTOP_INSPECTOR_LABEL_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
  DESKTOP_INSPECTOR_ROW_CLASS,
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
  DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
  DESKTOP_INSPECTOR_SELECTED_CLASS,
  DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
  DesktopInspectorAnimatedOptionGrid,
  DesktopInspectorMorphFilterMenu,
  DesktopInspectorScrubbableNumberInput,
  DesktopInspectorSearchInput,
  DesktopInspectorSection,
  desktopInspectorOptionGridItemClass,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  DRAFTING_CARD_SIZE_MAX,
  DRAFTING_CARD_SIZE_MIN,
  type DraftingCardSizeMode,
} from "@/features/workspace/model/card-state"
import {
  SIZE_TEMPLATE_GROUP_LABELS,
  SIZE_TEMPLATES,
  formatAspectRatio,
  getSizeTemplatesByGroup,
  type SizeTemplate,
  type SizeTemplateGroup,
} from "@/features/workspace/model/size-templates"
import { cn } from "@/lib/utils"

type SizeTemplateFilterId = "all" | SizeTemplateGroup

const SIZE_TEMPLATE_FILTER_OPTIONS: Array<{ id: SizeTemplateFilterId; label: string }> = [
  { id: "all", label: "All" },
  ...(["ratio", "web", "print", "qr-physical"] as const).map((group) => ({
    id: group,
    label: SIZE_TEMPLATE_GROUP_LABELS[group],
  })),
]

export type DesktopCardSizeSettings = {
  cardHeight: number
  cardWidth: number
  lockAspectRatio: boolean
  sizeMode: DraftingCardSizeMode
  sizePresetId?: string
}

type DesktopSizeTemplateInspectorProps = {
  onChange: (patch: Partial<DesktopCardSizeSettings>) => void
  onSelectTemplate: (template: SizeTemplate) => void
  settings: DesktopCardSizeSettings
}

export function DesktopSizeTemplateInspector({
  onChange,
  onSelectTemplate,
  settings,
}: DesktopSizeTemplateInspectorProps) {
  const aspectRatioLabel = formatAspectRatio(settings.cardWidth, settings.cardHeight)
  const [groupId, setGroupId] = useState<SizeTemplateFilterId>("all")
  const [query, setQuery] = useState("")
  const sizeFilterOptions = useMemo(
    () =>
      SIZE_TEMPLATE_FILTER_OPTIONS.map((option) => ({
        label: option.label,
        value: option.id,
      })),
    [],
  )
  const isGroupFilterActive = groupId !== "all"
  const visibleTemplates = useMemo(() => {
    const groupTemplates =
      groupId === "all" ? [...SIZE_TEMPLATES] : getSizeTemplatesByGroup(groupId)
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return groupTemplates
    }

    return groupTemplates.filter((template) =>
      `${template.label} ${template.ratioLabel} ${template.width} ${template.height}`
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [groupId, query])

  function updateWidth(nextWidth: number) {
    if (settings.lockAspectRatio && settings.cardHeight > 0) {
      const ratio = settings.cardWidth / settings.cardHeight
      onChange({
        cardWidth: nextWidth,
        cardHeight: Math.round(nextWidth / ratio),
        sizeMode: "fixed",
        sizePresetId: undefined,
      })
      return
    }

    onChange({
      cardWidth: nextWidth,
      sizeMode: "fixed",
      sizePresetId: undefined,
    })
  }

  function updateHeight(nextHeight: number) {
    if (settings.lockAspectRatio && settings.cardWidth > 0) {
      const ratio = settings.cardWidth / settings.cardHeight
      onChange({
        cardHeight: nextHeight,
        cardWidth: Math.round(nextHeight * ratio),
        sizeMode: "fixed",
        sizePresetId: undefined,
      })
      return
    }

    onChange({
      cardHeight: nextHeight,
      sizeMode: "fixed",
      sizePresetId: undefined,
    })
  }

  return (
    <>
      <DesktopInspectorSection
        className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}
        data-slot="desktop-card-size"
      >
        <div className="flex items-center justify-between gap-2">
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Size</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[0.68rem] font-medium tabular-nums",
              DESKTOP_INSPECTOR_FG_TERTIARY,
              DESKTOP_INSPECTOR_CONTROL_CLASS,
            )}
          >
            {aspectRatioLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <DesktopSizeDimensionField
            ariaLabel="Card width"
            label="W"
            value={settings.cardWidth}
            onValueChange={updateWidth}
          />
          <DesktopSizeDimensionField
            ariaLabel="Card height"
            label="H"
            value={settings.cardHeight}
            onValueChange={updateHeight}
          />
        </div>

        <button
          aria-pressed={settings.lockAspectRatio}
          className={cn(
            "h-8 w-full rounded-[7px] px-2.5 text-left text-xs font-medium transition",
            DESKTOP_INSPECTOR_CONTROL_CLASS,
            settings.lockAspectRatio && DESKTOP_INSPECTOR_SELECTED_CLASS,
          )}
          type="button"
          onClick={() => onChange({ lockAspectRatio: !settings.lockAspectRatio })}
        >
          Lock aspect ratio
        </button>
      </DesktopInspectorSection>

      <DesktopInspectorSection dataSlot="desktop-size-template-section">
        <div
          className="flex min-w-0 items-center gap-2"
          data-slot="desktop-size-filter-search-row"
        >
          <DesktopInspectorSearchInput
            aria-label="Search size presets"
            className="h-8 min-w-0 w-full flex-1"
            iconClassName="left-3"
            inputClassName="rounded-full pl-8 pr-3"
            placeholder="Search"
            value={query}
            onValueChange={setQuery}
          />
          <DesktopInspectorMorphFilterMenu
            ariaLabel="Filter size presets"
            data-slot="desktop-size-template-morph"
            icon={
              <HugeiconsIcon
                icon={FilterMailIcon}
                size={16}
                color="currentColor"
                strokeWidth={1.8}
              />
            }
            isActive={isGroupFilterActive}
            menuDataSlot="desktop-inspector-filter-menu desktop-size-template-filter-menu"
            morphClassName="desktop-inspector-morph-filter--compact"
            options={sizeFilterOptions}
            triggerDataSlot="desktop-inspector-filter-trigger desktop-size-template-filter-trigger"
            value={groupId}
            onValueChange={setGroupId}
          />
        </div>

        <DesktopInspectorOptionGridScrollArea
          ariaLabel="Size presets"
          className="mt-3"
          columns={3}
          dataSlot="desktop-size-template-scroll-area"
          shelfDataSlot="desktop-size-template-collection"
          variant="content"
        >
          <DesktopInspectorAnimatedOptionGrid
            columns={3}
            data-slot="desktop-size-template-collection"
            selectedKey={settings.sizePresetId}
          >
            {visibleTemplates.map((template) => (
              <DesktopSizeTemplateCard
                key={template.id}
                selected={settings.sizePresetId === template.id}
                template={template}
                onClick={() => onSelectTemplate(template)}
              />
            ))}
            {visibleTemplates.length === 0 ? (
              <p className={cn("col-span-3 px-1 py-3 text-center", DESKTOP_INSPECTOR_CAPTION_CLASS)}>
                No size presets found
              </p>
            ) : null}
          </DesktopInspectorAnimatedOptionGrid>
        </DesktopInspectorOptionGridScrollArea>
      </DesktopInspectorSection>
    </>
  )
}

function DesktopSizeDimensionField({
  ariaLabel,
  label,
  onValueChange,
  value,
}: {
  ariaLabel: string
  label: string
  onValueChange: (value: number) => void
  value: number
}) {
  return (
    <div className={DESKTOP_INSPECTOR_ROW_CLASS} role="group">
      <span className={DESKTOP_INSPECTOR_LABEL_CLASS}>{label}</span>
      <DesktopInspectorScrubbableNumberInput
        aria-label={ariaLabel}
        className="h-8 w-full rounded-[7px] px-2"
        max={DRAFTING_CARD_SIZE_MAX}
        min={DRAFTING_CARD_SIZE_MIN}
        step={1}
        value={value}
        onValueChange={onValueChange}
      />
    </div>
  )
}

function DesktopSizeTemplateCard({
  onClick,
  selected,
  template,
}: {
  onClick: () => void
  selected: boolean
  template: SizeTemplate
}) {
  const label = template.group === "ratio" ? template.ratioLabel : template.label

  return (
    <button
      aria-label={`Use ${template.label} size ${template.width} by ${template.height}`}
      aria-pressed={selected}
      data-desktop-animated-option-selection="true"
      data-desktop-option-tile="true"
      className={cn(
        "group relative mx-auto flex aspect-square size-[3.375rem] min-w-0 flex-col items-center justify-center gap-1 p-1.5 text-center transition",
        desktopInspectorOptionGridItemClass("tight"),
        DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        className="relative z-10 block rounded-[4px] border border-white/14 bg-white/10"
        style={{
          aspectRatio: `${template.width} / ${template.height}`,
          width: template.width >= template.height ? "1.35rem" : "0.95rem",
        }}
      />
      <span
        className={cn(
          "relative z-10 max-w-full truncate leading-none",
          DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
        )}
      >
        {label}
      </span>
    </button>
  )
}
