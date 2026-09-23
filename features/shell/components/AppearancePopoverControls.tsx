import { Link2, Unlink2 } from "lucide-react"
import {
  INSPECTOR_SECTION_GAP_CLASS,
} from "@/features/shell/components/inspector-tokens"
import {
  InspectorLabel,
  InspectorSection,
} from "@/features/shell/components/InspectorControls"
import {
  InspectorElasticSliderRow,
  InspectorNumberField,
  InspectorValueGrid,
} from "@/features/shell/components/InspectorShell"
import { InspectorThemeContext } from "@/features/shell/inspector/theme-context"
import { SettingsFillPopover, SettingsSlider } from "@/features/shell/inspector/settings-ui"
import { fillPreviewHex } from "@/features/shell/inspector/FillPicker.utils"
import type {
  AppearanceBorderSnapshot,
  AppearancePatch,
  AppearanceSnapshot,
} from "@/features/shell/model/appearance"
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared"
import {
  DRAFTING_CORNER_RADIUS_KEYS,
  DRAFTING_CORNER_RADIUS_MAX,
  patchCornerRadii,
  resolveCornerRadii,
  setCornerRadiiLinked,
  type DraftingCornerRadiusKey,
  type DraftingCornerRadiiState,
} from "@/features/canvas/model/corner-radius"
import { cn } from "@/lib/utils"

export function AppearanceBorderControls({
  appearance,
  className,
  onPatch,
  theme = "dark",
}: {
  appearance: AppearanceSnapshot
  className?: string
  onPatch: (patch: AppearancePatch) => void
  theme?: "dark" | "light"
}) {
  const border = appearance.border

  const emit = (patch: Partial<AppearanceBorderSnapshot>) =>
    onPatch({ border: { ...border, ...patch } })

  return (
    <InspectorSection
      className={cn(INSPECTOR_SECTION_GAP_CLASS, className)}
      dataSlot="appearance-border-controls"
    >
      <InspectorLabel>Border</InspectorLabel>
      <InspectorThemeContext.Provider value={theme}>
        <BorderColorRow appearance={appearance} onPatch={onPatch} />
      </InspectorThemeContext.Provider>
      <div className="mt-2 grid gap-2">
        <InspectorElasticSliderRow
          label="Width"
          max={64}
          min={0}
          value={border.width}
          valueLabel={`${Math.round(border.width)}`}
          onChange={(width) => emit({ width })}
        />
        <InspectorElasticSliderRow
          label="Opacity"
          max={100}
          min={0}
          value={border.opacity}
          valueLabel={`${Math.round(border.opacity)}%`}
          onChange={(opacity) => emit({ opacity })}
        />
      </div>
    </InspectorSection>
  )
}

function BorderColorRow({
  appearance,
  onPatch,
}: {
  appearance: AppearanceSnapshot
  onPatch: (patch: AppearancePatch) => void
}) {
  const border = appearance.border

  return (
    <div className="flex min-h-[var(--settings-control-height)] items-center">
      <span className="dn-row-label-text pl-[var(--settings-row-px)]">Color</span>
      <SettingsFillPopover
        align="start"
        hint="Border color"
        side="right"
        solidOnly
        title="Border color"
        triggerClassName="ml-auto"
        value={border.color}
        variant="swatch"
        onValueChange={(_fill, css) =>
          onPatch({ border: { ...border, color: fillPreviewHex(css) || "#111827" } })
        }
      />
    </div>
  )
}

function AppearanceOpacityControls({
  appearance,
  className,
  onPatch,
  useSettingsSlider = false,
}: {
  appearance: AppearanceSnapshot
  className?: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  useSettingsSlider?: boolean
}) {
  const opacityPercent = Math.round(appearance.opacity * 100)

  return (
    <InspectorSection
      className={cn(INSPECTOR_SECTION_GAP_CLASS, className)}
      dataSlot="appearance-opacity-controls"
    >
      {useSettingsSlider ? (
        <SettingsSlider
          label="Opacity"
          max={100}
          min={0}
          value={opacityPercent}
          onChange={(next) => onPatch({ opacity: next / 100 })}
        />
      ) : (
        <InspectorElasticSliderRow
          label="Opacity"
          max={100}
          min={0}
          value={opacityPercent}
          valueLabel={`${opacityPercent}%`}
          onChange={(next) => onPatch({ opacity: next / 100 })}
        />
      )}
    </InspectorSection>
  )
}

export function AppearanceRadiusControls({
  appearance,
  className,
  onPatch,
}: {
  appearance: AppearanceSnapshot
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
    <InspectorSection
      className={cn(INSPECTOR_SECTION_GAP_CLASS, className)}
      dataSlot="appearance-radius-controls"
    >
      <div className="flex items-center justify-between gap-2">
        <InspectorLabel>Corner radius</InspectorLabel>
        <button
          aria-label={radii.linked ? "Unlink corner radii" : "Link corner radii"}
          aria-pressed={radii.linked}
          className="grid size-7 place-items-center rounded-md text-[var(--settings-fg-secondary)] hover:bg-[var(--settings-control-hover-bg)]"
          type="button"
          onClick={() =>
            applyRadii(setCornerRadiiLinked(appearance.cornerRadii, appearance.cornerRadius, !radii.linked))
          }
        >
          {radii.linked ? <Link2 className="size-3.5" /> : <Unlink2 className="size-3.5" />}
        </button>
      </div>

      {radii.linked ? (
        <InspectorElasticSliderRow
          label="All corners"
          max={DRAFTING_CORNER_RADIUS_MAX}
          min={0}
          value={radii.topLeft}
          valueLabel={`${Math.round(radii.topLeft)}`}
          onChange={(value) => updateCorner("topLeft", value)}
        />
      ) : (
        <InspectorValueGrid>
          {DRAFTING_CORNER_RADIUS_KEYS.map((corner) => (
            <InspectorNumberField
              key={corner}
              label={corner === "topLeft" ? "TL" : corner === "topRight" ? "TR" : corner === "bottomRight" ? "BR" : "BL"}
              max={DRAFTING_CORNER_RADIUS_MAX}
              min={0}
              value={radii[corner]}
              onChange={(value) => updateCorner(corner, value)}
            />
          ))}
        </InspectorValueGrid>
      )}
    </InspectorSection>
  )
}
