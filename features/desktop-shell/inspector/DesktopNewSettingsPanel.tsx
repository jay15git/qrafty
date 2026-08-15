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

import { DesktopNewContentFields } from "@/features/desktop-shell/inspector/desktopnew-content-fields"
import {
  ContentTypePicker,
  OptionGrid,
  PresetList,
  SegmentTabs,
  SettingsAccordion,
  SettingsFillPopover,
  SettingsPanelShell,
  SettingsPrimaryButton,
  SettingsRowPopover,
  SettingsScroll,
  SettingsSlider,
  SettingsSwitchRow,
  SettingsTabPanel,
} from "@/features/desktop-shell/inspector/settings-ui"
import { ContentTypeGridIcon } from "@/features/qr-code/content/ContentTypeGridIcon"
import {
  getContentTypeLabel,
} from "@/features/qr-code/content/input-options"
import {
  MOTION_COLOR_SWATCHES,
  QR_DOT_MATRIX_COLOR_PRESET_OPTIONS,
  QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS,
  type QrDotMatrixColorPreset,
  type QrDotMatrixSquareLoader,
} from "@/features/qr-code/model/state"
import { SettingsPaperShaderControls } from "@/features/desktop-shell/inspector/desktopnew-paper-shader-settings"
import { PaperShaderOptionPreview } from "@/features/workspace/components/PaperShaderOptionPreview"
import { cn } from "@/lib/utils"
import { getLogoSelectionLabel } from "@/features/desktop-shell/inspector/settings-pickers.utils"
import {
  LogoIconPicker,
  PexelsPhotoPicker,
} from "@/features/desktop-shell/inspector/settings-pickers"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import {
  applyCornerFill,
  applyLogoFill,
  applyPatternModuleFill,
  applyCardFill,
  applyShapeFill,
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
import { SettingsEffectsSection } from "@/features/desktop-shell/inspector/settings-effects"
import { legacyShadowToShadowLayer } from "@/features/workspace/model/effects"
import {
  EXPORT_PRESETS,
  formatExportPresetLabel,
} from "@/features/workspace/model/export-presets"
import type {
  DesktopExportTarget,
  DesktopInspectorModel,
  DesktopRasterExportPresetId,
  DesktopToolbarToolId,
} from "@/features/desktop-shell/components/FloatingToolbar"
import { createDefaultDraftingCardPaperShader } from "@/features/workspace/model/card-state"
import type { QrFileExtension } from "@/features/qr-code/model/types"

const SECTION_STACK = "flex flex-col gap-2.5"
const PREVIEW_TILE =
  "dn-preview-tile group relative shrink-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dn-squircle-xs"
const PREVIEW_ROW = "flex min-w-max gap-1.5 px-1 py-1.5"

const SECTIONS = [
  "Content",
  "QR",
  "Shape",
  "Effects",
  "Background",
  "Motion",
  "Export",
] as const

type SectionId = (typeof SECTIONS)[number]

const SECTION_TO_TOOL: Record<SectionId, DesktopToolbarToolId> = {
  Content: "content",
  QR: "pattern",
  Shape: "shape",
  Background: "background",
  Motion: "motion",
  Export: "export",
}

const TOOL_TO_SECTION: Partial<Record<DesktopToolbarToolId, SectionId>> = {
  content: "Content",
  pattern: "QR",
  corners: "QR",
  logo: "QR",
  shape: "Shape",
  background: "Background",
  motion: "Motion",
  export: "Export",
}

const EXPORT_TARGET_OPTIONS: Array<{ label: string; value: DesktopExportTarget }> = [
  { label: "Current QR", value: "current" },
  { label: "All QR codes", value: "all-qr" },
  { label: "Full surface", value: "surface" },
]

const EXPORT_FORMAT_OPTIONS: QrFileExtension[] = ["svg", "png", "webp", "jpeg"]

const RASTER_QUALITY_PRESETS: Array<{
  id: DesktopRasterExportPresetId
  label: string
}> = [
  { id: "quick-share", label: "Quick share" },
  { id: "web-social", label: "Web & social" },
  { id: "small-print", label: "Small print" },
  { id: "flyer-poster", label: "Flyer / poster" },
  { id: "large-format", label: "Large format" },
  { id: "max-quality", label: "Max quality" },
]

function sectionForTool(tool: DesktopToolbarToolId | null): SectionId {
  if (!tool) return "Content"
  return TOOL_TO_SECTION[tool] ?? "Content"
}

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
      scrollFade
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
              className={cn(PREVIEW_TILE, "size-14 text-center")}
              title={option.label}
              type="button"
              onClick={() => onSelect(option.value)}
            >
              <span
                aria-hidden="true"
                className="grid size-full place-items-center overflow-hidden p-0.5 dn-squircle-xs"
              >
                <span className="grid size-[90%] place-items-center [&_svg]:size-full [&_svg]:text-current">
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
      scrollFade
      viewportClassName="min-w-0"
    >
      <div className={PREVIEW_ROW}>
        <button
          aria-label="Use no shape"
          aria-pressed={selected === "none"}
          className={cn(PREVIEW_TILE, "size-14")}
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
              className={cn(PREVIEW_TILE, "size-14")}
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
      scrollFade
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
              className={cn(PREVIEW_TILE, "size-14")}
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
      scrollFade
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
                "dn-option-tile h-9 shrink-0 px-3 text-[11px] font-medium tracking-tight dn-squircle-xs",
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

function AnimatedPresetGrid({
  customColors,
  selected,
  onSelect,
}: {
  customColors?: { base: string; peak: string }
  selected: QrDotMatrixColorPreset
  onSelect: (preset: QrDotMatrixColorPreset) => void
}) {
  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      scrollFade
      viewportClassName="min-w-0"
    >
      <div className={PREVIEW_ROW}>
        {QR_DOT_MATRIX_COLOR_PRESET_OPTIONS.map((preset) => {
          const [base, peak] =
            preset.value === "theme" && customColors
              ? [customColors.base, customColors.peak]
              : MOTION_COLOR_SWATCHES[preset.value]
          const isSelected = selected === preset.value

          return (
            <button
              key={preset.value}
              aria-label={preset.label}
              aria-pressed={isSelected}
              className={cn(
                "dn-pressable-pickable flex size-8 shrink-0 overflow-hidden border border-[color-mix(in_srgb,var(--dn-line)_40%,transparent)] dn-squircle-xs",
                isSelected &&
                  "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
              type="button"
              onClick={() => onSelect(preset.value)}
            >
              <span aria-hidden className="flex-1" style={{ backgroundColor: base }} />
              <span aria-hidden className="flex-1" style={{ backgroundColor: peak }} />
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

type DesktopNewSettingsPanelProps = {
  fillHeight?: boolean
  model: DesktopInspectorModel
  openSection?: string
  onOpenSectionChange?: (section: string) => void
}

export function DesktopNewSettingsPanel({
  fillHeight = false,
  model,
  openSection: openSectionProp,
  onOpenSectionChange,
}: DesktopNewSettingsPanelProps) {
  const [internalOpenSection, setInternalOpenSection] = useState<string | undefined>(
    () => sectionForTool(model.actualActiveTool),
  )
  const openSection = openSectionProp ?? internalOpenSection
  const setOpenSection = onOpenSectionChange ?? setInternalOpenSection

  useEffect(() => {
    setOpenSection(sectionForTool(model.actualActiveTool))
  }, [model.actualActiveTool, setOpenSection])

  function handleSectionChange(section: string) {
    setOpenSection(section)
    const tool = SECTION_TO_TOOL[section as SectionId]
    if (tool) {
      model.onActiveToolChange(tool)
    }
  }

  return (
    <SettingsPanelShell fillHeight={fillHeight}>
      <SettingsScroll fillHeight={fillHeight}>
        <SettingsAccordion
          openSection={openSection}
          renderSection={(section) => (
            <SectionBody id={section as SectionId} model={model} />
          )}
          sections={SECTIONS}
          onOpenSectionChange={handleSectionChange}
        />
      </SettingsScroll>
    </SettingsPanelShell>
  )
}

function SectionBody({
  id,
  model,
}: {
  id: SectionId
  model: DesktopInspectorModel
}) {
  switch (id) {
    case "Content":
      return <ContentSection model={model} />
    case "QR":
      return <QrStyleSection model={model} />
    case "Shape":
      return <CardSection model={model} />
    case "Effects":
      return <EffectsSection model={model} />
    case "Background":
      return <SceneSection model={model} />
    case "Motion":
      return <MotionSection model={model} />
    case "Export":
      return <ExportSection model={model} />
    default:
      return null
  }
}

function ContentSection({ model }: { model: DesktopInspectorModel }) {
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

function QrStyleSection({ model }: { model: DesktopInspectorModel }) {
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
          onSelect: (value: string) => onPatternSettingsChange({ qrDotType: value as typeof actualPatternSettings.qrDotType }),
        }
      : tab === "Eye"
        ? {
            options: CORNER_DOT_STYLE_OPTIONS,
            previewKind: "corner-dot" as const,
            selected: actualCornersSettings.cornerDotType,
            onSelect: (value: string) =>
              onCornersSettingsChange({ cornerDotType: value as typeof actualCornersSettings.cornerDotType }),
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
    <div className="flex w-full min-w-0 max-w-full flex-col gap-2.5">
      <SegmentTabs items={["Module", "Eye", "Frame", "Logo"]} value={tab} onChange={setTab} />

      <SettingsTabPanel activeKey={tab}>
        {tab === "Logo" ? (
          <>
            <SettingsRowPopover
              contentClassName="w-[18rem]"
              hint="Logo"
              open={logoPopoverOpen}
              title="Logo"
              trigger={getLogoSelectionLabel(actualLogoSettings.selectedBrandIconId)}
              onOpenChange={setLogoPopoverOpen}
            >
              <LogoIconPicker
                selectedId={actualLogoSettings.selectedBrandIconId}
                onAfterSelect={() => setLogoPopoverOpen(false)}
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
                hint="Fill"
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
                }}
                value={moduleFill}
                onValueChange={(fill) =>
                  onPatternSettingsChange(applyPatternModuleFill(fill, actualPatternSettings))
                }
              />
            ) : (
              <SettingsFillPopover
                hint="Fill"
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

function CardSection({ model }: { model: DesktopInspectorModel }) {
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

function EffectsSection({ model }: { model: DesktopInspectorModel }) {
  const snapshot = model.controller?.appearanceSnapshot
  const onAppearancePatch = model.controller?.onAppearancePatch
  const { actualShapeSettings, onShapeSettingsChange } = model

  const shadows =
    snapshot?.shadows ??
    [
      legacyShadowToShadowLayer({
        blur: actualShapeSettings.shadowBlur,
        color: actualShapeSettings.shadowColor,
        offsetX: actualShapeSettings.shadowOffsetX,
        offsetY: actualShapeSettings.shadowOffsetY,
        opacity: actualShapeSettings.shadowOpacity,
        visible: actualShapeSettings.shadowOpacity > 0,
      }),
    ]
  const layerFilters = snapshot?.layerFilters ?? []

  return (
    <SettingsEffectsSection
      layerFilters={layerFilters}
      shadows={shadows}
      onPatch={(patch) => {
        if (onAppearancePatch) {
          onAppearancePatch(patch)
          return
        }

        const primary = patch.shadows?.[0] ?? patch.shadow
        if (!primary) {
          return
        }

        onShapeSettingsChange({
          shadowBlur: primary.blur,
          shadowColor: primary.color,
          shadowOffsetX: primary.offsetX,
          shadowOffsetY: primary.offsetY,
          shadowOpacity: primary.visible === false ? 0 : primary.opacity,
        })
      }}
    />
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

function SceneSection({ model }: { model: DesktopInspectorModel }) {
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

function MotionSection({ model }: { model: DesktopInspectorModel }) {
  const { actualMotionSettings, onMotionSettingsChange } = model
  const loader =
    actualMotionSettings.presetCategory === "dotMatrix"
      ? actualMotionSettings.loader
      : ("neon-drift" satisfies QrDotMatrixSquareLoader)

  const selectAnimatedPreset = (nextPreset: QrDotMatrixColorPreset) => {
    const [base, accent] = MOTION_COLOR_SWATCHES[nextPreset]
    onMotionSettingsChange({
      colorPreset: nextPreset,
      customColor: base,
      customColorBase: base,
      customColorMid: accent,
      customColorPeak: accent,
    })
  }

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
          <AnimatedPresetGrid
            customColors={{
              base: actualMotionSettings.customColorBase,
              peak: actualMotionSettings.customColorPeak,
            }}
            selected={actualMotionSettings.colorPreset}
            onSelect={selectAnimatedPreset}
          />
          <SettingsFillPopover
            hint="Base"
            value={solidColorToFillCss(actualMotionSettings.customColorBase)}
            onValueChange={(_fill, css) =>
              onMotionSettingsChange({
                colorPreset: "theme",
                customColor: fillPreviewHex(css),
                customColorBase: fillPreviewHex(css),
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

function ExportSection({ model }: { model: DesktopInspectorModel }) {
  const { actualExportSettings, controller, onExportSettingsChange } = model
  const selectedPreset =
    EXPORT_PRESETS.find((preset) => preset.id === actualExportSettings.exportPresetId) ??
    EXPORT_PRESETS[0]
  const selectedQuality =
    RASTER_QUALITY_PRESETS.find((preset) => preset.id === actualExportSettings.qualityPresetId) ??
    RASTER_QUALITY_PRESETS[1]

  const targetLabel =
    EXPORT_TARGET_OPTIONS.find((option) => option.value === actualExportSettings.target)?.label ??
    "Current QR"

  return (
    <div className={SECTION_STACK}>
      <SettingsRowPopover hint="Target" title="Target" trigger={targetLabel}>
        <PresetList
          items={EXPORT_TARGET_OPTIONS.map((option) => option.label)}
          selected={targetLabel}
          onSelect={(label) => {
            const next = EXPORT_TARGET_OPTIONS.find((option) => option.label === label)
            if (next) onExportSettingsChange({ target: next.value })
          }}
        />
      </SettingsRowPopover>
      <SettingsRowPopover
        hint="Format"
        title="Format"
        trigger={actualExportSettings.extension.toUpperCase()}
      >
        <OptionGrid
          columns={4}
          items={EXPORT_FORMAT_OPTIONS.map((format) => format.toUpperCase())}
          selected={actualExportSettings.extension.toUpperCase()}
          onSelect={(format) =>
            onExportSettingsChange({
              extension: format.toLowerCase() as QrFileExtension,
            })
          }
        />
      </SettingsRowPopover>
      <SettingsRowPopover
        hint="Platform size"
        title="Platform size"
        trigger={
          actualExportSettings.usePlatformPreset
            ? selectedPreset.label
            : "Custom"
        }
      >
        <PresetList
          items={EXPORT_PRESETS.map((preset) => preset.label)}
          selected={selectedPreset.label}
          onSelect={(label) => {
            const preset = EXPORT_PRESETS.find((entry) => entry.label === label)
            if (!preset) return
            onExportSettingsChange({
              exportPresetId: preset.id,
              extension: preset.format,
              usePlatformPreset: true,
            })
          }}
        />
      </SettingsRowPopover>
      <SettingsRowPopover hint="Quality" title="Quality" trigger={selectedQuality.label}>
        <PresetList
          items={RASTER_QUALITY_PRESETS.map((preset) => preset.label)}
          selected={selectedQuality.label}
          onSelect={(label) => {
            const preset = RASTER_QUALITY_PRESETS.find((entry) => entry.label === label)
            if (!preset) return
            onExportSettingsChange({
              qualityPresetId: preset.id,
              usePlatformPreset: false,
            })
          }}
        />
      </SettingsRowPopover>
      <SettingsPrimaryButton onClick={() => controller?.onExportDownload?.()}>
        Download
      </SettingsPrimaryButton>
      {controller?.exportDownloadError ? (
        <p className="text-center text-[11px] text-red-500">{controller.exportDownloadError}</p>
      ) : null}
      {actualExportSettings.usePlatformPreset ? (
        <p className="dn-type-meta text-center">
          {formatExportPresetLabel(selectedPreset)}
        </p>
      ) : null}
    </div>
  )
}
