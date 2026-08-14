"use client"

import { PaperShaderOptionPreview } from "@/features/workspace/components/PaperShaderOptionPreview"
import {
  getAllPaperShaderDefinitions,
  type PaperShaderId,
} from "@/features/workspace/rendering/paper-shaders"
import { cn } from "@/lib/utils"

type DraftingPaperShaderInsertGridVariant = "insert-desktop" | "insert-drafting"

type DraftingPaperShaderInsertGridProps = {
  dataSlot?: string
  onSelect: (shaderId: PaperShaderId) => void
  variant: DraftingPaperShaderInsertGridVariant
}

function PaperShaderInsertOptionTile({
  label,
  onClick,
  shaderId,
  variant,
}: {
  label: string
  onClick: () => void
  shaderId: PaperShaderId
  variant: DraftingPaperShaderInsertGridVariant
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

export function DraftingPaperShaderInsertGrid({
  dataSlot = "drafting-paper-shader-insert-grid",
  onSelect,
  variant,
}: DraftingPaperShaderInsertGridProps) {
  const isInsertDesktop = variant === "insert-desktop"
  const shaders = getAllPaperShaderDefinitions()

  return (
    <div
      aria-label="Shader options"
      className={cn(
        "grid max-h-72 grid-cols-3 gap-1 overflow-y-auto p-1",
        isInsertDesktop ? "rounded-[10px] border border-white/[0.12] bg-white/[0.04]" : undefined,
      )}
      data-slot={dataSlot}
      role="group"
    >
      {shaders.map((shader) => (
        <PaperShaderInsertOptionTile
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
