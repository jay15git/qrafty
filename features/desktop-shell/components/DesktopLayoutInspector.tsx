"use client"

import { useState } from "react"

import {
  DesktopInspectorHeader,
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
  DesktopInspectorScrubbableNumberInput,
  DesktopInspectorSection,
  DesktopInspectorSegmentedControl,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  SCENE_LAYOUT_PRESETS,
  type SceneLayoutPreset,
} from "@/features/workspace/model/scene-templates"
import { cn } from "@/lib/utils"

type LayoutControlTab = "zoom" | "tilt"

export type DesktopLayoutSettings = {
  layout: SceneLayoutPreset
}

type DesktopLayoutInspectorProps = {
  onLayoutPresetSelect: (preset: SceneLayoutPreset) => void
  onLayoutChange: (patch: Partial<SceneLayoutPreset>) => void
  settings: DesktopLayoutSettings
}

export function DesktopLayoutInspector({
  onLayoutPresetSelect,
  onLayoutChange,
  settings,
}: DesktopLayoutInspectorProps) {
  const [activeTab, setActiveTab] = useState<LayoutControlTab>("zoom")

  return (
    <div data-slot="desktop-layout-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Layout" />
      <DesktopInspectorScrollArea>
        <DesktopInspectorSection className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
          <p className={cn("mb-2", DESKTOP_INSPECTOR_SECTION_HEADING_CLASS)}>Presets</p>
          <div className="flex flex-col gap-2">
            {SCENE_LAYOUT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-label={preset.label}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-transparent p-2 text-left transition",
                  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
                  settings.layout.id === preset.id && DESKTOP_INSPECTOR_SELECTED_CLASS,
                )}
                onClick={() => onLayoutPresetSelect(preset)}
              >
                <span
                  className={cn(
                    "grid h-12 w-16 shrink-0 place-items-center rounded-md text-[10px] font-medium",
                    DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
                  )}
                >
                  {preset.label}
                </span>
                <span className="text-sm font-medium">{preset.label}</span>
              </button>
            ))}
          </div>
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
