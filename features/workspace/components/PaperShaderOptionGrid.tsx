"use client"

import {
  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
} from "@/features/desktop-shell/components/desktop-inspector-tokens"
import { DesktopInspectorAnimatedOptionGrid } from "@/features/desktop-shell/inspector/inspector-option-grid"
import { desktopInspectorOptionGridItemClass } from "@/features/desktop-shell/inspector/inspector-option-grid.classes"
import { DesktopInspectorOptionGridScrollArea } from "@/features/desktop-shell/inspector/inspector-option-grid"
import { PaperShaderOptionPreview } from "@/features/workspace/components/PaperShaderOptionPreview"
import {
  getAllPaperShaderDefinitions,
  type PaperShaderId,
} from "@/features/workspace/rendering/paper-shaders"
import { cn } from "@/lib/utils"

export type PaperShaderOptionGridVariant = "inspector" | "insert-desktop" | "insert-drafting"

type PaperShaderOptionGridProps = {
  columns?: 2 | 3
  dataSlot?: string
  onSelect: (shaderId: PaperShaderId) => void
  scrollAreaDataSlot?: string
  selectedShaderId?: PaperShaderId
  shelfDataSlot?: string
  variant: PaperShaderOptionGridVariant
}

function InspectorPaperShaderOptionTile({
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

function InsertPaperShaderOptionTile({
  label,
  onClick,
  shaderId,
  variant,
}: {
  label: string
  onClick: () => void
  shaderId: PaperShaderId
  variant: Exclude<PaperShaderOptionGridVariant, "inspector">
}) {
  const isInsertDesktop = variant === "insert-desktop"

  return (
    <button
      aria-label={`Use ${label} shader`}
      className={cn(
        "group relative aspect-square w-full min-w-0 p-0 transition",
        isInsertDesktop
          ? "rounded-[8px] hover:bg-white/[0.11]"
          : "rounded-[7px] hover:bg-[var(--ws-panel-bg-hover)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        data-slot="paper-shader-insert-preview-surface"
        className={cn(
          "relative block size-full overflow-hidden rounded-[6px] border-2 border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
          isInsertDesktop ? "bg-[#15161a]" : "bg-[var(--ws-control-bg)]",
        )}
      >
        <PaperShaderOptionPreview shaderId={shaderId} />
      </span>
    </button>
  )
}

export function PaperShaderOptionGrid({
  columns = 3,
  dataSlot = "desktop-paper-shader-grid",
  onSelect,
  scrollAreaDataSlot = "desktop-paper-shader-grid-scroll-area",
  selectedShaderId,
  shelfDataSlot = "desktop-paper-shader-grid-shelf",
  variant,
}: PaperShaderOptionGridProps) {
  const shaders = getAllPaperShaderDefinitions()

  if (variant === "inspector") {
    if (!selectedShaderId) {
      throw new Error("PaperShaderOptionGrid inspector variant requires selectedShaderId")
    }

    return (
      <DesktopInspectorOptionGridScrollArea
        ariaLabel="Paper shaders"
        columns={columns}
        dataSlot={scrollAreaDataSlot}
        shelfDataSlot={shelfDataSlot}
        variant="preset"
      >
        <DesktopInspectorAnimatedOptionGrid columns={columns} data-slot={dataSlot} selectedKey={selectedShaderId}>
          {shaders.map((shader) => (
            <InspectorPaperShaderOptionTile
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

  return (
    <div
      aria-label="Shader options"
      className={cn(
        "grid max-h-72 grid-cols-3 gap-1 overflow-y-auto p-1",
        variant === "insert-desktop" ? "rounded-[10px] border border-white/[0.12] bg-white/[0.04]" : undefined,
      )}
      data-slot={dataSlot}
      role="group"
    >
      {shaders.map((shader) => (
        <InsertPaperShaderOptionTile
          key={shader.id}
          label={shader.label}
          shaderId={shader.id}
          variant={variant}
          onClick={() => onSelect(shader.id)}
        />
      ))}
    </div>
  )
}
