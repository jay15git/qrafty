"use client"

import { FilterMailIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useState } from "react"

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
  DesktopInspectorMorphFilterMenu,
  DesktopInspectorScrubbableNumberInput,
  DesktopInspectorSearchInput,
  DesktopInspectorSection,
} from "@/features/desktop-shell/components/InspectorControls"
import { findBrandIconById } from "@/features/qr-code/assets/brand-icons"
import { getContentTypeIcon } from "@/features/qr-code/content/content-type-icons"
import type { QrInputType } from "@/features/qr-code/content/input-options"
import {
  DRAFTING_CARD_SIZE_MAX,
  DRAFTING_CARD_SIZE_MIN,
  type DraftingCardSizeMode,
} from "@/features/workspace/model/card-state"
import {
  SIZE_TEMPLATE_GROUPS,
  SIZE_TEMPLATE_GROUP_LABELS,
  formatAspectRatio,
  getSizeTemplateSections,
  type SizeTemplate,
  type SizeTemplateGroup,
} from "@/features/workspace/model/size-templates"
import { cn } from "@/lib/utils"

type SizeTemplateFilterId = "all" | SizeTemplateGroup

const SIZE_TEMPLATE_FILTER_OPTIONS: Array<{ id: SizeTemplateFilterId; label: string }> = [
  { id: "all", label: "All" },
  ...SIZE_TEMPLATE_GROUPS.map((group) => ({
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
  const visibleSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return getSizeTemplateSections()
      .filter((section) => groupId === "all" || section.group === groupId)
      .map((section) => ({
        ...section,
        templates: section.templates.filter((template) => {
          if (!normalizedQuery) {
            return true
          }

          const haystack = [
            section.label,
            template.label,
            template.ratioLabel,
            template.subtitle,
            `${template.width}`,
            `${template.height}`,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()

          return haystack.includes(normalizedQuery)
        }),
      }))
      .filter((section) => section.templates.length > 0)
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

        <div
          className="mt-3 flex flex-col gap-4"
          data-slot="desktop-size-template-collection"
        >
          {visibleSections.map((section) => (
            <DesktopSizeTemplatePlatformSection
              key={section.group}
              group={section.group}
              label={section.label}
              selectedPresetId={settings.sizePresetId}
              templates={section.templates}
              onSelectTemplate={onSelectTemplate}
            />
          ))}
          {visibleSections.length === 0 ? (
            <p className={cn("px-1 py-3 text-center", DESKTOP_INSPECTOR_CAPTION_CLASS)}>
              No size presets found
            </p>
          ) : null}
        </div>
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

function DesktopSizeTemplatePlatformSection({
  group,
  label,
  onSelectTemplate,
  selectedPresetId,
  templates,
}: {
  group: SizeTemplateGroup
  label: string
  onSelectTemplate: (template: SizeTemplate) => void
  selectedPresetId?: string
  templates: SizeTemplate[]
}) {
  const PlatformIcon = resolveSizeTemplatePlatformIcon(group)

  return (
    <section
      className="border-t border-white/8 pt-4 first:border-t-0 first:pt-0"
      data-slot={`desktop-size-template-section-${group}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <PlatformIcon className="size-4 shrink-0 opacity-90" />
        <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>{label}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {templates.map((template) => (
          <DesktopSizeTemplateCard
            key={template.id}
            platformIcon={resolveSizeTemplatePlatformIcon(template.brandIconId ?? group)}
            selected={selectedPresetId === template.id}
            template={template}
            onClick={() => onSelectTemplate(template)}
          />
        ))}
      </div>
    </section>
  )
}

function DesktopSizeTemplateCard({
  onClick,
  platformIcon: PlatformIcon,
  selected,
  template,
}: {
  onClick: () => void
  platformIcon: (props: { className?: string }) => React.ReactNode
  selected: boolean
  template: SizeTemplate
}) {
  const isLandscape = template.width >= template.height
  const previewWidth = isLandscape ? "3.25rem" : "2.1rem"

  return (
    <button
      aria-label={`Use ${template.label} size ${template.width} by ${template.height}`}
      aria-pressed={selected}
      data-desktop-animated-option-selection="true"
      data-desktop-option-tile="true"
      className={cn(
        "group flex w-[4.75rem] min-w-0 flex-col items-center gap-1.5 text-center transition",
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        className={cn(
          "relative flex h-[4.25rem] w-full items-center justify-center rounded-[10px] border border-white/10 bg-white/6 transition",
          DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
          selected && DESKTOP_INSPECTOR_SELECTED_CLASS,
        )}
      >
        <span
          aria-hidden="true"
          className="relative flex items-center justify-center rounded-[6px] border border-white/14 bg-white/10"
          style={{
            aspectRatio: `${template.width} / ${template.height}`,
            width: previewWidth,
          }}
        >
          <PlatformIcon className="size-3 opacity-70" />
        </span>
      </span>
      <span className="flex w-full flex-col items-center gap-0.5">
        <span
          className={cn(
            "max-w-full truncate leading-none",
            DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
          )}
        >
          {template.label}
        </span>
        <span className={cn("max-w-full truncate text-[0.62rem] leading-none", DESKTOP_INSPECTOR_CAPTION_CLASS)}>
          {template.subtitle ?? template.ratioLabel}
        </span>
      </span>
    </button>
  )
}

function resolveSizeTemplatePlatformIcon(
  iconId: string,
): (props: { className?: string }) => React.ReactNode {
  const brandIcon = findBrandIconById(iconId)
  if (brandIcon) {
    const BrandIcon = brandIcon.icon
    return function BrandPlatformIcon({ className }: { className?: string }) {
      return <BrandIcon aria-hidden className={className} />
    }
  }

  const contentIcon = getContentTypeIcon(iconId as QrInputType)
  if (contentIcon.kind === "brand") {
    const BrandIcon = contentIcon.icon
    return function ContentBrandPlatformIcon({ className }: { className?: string }) {
      return <BrandIcon aria-hidden className={className} />
    }
  }

  const HugeIcon = contentIcon.icon
  return function ContentHugePlatformIcon({ className }: { className?: string }) {
    return (
      <HugeiconsIcon
        aria-hidden
        className={className}
        color="currentColor"
        icon={HugeIcon}
        size={16}
        strokeWidth={1.75}
      />
    )
  }
}
