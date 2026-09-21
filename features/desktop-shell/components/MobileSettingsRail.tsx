"use client"

import {
  Check,
  Layers,
  Pipette,
  Plus,
  X,
} from "lucide-react"

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
  applyShapeFill,
  applyUnifiedQrFill,
  applyUnifiedQrModuleImageUrl,
  applyUnifiedQrModulePatternPatch,
  isPatternModuleImageFill,
  readPatternModuleFillCss,
  readShapeFillCss,
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
import {
  SegmentTabs,
  SettingsSlider,
} from "@/features/desktop-shell/inspector/settings-ui"
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
// Palette editing drags in the full fill picker — fetch it only when the
// pattern-colors detail page is pushed.
const LazyPatternColorPickerContent = lazy(() =>
  import("@/features/desktop-shell/inspector/qr-color-fill-controls").then(
    (module) => ({ default: module.PatternColorPickerContent }),
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
  { id: "Module", label: "Module", drillsTo: "Module" },
  { id: "Eye", label: "Eye", drillsTo: "Eye" },
  { id: "Frame", label: "Frame", drillsTo: "Frame" },
  { id: "Logo", label: "Logo" },
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
  /** Mode the option row is currently displaying (lags during the fade-out
      beat so exiting content never swaps in place). */
  mode: string | undefined
  /** Mode the user picked — the footer pills highlight it immediately. */
  selectedMode: string | undefined
  setMode: (mode: string) => void
} | null>(null)

/**
 * Selected QR style part shared between the Style family's row (catalogue
 * above) and its footer tabs. Always resolved — defaults to Module.
 * `part` lags like `mode`; `selectedPart` is what the tabs highlight.
 */
const MobileRailPartContext = createContext<{
  part: QrStylePartId
  selectedPart: QrStylePartId
  selectPart: (part: QrStylePartId) => void
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

/**
 * Shape family's two views. The browsed fill sub-mode is folded into the mode
 * string (`fill:<mode>`) so the row and footer share one mode context.
 */
const SHAPE_VIEW_MODES = [
  { id: "shape", label: "Shape" },
  { id: "fill", label: "Fill" },
] as const

const SHAPE_FILL_MODES = [
  { id: "solid", label: "Solid" },
  { id: "linear", label: "Linear" },
  { id: "radial", label: "Radial" },
] as const

function shapeFillSubMode(mode: string): string {
  return mode.startsWith("fill:") ? mode.slice("fill:".length) : "solid"
}

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
  if (family === "Shape") {
    return "shape"
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
  applyQrPalettePatch(model, {
    dotsColorMode: "palette",
    dotsPalette: [...preset.colors],
    dotsPalettePreset: preset.label,
  })
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

/** Palette-mode patches are module-only, but unified mode still syncs the rest. */
function applyQrPalettePatch(
  model: DesktopInspectorModel,
  patch: Partial<DesktopPatternSettings>,
) {
  if (model.actualPatternSettings.gradientLinkMode === "unified") {
    applyUnifiedPatches(
      model,
      applyUnifiedQrModulePatternPatch(patch, unifiedQrSettings(model)),
    )
    return
  }
  model.onPatternSettingsChange(patch)
}

/**
 * Palette editor pushed as a rail detail: the 4 wells on top, solid picker
 * below. The palette is kept in local state because detail content is frozen
 * at open time and can't re-read the model as the user picks colors.
 */
function MobileRailPatternPaletteDetail({
  model,
}: {
  model: DesktopInspectorModel
}) {
  const [palette, setPalette] = useState(() => [
    ...model.actualPatternSettings.dotsPalette,
  ])

  const applyColor = (index: number, color: string) => {
    setPalette((current) => {
      const next = current.map((entry, entryIndex) =>
        entryIndex === index ? color : entry,
      )
      applyQrPalettePatch(model, {
        dotsColorMode: "palette",
        dotsPalettePreset: "custom",
        dotsPalette: next,
      })
      return next
    })
  }

  return (
    <Suspense fallback={null}>
      <LazyPatternColorPickerContent
        selectedPalette={palette}
        onPaletteColorChange={applyColor}
      />
    </Suspense>
  )
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
        <MobileRailPickerTile
          ariaLabel="Custom pattern colors"
          onOpen={() => {
            const m = modelRef.current
            // Palette wells edit live on the QR — switch to palette mode so
            // the preview reacts while the user picks.
            if (m.actualPatternSettings.dotsColorMode !== "palette") {
              applyQrPalettePatch(m, { dotsColorMode: "palette" })
            }
            if (navigation) {
              navigation.openDetail({
                title: "Pattern colors",
                content: <MobileRailPatternPaletteDetail model={m} />,
              })
              return
            }
            openDrawer()
          }}
        />
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
      </>
    )
  }

  if (mode === "image") {
    const imageUrl = model.actualPatternSettings.moduleFillImageUrl
    return (
      <MobileRailImageOptions
        imageUrl={imageUrl}
        onClear={() => applyQrImageFill(modelRef.current, "", "upload")}
        onSelect={(path) => applyQrImageFill(modelRef.current, path, "url")}
        onUpload={(url) => applyQrImageFill(modelRef.current, url, "upload")}
      />
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
    </>
  )
}

/** Sliding-tab mode switcher under the Color options row — the pill slides to
 *  the browsed mode and the option set above crossfades with it. */
function MobileColorRailFooter() {
  const railMode = useContext(MobileRailModeContext)

  if (!railMode?.selectedMode) {
    return null
  }

  return (
    <div className="dn-mobile-settings-rail__tabs">
      <SegmentTabs
        className="dn-mobile-settings-rail__tabbar"
        items={QR_COLOR_FILL_MODES.map((mode) => ({
          id: mode.id,
          label: mode.label,
        }))}
        value={railMode.selectedMode}
        onChange={railMode.setMode}
      />
    </div>
  )
}

/** Style family row: the selected part's catalogue sits above the tabs. */
function MobileQrRailRow({ model }: MobileRailRowProps) {
  const part = useContext(MobileRailPartContext)?.part ?? "Module"
  return <QrStylePartOptions model={model} partId={part} />
}

/** Part tabs pinned under the catalogue — parts with a catalogue swap the
 *  row; Logo has none, so it keeps opening the drawer. */
function MobileQrRailFooter({ openDrawer }: MobileRailRowProps) {
  const railPart = useContext(MobileRailPartContext)
  const part = railPart?.selectedPart ?? "Module"

  return (
    <div className="dn-mobile-settings-rail__tabs">
      <SegmentTabs
        className="dn-mobile-settings-rail__tabbar"
        items={QR_STYLE_PART_OPTIONS.map((option) => ({
          id: option.id,
          label: option.label,
        }))}
        value={part}
        onChange={(value) => {
          const option = QR_STYLE_PART_OPTIONS.find((entry) => entry.id === value)
          if (!option) {
            return
          }
          if (option.drillsTo) {
            railPart?.selectPart(option.drillsTo)
            return
          }
          openDrawer()
        }}
      />
    </div>
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

function MobileShapeRailRow({ model }: MobileRailRowProps) {
  const navigation = useMobileDrawerNavigation()
  const railMode = useContext(MobileRailModeContext)
  const modelRef = useLatestModel(model)
  const mode = railMode?.mode ?? "shape"
  const selected = model.actualShapeSettings.backgroundShapeId

  if (mode.startsWith("fill:")) {
    const value = readShapeFillCss(model.actualShapeSettings)
    const presets = fillPresetsForMode(shapeFillSubMode(mode))
    const activePreset = getActiveFillPresetForStoredValue(value, presets)
    const applyFill = (fill: Fill) => {
      const m = modelRef.current
      m.onShapeSettingsChange(applyShapeFill(fill, m.actualShapeSettings))
    }

    return (
      <>
        <MobileRailPickerTile
          ariaLabel="Custom shape color"
          customFill={activePreset ? undefined : value}
          onOpen={() =>
            navigation?.openDetail({
              title: "Shape fill",
              content: (
                <Suspense fallback={null}>
                  <div className="w-full min-w-0">
                    <LazyDesktopNewFillPicker
                      qrGradient
                      value={value}
                      onValueChange={(fill) => applyFill(fill)}
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
            ariaLabel="Use this shape color"
            fill={preset}
            selected={activePreset === preset}
            onSelect={() => {
              const fill = parseFill(preset)
              if (fill) {
                applyFill(fill)
              }
            }}
          />
        ))}
      </>
    )
  }

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
    </>
  )
}

/**
 * Shape footer: Shape|Fill view tabs on the bottom; above them the subrow
 * swaps between the padding slider (Shape view) and the fill sub-mode tabs
 * (Fill view) — same sliding-tab treatment as Color/Background.
 */
function MobileShapeRailFooter({ model }: MobileRailRowProps) {
  const railMode = useContext(MobileRailModeContext)
  const mode = railMode?.selectedMode ?? "shape"
  const view = mode.startsWith("fill:") ? "fill" : "shape"

  return (
    <div className="dn-mobile-settings-rail__shapefooter">
      {view === "fill" ? (
        <div className="dn-mobile-settings-rail__tabs">
          <SegmentTabs
            className="dn-mobile-settings-rail__tabbar"
            items={SHAPE_FILL_MODES.map((subMode) => ({
              id: subMode.id,
              label: subMode.label,
            }))}
            value={shapeFillSubMode(mode)}
            onChange={(value) => railMode?.setMode(`fill:${value}`)}
          />
        </div>
      ) : (
        <div className="dn-mobile-settings-rail__slider">
          <SettingsSlider
            label="Padding"
            max={192}
            value={model.actualShapeSettings.shapePadding}
            onChange={(shapePadding) =>
              model.onShapeSettingsChange({ shapePadding })
            }
          />
        </div>
      )}
      <div className="dn-mobile-settings-rail__tabs">
        <SegmentTabs
          className="dn-mobile-settings-rail__tabbar"
          items={SHAPE_VIEW_MODES.map((entry) => ({
            id: entry.id,
            label: entry.label,
          }))}
          value={view}
          onChange={(value) =>
            railMode?.setMode(value === "fill" ? "fill:solid" : "shape")
          }
        />
      </div>
    </div>
  )
}

function backgroundFillTabName(css: string): "Solid" | "Linear" | "Radial" {
  if (css.startsWith("radial-gradient")) return "Radial"
  if (css.startsWith("linear-gradient")) return "Linear"
  return "Solid"
}

function MobileBackgroundRailRow({ model }: MobileRailRowProps) {
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
    </>
  )
}

/**
 * Sliding-tab mode switcher under the Background options row. Mirrors
 * `SceneSection.handleBackgroundTabChange` — tapping a tab also activates
 * that canvas background mode so the preview reacts immediately.
 */
function MobileBackgroundRailFooter({ model }: MobileRailRowProps) {
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
  QR: MobileQrRailRow,
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
  QR: MobileQrRailFooter,
  Color: MobileColorRailFooter,
  Shape: MobileShapeRailFooter,
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
  const theme = model.actualDesktopTheme
  const { height: railHeight, ref: railRef } = useMeasuredHeight<HTMLDivElement>()
  const [toolbarHeight, setToolbarHeight] = useState(0)
  const [openFamily, setOpenFamily] = useState<DesktopSettingsSectionId | null>(null)
  // Selected Style part — the QR row shows its catalogue, the tabs track it.
  const [openPart, setOpenPart] = useState<QrStylePartId>("Module")
  const [drawerSection, setDrawerSection] = useState<DesktopSettingsSectionId | null>(null)
  const [drawerView, setDrawerView] = useState(MOBILE_DRAWER_SECTION_VIEW)
  // Browsed fill mode per family — unset entries derive from the model.
  const [familyModes, setFamilyModes] = useState<
    Partial<Record<DesktopSettingsSectionId, string>>
  >({})
  const keyboardInset = useMobileKeyboardInset()

  /* Two-phase stage swap: everything the rail renders — options, mode tabs,
     X/label/tick — comes from `displayed`, a snapshot that only commits ~190ms
     after the user picks something, while the stage sits at opacity 0. Nothing
     re-renders mid-fade: the exiting content is frozen because it IS the
     snapshot, not a dying AnimatePresence clone. `selectedMode`/`selectedPart`
     stay live so the tab pill reacts instantly. */
  const incomingMode =
    openFamily && MOBILE_FAMILY_FOOTERS[openFamily]
      ? (familyModes[openFamily] ?? defaultFamilyMode(openFamily, model))
      : undefined
  const [displayed, setDisplayed] = useState({
    family: openFamily,
    mode: incomingMode,
    part: openPart,
  })
  // "stage" fades the whole rail block (family open/close); "row" fades only
  // the option row (mode/part tabs inside a family — tabs/actions stay lit).
  const [fading, setFading] = useState<"stage" | "row" | false>(false)

  useEffect(() => {
    if (
      displayed.family === openFamily &&
      displayed.mode === incomingMode &&
      displayed.part === openPart
    ) {
      return
    }
    setFading(displayed.family === openFamily ? "row" : "stage")
    const timeout = window.setTimeout(() => {
      setDisplayed({ family: openFamily, mode: incomingMode, part: openPart })
      setFading(false)
    }, 190)
    return () => window.clearTimeout(timeout)
  }, [openFamily, incomingMode, openPart, displayed])

  const viewFamily = displayed.family
  const options = viewFamily ? MOBILE_FAMILY_OPTIONS[viewFamily] : undefined
  const FamilyRow = viewFamily ? MOBILE_FAMILY_ROWS[viewFamily] : undefined
  const FamilyFooter = viewFamily ? MOBILE_FAMILY_FOOTERS[viewFamily] : undefined
  const drilled = Boolean(options || FamilyRow)
  const drawerOpen = drawerSection !== null || drawerView === MOBILE_DRAWER_DETAIL_VIEW
  // Footer pill highlight: live for the displayed family so a tap slides the
  // pill instantly; during a family fade it still describes the exiting view.
  const railMode =
    viewFamily && FamilyFooter
      ? (familyModes[viewFamily] ?? defaultFamilyMode(viewFamily, model))
      : undefined

  const setRailMode = useCallback(
    (mode: string) => {
      setFamilyModes((current) =>
        viewFamily ? { ...current, [viewFamily]: mode } : current,
      )
    },
    [viewFamily],
  )

  const railModeContext = useMemo(
    () => ({ mode: displayed.mode, selectedMode: railMode, setMode: setRailMode }),
    [displayed.mode, railMode, setRailMode],
  )

  const railPartContext = useMemo(
    () => ({
      part: displayed.part,
      selectedPart: openPart,
      selectPart: setOpenPart,
    }),
    [displayed.part, openPart],
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
    setOpenPart("Module")
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

  // The corner cross leaves the drilled-in family.
  const goBack = useCallback(() => {
    setOpenFamily(null)
  }, [])

  const handleOptionClick = (option: MobileRailOption) => {
    if (option.drillsTo) {
      setOpenPart(option.drillsTo)
      return
    }
    if (viewFamily === "Content") {
      model.onContentTypeChange(option.id as QrInputType)
    }
    openDrawerSection(viewFamily!)
  }

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
            <MobileRailPartContext.Provider value={railPartContext}>
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
            {/* One atomic swap: the whole rail block (options + tabs +
                actions) fades out showing the old view, then the snapshot
                commits at opacity 0 and the new view fades in already laid
                out. Nothing re-renders mid-fade — no layout shifts, no live
                state leaking into the exiting frame. */}
            <div
              className={
                fading === "stage"
                  ? "dn-mobile-settings-rail__stage is-fading"
                  : "dn-mobile-settings-rail__stage"
              }
            >
            <ScrollArea
              className="dn-mobile-settings-rail__scroll w-full min-w-0 max-w-full overflow-hidden"
              chevron={false}
              cueSize="tight"
              orientation="horizontal"
              persistKey={`mobile-settings-rail:${drilled ? `family:${viewFamily}` : "families"}`}
              scrollFade
              showScrollbar={false}
              viewportClassName="min-w-0"
            >
              <div className="dn-mobile-settings-rail__swap">
                <div
                  aria-label={drilled ? `${viewFamily} options` : "Settings sections"}
                  className={
                    fading === "row"
                      ? "dn-mobile-settings-rail__row is-fading"
                      : "dn-mobile-settings-rail__row"
                  }
                  role="group"
                >
                  {FamilyRow && viewFamily ? (
                    <FamilyRow
                      model={model}
                      openDrawer={() => openDrawerSection(viewFamily!)}
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
                        onClick={() => handleOptionClick(option)}
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
                </div>
              </div>
            </ScrollArea>
            {drilled && FamilyFooter ? (
              <div
                aria-label={
                  viewFamily === "QR"
                    ? "QR parts"
                    : viewFamily === "Shape"
                      ? "Shape controls"
                      : `${viewFamily} fill modes`
                }
                className="dn-mobile-settings-rail__subrow"
                role="group"
              >
                <FamilyFooter
                  model={model}
                  openDrawer={() => openDrawerSection(viewFamily!)}
                />
              </div>
            ) : null}
            {drilled ? (
              <div className="dn-mobile-settings-rail__actions">
                <button
                  aria-label="Close options"
                  className="dn-mobile-settings-rail__action"
                  type="button"
                  onClick={goBack}
                >
                  <X aria-hidden size={18} strokeWidth={2.25} />
                </button>
                {/* The open family's name sits centered between the corners. */}
                <span
                  className="dn-mobile-settings-rail__family"
                  data-slot="mobile-rail-family-label"
                >
                  {viewFamily ? getDesktopSettingsSectionLabel(viewFamily) : null}
                </span>
                <button
                  aria-label="Next settings family"
                  className="dn-mobile-settings-rail__action"
                  type="button"
                  onClick={goToNextFamily}
                >
                  <Check aria-hidden size={18} strokeWidth={2.25} />
                </button>
              </div>
            ) : null}
            </div>
          </div>
          <MobileSettingsDrawer
            model={model}
            view={drawerView}
            onClose={closeDrawer}
            onSectionChange={openDrawerSection}
            section={drawerSection}
          />
            </MobileRailPartContext.Provider>
          </MobileRailModeContext.Provider>
        </MobileDrawerNavigationProvider>
      </MobileInspectorDensityContext.Provider>
    </DesktopnewThemeContext.Provider>
  )
}
