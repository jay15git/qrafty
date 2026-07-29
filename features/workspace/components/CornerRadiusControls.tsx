"use client"

import { Link2, Unlink2 } from "lucide-react"

import {
  DraftingInspectorSection,
  DraftingInspectorValueGrid,
} from "@/features/workspace/components/InspectorPanel"
import { InspectorNumberInput } from "@/features/workspace/components/inspector/InspectorFields"
import {
  DRAFTING_CORNER_RADIUS_KEYS,
  DRAFTING_CORNER_RADIUS_MAX,
  patchCornerRadii,
  resolveCornerRadii,
  setCornerRadiiLinked,
  type DraftingCornerRadiusKey,
  type DraftingCornerRadiiState,
} from "@/features/workspace/model/corner-radius"
import { cn } from "@/lib/utils"

const CORNER_LABELS: Record<DraftingCornerRadiusKey, string> = {
  bottomLeft: "BL",
  bottomRight: "BR",
  topLeft: "TL",
  topRight: "TR",
}

type CornerRadiusControlsProps = {
  className?: string
  cornerRadius?: number
  cornerRadii?: DraftingCornerRadiiState
  dataSlot?: string
  onChange: (patch: { cornerRadius: number; cornerRadii: DraftingCornerRadiiState }) => void
  title?: string
}

export function CornerRadiusControls({
  className,
  cornerRadius,
  cornerRadii,
  dataSlot = "drafting-corner-radius-controls",
  onChange,
  title = "Corner radius",
}: CornerRadiusControlsProps) {
  const radii = resolveCornerRadii(cornerRadii, cornerRadius)

  const applyRadii = (nextRadii: DraftingCornerRadiiState) => {
    onChange({
      cornerRadius: nextRadii.linked
        ? nextRadii.topLeft
        : Math.max(nextRadii.topLeft, nextRadii.topRight, nextRadii.bottomRight, nextRadii.bottomLeft),
      cornerRadii: nextRadii,
    })
  }

  const updateCorner = (corner: DraftingCornerRadiusKey, value: number) => {
    applyRadii(patchCornerRadii(cornerRadii, cornerRadius, corner, value))
  }

  const toggleLinked = () => {
    applyRadii(setCornerRadiiLinked(cornerRadii, cornerRadius, !radii.linked))
  }

  return (
    <DraftingInspectorSection className={className} dataSlot={dataSlot} title={title}>
      <div className="mb-2 flex items-center justify-end">
        <button
          aria-label={radii.linked ? "Unlink corner radii" : "Link corner radii"}
          aria-pressed={radii.linked}
          className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--drafting-line)]"
          type="button"
          onClick={toggleLinked}
        >
          {radii.linked ? <Link2 className="size-3.5" /> : <Unlink2 className="size-3.5" />}
        </button>
      </div>

      {radii.linked ? (
        <InspectorNumberInput
          label="All corners"
          max={DRAFTING_CORNER_RADIUS_MAX}
          min={0}
          value={radii.topLeft}
          onChange={(value) => updateCorner("topLeft", value)}
        />
      ) : (
        <DraftingInspectorValueGrid>
          {DRAFTING_CORNER_RADIUS_KEYS.map((corner) => (
            <InspectorNumberInput
              key={corner}
              label={CORNER_LABELS[corner]}
              max={DRAFTING_CORNER_RADIUS_MAX}
              min={0}
              value={radii[corner]}
              onChange={(value) => updateCorner(corner, value)}
            />
          ))}
        </DraftingInspectorValueGrid>
      )}

      <div
        aria-hidden="true"
        className={cn(
          "mt-3 grid grid-cols-2 gap-2 rounded-[8px] border border-[var(--drafting-line)] p-3",
          radii.linked && "opacity-80",
        )}
      >
        <CornerRadiusPreviewCorner active={!radii.linked} corner="topLeft" radii={radii} />
        <CornerRadiusPreviewCorner active={!radii.linked} corner="topRight" radii={radii} />
        <CornerRadiusPreviewCorner active={!radii.linked} corner="bottomLeft" radii={radii} />
        <CornerRadiusPreviewCorner active={!radii.linked} corner="bottomRight" radii={radii} />
      </div>
    </DraftingInspectorSection>
  )
}

function CornerRadiusPreviewCorner({
  active,
  corner,
  radii,
}: {
  active: boolean
  corner: DraftingCornerRadiusKey
  radii: DraftingCornerRadiiState
}) {
  const radius = radii[corner]
  const alignment =
    corner === "topLeft"
      ? "items-start justify-start"
      : corner === "topRight"
        ? "items-start justify-end"
        : corner === "bottomLeft"
          ? "items-end justify-start"
          : "items-end justify-end"

  return (
    <div className={cn("flex min-h-10", alignment)}>
      <div
        className={cn(
          "size-8 border border-[var(--drafting-line-strong)] bg-[var(--drafting-panel-bg-hover)]",
          active && "ring-1 ring-[var(--drafting-line-strong)]",
        )}
        style={{
          borderBottomLeftRadius: corner === "bottomLeft" ? radius : 0,
          borderBottomRightRadius: corner === "bottomRight" ? radius : 0,
          borderTopLeftRadius: corner === "topLeft" ? radius : 0,
          borderTopRightRadius: corner === "topRight" ? radius : 0,
        }}
      />
    </div>
  )
}
