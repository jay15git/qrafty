"use client"

import { Link2, Unlink2 } from "lucide-react"
import {
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
  DesktopInspectorLabel,
  DesktopInspectorSection,
  DesktopInspectorSegmentedControl,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  DesktopInspectorColorRow,
  DesktopInspectorElasticSliderRow,
  DesktopInspectorNumberField,
  DesktopInspectorValueGrid,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import {
  DRAFTING_BORDER_STYLES,
  type DraftingBorderStyle,
} from "@/features/workspace/model/effects"
import {
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
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

export function AppearanceOutlineControls({
  appearance,
  className,
  onPatch,
}: {
  appearance: DesktopAppearanceSnapshot
  className?: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  if (!appearance.supportsOutline) {
    return null
  }

  const outline = appearance.outline

  return (
    <DesktopInspectorSection
      className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS, className)}
      dataSlot="desktop-appearance-outline-controls"
    >
      <DesktopInspectorLabel>Outline</DesktopInspectorLabel>
      <DesktopInspectorSegmentedControl
        ariaLabelPrefix="Outline style"
        items={DRAFTING_BORDER_STYLES.map((style) => ({ label: style, value: style }))}
        onValueChange={(style: DraftingBorderStyle) =>
          onPatch({ outline: { ...outline, style } })
        }
        value={outline.style}
      />
      <DesktopInspectorColorRow
        label="Outline color"
        value={outline.color}
        onChange={(color) => onPatch({ outline: { ...outline, color: color || "#111827" } })}
      />
      <div className="mt-2 grid gap-2">
        <DesktopInspectorElasticSliderRow
          label="Outline width"
          max={64}
          min={0}
          value={outline.width}
          valueLabel={`${Math.round(outline.width)}`}
          onChange={(width) => onPatch({ outline: { ...outline, width, visible: width > 0 } })}
        />
        <DesktopInspectorElasticSliderRow
          label="Outline offset"
          max={64}
          min={-64}
          value={outline.offset}
          valueLabel={`${Math.round(outline.offset)}`}
          onChange={(offset) => onPatch({ outline: { ...outline, offset } })}
        />
        <DesktopInspectorElasticSliderRow
          label="Outline opacity"
          max={100}
          min={0}
          value={outline.opacity}
          valueLabel={`${Math.round(outline.opacity)}%`}
          onChange={(opacity) => onPatch({ outline: { ...outline, opacity } })}
        />
      </div>
    </DesktopInspectorSection>
  )
}

export function AppearanceRadiusControls({
  appearance,
  className,
  onPatch,
}: {
  appearance: DesktopAppearanceSnapshot
  className?: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  if (!appearance.supportsCornerRadius) {
    return null
  }

  const radii = resolveCornerRadii(appearance.cornerRadii, appearance.cornerRadius)

  const applyRadii = (nextRadii: DraftingCornerRadiiState) => {
    onPatch({
      cornerRadius: nextRadii.linked
        ? nextRadii.topLeft
        : Math.max(nextRadii.topLeft, nextRadii.topRight, nextRadii.bottomRight, nextRadii.bottomLeft),
      cornerRadii: nextRadii,
    })
  }

  const updateCorner = (corner: DraftingCornerRadiusKey, value: number) => {
    applyRadii(patchCornerRadii(appearance.cornerRadii, appearance.cornerRadius, corner, value))
  }

  return (
    <DesktopInspectorSection
      className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS, className)}
      dataSlot="desktop-appearance-radius-controls"
    >
      <div className="flex items-center justify-between gap-2">
        <DesktopInspectorLabel>Corner radius</DesktopInspectorLabel>
        <button
          aria-label={radii.linked ? "Unlink corner radii" : "Link corner radii"}
          aria-pressed={radii.linked}
          className="grid size-7 place-items-center rounded-md text-[var(--desktop-inspector-fg-secondary)] hover:bg-[var(--desktop-inspector-control-hover-bg)]"
          type="button"
          onClick={() =>
            applyRadii(setCornerRadiiLinked(appearance.cornerRadii, appearance.cornerRadius, !radii.linked))
          }
        >
          {radii.linked ? <Link2 className="size-3.5" /> : <Unlink2 className="size-3.5" />}
        </button>
      </div>

      {radii.linked ? (
        <DesktopInspectorElasticSliderRow
          label="All corners"
          max={DRAFTING_CORNER_RADIUS_MAX}
          min={0}
          value={radii.topLeft}
          valueLabel={`${Math.round(radii.topLeft)}`}
          onChange={(value) => updateCorner("topLeft", value)}
        />
      ) : (
        <DesktopInspectorValueGrid>
          {DRAFTING_CORNER_RADIUS_KEYS.map((corner) => (
            <DesktopInspectorNumberField
              key={corner}
              label={corner === "topLeft" ? "TL" : corner === "topRight" ? "TR" : corner === "bottomRight" ? "BR" : "BL"}
              max={DRAFTING_CORNER_RADIUS_MAX}
              min={0}
              value={radii[corner]}
              onChange={(value) => updateCorner(corner, value)}
            />
          ))}
        </DesktopInspectorValueGrid>
      )}
    </DesktopInspectorSection>
  )
}
