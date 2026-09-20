"use client"

import {
  Check,
  Droplet,
  Layers,
  Pipette,
  Plus,
  X,
} from "lucide-react"
import { AnimatePresence, m } from "motion/react"
import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"

import { parseFill } from "@/components/ui/fill-picker/lib/gradient"
import type { Fill } from "@/components/ui/fill-picker-base/public-api"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MobileRedoIcon,
  MobileUndoIcon,
} from "@/features/desktop-shell/components/MobileHistoryIcons"
import { MobileLayerToolbar } from "@/features/desktop-shell/components/MobileLayerToolbar"
import {
  MobileSettingsDrawer,
  MOBILE_DRAWER_DETAIL_VIEW,
  MOBILE_DRAWER_SECTION_VIEW,
} from "@/features/desktop-shell/components/MobileSettingsDrawer"
import {
  clearMobileWorkspaceChromeInsets,
  syncMobileWorkspaceChromeInsets,
} from "@/features/desktop-shell/components/mobile-layer-toolbar-sync"
import { getMobileKeyboardInsetPx } from "@/features/desktop-shell/components/mobile-family-drawer-viewport"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import {
  applyCardFill,
  applyPatternModuleFill,
  applyPatternModuleImageUrl,
  applyUnifiedQrFill,
  applyUnifiedQrModuleImageUrl,
  applyUnifiedQrModulePatternPatch,
  isPatternModuleImageFill,
  readPatternModuleFillCss,
  type UnifiedQrFillPatches,
  type UnifiedQrFillSettings,
} from "@/features/desktop-shell/inspector/desktopnew-settings-bridge"
import {
  DESKTOP_SETTINGS_SECTIONS,
  getDesktopSettingsSectionLabel,
  type DesktopSettingsSectionId,
} from "@/features/desktop-shell/inspector/desktopnew-settings-panel-meta"
import {
  ShapeGlyph,
  shapeViewBox,
  SQUARE_SHAPE_VIEWBOX,
} from "@/features/desktop-shell/inspector/desktopnew-settings-sections"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { setInspectorSectionTab } from "@/features/desktop-shell/inspector/inspector-chrome-state"
import {
  MobileDrawerNavigationProvider,
  useMobileDrawerNavigation,
} from "@/features/desktop-shell/inspector/mobile-drawer-navigation-context"
import { MobileInspectorDensityContext } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import {
  QR_STYLE_PART_DEFINITIONS,
  type QrStylePartId,
} from "@/features/desktop-shell/inspector/qr-style-parts"
import { DESKTOP_DOTS_PALETTE_PRESETS } from "@/features/desktop-shell/inspector/desktopnew-pattern-palettes"
import { PaletteColorBarPreview } from "@/features/desktop-shell/inspector/palette-color-bar-preview"
import { getActiveFillPresetForStoredValue } from "@/features/desktop-shell/inspector/settings-fill-preset-match"
import {
  SETTINGS_FILL_LINEAR_PRESETS,
  SETTINGS_FILL_RADIAL_PRESETS,
  SETTINGS_FILL_SOLID_PRESETS,
} from "@/features/desktop-shell/inspector/settings-fill-presets"
import {
  SETTINGS_FILL_OPTION_TILE,
  SETTINGS_FILL_OPTION_TILE_INNER,
  SETTINGS_PATTERN_OPTION_TILE_INNER,
  SETTINGS_PREVIEW_TILE,
} from "@/features/desktop-shell/inspector/settings-preview-tiles"
import { SettingsSectionIconFor } from "@/features/desktop-shell/inspector/settings-section-icons"
import { QrStyleOptionPreview } from "@/features/qr-code/components/QrStyleOptionPreview"
import { ContentTypeGridIcon } from "@/features/qr-code/content/ContentTypeGridIcon"
import {
  PICKER_QR_INPUT_TYPES,
  QR_INPUT_OPTIONS,
  type QrInputType,
} from "@/features/qr-code/content/input-options"
import { QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS } from "@/features/qr-code/model/state"
import { QR_BACKGROUND_SHAPES } from "@/features/qr-code/styles/background-shapes"
import type { DesktopPatternSettings } from "@/features/desktop-shell/model/desktop-toolbar-types"
import { SCENE_WALLPAPERS } from "@/features/workspace/assets/scene-wallpapers"
import { PaperShaderOptionPreview } from "@/features/workspace/components/PaperShaderOptionPreview"
import { WallpaperOptionPreview } from "@/features/workspace/components/WallpaperOptionPreview"
import { createDefaultDraftingCardPaperShader } from "@/features/workspace/model/card-state"
import { getCardGeneratedShaderDefinitions } from "@/features/workspace/rendering/paper-shader-definitions"
import { cn } from "@/lib/utils"

// Heavy detail surfaces load on demand — the rail shouldn't pay for pickers,
// insert menus, and layer tools before a detail page is pushed.
const LazyDesktopNewFillPicker = lazy(() =>
  import("@/features/desktop-shell/inspector/desktopnew-fill-picker").then(
    (module) => ({ default: module.DesktopNewFillPicker }),
  ),
)
const LazyInsertMenuPanelStack = lazy(() =>
  import("@/features/workspace/components/insert-menu/InsertMenuPanelStack").then(
    (module) => ({ default: module.InsertMenuPanelStack }),
  ),
)
const LazyDesktopLayersPopoverContent = lazy(() =>
  import("@/features/desktop-shell/components/DesktopLayersPopoverContent").then(
    (module) => ({ default: module.DesktopLayersPopoverContent }),
  ),
)
// The upload tile drags in the image cropper + scene codec — only fetch it when
// an image fill mode is actually browsed.
const LazySettingsImageUploadTile = lazy(() =>
  import("@/features/desktop-shell/inspector/settings-fill-option-grid").then(
    (module) => ({ default: module.SettingsImageUploadTile }),
  ),
)

import "@/features/desktop-shell/inspector/desktopnew.css"
import "@/features/desktop-shell/inspector/mobile-inspector.css"

const MOBILE_RAIL_BOTTOM_GAP_PX = 16

type MobileRailOption = {
  id: string
  label: string
  icon?: ReactNode
  /** Circle + label (default) or a plain text pill. */
  shape?: "circle" | "pill"
  /** Style part this option drills into, swapping the row for its catalogue. */
  drillsTo?: QrStylePartId
}

const RAIL_OPTION_ICON_CLASS = "dn-mobile-settings-rail__icon"

/** QR style parts, mirroring the `Part` control in the Style section. */
const QR_STYLE_PART_OPTIONS: MobileRailOption[] = [
  { id: "Module", label: "Module", shape: "pill", drillsTo: "Module" },
  { id: "Eye", label: "Eye", shape: "pill", drillsTo: "Eye" },
  { id: "Frame", label: "Frame", shape: "pill", drillsTo: "Frame" },
  { id: "Logo", label: "Logo", shape: "pill" },
]

/**
 * Options a family drills into. Families without an entry keep the rail on the
 * top-level list.
 */
const MOBILE_FAMILY_OPTIONS: Partial<Record<DesktopSettingsSectionId, MobileRailOption[]>> = {
  Content: PICKER_QR_INPUT_TYPES.map((type) => ({
    id: type,
    label: QR_INPUT_OPTIONS[type].label,
    icon: <ContentTypeGridIcon className={RAIL_OPTION_ICON_CLASS} type={type} />,
  })),
  QR: QR_STYLE_PART_OPTIONS,
}

/**
 * Second drill level: the style catalogue for one part, rendered in place of
 * the part row. Picking a tile applies it straight to the QR, so the rail stays
 * a quick-pick surface and the drawer is only needed for the long tail.
 */
function QrStylePartOptions({
  model,
  partId,
}: {
  model: DesktopInspectorModel
  partId: QrStylePartId
}) {
  const part = QR_STYLE_PART_DEFINITIONS[partId]
  const selected = part.readSelected(model)

  return part.options.map((option) => (
    <button
      key={option.value}
      aria-label={option.label}
      aria-pressed={selected === option.value}
      className={cn(SETTINGS_PREVIEW_TILE, "text-center")}
      data-slot="mobile-rail-style-option"
      title={option.label}
      type="button"
      onClick={() => part.applySelected(model, option.value)}
    >
      <span
        aria-hidden="true"
        className="grid size-full place-items-center overflow-hidden p-0.5 dn-squircle-xs"
      >
        <QrStyleOptionPreview
          className="size-full max-h-full max-w-full"
          previewKind={part.previewKind}
          value={option.value}
        />
      </span>
    </button>
  ))
}

type MobileRailRowProps = {
  model: DesktopInspectorModel
  /** Opens the family drawer on this family's section (long-tail controls). */
  openDrawer: () => void
}

/**
 * Detail callbacks run after the row re-rendered, so they must read the latest
 * model — the ReactNode handed to `openDetail` captures props at open time.
 */
function useLatestModel(model: DesktopInspectorModel) {
  const ref = useRef(model)
  useEffect(() => {
    ref.current = model
  })
  return ref
}

/**
 * Browse mode shared between a family row (options in the scrollarea) and its
 * footer pills (mode switcher below it). `mode` is always resolved — the rail
 * fills it with the value derived from the model when nothing was browsed yet.
 */
const MobileRailModeContext = createContext<{
  mode: string | undefined
  setMode: (mode: string) => void
} | null>(null)

const QR_COLOR_FILL_MODES = [
  { id: "solid", label: "Solid" },
  { id: "linear", label: "Linear" },
  { id: "radial", label: "Radial" },
  { id: "image", label: "Image" },
  { id: "pattern", label: "Pattern" },
] as const

const SCENE_FILL_MODES = [
  { id: "solid", label: "Solid" },
  { id: "linear", label: "Linear" },
  { id: "radial", label: "Radial" },
  { id: "image", label: "Image" },
  { id: "shader", label: "Shader" },
] as const

function qrFillModeFromPattern(settings: DesktopPatternSettings): string {
  if (isPatternModuleImageFill(settings)) {
    return "image"
  }
  if (settings.dotsColorMode === "palette") {
    return "pattern"
  }
  if (settings.dotsColorMode === "gradient") {
    return readPatternModuleFillCss(settings).startsWith("radial-gradient")
      ? "radial"
      : "linear"
  }
  return "solid"
}

function sceneFillModeFromModel(model: DesktopInspectorModel): string {
  const styleMode = model.actualBackgroundSettings.styleMode
  if (styleMode === "image" || styleMode === "image-filter") {
    return "image"
  }
  if (styleMode === "paper-shader") {
    return "shader"
  }
  const css = model.actualShapeSettings.cardFill
  if (css.startsWith("radial-gradient")) {
    return "radial"
  }
  if (css.startsWith("linear-gradient")) {
    return "linear"
  }
  return "solid"
}

/** The mode a family's pills should light up before anything is browsed. */
function defaultFamilyMode(
  family: DesktopSettingsSectionId,
  model: DesktopInspectorModel,
): string | undefined {
  if (family === "Color") {
    return qrFillModeFromPattern(model.actualPatternSettings)
  }
  if (family === "Background") {
    return sceneFillModeFromModel(model)
  }
  return undefined
}

function fillPresetsForMode(mode: string): readonly string[] {
  if (mode === "linear") {
    return SETTINGS_FILL_LINEAR_PRESETS
  }
  if (mode === "radial") {
    return SETTINGS_FILL_RADIAL_PRESETS
  }
  return SETTINGS_FILL_SOLID_PRESETS
}

/** Solid/gradient swatch tile for the rail. */
function MobileRailSwatchTile({
  ariaLabel,
  fill,
  onSelect,
  selected,
}: {
  ariaLabel: string
  fill: string
  onSelect: () => void
  selected: boolean
}) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={selected}
      className={SETTINGS_FILL_OPTION_TILE}
      data-slot="mobile-rail-option"
      title={ariaLabel}
      type="button"
      onClick={onSelect}
    >
      <span aria-hidden="true" className={SETTINGS_FILL_OPTION_TILE_INNER}>
        <span className="size-full dn-squircle-xs" style={{ background: fill }} />
      </span>
    </button>
  )
}

/** Picker-symbol tile — mirrors the `+` tile in `SettingsFillOptionGrid`. */
function MobileRailPickerTile({
  ariaLabel,
  customFill,
  onOpen,
}: {
  ariaLabel: string
  /** Active custom value; shown behind the pipette when the fill isn't a preset. */
  customFill?: string
  onOpen: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={SETTINGS_FILL_OPTION_TILE}
      data-slot="mobile-rail-option"
      title={ariaLabel}
      type="button"
      onClick={onOpen}
    >
      <span aria-hidden="true" className={SETTINGS_FILL_OPTION_TILE_INNER}>
        <span
          className="grid size-full place-items-center dn-squircle-xs"
          style={customFill ? { background: customFill } : undefined}
        >
          <span
            className={cn(
              "grid place-items-center text-[var(--dn-fg)]",
              customFill
                ? "size-5 rounded-full bg-[color-mix(in_srgb,var(--dn-bg)_88%,transparent)]"
                : "size-full bg-[color-mix(in_srgb,var(--dn-muted)_40%,transparent)] dn-squircle-xs",
            )}
          >
            <Pipette className="size-4" strokeWidth={2.5} />
          </span>
        </span>
      </span>
    </button>
  )
}

function MobileRailPill({
  label,
  onClick,
  pressed,
}: {
  label: string
  onClick: () => void
  pressed?: boolean
}) {
  return (
    <button
      aria-pressed={pressed}
      className="dn-mobile-settings-rail__item dn-mobile-settings-rail__item--pill"
      type="button"
      onClick={onClick}
    >
      <span className="dn-mobile-settings-rail__pill">{label}</span>
    </button>
  )
}

function MobileRailCircleOption({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      className="dn-mobile-settings-rail__item"
      type="button"
      onClick={onClick}
    >
      <span className="dn-mobile-settings-rail__circle">{icon}</span>
      <span className="dn-mobile-settings-rail__label">{label}</span>
    </button>
  )
}

function unifiedQrSettings(model: DesktopInspectorModel): UnifiedQrFillSettings {
  return {
    pattern: model.actualPatternSettings,
    corners: model.actualCornersSettings,
    logo: model.actualLogoSettings,
  }
}

function applyUnifiedPatches(model: DesktopInspectorModel, patches: UnifiedQrFillPatches) {
  if (model.onUnifiedQrFillSettingsChange) {
    model.onUnifiedQrFillSettingsChange(patches)
    return
  }
  model.onPatternSettingsChange(patches.pattern)
  model.onCornersSettingsChange(patches.corners)
  model.onLogoSettingsChange(patches.logo)
}

/** Applies a fill to module dots — fans out to eye/frame/logo when unified. */
function applyQrFill(model: DesktopInspectorModel, fill: Fill) {
  if (model.actualPatternSettings.gradientLinkMode === "unified") {
    applyUnifiedPatches(model, applyUnifiedQrFill(fill, unifiedQrSettings(model)))
    return
  }
  model.onPatternSettingsChange(applyPatternModuleFill(fill, model.actualPatternSettings))
}

/** Dots-palette fills are module-only, but unified mode still syncs the rest. */
function applyQrPalette(
  model: DesktopInspectorModel,
  preset: { label: string; colors: string[] },
) {
  const patch: Partial<DesktopPatternSettings> = {
    dotsColorMode: "palette",
    dotsPalette: [...preset.colors],
    dotsPalettePreset: preset.label,
  }
  if (model.actualPatternSettings.gradientLinkMode === "unified") {
    applyUnifiedPatches(
      model,
      applyUnifiedQrModulePatternPatch(patch, unifiedQrSettings(model)),
    )
    return
  }
  model.onPatternSettingsChange(patch)
}

function applyQrImageFill(
  model: DesktopInspectorModel,
  imageUrl: string,
  sourceMode: DesktopPatternSettings["moduleFillImageSourceMode"],
) {
  if (model.actualPatternSettings.gradientLinkMode === "unified") {
    applyUnifiedPatches(
      model,
      applyUnifiedQrModuleImageUrl(imageUrl, sourceMode, unifiedQrSettings(model)),
    )
    return
  }
  model.onPatternSettingsChange(applyPatternModuleImageUrl(imageUrl, sourceMode))
}

/** Wallpaper + upload tiles for image fills — shared by Color and Background. */
function MobileRailImageOptions({
  imageUrl,
  onClear,
  onSelect,
  onUpload,
}: {
  imageUrl: string
  onClear: () => void
  onSelect: (imagePath: string) => void
  onUpload: (imageUrl: string) => void
}) {
  const customImageUrl =
    imageUrl && !SCENE_WALLPAPERS.some((w) => w.path === imageUrl) ? imageUrl : ""

  return (
    <>
      <Suspense fallback={null}>
        <LazySettingsImageUploadTile
          className="dn-mobile-settings-rail__upload-tile"
          imageUrl={customImageUrl}
          onClear={onClear}
          onUpload={onUpload}
        />
      </Suspense>
      {SCENE_WALLPAPERS.map((wallpaper) => (
        <button
          key={wallpaper.id}
          aria-label={`Use ${wallpaper.label} image`}
          aria-pressed={imageUrl === wallpaper.path}
          className={cn(SETTINGS_PREVIEW_TILE)}
          data-slot="mobile-rail-option"
          title={wallpaper.label}
          type="button"
          onClick={() => onSelect(wallpaper.path)}
        >
          <WallpaperOptionPreview
            alt={wallpaper.label}
            className="relative z-10 block size-full overflow-hidden dn-squircle-xs"
            previewPath={wallpaper.previewPath}
          />
        </button>
      ))}
    </>
  )
}

function MobileColorRailRow({ model, openDrawer }: MobileRailRowProps) {
  const navigation = useMobileDrawerNavigation()
  const railMode = useContext(MobileRailModeContext)
  const modelRef = useLatestModel(model)
  const mode = railMode?.mode ?? qrFillModeFromPattern(model.actualPatternSettings)
  const value = readPatternModuleFillCss(model.actualPatternSettings)

  if (mode === "pattern") {
    const { dotsPalette, dotsPalettePreset } = model.actualPatternSettings
    return (
      <>
        {DESKTOP_DOTS_PALETTE_PRESETS.map((preset) => {
          const isSelected =
            dotsPalettePreset === preset.label ||
            (dotsPalettePreset === "custom" && dotsPalette.join() === preset.colors.join())
          return (
            <button
              key={preset.label}
              aria-label={`Use ${preset.label} pattern`}
              aria-pressed={isSelected}
              className={cn(SETTINGS_PREVIEW_TILE)}
              data-slot="mobile-rail-option"
              title={preset.label}
              type="button"
              onClick={() => applyQrPalette(modelRef.current, preset)}
            >
              <span aria-hidden className={SETTINGS_PATTERN_OPTION_TILE_INNER}>
                <PaletteColorBarPreview
                  className="size-full"
                  colors={preset.colors}
                  size="md"
                />
              </span>
            </button>
          )
        })}
        <MobileRailPill label="More" onClick={openDrawer} />
      </>
    )
  }

  if (mode === "image") {
    const imageUrl = model.actualPatternSettings.moduleFillImageUrl
    return (
      <>
        <MobileRailImageOptions
          imageUrl={imageUrl}
          onClear={() => applyQrImageFill(modelRef.current, "", "upload")}
          onSelect={(path) => applyQrImageFill(modelRef.current, path, "url")}
          onUpload={(url) => applyQrImageFill(modelRef.current, url, "upload")}
        />
        <MobileRailPill label="More" onClick={openDrawer} />
      </>
    )
  }

  const presets = fillPresetsForMode(mode)
  const activePreset = getActiveFillPresetForStoredValue(value, presets)

  return (
    <>
      <MobileRailPickerTile
        ariaLabel="Custom color"
        customFill={activePreset ? undefined : value}
        onOpen={() =>
          navigation?.openDetail({
            title: "Color",
            content: (
              <Suspense fallback={null}>
                <div className="w-full min-w-0">
                  <LazyDesktopNewFillPicker
                    qrGradient
                    value={value}
                    onValueChange={(fill) => applyQrFill(modelRef.current, fill)}
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
          ariaLabel="Use this color"
          fill={preset}
          selected={activePreset === preset}
          onSelect={() => {
            const fill = parseFill(preset)
            if (fill) {
              applyQrFill(modelRef.current, fill)
            }
          }}
        />
      ))}
      <MobileRailPill label="More" onClick={openDrawer} />
    </>
  )
}

/** Pill switcher under the Color options row — browses the fill modes. */
function MobileColorRailFooter() {
  const railMode = useContext(MobileRailModeContext)

  return (
    <>
      {QR_COLOR_FILL_MODES.map((mode) => (
        <MobileRailPill
          key={mode.id}
          label={mode.label}
          pressed={railMode?.mode === mode.id}
          onClick={() => railMode?.setMode(mode.id)}
        />
      ))}
    </>
  )
}

function MobileMotionRailRow({ model, openDrawer }: MobileRailRowProps) {
  const { actualMotionSettings, onMotionSettingsChange } = model
  const enabled = actualMotionSettings.enabled

  return (
    <>
      <MobileRailPill
        label="Off"
        pressed={!enabled}
        onClick={() => onMotionSettingsChange({ enabled: false })}
      />
      {QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS.map((option) => (
        <MobileRailPill
          key={option.value}
          label={option.label}
          pressed={enabled && actualMotionSettings.loader === option.value}
          onClick={() =>
            onMotionSettingsChange({
              enabled: true,
              loader: option.value,
              preset: option.value,
              presetCategory: "dotMatrix",
            })
          }
        />
      ))}
      <MobileRailPill label="More" onClick={openDrawer} />
    </>
  )
}

function MobileShapeRailRow({ model, openDrawer }: MobileRailRowProps) {
  const selected = model.actualShapeSettings.backgroundShapeId

  return (
    <>
      <button
        aria-label="Use square shape"
        aria-pressed={selected === "none"}
        className={cn(SETTINGS_PREVIEW_TILE, "text-center")}
        data-slot="mobile-rail-option"
        title="Square"
        type="button"
        onClick={() => model.onShapeSettingsChange({ backgroundShapeId: "none" })}
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
          className={cn(SETTINGS_PREVIEW_TILE, "text-center")}
          data-slot="mobile-rail-option"
          title={option.label}
          type="button"
          onClick={() => model.onShapeSettingsChange({ backgroundShapeId: option.id })}
        >
          <span className="relative z-10 grid size-full place-items-center p-0.5 dn-preview-icon">
            <ShapeGlyph path={option.path} viewBox={shapeViewBox(option)} />
          </span>
        </button>
      ))}
      <MobileRailCircleOption
        icon={<Droplet className={RAIL_OPTION_ICON_CLASS} />}
        label="Fill"
        onClick={openDrawer}
      />
    </>
  )
}

function backgroundFillTabName(css: string): "Solid" | "Linear" | "Radial" {
  if (css.startsWith("radial-gradient")) return "Radial"
  if (css.startsWith("linear-gradient")) return "Linear"
  return "Solid"
}

function MobileBackgroundRailRow({ model, openDrawer }: MobileRailRowProps) {
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
        <MobileRailPill label="More" onClick={openDrawer} />
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
        <MobileRailPill label="More" onClick={openDrawer} />
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
                <div className="w-full min-w-0">
                  <LazyDesktopNewFillPicker
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
      <MobileRailPill label="More" onClick={openDrawer} />
    </>
  )
}

/**
 * Pill switcher under the Background options row. Mirrors
 * `SceneSection.handleBackgroundTabChange` — tapping a pill also activates
 * that canvas background mode so the preview reacts immediately.
 */
function MobileBackgroundRailFooter({ model }: MobileRailRowProps) {
  const railMode = useContext(MobileRailModeContext)
  const modelRef = useLatestModel(model)

  return (
    <>
      {SCENE_FILL_MODES.map((mode) => (
        <MobileRailPill
          key={mode.id}
          label={mode.label}
          pressed={railMode?.mode === mode.id}
          onClick={() => {
            railMode?.setMode(mode.id)
            setInspectorSectionTab(
              "background",
              mode.label as "Solid" | "Linear" | "Radial" | "Image" | "Shader",
            )
            modelRef.current.controller?.onCanvasBackgroundTabChange?.(
              mode.id === "shader" ? "shader" : mode.id === "image" ? "image" : "color",
            )
          }}
        />
      ))}
    </>
  )
}

function MobileElementsRailRow({ model, openDrawer }: MobileRailRowProps) {
  const navigation = useMobileDrawerNavigation()
  const modelRef = useLatestModel(model)

  const openAddElement = () => {
    const controller = modelRef.current.controller
    const nodeId = controller?.insertNodeId
    const onInsertLayer = controller?.onInsertLayer
    if (!navigation || !nodeId || !onInsertLayer) {
      openDrawer()
      return
    }
    navigation.openDetail({
      title: "Add element",
      content: (
        <Suspense fallback={null}>
          <LazyInsertMenuPanelStack
            canAddQrCode={controller?.canAddQrCode}
            isDesktopPopover
            nodeId={nodeId}
            onAddQrCode={controller?.onAddQrCode}
            onBrowseWallpapers={
              controller?.onOpenComposeSidebar
                ? () => controller.onOpenComposeSidebar?.("wallpapers")
                : undefined
            }
            onClose={() => navigation.closeDetail()}
            onInsertLayer={onInsertLayer}
          />
        </Suspense>
      ),
    })
  }

  const openLayers = () => {
    if (!navigation) {
      openDrawer()
      return
    }
    navigation.openDetail({
      title: "Layers",
      content: (
        <Suspense fallback={null}>
          <LazyDesktopLayersPopoverContent
            embedded
            canDeleteLayer={modelRef.current.controller?.canDeleteLayer}
            layersSettings={modelRef.current.actualLayersSettings}
            onLayerDelete={modelRef.current.controller?.onLayerDelete}
            onLayersReorder={modelRef.current.onLayersReorder}
            onLayersSettingsChange={modelRef.current.onLayersSettingsChange}
          />
        </Suspense>
      ),
    })
  }

  return (
    <>
      <MobileRailCircleOption
        icon={<Plus className={RAIL_OPTION_ICON_CLASS} />}
        label="Add"
        onClick={openAddElement}
      />
      <MobileRailCircleOption
        icon={<Layers className={RAIL_OPTION_ICON_CLASS} />}
        label="Layers"
        onClick={openLayers}
      />
    </>
  )
}

/**
 * Per-family quick rows rendered in place of the option list. Families without
 * an entry fall back to `MOBILE_FAMILY_OPTIONS` (Content, Style) or open the
 * drawer directly.
 */
const MOBILE_FAMILY_ROWS: Partial<
  Record<DesktopSettingsSectionId, ComponentType<MobileRailRowProps>>
> = {
  Color: MobileColorRailRow,
  Motion: MobileMotionRailRow,
  Shape: MobileShapeRailRow,
  Background: MobileBackgroundRailRow,
  Elements: MobileElementsRailRow,
}

/**
 * Mode-pill row rendered under the scrollarea for families whose options are
 * grouped by fill mode. The pills read/write `MobileRailModeContext`.
 */
const MOBILE_FAMILY_FOOTERS: Partial<
  Record<DesktopSettingsSectionId, ComponentType<MobileRailRowProps>>
> = {
  Color: MobileColorRailFooter,
  Background: MobileBackgroundRailFooter,
}

/** Clears the pushed-detail stack once the host drawer is fully closed. */
function MobileDrawerStackReset({ open }: { open: boolean }) {
  const navigation = useMobileDrawerNavigation()
  useEffect(() => {
    if (!open) {
      navigation?.clearDetails()
    }
  }, [navigation, open])
  return null
}

function useMobileKeyboardInset() {
  const [keyboardInset, setKeyboardInset] = useState(0)

  useLayoutEffect(() => {
    let remeasureTimer = 0

    const update = () => {
      setKeyboardInset(getMobileKeyboardInsetPx(window.innerHeight, window.visualViewport))
    }

    const remeasureAfterKeyboard = () => {
      update()
      window.clearTimeout(remeasureTimer)
      // iOS often skips visualViewport.resize after blur; trailing pass catches close.
      remeasureTimer = window.setTimeout(update, 280)
    }

    update()
    window.addEventListener("resize", remeasureAfterKeyboard)
    window.visualViewport?.addEventListener("resize", remeasureAfterKeyboard)
    window.visualViewport?.addEventListener("scroll", update)
    document.addEventListener("focusout", remeasureAfterKeyboard)
    document.addEventListener("focusin", remeasureAfterKeyboard)

    return () => {
      window.clearTimeout(remeasureTimer)
      window.removeEventListener("resize", remeasureAfterKeyboard)
      window.visualViewport?.removeEventListener("resize", remeasureAfterKeyboard)
      window.visualViewport?.removeEventListener("scroll", update)
      document.removeEventListener("focusout", remeasureAfterKeyboard)
      document.removeEventListener("focusin", remeasureAfterKeyboard)
    }
  }, [])

  return keyboardInset
}

function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }

    // The rail's height feeds the workspace canvas inset, so an unthrottled
    // observer turns a height animation into per-frame React renders.
    let frame = 0
    const measure = () => {
      if (frame) {
        return
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0
        setHeight(node.getBoundingClientRect().height)
      })
    }

    setHeight(node.getBoundingClientRect().height)

    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return { height, ref }
}

export function MobileSettingsRail({ model }: { model: DesktopInspectorModel }) {
  const { controller } = model
  const theme = model.actualDesktopTheme
  const { height: railHeight, ref: railRef } = useMeasuredHeight<HTMLDivElement>()
  const [toolbarHeight, setToolbarHeight] = useState(0)
  const [openFamily, setOpenFamily] = useState<DesktopSettingsSectionId | null>(null)
  const [openPart, setOpenPart] = useState<QrStylePartId | null>(null)
  const [drawerSection, setDrawerSection] = useState<DesktopSettingsSectionId | null>(null)
  const [drawerView, setDrawerView] = useState(MOBILE_DRAWER_SECTION_VIEW)
  // Browsed fill mode per family — unset entries derive from the model.
  const [familyModes, setFamilyModes] = useState<
    Partial<Record<DesktopSettingsSectionId, string>>
  >({})
  const keyboardInset = useMobileKeyboardInset()

  const options = openFamily ? MOBILE_FAMILY_OPTIONS[openFamily] : undefined
  const FamilyRow = openFamily ? MOBILE_FAMILY_ROWS[openFamily] : undefined
  const FamilyFooter = openFamily ? MOBILE_FAMILY_FOOTERS[openFamily] : undefined
  const part = openPart ? QR_STYLE_PART_DEFINITIONS[openPart] : undefined
  const drilled = Boolean(options || FamilyRow)
  const drawerOpen = drawerSection !== null || drawerView === MOBILE_DRAWER_DETAIL_VIEW
  const railMode =
    openFamily && FamilyFooter
      ? (familyModes[openFamily] ?? defaultFamilyMode(openFamily, model))
      : undefined
  const railViewKey = part
    ? `part:${openPart}`
    : drilled
      ? `family:${openFamily}:${railMode ?? ""}`
      : "families"

  const setRailMode = useCallback(
    (mode: string) => {
      setFamilyModes((current) =>
        openFamily ? { ...current, [openFamily]: mode } : current,
      )
    },
    [openFamily],
  )

  const railModeContext = useMemo(
    () => ({ mode: railMode, setMode: setRailMode }),
    [railMode, setRailMode],
  )

  const handleDrawerViewChange = useCallback((view: string) => {
    // The nav provider's empty-stack recovery asks for "default"; the section
    // view is the default inside this drawer.
    setDrawerView(view === "default" ? MOBILE_DRAWER_SECTION_VIEW : view)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerSection(null)
    setDrawerView(MOBILE_DRAWER_SECTION_VIEW)
  }, [])

  // Jumping sections always lands on the section view — a stale detail page
  // can't survive the switch.
  const openDrawerSection = useCallback((section: DesktopSettingsSectionId) => {
    setDrawerView(MOBILE_DRAWER_SECTION_VIEW)
    setDrawerSection(section)
  }, [])

  const goToNextFamily = useCallback(() => {
    if (!openFamily) {
      return
    }
    setOpenPart(null)
    const index = DESKTOP_SETTINGS_SECTIONS.indexOf(openFamily)
    for (let step = 1; step <= DESKTOP_SETTINGS_SECTIONS.length; step += 1) {
      const candidate =
        DESKTOP_SETTINGS_SECTIONS[(index + step) % DESKTOP_SETTINGS_SECTIONS.length]
      if (MOBILE_FAMILY_OPTIONS[candidate] || MOBILE_FAMILY_ROWS[candidate]) {
        setOpenFamily(candidate)
        return
      }
    }
  }, [openFamily])

  // The corner cross steps back one drill level before it leaves the family.
  const goBack = useCallback(() => {
    if (openPart) {
      setOpenPart(null)
      return
    }
    setOpenFamily(null)
  }, [openPart])

  useEffect(() => {
    syncMobileWorkspaceChromeInsets({
      drawerHeight: railHeight,
      toolbarHeight,
      drawerBottomGapPx: MOBILE_RAIL_BOTTOM_GAP_PX,
      keyboardInsetPx: keyboardInset,
    })
  }, [keyboardInset, railHeight, toolbarHeight])

  useEffect(() => {
    return () => {
      clearMobileWorkspaceChromeInsets()
    }
  }, [])

  return (
    <DesktopnewThemeContext.Provider value={theme}>
      <MobileInspectorDensityContext.Provider value={true}>
        <MobileDrawerNavigationProvider
          currentView={drawerView}
          setView={handleDrawerViewChange}
        >
          <MobileRailModeContext.Provider value={railModeContext}>
            <MobileDrawerStackReset open={drawerOpen} />
          <MobileLayerToolbar onToolbarHeightChange={setToolbarHeight} model={model} theme={theme} />
          <div
            ref={railRef}
            className="desktopnew-root pointer-events-auto fixed z-[35]"
            data-desktop-theme={theme}
            data-mobile-inspector=""
            data-slot="mobile-settings-rail-root"
            data-theme={theme}
          >
            <ScrollArea
              className="dn-mobile-settings-rail__scroll w-full min-w-0 max-w-full overflow-hidden"
              chevron={false}
              cueSize="tight"
              orientation="horizontal"
              persistKey={`mobile-settings-rail:${railViewKey}`}
              scrollFade
              showScrollbar={false}
              viewportClassName="min-w-0"
            >
              <AnimatePresence initial={false} mode="wait">
                <m.div
                  key={railViewKey}
                  animate={{ opacity: 1 }}
                  aria-label={
                    part
                      ? `${openPart} options`
                      : drilled
                        ? `${openFamily} options`
                        : "Settings sections"
                  }
                  className="dn-mobile-settings-rail__row"
                  exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeIn" } }}
                  initial={{ opacity: 0 }}
                  role="group"
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  {part && openPart ? (
                    <QrStylePartOptions model={model} partId={openPart} />
                  ) : FamilyRow && openFamily ? (
                    <FamilyRow
                      model={model}
                      openDrawer={() => openDrawerSection(openFamily!)}
                    />
                  ) : options ? (
                    options.map((option) => (
                      <button
                        key={option.id}
                        className={
                          option.shape === "pill"
                            ? "dn-mobile-settings-rail__item dn-mobile-settings-rail__item--pill"
                            : "dn-mobile-settings-rail__item"
                        }
                        type="button"
                        onClick={() => {
                          if (option.drillsTo) {
                            setOpenPart(option.drillsTo)
                            return
                          }
                          if (openFamily === "Content") {
                            model.onContentTypeChange(option.id as QrInputType)
                          }
                          openDrawerSection(openFamily!)
                        }}
                      >
                        {option.shape === "pill" ? (
                          <span className="dn-mobile-settings-rail__pill">{option.label}</span>
                        ) : (
                          <>
                            <span className="dn-mobile-settings-rail__circle">{option.icon}</span>
                            <span className="dn-mobile-settings-rail__label">{option.label}</span>
                          </>
                        )}
                      </button>
                    ))
                  ) : (
                    DESKTOP_SETTINGS_SECTIONS.map((section) => (
                      <button
                        key={section}
                        className="dn-mobile-settings-rail__item"
                        type="button"
                        onClick={() =>
                          setOpenFamily((current) => (current === section ? null : section))
                        }
                      >
                        <span className="dn-mobile-settings-rail__circle">
                          <SettingsSectionIconFor
                            className="dn-mobile-settings-rail__icon"
                            section={section}
                            size={20}
                          />
                        </span>
                        <span className="dn-mobile-settings-rail__label">
                          {getDesktopSettingsSectionLabel(section)}
                        </span>
                      </button>
                    ))
                  )}
                </m.div>
              </AnimatePresence>
            </ScrollArea>
            <AnimatePresence initial={false}>
              {drilled && FamilyFooter ? (
                <m.div
                  key={`modes:${openFamily}`}
                  animate={{ opacity: 1 }}
                  aria-label={`${openFamily} fill modes`}
                  className="dn-mobile-settings-rail__subrow"
                  exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeIn" } }}
                  initial={{ opacity: 0 }}
                  role="group"
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  <FamilyFooter
                    model={model}
                    openDrawer={() => openDrawerSection(openFamily!)}
                  />
                </m.div>
              ) : null}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {drilled ? (
                <m.div
                  key="rail-actions"
                  animate={{ height: "auto", opacity: 1 }}
                  className="dn-mobile-settings-rail__actions"
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                >
                  <button
                    aria-label="Close options"
                    className="dn-mobile-settings-rail__action"
                    type="button"
                    onClick={goBack}
                  >
                    <X aria-hidden size={18} strokeWidth={2.25} />
                  </button>
                  {/* History lives in the thumb zone, between the corners. */}
                  <span
                    className="dn-mobile-settings-rail__history"
                    data-slot="mobile-rail-history"
                  >
                    <button
                      aria-label="Undo"
                      className="dn-mobile-settings-rail__action dn-mobile-settings-rail__action--history"
                      disabled={!controller?.canUndo || !controller?.onUndo}
                      type="button"
                      onClick={() => controller?.onUndo?.()}
                    >
                      <MobileUndoIcon className="size-4" />
                    </button>
                    <button
                      aria-label="Redo"
                      className="dn-mobile-settings-rail__action dn-mobile-settings-rail__action--history"
                      disabled={!controller?.canRedo || !controller?.onRedo}
                      type="button"
                      onClick={() => controller?.onRedo?.()}
                    >
                      <MobileRedoIcon className="size-4" />
                    </button>
                  </span>
                  <button
                    aria-label="Next settings family"
                    className="dn-mobile-settings-rail__action"
                    type="button"
                    onClick={goToNextFamily}
                  >
                    <Check aria-hidden size={18} strokeWidth={2.25} />
                  </button>
                </m.div>
              ) : null}
            </AnimatePresence>
          </div>
          <MobileSettingsDrawer
            model={model}
            view={drawerView}
            onClose={closeDrawer}
            onSectionChange={openDrawerSection}
            section={drawerSection}
          />
          </MobileRailModeContext.Provider>
        </MobileDrawerNavigationProvider>
      </MobileInspectorDensityContext.Provider>
    </DesktopnewThemeContext.Provider>
  )
}
