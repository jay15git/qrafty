import { useRef } from "react"
import { Link2, Unlink2 } from "lucide-react"
import {
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
} from "@/features/shell/components/desktop-inspector-tokens"
import {
  DesktopInspectorLabel,
  DesktopInspectorSection,
} from "@/features/shell/components/InspectorControls"
import {
  DesktopInspectorElasticSliderRow,
  DesktopInspectorNumberField,
  DesktopInspectorValueGrid,
} from "@/features/shell/components/DesktopInspectorShell"
import { DesktopnewThemeContext } from "@/features/shell/inspector/theme-context"
import { SettingsFillPopover, SettingsSlider } from "@/features/shell/inspector/settings-ui"
import { fillPreviewHex } from "@/features/shell/inspector/fill-picker.utils"
import type {
  DesktopAppearanceBorderSnapshot,
  DesktopAppearancePatch,
  DesktopAppearanceSnapshot,
} from "@/features/shell/model/appearance"
import {
  type DraftingCanvasLayer,
} from "@/features/canvas/model/layers"
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
  appearance: DesktopAppearanceSnapshot
  className?: string
  onPatch: (patch: DesktopAppearancePatch) => void
  theme?: "dark" | "light"
}) {
  const border = appearance.border

  const emit = (patch: Partial<DesktopAppearanceBorderSnapshot>) =>
    onPatch({ border: { ...border, ...patch } })

  return (
    <DesktopInspectorSection
      className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS, className)}
      dataSlot="desktop-appearance-border-controls"
    >
      <DesktopInspectorLabel>Border</DesktopInspectorLabel>
      <DesktopnewThemeContext.Provider value={theme}>
        <BorderColorRow appearance={appearance} onPatch={onPatch} />
      </DesktopnewThemeContext.Provider>
      <div className="mt-2 grid gap-2">
        <DesktopInspectorElasticSliderRow
          label="Width"
          max={64}
          min={0}
          value={border.width}
          valueLabel={`${Math.round(border.width)}`}
          onChange={(width) => emit({ width })}
        />
        <DesktopInspectorElasticSliderRow
          label="Opacity"
          max={100}
          min={0}
          value={border.opacity}
          valueLabel={`${Math.round(border.opacity)}%`}
          onChange={(opacity) => emit({ opacity })}
        />
      </div>
    </DesktopInspectorSection>
  )
}

function BorderColorRow({
  appearance,
  onPatch,
}: {
  appearance: DesktopAppearanceSnapshot
  onPatch: (patch: DesktopAppearancePatch) => void
}) {
  const pickerRef = useRef<{ openPicker: () => void } | null>(null)
  const border = appearance.border

  return (
    <>
      <div className="flex min-h-[var(--settings-control-height)] items-center">
        <span className="dn-row-label-text pl-[var(--settings-row-px)]">Color</span>
        <button
          aria-label="Border color"
          className="ml-auto size-7 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-[color-mix(in_srgb,var(--line)_40%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus,var(--ring))]"
          style={{ background: border.color }}
          type="button"
          onClick={() => pickerRef.current?.openPicker()}
        />
      </div>
      <SettingsFillPopover
        ref={pickerRef}
        hint="Border color"
        solidOnly
        title="Border color"
        value={border.color}
        variant="picker-only"
        onValueChange={(_fill, css) =>
          onPatch({ border: { ...border, color: fillPreviewHex(css) || "#111827" } })
        }
      />
    </>
  )
}

function AppearanceOpacityControls({
  appearance,
  className,
  onPatch,
  useSettingsSlider = false,
}: {
  appearance: DesktopAppearanceSnapshot
  className?: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  useSettingsSlider?: boolean
}) {
  const opacityPercent = Math.round(appearance.opacity * 100)

  return (
    <DesktopInspectorSection
      className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS, className)}
      dataSlot="desktop-appearance-opacity-controls"
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
        <DesktopInspectorElasticSliderRow
          label="Opacity"
          max={100}
          min={0}
          value={opacityPercent}
          valueLabel={`${opacityPercent}%`}
          onChange={(next) => onPatch({ opacity: next / 100 })}
        />
      )}
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
