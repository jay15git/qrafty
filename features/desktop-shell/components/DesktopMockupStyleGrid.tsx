"use client"

import { MockupStylePreview } from "@/features/desktop-shell/components/MockupStylePreview"
import {
  DESKTOP_INSPECTOR_FG_PRIMARY,
  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
  DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
  DESKTOP_INSPECTOR_SELECTED_CLASS,
  DesktopInspectorAnimatedOptionGrid,
  DesktopInspectorSection,
  desktopInspectorOptionGridItemClass,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  MOCKUP_STYLE_PRESETS,
  type MockupStylePreset,
} from "@/features/workspace/model/scene-templates"
import { cn } from "@/lib/utils"

type DesktopMockupStyleGridProps = {
  heading?: string
  onApplyMockupStyle: (preset: MockupStylePreset) => void
  selectedStyleId?: string
}

export function DesktopMockupStyleGrid({
  heading = "Style",
  onApplyMockupStyle,
  selectedStyleId,
}: DesktopMockupStyleGridProps) {
  return (
    <DesktopInspectorSection data-slot="desktop-mockup-style-grid">
      <p className={cn("mb-2", DESKTOP_INSPECTOR_SECTION_HEADING_CLASS)}>{heading}</p>
      <DesktopInspectorAnimatedOptionGrid columns={3} selectedKey={selectedStyleId}>
        {MOCKUP_STYLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-label={preset.label}
            aria-pressed={selectedStyleId === preset.id}
            data-desktop-animated-option-selection="true"
            data-desktop-option-interaction="scale"
            data-desktop-option-tile="true"
            className={cn(
              "group flex w-full min-w-0 flex-col items-center text-center",
              desktopInspectorOptionGridItemClass(),
              DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
              DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
              selectedStyleId === preset.id && DESKTOP_INSPECTOR_SELECTED_CLASS,
            )}
            onClick={() => onApplyMockupStyle(preset)}
          >
            <span
              className={cn(
                "relative z-10 block aspect-square w-full overflow-hidden rounded-md",
                DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
              )}
            >
              <MockupStylePreview preset={preset} />
            </span>
            <span className={cn("relative z-10 mt-1.5 truncate text-xs font-medium", DESKTOP_INSPECTOR_FG_PRIMARY)}>
              {preset.label}
            </span>
          </button>
        ))}
      </DesktopInspectorAnimatedOptionGrid>
    </DesktopInspectorSection>
  )
}
