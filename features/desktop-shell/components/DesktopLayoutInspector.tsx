"use client"

import { useState } from "react"

import {
  DesktopInspectorHeader,
  DesktopInspectorOptionGridScrollArea,
  DesktopInspectorScrollArea,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import {
  DESKTOP_INSPECTOR_CONTROL_CLASS,
  DESKTOP_INSPECTOR_LABEL_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
  DESKTOP_INSPECTOR_ROW_CLASS,
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
  DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
  DESKTOP_INSPECTOR_SELECTED_CLASS,
  DesktopInspectorAnimatedOptionGrid,
  DesktopInspectorScrubbableNumberInput,
  DesktopInspectorSection,
  DesktopInspectorSegmentedControl,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  DesktopSizeTemplateInspector,
  type DesktopCardSizeSettings,
} from "@/features/desktop-shell/components/DesktopSizeTemplateInspector"
import {
  SCENE_LAYOUT_PRESETS,
  type SceneLayoutPreset,
} from "@/features/workspace/model/scene-templates"
import type { SizeTemplate } from "@/features/workspace/model/size-templates"
import { cn } from "@/lib/utils"

type LayoutControlTab = "zoom" | "tilt"

export type DesktopLayoutSettings = {
  layout: SceneLayoutPreset
}

type DesktopLayoutInspectorProps = {
  onLayoutPresetSelect: (preset: SceneLayoutPreset) => void
  onLayoutChange: (patch: Partial<SceneLayoutPreset>) => void
  onSizeSettingsChange: (patch: Partial<DesktopCardSizeSettings>) => void
  onSelectSizeTemplate: (template: SizeTemplate) => void
  settings: DesktopLayoutSettings
  sizeSettings: DesktopCardSizeSettings
}

export function DesktopLayoutInspector({
  onLayoutPresetSelect,
  onLayoutChange,
  onSizeSettingsChange,
  onSelectSizeTemplate,
  settings,
  sizeSettings,
}: DesktopLayoutInspectorProps) {
  const [activeTab, setActiveTab] = useState<LayoutControlTab>("zoom")

  return (
    <div data-slot="desktop-layout-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Layout" />
      <DesktopInspectorScrollArea>
        <DesktopSizeTemplateInspector
          onChange={onSizeSettingsChange}
          onSelectTemplate={onSelectSizeTemplate}
          settings={sizeSettings}
        />

        <DesktopInspectorSection className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
          <p className={cn("mb-2", DESKTOP_INSPECTOR_SECTION_HEADING_CLASS)}>Presets</p>
          <DesktopInspectorOptionGridScrollArea
            ariaLabel="Scene layout presets"
            columns={3}
            dataSlot="desktop-layout-preset-shelf-scroll-area"
            shelfDataSlot="desktop-layout-preset-shelf"
            variant="preset"
          >
            <DesktopInspectorAnimatedOptionGrid
              columns={3}
              selectedKey={settings.layout.id}
            >
              {SCENE_LAYOUT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  aria-label={preset.label}
                  aria-pressed={settings.layout.id === preset.id}
                  data-desktop-animated-option-selection="true"
                  data-desktop-option-tile="true"
                  className={cn(
                    "group flex w-full min-w-0 flex-col items-center justify-center gap-1.5 p-2 transition",
                    DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
                    DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
                    settings.layout.id === preset.id && DESKTOP_INSPECTOR_SELECTED_CLASS,
                  )}
                  onClick={() => onLayoutPresetSelect(preset)}
                >
                  <span className="grid h-10 w-full place-items-center rounded-[6px] text-[10px] font-medium leading-tight">
                    {preset.label}
                  </span>
                </button>
              ))}
            </DesktopInspectorAnimatedOptionGrid>
          </DesktopInspectorOptionGridScrollArea>
        </DesktopInspectorSection>

        <DesktopInspectorSection>
          <DesktopInspectorSegmentedControl
            ariaLabelPrefix="Layout"
            items={[
              { label: "Zoom", value: "zoom" },
              { label: "Tilt", value: "tilt" },
            ]}
            onValueChange={setActiveTab}
            value={activeTab}
          />
        </DesktopInspectorSection>

        {activeTab === "zoom" ? (
          <DesktopInspectorSection>
            <div className={DESKTOP_INSPECTOR_ROW_CLASS}>
              <span className={DESKTOP_INSPECTOR_LABEL_CLASS}>Base zoom %</span>
              <DesktopInspectorScrubbableNumberInput
                className={DESKTOP_INSPECTOR_CONTROL_CLASS}
                max={150}
                min={50}
                onValueChange={(value) => onLayoutChange({ zoom: value / 100 })}
                value={Math.round(settings.layout.zoom * 100)}
              />
            </div>
          </DesktopInspectorSection>
        ) : (
          <DesktopInspectorSection className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
            <div className={DESKTOP_INSPECTOR_ROW_CLASS}>
              <span className={DESKTOP_INSPECTOR_LABEL_CLASS}>Tilt X</span>
              <DesktopInspectorScrubbableNumberInput
                className={DESKTOP_INSPECTOR_CONTROL_CLASS}
                max={45}
                min={-45}
                onValueChange={(value) => onLayoutChange({ tiltX: value })}
                value={settings.layout.tiltX}
              />
            </div>
            <div className={DESKTOP_INSPECTOR_ROW_CLASS}>
              <span className={DESKTOP_INSPECTOR_LABEL_CLASS}>Tilt Y</span>
              <DesktopInspectorScrubbableNumberInput
                className={DESKTOP_INSPECTOR_CONTROL_CLASS}
                max={45}
                min={-45}
                onValueChange={(value) => onLayoutChange({ tiltY: value })}
                value={settings.layout.tiltY}
              />
            </div>
          </DesktopInspectorSection>
        )}

        <DesktopInspectorSection>
          <div className={DESKTOP_INSPECTOR_ROW_CLASS}>
            <span className={DESKTOP_INSPECTOR_LABEL_CLASS}>Rotation</span>
            <DesktopInspectorScrubbableNumberInput
              className={DESKTOP_INSPECTOR_CONTROL_CLASS}
              max={180}
              min={-180}
              onValueChange={(value) => onLayoutChange({ rotation: value })}
              value={settings.layout.rotation}
            />
          </div>
        </DesktopInspectorSection>
      </DesktopInspectorScrollArea>
    </div>
  )
}
