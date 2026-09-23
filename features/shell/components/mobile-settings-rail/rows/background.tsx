import { Suspense, useContext } from "react"

import { parseFill } from "@/components/ui/fill-picker/lib/gradient"
import type { Fill } from "@/components/ui/fill-picker/public-api"
import { PaperShaderOptionPreview } from "@/features/canvas/components/PaperShaderOptionPreview"
import { createDefaultDraftingCardPaperShader } from "@/features/canvas/model/card-state"
import { getCardGeneratedShaderDefinitions } from "@/features/canvas/rendering/paper-shader-definitions"
import { setInspectorSectionTab } from "@/features/shell/inspector/inspector-section-tabs"
import { useMobileDrawerNavigation } from "@/features/shell/inspector/MobileDrawerNavigationContext"
import { applyCardFill } from "@/features/shell/inspector/settings-bridge"
import { getActiveFillPresetForStoredValue } from "@/features/shell/inspector/settings-fill-preset-match"
import { SETTINGS_PREVIEW_TILE } from "@/features/shell/inspector/SettingsPreviewTiles"
import { SegmentTabs } from "@/features/shell/inspector/settings-ui"
import { cn } from "@/lib/utils"

import { LazyInspectorFillPicker } from "../lazy-details"
import {
  MobileRailModeContext,
  useLatestModel,
  type MobileRailRowProps,
} from "../rail-context"
import {
  fillPresetsForMode,
  lockedFillModeForRailMode,
  SCENE_FILL_MODES,
  sceneFillModeFromModel,
} from "../rail-modes"
import {
  MobileRailImageOptions,
  MobileRailPickerTile,
  MobileRailSwatchTile,
} from "../tiles"

function backgroundFillTabName(css: string): "Solid" | "Linear" | "Radial" {
  if (css.startsWith("radial-gradient")) return "Radial"
  if (css.startsWith("linear-gradient")) return "Linear"
  return "Solid"
}

export function MobileBackgroundRailRow({ model }: MobileRailRowProps) {
  const navigation = useMobileDrawerNavigation()
  const railMode = useContext(MobileRailModeContext)
  const modelRef = useLatestModel(model)
  const mode = railMode?.mode ?? sceneFillModeFromModel(model)
  const value = model.actualShapeSettings.cardFill

  const applyBackground = (fill: Fill, css: string) => {
    const m = modelRef.current
    m.onShapeSettingsChange(applyCardFill(fill))
    m.controller?.onCanvasBackgroundTabChange?.("color")
    setInspectorSectionTab("background", backgroundFillTabName(css))
  }

  if (mode === "image") {
    const imageUrl = model.actualImageSettings.remoteUrl ?? ""
    return (
      <>
        <MobileRailImageOptions
          imageUrl={imageUrl}
          onClear={() =>
            modelRef.current.onImageSettingsChange({
              remoteUrl: "",
              sourceMode: "upload",
            })
          }
          onSelect={(path) =>
            modelRef.current.onImageSettingsChange({
              remoteUrl: path,
              sourceMode: "url",
            })
          }
          onUpload={(url) =>
            modelRef.current.onImageSettingsChange({
              remoteUrl: url,
              sourceMode: "upload",
            })
          }
        />
      </>
    )
  }

  if (mode === "shader") {
    const selected = model.actualBackgroundSettings.paperShader.shaderId
    return (
      <>
        {getCardGeneratedShaderDefinitions().map((option) => (
          <button
            key={option.id}
            aria-label={`Use ${option.label} shader`}
            aria-pressed={selected === option.id}
            className={cn(SETTINGS_PREVIEW_TILE)}
            data-slot="mobile-rail-option"
            title={option.label}
            type="button"
            onClick={() =>
              modelRef.current.onBackgroundSettingsChange({
                paperShader: createDefaultDraftingCardPaperShader(option.id),
              })
            }
          >
            <PaperShaderOptionPreview
              className="relative z-10 block size-full overflow-hidden dn-squircle-xs"
              shaderId={option.id}
            />
          </button>
        ))}
      </>
    )
  }

  const presets = fillPresetsForMode(mode)
  const activePreset = getActiveFillPresetForStoredValue(value, presets)

  return (
    <>
      <MobileRailPickerTile
        ariaLabel="Custom background"
        customFill={activePreset ? undefined : value}
        onOpen={() =>
          navigation?.openDetail({
            title: "Background",
            content: (
              <Suspense fallback={null}>
                <div
                  className="inspector-fill-popover w-full min-w-0"
                  data-theme={model.actualTheme}
                >
                  <LazyInspectorFillPicker
                    lockedFillMode={lockedFillModeForRailMode(mode)}
                    qrGradient
                    value={value}
                    onValueChange={(fill, css) => applyBackground(fill, css)}
                  />
                </div>
              </Suspense>
            ),
          })
        }
      />
      {presets.map((preset) => (
        <MobileRailSwatchTile
          key={preset}
          ariaLabel="Use this background"
          fill={preset}
          selected={activePreset === preset}
          onSelect={() => {
            const fill = parseFill(preset)
            if (fill) {
              applyBackground(fill, preset)
            }
          }}
        />
      ))}
    </>
  )
}

/**
 * Sliding-tab mode switcher under the Background options row. Mirrors
 * `SceneSection.handleBackgroundTabChange` — tapping a tab also activates
 * that canvas background mode so the preview reacts immediately.
 */
export function MobileBackgroundRailFooter({ model }: MobileRailRowProps) {
  const railMode = useContext(MobileRailModeContext)
  const modelRef = useLatestModel(model)

  if (!railMode?.selectedMode) {
    return null
  }

  return (
    <div className="dn-mobile-settings-rail__tabs">
      <SegmentTabs
        className="dn-mobile-settings-rail__tabbar"
        items={SCENE_FILL_MODES.map((mode) => ({
          id: mode.id,
          label: mode.label,
        }))}
        value={railMode.selectedMode}
        onChange={(value) => {
          const mode = SCENE_FILL_MODES.find((entry) => entry.id === value)
          if (!mode) {
            return
          }
          railMode.setMode(mode.id)
          setInspectorSectionTab(
            "background",
            mode.label as "Solid" | "Linear" | "Radial" | "Image" | "Shader",
          )
          modelRef.current.controller?.onCanvasBackgroundTabChange?.(
            mode.id === "shader" ? "shader" : mode.id === "image" ? "image" : "color",
          )
        }}
      />
    </div>
  )
}
