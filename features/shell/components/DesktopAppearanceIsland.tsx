"use client"

import { useMemo, type ReactNode } from "react"
import {
  MoonIcon,
  PaletteIcon,
  SunIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react"
import {
  BorderNone02Icon,
  KeyboardIcon,
  Layers01Icon,
  MagicWand05Icon,
  ResourcesAddIcon,
  ScreenRotationIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { DesktopKeyboardShortcutsPopoverContent } from "@/features/shell/components/DesktopChromeControls"
import { DesktopCanvasRatioPresetPopoverContent } from "@/features/shell/components/DesktopCanvasRatioPresetRow"
import {
  DesktopLayerBorderPanel,
  DesktopLayerEffectsPanel,
  DesktopLayerShadowsPanel,
  DesktopLayerStylePanel,
  DesktopLayerTransformPanel,
} from "@/features/shell/components/DesktopLayerSettingsPanel"
import { DesktopLayersPopoverContent } from "@/features/shell/components/DesktopLayersPopoverContent"
import { DesktopToolbarPopoverContent } from "@/features/shell/components/DesktopToolbarPopover"
import type { DesktopThemeMode } from "@/features/shell/components/FloatingToolbar"
import type { DesktopLayersSettings } from "@/features/shell/model/desktop-toolbar-types"
import { InsertMenuPopoverContent } from "@/features/canvas/components/insert-menu/InsertMenuPopoverContent"
import type { DesktopAppearanceSnapshot } from "@/features/shell/model/appearance"
import { getDesktopLayerToolbarCapabilities } from "@/features/shell/model/layer-toolbar-capabilities"
import { TooltipNavbar, type TooltipItem } from "@/components/ui/tooltip-navbar"
import { useOptionalBlurFadeThemeTransition } from "@/components/ui/BlurFadeThemeTransition"
import { useDesktopCuelume } from "@/features/shell/hooks/use-desktop-cuelume"
import { LAYER_FILTER_EFFECT_KINDS } from "@/features/canvas/model/layer-effects"
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers"
import type { SizeTemplate } from "@/features/canvas/model/size-templates"

function DesktopToolbarSvgIcon({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}

function DesktopUndoIcon({ className }: { className?: string }) {
  return (
    <DesktopToolbarSvgIcon className={className}>
      <path d="M15.13 19.0596H7.13C6.72 19.0596 6.38 18.7196 6.38 18.3096C6.38 17.8996 6.72 17.5596 7.13 17.5596H15.13C17.47 17.5596 19.38 15.6496 19.38 13.3096C19.38 10.9696 17.47 9.05957 15.13 9.05957H4.13C3.72 9.05957 3.38 8.71957 3.38 8.30957C3.38 7.89957 3.72 7.55957 4.13 7.55957H15.13C18.3 7.55957 20.88 10.1396 20.88 13.3096C20.88 16.4796 18.3 19.0596 15.13 19.0596Z" />
      <path d="M6.43006 11.5599C6.24006 11.5599 6.05006 11.4899 5.90006 11.3399L3.34006 8.77988C3.05006 8.48988 3.05006 8.00988 3.34006 7.71988L5.90006 5.15988C6.19006 4.86988 6.67006 4.86988 6.96006 5.15988C7.25006 5.44988 7.25006 5.92988 6.96006 6.21988L4.93006 8.24988L6.96006 10.2799C7.25006 10.5699 7.25006 11.0499 6.96006 11.3399C6.82006 11.4899 6.62006 11.5599 6.43006 11.5599Z" />
    </DesktopToolbarSvgIcon>
  )
}

function DesktopRedoIcon({ className }: { className?: string }) {
  return (
    <DesktopToolbarSvgIcon className={className}>
      <path d="M16.87 19.0596H8.87C5.7 19.0596 3.12 16.4796 3.12 13.3096C3.12 10.1396 5.7 7.55957 8.87 7.55957H19.87C20.28 7.55957 20.62 7.89957 20.62 8.30957C20.62 8.71957 20.28 9.05957 19.87 9.05957H8.87C6.53 9.05957 4.62 10.9696 4.62 13.3096C4.62 15.6496 6.53 17.5596 8.87 17.5596H16.87C17.28 17.5596 17.62 17.8996 17.62 18.3096C17.62 18.7196 17.29 19.0596 16.87 19.0596Z" />
      <path d="M17.57 11.5599C17.38 11.5599 17.19 11.4899 17.04 11.3399C16.75 11.0499 16.75 10.5699 17.04 10.2799L19.07 8.24988L17.04 6.21988C16.75 5.92988 16.75 5.44988 17.04 5.15988C17.33 4.86988 17.81 4.86988 18.1 5.15988L20.66 7.71988C20.95 8.00988 20.95 8.48988 20.66 8.77988L18.1 11.3399C17.95 11.4899 17.76 11.5599 17.57 11.5599Z" />
    </DesktopToolbarSvgIcon>
  )
}

function DesktopCanvasSizeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 12C2 7.75736 2 5.63604 3.17157 4.31802C4.34315 3 6.22876 3 10 3H14C17.7712 3 19.6569 3 20.8284 4.31802C22 5.63604 22 7.75736 22 12C22 16.2426 22 18.364 20.8284 19.682C19.6569 21 17.7712 21 14 21H10C6.22876 21 4.34315 21 3.17157 19.682C2 18.364 2 16.2426 2 12Z"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M2 9H10C12.8284 9 14.2426 9 15.1213 9.87868C16 10.7574 16 12.1716 16 15V21"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path d="M10 21L10 9" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  )
}

const ICON_CLASS = "size-3.5 shrink-0"

function DesktopShadowIcon({ className }: { className?: string }) {
  return (
    <DesktopToolbarSvgIcon className={className}>
      <path d="M13.441 20.3784L10.2822 17.2196C9.9893 16.9267 9.51443 16.9267 9.22153 17.2196C8.92864 17.5125 8.92864 17.9873 9.22153 18.2802L11.4219 20.4807C10.5853 20.4245 9.78184 20.2472 9.0289 19.9663L6.53219 17.4696C6.24325 17.1806 5.77721 17.1767 5.48349 17.4579C4.24545 15.9813 3.5 14.0777 3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C14.0777 3.5 15.9813 4.24547 17.4579 5.48353C17.1787 5.77736 17.1832 6.24195 17.4715 6.53024L19.964 9.02267C20.2458 9.77615 20.4237 10.5803 20.4804 11.4178L18.2822 9.21958C17.9893 8.92669 17.5144 8.92669 17.2215 9.21958C16.9286 9.51247 16.9286 9.98734 17.2215 10.2802L20.3789 13.4376C20.2917 13.9494 20.1588 14.4456 19.9845 14.9219L17.2822 12.2196C16.9893 11.9267 16.5144 11.9267 16.2215 12.2196C15.9286 12.5125 15.9286 12.9873 16.2215 13.2802L19.2993 16.358C19.0678 16.7449 18.8064 17.1119 18.5183 17.4557L15.7822 14.7196C15.4893 14.4267 15.0144 14.4267 14.7215 14.7196C14.4286 15.0125 14.4286 15.4873 14.7215 15.7802L17.4578 18.5165C17.1141 18.8047 16.7473 19.0662 16.3605 19.2978L13.2822 16.2196C12.9893 15.9267 12.5144 15.9267 12.2215 16.2196C11.9286 16.5125 11.9286 16.9873 12.2215 17.2802L14.9247 19.9834C14.4486 20.1579 13.9526 20.291 13.441 20.3784ZM12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
    </DesktopToolbarSvgIcon>
  )
}

type DesktopDynamicIslandChromeProps = {
  appearance?: DesktopAppearanceSnapshot | null
  appearanceLayer?: DraftingCanvasLayer | null
  canAddQrCode?: boolean
  canDeleteLayer?: (layerId: string) => boolean
  canRedo?: boolean
  canUndo?: boolean
  insertNodeId?: string
  layersSettings?: DesktopLayersSettings
  onAddQrCode?: () => void
  onAppearancePatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onBrowseWallpapers?: () => void
  onRedo?: () => void
  onElementLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onInsertLayer?: (layer: DraftingCanvasLayer) => void
  onLayerDelete?: (layerId: string) => void
  onLayersReorder?: (orderedIds: string[]) => void
  onLayersSettingsChange?: (patch: Partial<DesktopLayersSettings>) => void
  onTransformLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onSelectSizeTemplate?: (template: SizeTemplate) => void
  onThemeChange?: (theme: DesktopThemeMode) => void
  onUndo?: () => void
  selectedElementLayer?: DraftingCanvasLayer | null
  selectedTransformLayer?: DraftingCanvasLayer | null
  sizePresetId?: string
  theme?: DesktopThemeMode
}

function useDesktopIslandItems({
  appearance,
  appearanceLayer,
  canAddQrCode,
  canDeleteLayer,
  canRedo,
  canUndo,
  insertNodeId,
  layersSettings,
  onAddQrCode,
  onAppearancePatch,
  onBrowseWallpapers,
  onRedo,
  onElementLayerPatch,
  onInsertLayer,
  onLayerDelete,
  onLayersReorder,
  onLayersSettingsChange,
  onTransformLayerPatch,
  onSelectSizeTemplate,
  onThemeChange,
  onUndo,
  selectedElementLayer,
  selectedTransformLayer,
  sizePresetId,
  theme,
}: Omit<DesktopDynamicIslandChromeProps, "theme"> & {
  theme: DesktopThemeMode
}) {
  const propertyLayer = selectedTransformLayer ?? selectedElementLayer ?? appearanceLayer ?? null
  const propertyCapabilities = getDesktopLayerToolbarCapabilities(propertyLayer)
  const effectsLayer = selectedElementLayer ?? appearanceLayer ?? null
  const effectsPatch = selectedElementLayer ? onElementLayerPatch : onAppearancePatch
  const hasTransform = Boolean(selectedTransformLayer && onTransformLayerPatch)
  const hasStyle = Boolean(selectedElementLayer && onElementLayerPatch)
  const hasBorder = Boolean(appearance?.supportsBorder && onAppearancePatch)
  const hasEffects = Boolean(
    effectsLayer && effectsPatch && propertyCapabilities.maxEffects > 0,
  )
  const canInsert = Boolean(insertNodeId && onInsertLayer)
  const hasLayers = Boolean(layersSettings && onLayersSettingsChange)
  const { soundsEnabled, toggleSoundsEnabled } = useDesktopCuelume()
  const themeTransition = useOptionalBlurFadeThemeTransition()

  const items = useMemo(() => {
    const hugeIcon = (icon: Parameters<typeof HugeiconsIcon>[0]["icon"]) => (
      <HugeiconsIcon
        className={ICON_CLASS}
        color="currentColor"
        icon={icon}
        size={14}
        strokeWidth={1.8}
      />
    )
    const panelItem = (
      label: string,
      slot: string,
      icon: ReactNode,
      panel: ReactNode,
    ): TooltipItem => ({
      ariaLabel: label,
      dataSlot: `${slot}-trigger`,
      icon,
      label,
      popover: (
        <DesktopToolbarPopoverContent dataSlot={`${slot}-popover`} fitContent>
          {panel}
        </DesktopToolbarPopoverContent>
      ),
    })

    const nextItems: TooltipItem[] = [
      {
        ariaLabel: "Undo",
        disabled: !canUndo || !onUndo,
        icon: <DesktopUndoIcon className={ICON_CLASS} />,
        label: "Undo",
        onClick: onUndo,
      },
      {
        ariaLabel: "Redo",
        disabled: !canRedo || !onRedo,
        icon: <DesktopRedoIcon className={ICON_CLASS} />,
        label: "Redo",
        onClick: onRedo,
      },
    ]

    if (onSelectSizeTemplate) {
      nextItems.push({
        ariaLabel: "Canvas size",
        dataSlot: "desktop-canvas-size-trigger",
        icon: <DesktopCanvasSizeIcon className={ICON_CLASS} />,
        label: "Canvas size",
        popover: (
          <DesktopCanvasRatioPresetPopoverContent
            onSelectTemplate={onSelectSizeTemplate}
            selectedPresetId={sizePresetId}
          />
        ),
      })
    }

    if (hasTransform) {
      nextItems.push(
        panelItem(
          "Transform",
          "desktop-layer-transform",
          hugeIcon(ScreenRotationIcon),
          <DesktopLayerTransformPanel
            layer={selectedTransformLayer!}
            onPatch={onTransformLayerPatch!}
            theme={theme}
            variant="flat"
          />,
        ),
      )
    }

    if (hasStyle) {
      nextItems.push(
        panelItem(
          "Style",
          "desktop-layer-style",
          <PaletteIcon className={ICON_CLASS} />,
          <DesktopLayerStylePanel
            layer={selectedElementLayer!}
            onPatch={onElementLayerPatch!}
            theme={theme}
          />,
        ),
      )
    }

    if (hasBorder) {
      nextItems.push(
        panelItem(
          "Border",
          "desktop-layer-border",
          hugeIcon(BorderNone02Icon),
          <DesktopLayerBorderPanel
            appearance={appearance!}
            onPatch={onAppearancePatch!}
            theme={theme}
          />,
        ),
      )
    }

    if (hasEffects) {
      nextItems.push(
        panelItem(
          "Shadows",
          "desktop-layer-shadows",
          <DesktopShadowIcon className={ICON_CLASS} />,
          <DesktopLayerShadowsPanel
            layer={effectsLayer!}
            onPatch={effectsPatch!}
            theme={theme}
          />,
        ),
        panelItem(
          "Effects",
          "desktop-layer-effects",
          hugeIcon(MagicWand05Icon),
          <DesktopLayerEffectsPanel
            effectKinds={LAYER_FILTER_EFFECT_KINDS}
            layer={effectsLayer!}
            layerOpacity={appearance?.opacity}
            onLayerOpacityChange={
              appearance && onAppearancePatch
                ? (opacity) => onAppearancePatch({ opacity })
                : undefined
            }
            onPatch={effectsPatch!}
            theme={theme}
            variant="flat"
          />,
        ),
      )
    }

    if (canInsert) {
      nextItems.push({
        ariaLabel: "Add element",
        dataSlot: "desktop-insert-trigger",
        icon: hugeIcon(ResourcesAddIcon),
        label: "Add element",
        popover: (
          <InsertMenuPopoverContent
            canAddQrCode={canAddQrCode}
            isDesktopPopover
            nodeId={insertNodeId!}
            onAddQrCode={onAddQrCode}
            onBrowseWallpapers={onBrowseWallpapers}
            onInsertLayer={onInsertLayer!}
            theme={theme}
          />
        ),
      })
    }

    if (hasLayers) {
      nextItems.push(
        panelItem(
          "Layers",
          "desktop-layers",
          hugeIcon(Layers01Icon),
          <DesktopLayersPopoverContent
            canDeleteLayer={canDeleteLayer}
            layersSettings={layersSettings!}
            onLayerDelete={onLayerDelete}
            onLayersReorder={onLayersReorder}
            onLayersSettingsChange={onLayersSettingsChange!}
          />,
        ),
      )
    }

    nextItems.push({
      ariaLabel: "Open keyboard shortcuts",
      dataSlot: "desktop-keyboard-shortcuts-trigger",
      icon: (
        <HugeiconsIcon icon={KeyboardIcon} size={14} color="currentColor" strokeWidth={1.8} />
      ),
      label: "Keyboard shortcuts",
      popover: <DesktopKeyboardShortcutsPopoverContent popoverSide="bottom" />,
    })

    nextItems.push({
      ariaLabel: soundsEnabled ? "Mute interaction sounds" : "Enable interaction sounds",
      cuelume: "toggle",
      dataSlot: "desktop-sounds-toggle",
      icon: soundsEnabled ? (
        <Volume2Icon className={ICON_CLASS} />
      ) : (
        <VolumeXIcon className={ICON_CLASS} />
      ),
      label: soundsEnabled ? "Sounds on" : "Sounds off",
      onClick: toggleSoundsEnabled,
    })

    if (onThemeChange) {
      nextItems.push({
        ariaLabel: `Switch to ${theme === "light" ? "dark" : "light"} mode`,
        cuelume: "toggle",
        dataSlot: "desktop-theme-toggle",
        icon:
          theme === "light" ? (
            <MoonIcon className={ICON_CLASS} />
          ) : (
            <SunIcon className={ICON_CLASS} />
          ),
        label: `Switch to ${theme === "light" ? "dark" : "light"} mode`,
        onClick: () => {
          if (themeTransition) {
            themeTransition.triggerTransition()
          } else {
            onThemeChange(theme === "light" ? "dark" : "light")
          }
        },
      })
    }

    return nextItems
  }, [
    appearance,
    canAddQrCode,
    canDeleteLayer,
    canInsert,
    canRedo,
    canUndo,
    effectsLayer,
    effectsPatch,
    hasBorder,
    hasEffects,
    hasLayers,
    hasStyle,
    hasTransform,
    insertNodeId,
    layersSettings,
    onAddQrCode,
    onAppearancePatch,
    onBrowseWallpapers,
    onElementLayerPatch,
    onInsertLayer,
    onLayerDelete,
    onLayersReorder,
    onLayersSettingsChange,
    onRedo,
    onSelectSizeTemplate,
    onThemeChange,
    onTransformLayerPatch,
    onUndo,
    selectedElementLayer,
    selectedTransformLayer,
    sizePresetId,
    soundsEnabled,
    theme,
    themeTransition,
    toggleSoundsEnabled,
  ])

  return items
}

export function DesktopDynamicIslandChrome(props: DesktopDynamicIslandChromeProps) {
  const theme = props.theme ?? "dark"
  const items = useDesktopIslandItems({ ...props, theme })

  return (
    <div data-slot="desktop-dynamic-island-content">
      <TooltipNavbar items={items} />
    </div>
  )
}
