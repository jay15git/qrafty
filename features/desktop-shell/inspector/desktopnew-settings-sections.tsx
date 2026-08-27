"use client"

import { useEffect, useState } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { StylePreview, type StylePreviewKind } from "@/features/qr-code/components/StylePreview"
import {
  CORNER_DOT_STYLE_OPTIONS,
  CORNER_SQUARE_STYLE_OPTIONS,
  DOT_STYLE_OPTIONS,
} from "@/features/qr-code/styles/style-options"
import {
  QR_BACKGROUND_SHAPES,
  type QrBackgroundShapeId,
} from "@/features/qr-code/styles/background-shapes"
import { ElementsSection } from "@/features/desktop-shell/inspector/desktopnew-elements-section"
import { DesktopNewContentFields } from "@/features/desktop-shell/inspector/desktopnew-content-fields"
import {
  ContentTypePicker,
  SegmentTabs,
  SettingsFillPopover,
  SettingsRowPopover,
  SettingsSlider,
  SettingsSwitchRow,
  SettingsTabPanel,
} from "@/features/desktop-shell/inspector/settings-ui"
import { ContentTypeGridIcon } from "@/features/qr-code/content/ContentTypeGridIcon"
import { getContentTypeLabel } from "@/features/qr-code/content/input-options"
import {
  QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS,
  type QrDotMatrixSquareLoader,
} from "@/features/qr-code/model/state"
import { SettingsPaperShaderControls } from "@/features/desktop-shell/inspector/desktopnew-paper-shader-settings"
import { PaperShaderOptionPreview } from "@/features/workspace/components/PaperShaderOptionPreview"
import { cn } from "@/lib/utils"
import { getLogoSelectionLabel } from "@/features/desktop-shell/inspector/settings-pickers.utils"
import {
  LogoIconPicker,
  LogoSelectionIcon,
  PexelsPhotoPicker,
} from "@/features/desktop-shell/inspector/settings-pickers"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import {
  applyCornerFill,
  applyLogoFill,
  applyPatternModuleFill,
  applyPatternModuleImageUrl,
  applyCardFill,
  applyShapeFill,
  isPatternModuleImageFill,
  readCornerFillCss,
  readLogoFillCss,
  readPatternModuleFillCss,
  readShapeFillCss,
  solidColorToFillCss,
} from "@/features/desktop-shell/inspector/desktopnew-settings-bridge"
import {
  getAllPaperShaderDefinitions,
  type PaperShaderId,
} from "@/features/workspace/rendering/paper-shaders"
import { createDefaultDraftingCardPaperShader } from "@/features/workspace/model/card-state"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import { ScrollPersistScope } from "@/lib/persisted-element-scroll"

export const SECTION_STACK = "dn-section-stack"
const PREVIEW_TILE =
  "dn-preview-tile dn-preview-tile-size group relative shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dn-squircle-xs"
const PREVIEW_ROW = "dn-preview-row"

function QrStylePreviewGrid({
  options,
  previewKind,
  selected,
  onSelect,
}: {
  options: ReadonlyArray<{ label: string; value: string }>
  previewKind: StylePreviewKind
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      persistKey={`qr-style:${previewKind}`}
      scrollFade
      showScrollbar={false}
      viewportClassName="min-w-0"
    >
      <div className={PREVIEW_ROW}>
        {options.map((option) => {
          const isSelected = selected === option.value

          return (
            <button
              key={option.value}
              aria-label={option.label}
              aria-pressed={isSelected}
              className={cn(PREVIEW_TILE, "text-center")}
              title={option.label}
              type="button"
              onClick={() => onSelect(option.value)}
            >
              <span
                aria-hidden="true"
                className="grid size-full place-items-center overflow-hidden dn-squircle-xs"
              >
                <span className="grid size-full place-items-center [&_svg]:size-full [&_svg]:text-current">
                  <StylePreview previewKind={previewKind} value={option.value} />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function ShapeTypePreviewRow({
  selected,
  onSelect,
}: {
  selected: QrBackgroundShapeId
  onSelect: (shapeId: QrBackgroundShapeId) => void
}) {
  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      persistKey="qr-background-shapes"
      scrollFade
      showScrollbar={false}
      viewportClassName="min-w-0"
    >
      <div className={PREVIEW_ROW}>
        <button
          aria-label="Use no shape"
          aria-pressed={selected === "none"}
          className={cn(PREVIEW_TILE)}
          title="None"
          type="button"
          onClick={() => onSelect("none")}
        >
          <span className="relative z-10 grid size-full place-items-center p-0.5 dn-preview-icon">
            <svg
              aria-hidden="true"
              className="size-[90%] fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="24" height="24" />
            </svg>
          </span>
        </button>
        {QR_BACKGROUND_SHAPES.map((option) => {
          const isSelected = selected === option.id

          return (
            <button
              key={option.id}
              aria-label={`Use ${option.label} shape`}
              aria-pressed={isSelected}
              className={cn(PREVIEW_TILE)}
              title={option.label}
              type="button"
              onClick={() => onSelect(option.id)}
            >
              <span className="relative z-10 grid size-full place-items-center p-0.5 dn-preview-icon">
                <svg
                  aria-hidden="true"
                  className="size-[90%] fill-current"
                  viewBox={`0 0 ${option.viewBox.width} ${option.viewBox.height}`}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d={option.path} />
                </svg>
              </span>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function PaperShaderPreviewRow({
  selected,
  onSelect,
}: {
  selected: PaperShaderId
  onSelect: (shaderId: PaperShaderId) => void
}) {
  const shaders = getAllPaperShaderDefinitions()

  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      persistKey="paper-shader-gallery"
      scrollFade
      showScrollbar={false}
      viewportClassName="min-w-0"
    >
      <div className={PREVIEW_ROW}>
        {shaders.map((option) => {
          const isSelected = selected === option.id

          return (
            <button
              key={option.id}
              aria-label={`Use ${option.label} shader`}
              aria-pressed={isSelected}
              className={cn(PREVIEW_TILE)}
              title={option.label}
              type="button"
              onClick={() => onSelect(option.id)}
            >
              <PaperShaderOptionPreview
                className="relative z-10 block size-full overflow-hidden dn-squircle-xs"
                isSelected={isSelected}
                shaderId={option.id}
              />
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function MotionLoaderPresetGrid({
  selected,
  onSelect,
}: {
  selected: QrDotMatrixSquareLoader
  onSelect: (loader: QrDotMatrixSquareLoader) => void
}) {
  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      persistKey="motion-loader-presets"
      scrollFade
      showScrollbar={false}
      viewportClassName="min-w-0"
    >
      <div className={PREVIEW_ROW}>
        {QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS.map((option) => {
          const isSelected = selected === option.value

          return (
            <button
              key={option.value}
              aria-label={option.label}
              aria-pressed={isSelected}
              className={cn(
                "dn-option-tile dn-control-surface shrink-0 px-3 dn-type-chip dn-squircle-xs",
                isSelected && "text-[var(--dn-fg)]",
              )}
              type="button"
              onClick={() => onSelect(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

export function ContentSection({ model }: { model: DesktopInspectorModel }) {
  const {
    actualContentType,
    actualContentValues,
    actualContentValidation,
    onContentPasteApply,
    onContentTypeChange,
    onContentValueChange,
  } = model
  const [typePopoverOpen, setTypePopoverOpen] = useState(false)

  return (
    <div className={SECTION_STACK}>
      <SettingsRowPopover
        contentClassName="w-[17.25rem] p-0"
        hint="Type"
        open={typePopoverOpen}
        trigger={
          <span className="flex min-w-0 items-center gap-2">
            <ContentTypeGridIcon className="size-4 shrink-0" type={actualContentType} />
            <span className="truncate">{getContentTypeLabel(actualContentType)}</span>
          </span>
        }
        onOpenChange={setTypePopoverOpen}
      >
        <ContentTypePicker
          selected={actualContentType}
          onAfterSelect={() => setTypePopoverOpen(false)}
          onSelect={onContentTypeChange}
        />
      </SettingsRowPopover>
      <DesktopNewContentFields
        contentType={actualContentType}
        contentValues={actualContentValues}
        validation={actualContentValidation}
        onContentPasteApply={onContentPasteApply}
        onContentValueChange={onContentValueChange}
      />
    </div>
  )
}

export function QrStyleSection({ model }: { model: DesktopInspectorModel }) {
  const [tab, setTab] = useState("Module")
  const [logoPopoverOpen, setLogoPopoverOpen] = useState(false)
  const {
    actualCornersSettings,
    actualLogoSettings,
    actualPatternSettings,
    onCornersSettingsChange,
    onLogoSettingsChange,
    onPatternSettingsChange,
  } = model

  const moduleFill = readPatternModuleFillCss(actualPatternSettings)
  const eyeFill = readCornerFillCss(
    actualCornersSettings.cornerDotColorMode,
    actualCornersSettings.cornerDotSolidColor,
    actualCornersSettings.cornerDotGradient,
  )
  const frameFill = readCornerFillCss(
    actualCornersSettings.cornerSquareColorMode,
    actualCornersSettings.cornerSquareSolidColor,
    actualCornersSettings.cornerSquareGradient,
  )
  const logoFill = readLogoFillCss(actualLogoSettings)

  const part =
    tab === "Module"
      ? {
          options: DOT_STYLE_OPTIONS,
          previewKind: "dots" as const,
          selected: actualPatternSettings.qrDotType,
          onSelect: (value: string) =>
            onPatternSettingsChange({
              qrDotType: value as typeof actualPatternSettings.qrDotType,
            }),
        }
      : tab === "Eye"
        ? {
            options: CORNER_DOT_STYLE_OPTIONS,
            previewKind: "corner-dot" as const,
            selected: actualCornersSettings.cornerDotType,
            onSelect: (value: string) =>
              onCornersSettingsChange({
                cornerDotType: value as typeof actualCornersSettings.cornerDotType,
              }),
          }
        : tab === "Frame"
          ? {
              options: CORNER_SQUARE_STYLE_OPTIONS,
              previewKind: "corner-square" as const,
              selected: actualCornersSettings.cornerSquareType,
              onSelect: (value: string) =>
                onCornersSettingsChange({
                  cornerSquareType: value as typeof actualCornersSettings.cornerSquareType,
                }),
            }
          : null

  return (
    <div className="dn-section-stack w-full min-w-0 max-w-full">
      <SegmentTabs items={["Module", "Eye", "Frame", "Logo"]} value={tab} onChange={setTab} />

      <SettingsTabPanel activeKey={tab}>
        {tab === "Logo" ? (
          <>
            <SettingsRowPopover
              contentClassName="w-[18rem]"
              hideHint
              leading={<LogoSelectionIcon selectedId={actualLogoSettings.selectedBrandIconId} />}
              open={logoPopoverOpen}
              trigger={getLogoSelectionLabel(actualLogoSettings.selectedBrandIconId)}
              onOpenChange={setLogoPopoverOpen}
            >
              <LogoIconPicker
                selectedId={actualLogoSettings.selectedBrandIconId}
                onSelect={(selectedBrandIconId) => {
                  onLogoSettingsChange({ selectedBrandIconId, sourceMode: "brand" })
                }}
              />
            </SettingsRowPopover>
            <SettingsSlider
              label="Size"
              max={100}
              value={actualLogoSettings.size}
              onChange={(size) => onLogoSettingsChange({ size })}
            />
            <SettingsFillPopover
              hint="Fill"
              qrGradient
              value={logoFill}
              onValueChange={(fill) => onLogoSettingsChange(applyLogoFill(fill, actualLogoSettings))}
            />
          </>
        ) : part ? (
          <>
            <QrStylePreviewGrid
              options={part.options}
              previewKind={part.previewKind}
              selected={part.selected}
              onSelect={part.onSelect}
            />
            {tab === "Module" ? (
              <SettingsFillPopover
                fillPreviewImageUrl={
                  isPatternModuleImageFill(actualPatternSettings)
                    ? actualPatternSettings.moduleFillImageUrl
                    : undefined
                }
                hint="Fill"
                moduleImage={{
                  imageUrl: actualPatternSettings.moduleFillImageUrl,
                  onUpload: (file) =>
                    onPatternSettingsChange({
                      uploadedModuleFillFile: file,
                    }),
                  onClear: () =>
                    onPatternSettingsChange(applyPatternModuleImageUrl("", "upload")),
                }}
                qrGradient
                modulePattern={{
                  selectedPalette: actualPatternSettings.dotsPalette,
                  selectedPreset: actualPatternSettings.dotsPalettePreset,
                  onSelect: (preset) =>
                    onPatternSettingsChange(
                      preset === "custom"
                        ? { dotsColorMode: "palette", dotsPalettePreset: "custom" }
                        : {
                            dotsColorMode: "palette",
                            dotsPalette: [...preset.colors],
                            dotsPalettePreset: preset.label,
                          },
                    ),
                  onPaletteColorChange: (index, color) =>
                    onPatternSettingsChange({
                      dotsColorMode: "palette",
                      dotsPalettePreset: "custom",
                      dotsPalette: actualPatternSettings.dotsPalette.map((current, paletteIndex) =>
                        paletteIndex === index ? color : current,
                      ),
                    }),
                }}
                value={moduleFill}
                onValueChange={(fill) =>
                  onPatternSettingsChange(applyPatternModuleFill(fill, actualPatternSettings))
                }
              />
            ) : (
              <SettingsFillPopover
                hint="Fill"
                qrGradient
                value={tab === "Eye" ? eyeFill : frameFill}
                onValueChange={(fill) =>
                  onCornersSettingsChange(
                    applyCornerFill(fill, tab === "Eye" ? "eye" : "frame", actualCornersSettings),
                  )
                }
              />
            )}
          </>
        ) : null}
      </SettingsTabPanel>
    </div>
  )
}

export function CardSection({ model }: { model: DesktopInspectorModel }) {
  const { actualShapeSettings, onShapeSettingsChange } = model
  const cardFill = readShapeFillCss(actualShapeSettings)

  return (
    <div className={SECTION_STACK}>
      <ShapeTypePreviewRow
        selected={actualShapeSettings.backgroundShapeId}
        onSelect={(backgroundShapeId) => onShapeSettingsChange({ backgroundShapeId })}
      />
      <SettingsFillPopover
        hint="Fill"
        qrGradient
        value={cardFill}
        onValueChange={(fill) => onShapeSettingsChange(applyShapeFill(fill, actualShapeSettings))}
      />
      <SettingsSlider
        label="Padding"
        max={192}
        value={actualShapeSettings.shapePadding}
        onChange={(shapePadding) => onShapeSettingsChange({ shapePadding })}
      />
    </div>
  )
}

function backgroundTabFromStyleMode(
  styleMode: DesktopInspectorModel["actualBackgroundSettings"]["styleMode"],
): "Shader" | "Image" | "Color" {
  if (styleMode === "image" || styleMode === "image-filter") {
    return "Image"
  }

  if (styleMode === "paper-shader") {
    return "Shader"
  }

  return "Color"
}

export function SceneSection({ model }: { model: DesktopInspectorModel }) {
  const {
    actualBackgroundSettings,
    actualImageSettings,
    actualShapeSettings,
    controller,
    onBackgroundSettingsChange,
    onImageSettingsChange,
    onShapeSettingsChange,
  } = model
  const [imagePopoverOpen, setImagePopoverOpen] = useState(false)
  const [tab, setTab] = useState(() => backgroundTabFromStyleMode(actualBackgroundSettings.styleMode))
  const paperShader = actualBackgroundSettings.paperShader
  const backgroundFill = actualShapeSettings.cardFill
  const imageLabel = actualImageSettings.remoteUrl ? "Photo" : "None"

  useEffect(() => {
    setTab(backgroundTabFromStyleMode(actualBackgroundSettings.styleMode))
  }, [actualBackgroundSettings.styleMode])

  function handleBackgroundTabChange(nextTab: string) {
    const resolvedTab =
      nextTab === "Image" || nextTab === "Color" ? nextTab : ("Shader" as const)
    setTab(resolvedTab)
    controller?.onCanvasBackgroundTabChange?.(
      resolvedTab === "Shader" ? "shader" : resolvedTab === "Image" ? "image" : "color",
    )
  }

  return (
    <div className={SECTION_STACK}>
      <SegmentTabs items={["Shader", "Image", "Color"]} value={tab} onChange={handleBackgroundTabChange} />
      <SettingsTabPanel activeKey={tab}>
        {tab === "Shader" ? (
          <>
            <PaperShaderPreviewRow
              selected={paperShader.shaderId}
              onSelect={(shaderId) =>
                onBackgroundSettingsChange({
                  paperShader: createDefaultDraftingCardPaperShader(shaderId),
                })
              }
            />
            <SettingsPaperShaderControls
              paperShader={paperShader}
              onPaperShaderChange={(nextPaperShader) =>
                onBackgroundSettingsChange({ paperShader: nextPaperShader })
              }
            />
          </>
        ) : tab === "Image" ? (
          <>
            <SettingsRowPopover
              contentClassName="w-[19rem]"
              hint="Image"
              open={imagePopoverOpen}
              title="Image"
              trigger={imageLabel}
              onOpenChange={setImagePopoverOpen}
            >
              <PexelsPhotoPicker
                onAfterSelect={() => setImagePopoverOpen(false)}
                onClear={() => onImageSettingsChange({ remoteUrl: "" })}
                onSelectPhoto={(imageUrl) =>
                  onImageSettingsChange({ remoteUrl: imageUrl, sourceMode: "url" })
                }
              />
            </SettingsRowPopover>
            <SettingsSlider
              label="Opacity"
              max={100}
              value={actualImageSettings.opacity}
              onChange={(opacity) => onImageSettingsChange({ opacity })}
            />
          </>
        ) : (
          <SettingsFillPopover
            hint="Fill"
            value={backgroundFill}
            onValueChange={(fill) => onShapeSettingsChange(applyCardFill(fill))}
          />
        )}
      </SettingsTabPanel>
    </div>
  )
}

export function MotionSection({ model }: { model: DesktopInspectorModel }) {
  const { actualMotionSettings, onMotionSettingsChange } = model
  const loader =
    actualMotionSettings.presetCategory === "dotMatrix"
      ? actualMotionSettings.loader
      : ("neon-drift" satisfies QrDotMatrixSquareLoader)

  return (
    <div className={SECTION_STACK}>
      <SettingsSwitchRow
        checked={actualMotionSettings.enabled}
        label="Enabled"
        onChange={(enabled) => onMotionSettingsChange({ enabled })}
      />
      {actualMotionSettings.enabled ? (
        <>
          <MotionLoaderPresetGrid
            selected={loader}
            onSelect={(nextLoader) =>
              onMotionSettingsChange({
                loader: nextLoader,
                preset: nextLoader,
                presetCategory: "dotMatrix",
              })
            }
          />
          <SettingsFillPopover
            hint="Peak"
            value={solidColorToFillCss(actualMotionSettings.customColorPeak)}
            onValueChange={(_fill, css) =>
              onMotionSettingsChange({
                colorPreset: "theme",
                customColorMid: fillPreviewHex(css),
                customColorPeak: fillPreviewHex(css),
              })
            }
          />
        </>
      ) : null}
    </div>
  )
}

export function SettingsSectionBody({
  id,
  model,
}: {
  id: string
  model: DesktopInspectorModel
}) {
  let body = null
  switch (id) {
    case "Content":
      body = <ContentSection model={model} />
      break
    case "QR":
      body = <QrStyleSection model={model} />
      break
    case "Shape":
      body = <CardSection model={model} />
      break
    case "Background":
      body = <SceneSection model={model} />
      break
    case "Motion":
      body = <MotionSection model={model} />
      break
    case "Elements":
      body = <ElementsSection model={model} />
      break
    default:
      body = null
  }

  return <ScrollPersistScope id={`settings:${id}`}>{body}</ScrollPersistScope>
}
