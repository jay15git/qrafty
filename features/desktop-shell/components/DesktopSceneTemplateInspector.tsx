"use client"

import { useMemo, useState } from "react"

import { DesktopSizeTemplateInspector } from "@/features/desktop-shell/components/DesktopSizeTemplateInspector"
import {
  DesktopInspectorHeader,
  DesktopInspectorScrollArea,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import {
  DESKTOP_INSPECTOR_FG_PRIMARY,
  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
  DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
  DESKTOP_INSPECTOR_SELECTED_CLASS,
  DesktopInspectorAnimatedOptionGrid,
  DesktopInspectorSearchInput,
  DesktopInspectorSection,
  DesktopInspectorSegmentedControl,
  desktopInspectorOptionGridItemClass,
} from "@/features/desktop-shell/components/InspectorControls"
import type { DesktopCardSizeSettings } from "@/features/desktop-shell/components/DesktopSizeTemplateInspector"
import type { MockupStylePreset } from "@/features/workspace/model/scene-templates"
import {
  MOCKUP_STYLE_PRESETS,
  SCENE_TEMPLATE_CATEGORIES,
  SCENE_TEMPLATE_CATEGORY_LABELS,
  SCENE_TEMPLATES,
  type SceneTemplate,
  type SceneTemplateCategory,
} from "@/features/workspace/model/scene-templates"
import type { SizeTemplate } from "@/features/workspace/model/size-templates"
import { cn } from "@/lib/utils"

type SceneTemplateTab = "mockup" | "frame"

export type DesktopSceneTemplateSettings = {
  selectedTemplateId?: string
  sizeSettings: DesktopCardSizeSettings
}

type DesktopSceneTemplateInspectorProps = {
  onApplyMockupStyle: (preset: MockupStylePreset) => void
  onSelectTemplate: (template: SceneTemplate) => void
  onSizeSettingsChange: (patch: Partial<DesktopCardSizeSettings>) => void
  onSelectSizeTemplate: (template: SizeTemplate) => void
  settings: DesktopSceneTemplateSettings
}

export function DesktopSceneTemplateInspector({
  onApplyMockupStyle,
  onSelectTemplate,
  onSizeSettingsChange,
  onSelectSizeTemplate,
  settings,
}: DesktopSceneTemplateInspectorProps) {
  const [activeTab, setActiveTab] = useState<SceneTemplateTab>("mockup")
  const [query, setQuery] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Record<SceneTemplateCategory, boolean>>({
    solid: true,
    gradient: true,
    glass: true,
    texture: false,
    cosmic: false,
    minimal: false,
    bold: false,
  })

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return SCENE_TEMPLATES
    return SCENE_TEMPLATES.filter((template) =>
      `${template.title} ${template.category}`.toLowerCase().includes(normalizedQuery),
    )
  }, [query])

  const templatesByCategory = useMemo(() => {
    return SCENE_TEMPLATE_CATEGORIES.map((category) => ({
      category,
      templates: filteredTemplates.filter((template) => template.category === category),
    })).filter((group) => group.templates.length > 0)
  }, [filteredTemplates])

  function toggleCategory(category: SceneTemplateCategory) {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }))
  }

  return (
    <div data-slot="desktop-scene-template-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Templates" />
      <DesktopInspectorScrollArea>
        <DesktopInspectorSection className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
          <DesktopInspectorSegmentedControl
            ariaLabelPrefix="Template"
            items={[
              { label: "Mockup", value: "mockup" },
              { label: "Frame", value: "frame" },
            ]}
            onValueChange={setActiveTab}
            value={activeTab}
          />
        </DesktopInspectorSection>

        {activeTab === "frame" ? (
          <DesktopSizeTemplateInspector
            onChange={onSizeSettingsChange}
            onSelectTemplate={onSelectSizeTemplate}
            settings={settings.sizeSettings}
          />
        ) : (
          <>
            <DesktopInspectorSection>
              <DesktopInspectorSearchInput
                onValueChange={setQuery}
                placeholder="Search templates"
                value={query}
              />
            </DesktopInspectorSection>

            {templatesByCategory.map(({ category, templates }) => (
              <DesktopInspectorSection key={category}>
                <button
                  type="button"
                  className={cn(
                    "mb-2 flex w-full items-center justify-between text-left",
                    DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
                  )}
                  onClick={() => toggleCategory(category)}
                >
                  <span>{SCENE_TEMPLATE_CATEGORY_LABELS[category]}</span>
                  <span className="text-xs opacity-60">{expandedCategories[category] ? "−" : "+"}</span>
                </button>
                {expandedCategories[category] ? (
                  <DesktopInspectorAnimatedOptionGrid
                    columns={3}
                    selectedKey={settings.selectedTemplateId}
                  >
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        aria-label={template.title}
                        className={cn(
                          desktopInspectorOptionGridItemClass,
                          DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
                          settings.selectedTemplateId === template.id && DESKTOP_INSPECTOR_SELECTED_CLASS,
                        )}
                        onClick={() => onSelectTemplate(template)}
                      >
                        <span
                          className={cn(
                            "relative block aspect-[4/3] w-full overflow-hidden rounded-md",
                            DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt=""
                            className="size-full object-cover"
                            src={template.thumbnailUrl}
                          />
                        </span>
                        <span className={cn("mt-1.5 truncate text-xs font-medium", DESKTOP_INSPECTOR_FG_PRIMARY)}>
                          {template.title}
                        </span>
                      </button>
                    ))}
                  </DesktopInspectorAnimatedOptionGrid>
                ) : null}
              </DesktopInspectorSection>
            ))}

            <DesktopInspectorSection>
              <p className={cn("mb-2", DESKTOP_INSPECTOR_SECTION_HEADING_CLASS)}>Mockup style</p>
              <DesktopInspectorAnimatedOptionGrid columns={3} selectedKey={undefined}>
                {MOCKUP_STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    aria-label={preset.label}
                    className={cn(
                      desktopInspectorOptionGridItemClass,
                      DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
                    )}
                    onClick={() => onApplyMockupStyle(preset)}
                  >
                    <span
                      className={cn(
                        "grid aspect-[4/3] w-full place-items-center rounded-md text-xs font-medium",
                        DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
                      )}
                    >
                      {preset.label}
                    </span>
                  </button>
                ))}
              </DesktopInspectorAnimatedOptionGrid>
            </DesktopInspectorSection>
          </>
        )}
      </DesktopInspectorScrollArea>
    </div>
  )
}
