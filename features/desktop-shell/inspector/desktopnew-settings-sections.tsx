"use client"

import { useContext, useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { QrStyleOptionPreview } from "@/features/qr-code/components/QrStyleOptionPreview"
import type { StylePreviewKind } from "@/features/qr-code/components/StylePreview"
import {
  CORNER_DOT_STYLE_OPTIONS,
  CORNER_SQUARE_STYLE_OPTIONS,
  DOT_STYLE_OPTIONS,
} from "@/features/qr-code/styles/style-options"
import {
  ERROR_CORRECTION_LEVEL_OPTIONS,
  formatQrTypeNumberLabel,
  TYPE_NUMBER_MAX,
  TYPE_NUMBER_MIN,
} from "@/features/qr-code/styles/encoding-options"
import type { QrTypeNumber } from "@/features/qr-code/model/types"
import {
  QR_BACKGROUND_SHAPES,
  type QrBackgroundShapeId,
} from "@/features/qr-code/styles/background-shapes"
import { ElementsSection } from "@/features/desktop-shell/inspector/desktopnew-elements-section"
import { DesktopNewContentFields } from "@/features/desktop-shell/inspector/desktopnew-content-fields"
import { Ellipsis } from "lucide-react"
import {
  ContentTypeBrowser,
  QrColorPartBrowser,
  SettingsFillPresetSection,
  SettingsLabeledSelect,
  SettingsSlider,
  SettingsTilePopover,
  SettingsSwitchRow,
  SettingsTabPanel,
} from "@/features/desktop-shell/inspector/settings-ui"
import { normalizeContentTypeForPicker } from "@/features/qr-code/content/input-options"
import {
  dotMatrixAnimationSpeedToSliderPercent,
  sliderPercentToDotMatrixAnimationSpeed,
} from "@/features/qr-code/model/state"
import {
  isScaleOnlyDotMatrixLoader,
  MOTION_COLOR_SWATCHES,
  QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS,
  type QrDotMatrixAnimationOptions,
  type QrDotMatrixColorPreset,
  type QrDotMatrixSquareLoader,
  type QraftyDataModulesStyle,
} from "@/features/qr-code/model/state"
import { SettingsPaperShaderControls } from "@/features/desktop-shell/inspector/desktopnew-paper-shader-settings"
import { PaperShaderOptionPreview } from "@/features/workspace/components/PaperShaderOptionPreview"
import { WallpaperOptionPreview } from "@/features/workspace/components/WallpaperOptionPreview"
import { preloadRasterImage } from "@/features/workspace/rendering/preload-raster-image"
import { cn } from "@/lib/utils"
import {
  getBrandIconById,
  POPULAR_BRAND_ICON_IDS,
} from "@/features/qr-code/assets/brand-icons"
import {
  LogoIconPicker,
  LogoPickerTileIcon,
} from "@/features/desktop-shell/inspector/settings-pickers"
import { parseFill, type Fill } from "@/components/ui/fill-picker-base/public-api"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { QrColorFillControls } from "@/features/desktop-shell/inspector/qr-color-fill-controls"
import {
  applyCornerFill,
  applyLogoFill,
  applyPatternModuleFill,
  applyPatternModuleImageUrl,
  applyCardFill,
  applyShapeFill,
  applyUnifiedQrFill,
  applyUnifiedQrModuleImageUrl,
  applyUnifiedQrModulePatternPatch,
  isPatternModuleImageFill,
  readCornerFillCss,
  readLogoFillCss,
  readPatternModuleFillCss,
  readShapeFillCss,
  solidColorToFillCss,
  type UnifiedQrFillPatches,
  type UnifiedQrFillSettings,
} from "@/features/desktop-shell/inspector/desktopnew-settings-bridge"
import {
  getCardGeneratedShaderDefinitions,
  type PaperShaderId,
} from "@/features/workspace/rendering/paper-shader-definitions"
import { createDefaultDraftingCardPaperShader } from "@/features/workspace/model/card-state"
import { SCENE_WALLPAPERS } from "@/features/workspace/assets/scene-wallpapers"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import {
  getInspectorSectionTab,
  setInspectorSectionTab,
} from "@/features/desktop-shell/inspector/inspector-chrome-state"
import { ScrollPersistScope } from "@/lib/persisted-element-scroll"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { useMobileInspectorDensity } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import { SettingsOptionShelf } from "@/features/desktop-shell/inspector/mobile-settings-rail"
import { SETTINGS_PREVIEW_TILE_FLUID } from "@/features/desktop-shell/inspector/settings-preview-tiles"
import {
  isSceneWallpaperPath,
  SettingsImageUploadTile,
} from "@/features/desktop-shell/inspector/settings-fill-option-grid"
import {
  SETTINGS_FILL_LINEAR_PRESETS,
  SETTINGS_FILL_RADIAL_PRESETS,
  SETTINGS_FILL_SOLID_PRESETS,
} from "@/features/desktop-shell/inspector/settings-fill-presets"
import type { DesktopLogoSettings } from "@/features/desktop-shell/model/desktop-toolbar-types"

export const SECTION_STACK = "dn-section-stack"

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
    <SettingsOptionShelf
      activeKey={selected}
      ariaLabel="Style options"
      dataSlot={`qr-style-grid:${previewKind}`}
      persistKey={`qr-style:${previewKind}`}
    >
      {options.map((option) => {
        const isSelected = selected === option.value

        return (
          <button
            key={option.value}
            aria-label={option.label}
            aria-pressed={isSelected}
            className={cn(SETTINGS_PREVIEW_TILE_FLUID, "text-center")}
            title={option.label}
            type="button"
            onClick={() => onSelect(option.value)}
          >
            <span
              aria-hidden="true"
              className="grid size-full place-items-center overflow-hidden p-0.5 dn-squircle-xs"
            >
              <QrStyleOptionPreview
                className="size-full max-h-full max-w-full"
                previewKind={previewKind}
                value={option.value}
              />
            </span>
          </button>
        )
      })}
    </SettingsOptionShelf>
  )
}

const SQUARE_SHAPE_VIEWBOX = "0 0 24 24"

function ShapeGlyph({
  className,
  path,
  viewBox,
}: {
  className?: string
  path?: string
  viewBox: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-[90%] fill-current", className)}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      {path ? <path d={path} /> : <rect width="24" height="24" />}
    </svg>
  )
}

function shapeViewBox(option: (typeof QR_BACKGROUND_SHAPES)[number]) {
  return `${option.viewBox.x ?? 0} ${option.viewBox.y ?? 0} ${option.viewBox.width} ${option.viewBox.height}`
}

const SHAPE_SELECT_TILE =
  "aspect-square h-auto justify-center gap-0 px-0 [&>span]:grid [&>span]:place-items-center [&>span:last-child]:hidden"

function ShapeCatalogueSelect({
  selected,
  onSelect,
}: {
  selected: QrBackgroundShapeId
  onSelect: (shapeId: QrBackgroundShapeId) => void
}) {
  const theme = useContext(DesktopnewThemeContext)
  const mobileDensity = useMobileInspectorDensity()

  if (mobileDensity) {
    return (
      <SettingsOptionShelf
        activeKey={selected}
        ariaLabel="Background shapes"
        columns={4}
        dataSlot="shape-catalogue-grid"
        persistKey="qr-background-shapes"
      >
        <button
          aria-label="Use square shape"
          aria-pressed={selected === "none"}
          className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
          title="Square"
          type="button"
          onClick={() => onSelect("none")}
        >
          <span className="relative z-10 grid size-full place-items-center p-0.5 dn-preview-icon">
            <ShapeGlyph viewBox={SQUARE_SHAPE_VIEWBOX} />
          </span>
        </button>
        {QR_BACKGROUND_SHAPES.map((option) => (
          <button
            key={option.id}
            aria-label={`Use ${option.label} shape`}
            aria-pressed={selected === option.id}
            className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
            title={option.label}
            type="button"
            onClick={() => onSelect(option.id)}
          >
            <span className="relative z-10 grid size-full place-items-center p-0.5 dn-preview-icon">
              <ShapeGlyph path={option.path} viewBox={shapeViewBox(option)} />
            </span>
          </button>
        ))}
      </SettingsOptionShelf>
    )
  }

  return (
    <div className="dn-content-type-select w-full min-w-0">
      <Select
        value={selected}
        onValueChange={(next) => onSelect(next as QrBackgroundShapeId)}
      >
        <SelectTrigger
          className="dn-content-type-select-trigger w-full min-w-0 dn-squircle-sm"
          placeholder="Shape"
          variant="borderless"
        />
        <SelectContent
          className={cn(
            "dn-portal-surface desktopnew-popover-content overflow-hidden p-0 dn-squircle-md",
            theme === "dark" && "dark",
          )}
          data-theme={theme}
          listAxis="xy"
          listClassName="grid grid-cols-4 gap-0.5 p-1"
        >
          <SelectItem
            className={SHAPE_SELECT_TILE}
            index={0}
            label="Square"
            triggerLabel={
              <span className="flex min-w-0 items-center gap-2">
                <ShapeGlyph className="size-4 shrink-0" viewBox={SQUARE_SHAPE_VIEWBOX} />
                <span className="min-w-0 truncate">Square</span>
              </span>
            }
            value="none"
          >
            <ShapeGlyph className="size-7" viewBox={SQUARE_SHAPE_VIEWBOX} />
          </SelectItem>
          {QR_BACKGROUND_SHAPES.map((option, optionIndex) => (
            <SelectItem
              key={option.id}
              className={SHAPE_SELECT_TILE}
              index={optionIndex + 1}
              label={option.label}
              triggerLabel={
                <span className="flex min-w-0 items-center gap-2">
                  <ShapeGlyph
                    className="size-4 shrink-0"
                    path={option.path}
                    viewBox={shapeViewBox(option)}
                  />
                  <span className="min-w-0 truncate">{option.label}</span>
                </span>
              }
              value={option.id}
            >
              <ShapeGlyph
                className="size-7"
                path={option.path}
                viewBox={shapeViewBox(option)}
              />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function PaperShaderPreviewRow({
  selected,
  onSelect,
}: {
  selected: PaperShaderId
  onSelect: (shaderId: PaperShaderId) => void
}) {
  const shaders = getCardGeneratedShaderDefinitions()

  return (
    <SettingsOptionShelf
      activeKey={selected}
      ariaLabel="Shader options"
      dataSlot="paper-shader-grid"
      persistKey="paper-shader-grid"
    >
      {shaders.map((option) => {
        const isSelected = selected === option.id

        return (
          <button
            key={option.id}
            aria-label={`Use ${option.label} shader`}
            aria-pressed={isSelected}
            className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
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
    </SettingsOptionShelf>
  )
}

function WallpaperPreviewRow({
  onClear,
  onSelect,
  onUpload,
  selectedPath,
}: {
  onClear: () => void
  onSelect: (imagePath: string) => void
  onUpload: (imageUrl: string) => void
  selectedPath: string
}) {
  const mobileDensity = useMobileInspectorDensity()
  const customImageUrl =
    selectedPath && !isSceneWallpaperPath(selectedPath) ? selectedPath : ""

  const wallpaperTiles = SCENE_WALLPAPERS.map((wallpaper) => {
    const isSelected = selectedPath === wallpaper.path

    return (
      <button
        key={wallpaper.id}
        aria-label={`Use ${wallpaper.label} wallpaper`}
        aria-pressed={isSelected}
        className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
        title={wallpaper.label}
        type="button"
        onClick={() => onSelect(wallpaper.path)}
        onPointerEnter={() => {
          void preloadRasterImage(wallpaper.path)
        }}
      >
        <WallpaperOptionPreview
          alt={wallpaper.label}
          className="relative z-10 block size-full overflow-hidden dn-squircle-xs"
          previewPath={wallpaper.previewPath}
        />
      </button>
    )
  })

  if (mobileDensity) {
    return (
      <SettingsOptionShelf
        activeKey={selectedPath}
        ariaLabel="Image options"
        dataSlot="wallpaper-grid"
        label="Presets"
        persistKey="background-wallpapers"
      >
        <SettingsImageUploadTile
          fluid
          ariaLabel="Upload custom image"
          imageUrl={customImageUrl}
          onClear={onClear}
          onUpload={onUpload}
        />
        {wallpaperTiles}
      </SettingsOptionShelf>
    )
  }

  return (
    <>
      <div className="flex min-h-[var(--dn-control-height)] items-center">
        <span className="dn-row-label-text pl-[var(--dn-row-px)]">Upload</span>
        <SettingsImageUploadTile
          ariaLabel="Upload custom image"
          className="dn-row-upload-tile ml-auto"
          imageUrl={customImageUrl}
          onClear={onClear}
          onUpload={onUpload}
        />
      </div>
      <SettingsOptionShelf
        activeKey={selectedPath}
        ariaLabel="Image options"
        dataSlot="wallpaper-grid"
        label="Presets"
      >
        {wallpaperTiles}
      </SettingsOptionShelf>
    </>
  )
}

function MotionPresetSelect({
  selected,
  onSelect,
}: {
  selected: QrDotMatrixSquareLoader
  onSelect: (loader: QrDotMatrixSquareLoader) => void
}) {
  const options = QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS
  const selectedLabel =
    options.find((option) => option.value === selected)?.label ?? options[0].label

  return (
    <SettingsLabeledSelect
      items={options.map((option) => option.label)}
      label="Preset"
      placeholder="Preset"
      value={selectedLabel}
      onChange={(label) => {
        const option = options.find((item) => item.label === label)
        if (option) onSelect(option.value)
      }}
    />
  )
}

/** Motion animates a single accent color, so presets are solids: the accent
 *  each named motion preset resolves to (see `resolveMotionColors`). The
 *  `theme` slot is the custom color and lives on the swatch instead. */
const MOTION_COLOR_PRESETS = (
  (Object.keys(MOTION_COLOR_SWATCHES) as QrDotMatrixColorPreset[]).filter(
    (preset) => preset !== "theme",
  )
).map((preset) => ({
  preset,
  fill: solidColorToFillCss(MOTION_COLOR_SWATCHES[preset][1]),
}))

function MotionColorControls({
  animation,
  onChange,
}: {
  animation: QrDotMatrixAnimationOptions
  onChange: (patch: Partial<QrDotMatrixAnimationOptions>) => void
}) {
  const customFill = solidColorToFillCss(animation.customColorPeak)
  const activeFill = MOTION_COLOR_PRESETS.find(
    (option) => option.preset === animation.colorPreset,
  )?.fill

  return (
    <SettingsFillPresetSection
      lockedFillMode="solid"
      presets={MOTION_COLOR_PRESETS.map((option) => option.fill)}
      value={activeFill ?? customFill}
      onSelect={(_fill, css) => {
        const hex = fillPreviewHex(css)
        const preset = MOTION_COLOR_PRESETS.find((option) => option.fill === css)

        onChange({
          colorPreset: preset?.preset ?? "theme",
          customColorMid: hex,
          customColorPeak: hex,
        })
      }}
    />
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
  const normalizedContentType = normalizeContentTypeForPicker(actualContentType)

  return (
    <div className={SECTION_STACK}>
      <ContentTypeBrowser selected={actualContentType} onSelect={onContentTypeChange} />
      <SettingsTabPanel activeKey={normalizedContentType}>
        <DesktopNewContentFields
          contentType={actualContentType}
          contentValues={actualContentValues}
          validation={actualContentValidation}
          onContentPasteApply={onContentPasteApply}
          onContentValueChange={onContentValueChange}
        />
      </SettingsTabPanel>
    </div>
  )
}

const QR_MODULE_SIZE_STYLES = new Set<QraftyDataModulesStyle>([
  "circle",
  "diamond",
  "hashtag",
  "heart",
  "pinched-square",
  "square",
  "star",
])

const QR_MODULE_LINE_WIDTH_STYLES = new Set<QraftyDataModulesStyle>([
  "circuit-board",
  "horizontal-line",
  "rounded",
  "vertical-line",
])

function formatModuleScaleValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function QrModuleGeometrySlider({ model }: { model: DesktopInspectorModel }) {
  const { actualPatternSettings, onPatternSettingsChange } = model
  const dotType = actualPatternSettings.qrDotType

  if (QR_MODULE_SIZE_STYLES.has(dotType)) {
    return (
      <SettingsSlider
        formatValue={formatModuleScaleValue}
        label="Module size"
        max={1}
        min={0.25}
        step={0.05}
        value={actualPatternSettings.moduleSize ?? 1}
        onChange={(moduleSize) => onPatternSettingsChange({ moduleSize })}
      />
    )
  }

  if (QR_MODULE_LINE_WIDTH_STYLES.has(dotType)) {
    return (
      <SettingsSlider
        formatValue={formatModuleScaleValue}
        label="Line width"
        max={1}
        min={0.1}
        step={0.05}
        value={
          actualPatternSettings.moduleLineWidth ??
          (dotType === "circuit-board" ? 0.5 : 1)
        }
        onChange={(moduleLineWidth) => onPatternSettingsChange({ moduleLineWidth })}
      />
    )
  }

  return null
}

const LOGO_SOURCE_TABS = ["Brand", "Upload", "None"] as const
type LogoSettingsTab = (typeof LOGO_SOURCE_TABS)[number]

function logoSourceTab(sourceMode: DesktopLogoSettings["sourceMode"]): LogoSettingsTab {
  if (sourceMode === "brand") return "Brand"
  if (sourceMode === "none") return "None"
  return "Upload"
}

export function QrStyleSection({ model }: { model: DesktopInspectorModel }) {
  const [tab, setTab] = useState(() => getInspectorSectionTab("qr-style", "Module"))
  const {
    actualCornersSettings,
    actualEncodingSettings,
    actualLogoSettings,
    actualPatternSettings,
    onCornersSettingsChange,
    onEncodingSettingsChange,
    onLogoSettingsChange,
    onPatternSettingsChange,
  } = model

  const errorCorrectionIndex = Math.max(
    0,
    ERROR_CORRECTION_LEVEL_OPTIONS.findIndex(
      (option) => option.value === actualEncodingSettings.errorCorrectionLevel,
    ),
  )
  const logoSource = logoSourceTab(actualLogoSettings.sourceMode)

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
      <SettingsLabeledSelect
        items={["Module", "Eye", "Frame", "Logo"]}
        placeholder="Part"
        value={tab}
        onChange={(nextTab) => {
          setTab(nextTab)
          setInspectorSectionTab("qr-style", nextTab)
        }}
      />

      <SettingsTabPanel activeKey={tab}>
        {tab === "Logo" ? (
          <>
            <SettingsLabeledSelect
              items={LOGO_SOURCE_TABS}
              label="Source"
              placeholder="Source"
              value={logoSourceTab(actualLogoSettings.sourceMode)}
              onChange={(next) => {
                const nextSource = next as LogoSettingsTab

                if (nextSource === "Brand") {
                  onLogoSettingsChange({
                    sourceMode: "brand",
                    selectedBrandIconId:
                      actualLogoSettings.selectedBrandIconId ||
                      POPULAR_BRAND_ICON_IDS[0],
                  })
                  return
                }

                onLogoSettingsChange({
                  sourceMode: nextSource === "Upload" ? "upload" : "none",
                })
              }}
            />

            {logoSource === "Upload" ? (
              <SettingsOptionShelf
                ariaLabel="Logo upload"
                dataSlot="logo-upload-grid"
                persistKey="qr-logo-upload"
              >
                <SettingsImageUploadTile
                  fluid
                  ariaLabel="Upload custom logo"
                  className="dn-row-upload-tile"
                  imageUrl={actualLogoSettings.customImageUrl}
                  onClear={() => onLogoSettingsChange({ uploadedImageUrl: "" })}
                  onUpload={(imageUrl) =>
                    onLogoSettingsChange({ uploadedImageUrl: imageUrl })
                  }
                />
              </SettingsOptionShelf>
            ) : logoSource === "None" ? null : (
              <SettingsOptionShelf
                activeKey={actualLogoSettings.selectedBrandIconId}
                ariaLabel="Logo options"
                dataSlot="logo-brand-grid"
                persistKey="qr-logo-brands"
              >
                {POPULAR_BRAND_ICON_IDS.map((iconId) => {
                  const brandIcon = getBrandIconById(iconId)
                  const isSelected =
                    !actualLogoSettings.customImageUrl &&
                    actualLogoSettings.selectedBrandIconId === iconId

                  return (
                    <button
                      key={iconId}
                      aria-label={`Use ${brandIcon.label} logo`}
                      aria-pressed={isSelected}
                      className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
                      title={brandIcon.label}
                      type="button"
                      onClick={() =>
                        onLogoSettingsChange({
                          selectedBrandIconId: iconId,
                          sourceMode: "brand",
                        })
                      }
                    >
                      <span className="relative z-10 grid size-full place-items-center">
                        <LogoPickerTileIcon iconId={iconId} />
                      </span>
                    </button>
                  )
                })}
                <SettingsTilePopover
                  contentClassName="w-[18rem]"
                  title="Logo"
                  content={
                    <LogoIconPicker
                      selectedId={actualLogoSettings.selectedBrandIconId}
                      onSelect={(selectedBrandIconId) => {
                        onLogoSettingsChange({ selectedBrandIconId, sourceMode: "brand" })
                      }}
                    />
                  }
                >
                  <button
                    aria-label="More logo options"
                    className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
                    title="More"
                    type="button"
                  >
                    <span className="relative z-10 grid size-full place-items-center">
                      <Ellipsis aria-hidden className="size-4" />
                    </span>
                  </button>
                </SettingsTilePopover>
              </SettingsOptionShelf>
            )}

            {logoSource === "None" ? null : (
              <SettingsSlider
                label="Size"
                max={100}
                value={actualLogoSettings.size}
                onChange={(size) => onLogoSettingsChange({ size })}
              />
            )}
          </>
        ) : part ? (
          <QrStylePreviewGrid
            options={part.options}
            previewKind={part.previewKind}
            selected={part.selected}
            onSelect={part.onSelect}
          />
        ) : null}
      </SettingsTabPanel>

      {tab === "Module" ? (
        <QrModuleGeometrySlider model={model} />
      ) : null}

      <SettingsSlider
        formatValue={formatQrTypeNumberLabel}
        label="Min version"
        max={TYPE_NUMBER_MAX}
        min={TYPE_NUMBER_MIN}
        step={1}
        value={actualEncodingSettings.typeNumber}
        onChange={(typeNumber) =>
          onEncodingSettingsChange({ typeNumber: typeNumber as QrTypeNumber })
        }
      />

      <SettingsSlider
        formatValue={(index) =>
          ERROR_CORRECTION_LEVEL_OPTIONS[index]?.label ?? "Q"
        }
        label="Error correction"
        max={ERROR_CORRECTION_LEVEL_OPTIONS.length - 1}
        min={0}
        step={1}
        value={errorCorrectionIndex}
        onChange={(index) => {
          const option = ERROR_CORRECTION_LEVEL_OPTIONS[index]
          if (option) onEncodingSettingsChange({ errorCorrectionLevel: option.value })
        }}
      />
    </div>
  )
}

function QrColorUnifiedSettings({
  model,
  unifiedSettings,
  onApplyUnifiedPatches,
}: {
  model: DesktopInspectorModel
  unifiedSettings: UnifiedQrFillSettings
  onApplyUnifiedPatches: (patches: UnifiedQrFillPatches) => void
}) {
  const { actualPatternSettings } = model
  const moduleFill = readPatternModuleFillCss(actualPatternSettings)

  return (
    <QrColorFillControls
      moduleCapable
      fillPreviewImageUrl={
        isPatternModuleImageFill(actualPatternSettings)
          ? actualPatternSettings.moduleFillImageUrl
          : undefined
      }
      moduleFillMode={actualPatternSettings.dotsColorMode}
      moduleImage={{
        imageUrl: actualPatternSettings.moduleFillImageUrl,
        onUpload: (imageUrl, sourceMode = "upload") =>
          onApplyUnifiedPatches(
            applyUnifiedQrModuleImageUrl(imageUrl, sourceMode, unifiedSettings),
          ),
        onClear: () =>
          onApplyUnifiedPatches(
            applyUnifiedQrModuleImageUrl("", "upload", unifiedSettings),
          ),
      }}
      modulePattern={{
        selectedPalette: actualPatternSettings.dotsPalette,
        selectedPreset: actualPatternSettings.dotsPalettePreset,
        onSelect: (preset) =>
          onApplyUnifiedPatches(
            applyUnifiedQrModulePatternPatch(
              preset === "custom"
                ? { dotsColorMode: "palette", dotsPalettePreset: "custom" }
                : {
                    dotsColorMode: "palette",
                    dotsPalette: [...preset.colors],
                    dotsPalettePreset: preset.label,
                  },
              unifiedSettings,
            ),
          ),
        onPaletteColorChange: (index, color) =>
          onApplyUnifiedPatches(
            applyUnifiedQrModulePatternPatch(
              {
                dotsColorMode: "palette",
                dotsPalettePreset: "custom",
                dotsPalette: actualPatternSettings.dotsPalette.map((current, paletteIndex) =>
                  paletteIndex === index ? color : current,
                ),
              },
              unifiedSettings,
            ),
          ),
      }}
      persistKey="qr-color-unified"
      qrGradient
      value={moduleFill}
      onValueChange={(fill) => onApplyUnifiedPatches(applyUnifiedQrFill(fill, unifiedSettings))}
    />
  )
}

function QrColorPerPartSettings({
  model,
  tab,
  onTabChange,
}: {
  model: DesktopInspectorModel
  tab: string
  onTabChange: (nextTab: string) => void
}) {
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

  return (
    <>
      <QrColorPartBrowser
        selected={tab}
        onSelect={(nextPart) => onTabChange(nextPart)}
      />

      <SettingsTabPanel activeKey={tab}>
        {tab === "Logo" ? (
          <QrColorFillControls
            persistKey="qr-color-logo"
            qrGradient
            value={logoFill}
            onValueChange={(fill) => onLogoSettingsChange(applyLogoFill(fill, actualLogoSettings))}
          />
        ) : tab === "Module" ? (
          <QrColorFillControls
            moduleCapable
            fillPreviewImageUrl={
              isPatternModuleImageFill(actualPatternSettings)
                ? actualPatternSettings.moduleFillImageUrl
                : undefined
            }
            moduleFillMode={actualPatternSettings.dotsColorMode}
            moduleImage={{
              imageUrl: actualPatternSettings.moduleFillImageUrl,
              onUpload: (imageUrl, sourceMode = "upload") =>
                onPatternSettingsChange(applyPatternModuleImageUrl(imageUrl, sourceMode)),
              onClear: () =>
                onPatternSettingsChange(applyPatternModuleImageUrl("", "upload")),
            }}
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
            persistKey="qr-color-module"
            qrGradient
            value={moduleFill}
            onValueChange={(fill) =>
              onPatternSettingsChange(applyPatternModuleFill(fill, actualPatternSettings))
            }
          />
        ) : tab === "Eye" || tab === "Frame" ? (
          <QrColorFillControls
            persistKey={`qr-color-${tab.toLowerCase()}`}
            qrGradient
            value={tab === "Eye" ? eyeFill : frameFill}
            onValueChange={(fill) =>
              onCornersSettingsChange(
                applyCornerFill(fill, tab === "Eye" ? "eye" : "frame", actualCornersSettings),
              )
            }
          />
        ) : null}
      </SettingsTabPanel>
    </>
  )
}

export function QrColorSection({ model }: { model: DesktopInspectorModel }) {
  const [tab, setTab] = useState(() => getInspectorSectionTab("qr-style", "Module"))
  const {
    actualCornersSettings,
    actualLogoSettings,
    actualPatternSettings,
    onCornersSettingsChange,
    onLogoSettingsChange,
    onPatternSettingsChange,
  } = model

  const isUnified = actualPatternSettings.gradientLinkMode === "unified"
  const unifiedSettings: UnifiedQrFillSettings = {
    pattern: actualPatternSettings,
    corners: actualCornersSettings,
    logo: actualLogoSettings,
  }

  function applyUnifiedPatches(patches: UnifiedQrFillPatches) {
    if (model.onUnifiedQrFillSettingsChange) {
      model.onUnifiedQrFillSettingsChange(patches)
      return
    }

    onPatternSettingsChange(patches.pattern)
    onCornersSettingsChange(patches.corners)
    onLogoSettingsChange(patches.logo)
  }

  function handleColorSeparatelyChange(checked: boolean) {
    if (!checked) {
      const moduleFillCss = readPatternModuleFillCss(actualPatternSettings)
      const fill = parseFill(moduleFillCss)

      if (fill) {
        applyUnifiedPatches(applyUnifiedQrFill(fill, unifiedSettings))
        return
      }

      onPatternSettingsChange({ gradientLinkMode: "unified" })
      return
    }

    onPatternSettingsChange({ gradientLinkMode: "split" })
  }

  function handlePartTabChange(nextTab: string) {
    setTab(nextTab)
    setInspectorSectionTab("qr-style", nextTab)
  }

  return (
    <div className="dn-section-stack w-full min-w-0 max-w-full">
      <SettingsSwitchRow
        checked={!isUnified}
        label="Color separately"
        onChange={handleColorSeparatelyChange}
      />
      {isUnified ? (
        <QrColorUnifiedSettings
          model={model}
          unifiedSettings={unifiedSettings}
          onApplyUnifiedPatches={applyUnifiedPatches}
        />
      ) : (
        <QrColorPerPartSettings model={model} tab={tab} onTabChange={handlePartTabChange} />
      )}
    </div>
  )
}

export function CardSection({ model }: { model: DesktopInspectorModel }) {
  const { actualShapeSettings, onShapeSettingsChange } = model
  const cardFill = readShapeFillCss(actualShapeSettings)
  const [fillMode, setFillMode] = useState<BackgroundFillModeTab>(() =>
    backgroundFillModeTab(cardFill),
  )

  return (
    <div className={SECTION_STACK}>
      <ShapeCatalogueSelect
        selected={actualShapeSettings.backgroundShapeId}
        onSelect={(backgroundShapeId) => onShapeSettingsChange({ backgroundShapeId })}
      />
      <SettingsLabeledSelect
        items={BACKGROUND_FILL_MODE_TABS}
        label="Fill"
        placeholder="Fill"
        value={fillMode}
        onChange={(next) => setFillMode(next as BackgroundFillModeTab)}
      />
      <FillModePresetControls
        mode={fillMode}
        value={cardFill}
        applyFill={(fill) => onShapeSettingsChange(applyShapeFill(fill, actualShapeSettings))}
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

const BACKGROUND_FILL_MODE_TABS = ["Solid", "Linear", "Radial"] as const
type BackgroundFillModeTab = (typeof BACKGROUND_FILL_MODE_TABS)[number]

function backgroundFillModeTab(fill: string): BackgroundFillModeTab {
  if (fill.startsWith("radial-gradient")) return "Radial"
  if (fill.startsWith("linear-gradient")) return "Linear"
  return "Solid"
}

function FillModePresetControls({
  applyFill,
  mode,
  value,
}: {
  applyFill: (fill: Fill) => void
  mode: BackgroundFillModeTab
  value: string
}) {
  const presets =
    mode === "Solid"
      ? SETTINGS_FILL_SOLID_PRESETS
      : mode === "Linear"
        ? SETTINGS_FILL_LINEAR_PRESETS
        : SETTINGS_FILL_RADIAL_PRESETS

  return (
    <SettingsFillPresetSection
      lockedFillMode={mode === "Solid" ? "solid" : "gradient"}
      presets={presets}
      qrGradient
      value={value}
      onSelect={(fill) => applyFill(fill)}
    />
  )
}

type SceneBackgroundTab = "Shader" | "Image" | BackgroundFillModeTab

const SCENE_BACKGROUND_TABS: readonly SceneBackgroundTab[] = [
  "Shader",
  "Image",
  ...BACKGROUND_FILL_MODE_TABS,
]

function normalizeSceneBackgroundTab(tab: string, cardFill: string): SceneBackgroundTab {
  if (tab === "Shader" || tab === "Image") return tab
  if ((BACKGROUND_FILL_MODE_TABS as readonly string[]).includes(tab)) {
    return tab as BackgroundFillModeTab
  }
  return backgroundFillModeTab(cardFill)
}

function backgroundTabFromStyleMode(
  styleMode: DesktopInspectorModel["actualBackgroundSettings"]["styleMode"],
  cardFill: string,
): SceneBackgroundTab {
  if (styleMode === "image" || styleMode === "image-filter") {
    return "Image"
  }

  if (styleMode === "paper-shader") {
    return "Shader"
  }

  return backgroundFillModeTab(cardFill)
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
  const [tab, setTab] = useState<SceneBackgroundTab>(() =>
    normalizeSceneBackgroundTab(
      getInspectorSectionTab(
        "background",
        backgroundTabFromStyleMode(
          actualBackgroundSettings.styleMode,
          actualShapeSettings.cardFill,
        ),
      ),
      actualShapeSettings.cardFill,
    ),
  )
  const paperShader = actualBackgroundSettings.paperShader
  const backgroundFill = actualShapeSettings.cardFill

  function handleBackgroundTabChange(nextTab: string) {
    const resolvedTab = normalizeSceneBackgroundTab(nextTab, backgroundFill)
    setTab(resolvedTab)
    setInspectorSectionTab("background", resolvedTab)
    controller?.onCanvasBackgroundTabChange?.(
      resolvedTab === "Shader" ? "shader" : resolvedTab === "Image" ? "image" : "color",
    )
  }

  return (
    <div className={SECTION_STACK}>
      <SettingsLabeledSelect
        items={SCENE_BACKGROUND_TABS}
        label="Fill"
        placeholder="Background"
        value={tab}
        onChange={handleBackgroundTabChange}
      />
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
          <WallpaperPreviewRow
            selectedPath={actualImageSettings.remoteUrl ?? ""}
            onClear={() =>
              onImageSettingsChange({ remoteUrl: "", sourceMode: "upload" })
            }
            onSelect={(imagePath) =>
              onImageSettingsChange({ remoteUrl: imagePath, sourceMode: "url" })
            }
            onUpload={(imageUrl) =>
              onImageSettingsChange({ remoteUrl: imageUrl, sourceMode: "upload" })
            }
          />
        ) : (
          <FillModePresetControls
            mode={tab}
            value={backgroundFill}
            applyFill={(fill) => onShapeSettingsChange(applyCardFill(fill))}
          />
        )}
      </SettingsTabPanel>
    </div>
  )
}

export function MotionSection({ model }: { model: DesktopInspectorModel }) {
  const { actualMotionSettings, onMotionSettingsChange } = model
  const loader = actualMotionSettings.loader
  const usesPeakColor = !isScaleOnlyDotMatrixLoader(loader)

  return (
    <div className={SECTION_STACK}>
      <SettingsSwitchRow
        checked={actualMotionSettings.enabled}
        label="Enabled"
        onChange={(enabled) => onMotionSettingsChange({ enabled })}
      />
      {actualMotionSettings.enabled ? (
        <>
          <MotionPresetSelect
            selected={loader}
            onSelect={(nextLoader) =>
              onMotionSettingsChange({
                loader: nextLoader,
                preset: nextLoader,
                presetCategory: "dotMatrix",
              })
            }
          />
          <SettingsSlider
            label="Speed"
            max={100}
            min={0}
            value={dotMatrixAnimationSpeedToSliderPercent(actualMotionSettings.speed)}
            onChange={(speedPercent) =>
              onMotionSettingsChange({
                speed: sliderPercentToDotMatrixAnimationSpeed(speedPercent),
              })
            }
          />
          {usesPeakColor ? (
            <MotionColorControls
              animation={actualMotionSettings}
              onChange={onMotionSettingsChange}
            />
          ) : null}
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
    case "Color":
      body = <QrColorSection model={model} />
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
