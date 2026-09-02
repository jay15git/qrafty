"use client"

import { useMemo, type ReactNode } from "react"
import {
  MoonIcon,
  SlidersHorizontalIcon,
  SunIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react"
import { KeyboardIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { DesktopKeyboardShortcutsPopoverContent } from "@/features/desktop-shell/components/DesktopChromeControls"
import { DesktopCanvasRatioPresetPopoverContent } from "@/features/desktop-shell/components/DesktopCanvasRatioPresetRow"
import { DesktopLayerPropertiesPanel } from "@/features/desktop-shell/components/DesktopLayerPropertiesPanel"
import { DesktopToolbarPopoverContent } from "@/features/desktop-shell/components/DesktopToolbarPopover"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import { getDesktopLayerToolbarCapabilities } from "@/features/desktop-shell/model/layer-toolbar-capabilities"
import { TooltipNavbar, type TooltipItem } from "@/components/ui/tooltip-navbar"
import { useDesktopCuelume } from "@/features/desktop-shell/hooks/use-desktop-cuelume"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { SizeTemplate } from "@/features/workspace/model/size-templates"

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

export function DesktopDynamicIslandChrome({
  appearance,
  appearanceLayer,
  canRedo,
  canUndo,
  onAppearancePatch,
  onRedo,
  onElementLayerPatch,
  onTransformLayerPatch,
  onSelectSizeTemplate,
  onThemeChange,
  onUndo,
  selectedElementLayer,
  selectedTransformLayer,
  sizePresetId,
  theme = "dark",
}: {
  appearance?: DesktopAppearanceSnapshot | null
  appearanceLayer?: DraftingCanvasLayer | null
  canRedo?: boolean
  canUndo?: boolean
  onAppearancePatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onRedo?: () => void
  onElementLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onTransformLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onSelectSizeTemplate?: (template: SizeTemplate) => void
  onThemeChange?: (theme: DesktopThemeMode) => void
  onUndo?: () => void
  selectedElementLayer?: DraftingCanvasLayer | null
  selectedTransformLayer?: DraftingCanvasLayer | null
  sizePresetId?: string
  theme?: DesktopThemeMode
}) {
  const hasProperties =
    Boolean(selectedTransformLayer && onTransformLayerPatch) ||
    Boolean(selectedElementLayer && onElementLayerPatch) ||
    Boolean(appearance && onAppearancePatch)
  const propertyLayer = selectedTransformLayer ?? selectedElementLayer ?? appearanceLayer ?? null
  const propertyCapabilities = getDesktopLayerToolbarCapabilities(propertyLayer, appearance)
  const { soundsEnabled, toggleSoundsEnabled } = useDesktopCuelume()

  const items = useMemo(() => {
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

    if (hasProperties) {
      nextItems.push({
        ariaLabel: "Properties",
        dataSlot: "desktop-layer-properties-trigger",
        icon: <SlidersHorizontalIcon className={ICON_CLASS} />,
        label: "Properties",
        popover: (
          <DesktopToolbarPopoverContent
            dataSlot="desktop-layer-properties-popover"
            disableScroll
            flush
          >
            <DesktopLayerPropertiesPanel
              appearance={appearance}
              appearanceLayer={appearanceLayer}
              elementLayer={selectedElementLayer}
              maxEffects={propertyCapabilities.maxEffects}
              onAppearancePatch={onAppearancePatch}
              onElementLayerPatch={onElementLayerPatch}
              onTransformLayerPatch={onTransformLayerPatch}
              propertyTabs={propertyCapabilities.propertyTabs}
              showStyleInDesign={propertyCapabilities.showStyleInDesign}
              theme={theme}
              transformLayer={selectedTransformLayer}
            />
          </DesktopToolbarPopoverContent>
        ),
      })
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
        onClick: () => onThemeChange(theme === "light" ? "dark" : "light"),
      })
    }

    return nextItems
  }, [
    appearance,
    appearanceLayer,
    canRedo,
    canUndo,
    hasProperties,
    propertyCapabilities.maxEffects,
    propertyCapabilities.propertyTabs,
    propertyCapabilities.showStyleInDesign,
    onAppearancePatch,
    onElementLayerPatch,
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
    toggleSoundsEnabled,
  ])

  return (
    <div data-slot="desktop-dynamic-island-content">
      <TooltipNavbar items={items} />
    </div>
  )
}
