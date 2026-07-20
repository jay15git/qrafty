"use client"

import { MockupStylePreview } from "@/features/desktop-shell/components/MockupStylePreview"
import {
  DESKTOP_INSPECTOR_FG_PRIMARY,
  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
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
            className={cn(
              desktopInspectorOptionGridItemClass,
              DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
              selectedStyleId === preset.id && DESKTOP_INSPECTOR_SELECTED_CLASS,
            )}
            onClick={() => onApplyMockupStyle(preset)}
          >
            <span className="relative block aspect-square w-full overflow-hidden rounded-md">
              <MockupStylePreview preset={preset} />
            </span>
            <span className={cn("mt-1.5 truncate text-xs font-medium", DESKTOP_INSPECTOR_FG_PRIMARY)}>
              {preset.label}
            </span>
          </button>
        ))}
      </DesktopInspectorAnimatedOptionGrid>
    </DesktopInspectorSection>
  )
}
