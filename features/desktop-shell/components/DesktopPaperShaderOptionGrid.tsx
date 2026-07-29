"use client"

import {
  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
  DesktopInspectorAnimatedOptionGrid,
  desktopInspectorOptionGridItemClass,
} from "@/features/desktop-shell/components/InspectorControls"
import { DesktopInspectorOptionGridScrollArea } from "@/features/desktop-shell/components/DesktopInspectorShell"
import { PaperShaderOptionPreview } from "@/features/workspace/components/PaperShaderOptionPreview"
import {
  getAllPaperShaderDefinitions,
  type PaperShaderId,
} from "@/features/workspace/rendering/paper-shaders"
import { cn } from "@/lib/utils"

function DesktopPaperShaderOptionTile({
  label,
  onClick,
  selected,
  shaderId,
}: {
  label: string
  onClick: () => void
  selected: boolean
  shaderId: PaperShaderId
}) {
  return (
    <button
      aria-label={`Use ${label} shader`}
      aria-pressed={selected}
      data-desktop-animated-option-selection="true"
      data-desktop-option-interaction="scale"
      data-desktop-option-tile="true"
      data-desktop-preview-option="true"
      className={cn(
        "group relative aspect-square w-full min-w-0 p-0 text-center",
        desktopInspectorOptionGridItemClass("loose"),
        DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        data-desktop-adaptive-option-preview="true"
        data-slot="desktop-style-preview-surface"
        className={cn(
          "relative z-10 size-full overflow-hidden rounded-[6px] border-2 border-transparent bg-[#15161a] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
          DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
        )}
      >
        <PaperShaderOptionPreview isSelected={selected} shaderId={shaderId} />
      </span>
    </button>
  )
}

export function DesktopPaperShaderOptionGrid({
  columns = 3,
  dataSlot = "desktop-paper-shader-grid",
  onSelect,
  scrollAreaDataSlot = "desktop-paper-shader-grid-scroll-area",
  selectedShaderId,
  shelfDataSlot = "desktop-paper-shader-grid-shelf",
  variant = "preset",
}: {
  columns?: 2 | 3
  dataSlot?: string
  onSelect: (shaderId: PaperShaderId) => void
  scrollAreaDataSlot?: string
  selectedShaderId: PaperShaderId
  shelfDataSlot?: string
  variant?: "compact" | "content" | "preset"
}) {
  const shaders = getAllPaperShaderDefinitions()

  return (
    <DesktopInspectorOptionGridScrollArea
      ariaLabel="Paper shaders"
      columns={columns}
      dataSlot={scrollAreaDataSlot}
      shelfDataSlot={shelfDataSlot}
      variant={variant}
    >
      <DesktopInspectorAnimatedOptionGrid columns={columns} data-slot={dataSlot} selectedKey={selectedShaderId}>
        {shaders.map((shader) => (
          <DesktopPaperShaderOptionTile
            key={shader.id}
            label={shader.label}
            selected={selectedShaderId === shader.id}
            shaderId={shader.id}
            onClick={() => onSelect(shader.id)}
          />
        ))}
      </DesktopInspectorAnimatedOptionGrid>
    </DesktopInspectorOptionGridScrollArea>
  )
}
