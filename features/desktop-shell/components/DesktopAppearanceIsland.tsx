"use client"

import { useMemo, type ReactNode } from "react"
import {
  LayersIcon,
  MagnetIcon,
  MoonIcon,
  MousePointer2Icon,
  SlidersHorizontalIcon,
  SunIcon,
} from "lucide-react"
import { KeyboardIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { DesktopKeyboardShortcutsPopoverContent } from "@/features/desktop-shell/components/DesktopChromeControls"
import { DesktopCanvasRatioPresetPopoverContent } from "@/features/desktop-shell/components/DesktopCanvasRatioPresetRow"
import { DesktopLayerPropertiesPanel } from "@/features/desktop-shell/components/DesktopLayerPropertiesPanel"
import { DesktopLayersPopoverContent } from "@/features/desktop-shell/components/DesktopLayersPopoverContent"
import { DesktopToolbarPopoverContent } from "@/features/desktop-shell/components/DesktopToolbarPopover"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import type { DesktopLayersSettings } from "@/features/desktop-shell/model/desktop-toolbar-types"
import { getDesktopLayerToolbarCapabilities } from "@/features/desktop-shell/model/layer-toolbar-capabilities"
import { TooltipNavbar, type TooltipItem } from "@/components/ui/tooltip-navbar"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { SizeTemplate } from "@/features/workspace/model/size-templates"
import type { DraftingPaneCanvasTool } from "@/features/workspace/components/DraftingPaneSurface"
import { InsertMenuPopoverContent } from "@/features/workspace/components/insert-menu/InsertMenuPopoverContent"
import { InsertMenuAddIcon } from "@/features/workspace/components/insert-menu/InsertMenuAddIcon"

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
    <DesktopToolbarSvgIcon className={className}>
      <path d="M21 9.75C20.59 9.75 20.25 9.41 20.25 9V3.75H15C14.59 3.75 14.25 3.41 14.25 3C14.25 2.59 14.59 2.25 15 2.25H21C21.41 2.25 21.75 2.59 21.75 3V9C21.75 9.41 21.41 9.75 21 9.75Z" />
      <path d="M9 21.75H3C2.59 21.75 2.25 21.41 2.25 21V15C2.25 14.59 2.59 14.25 3 14.25C3.41 14.25 3.75 14.59 3.75 15V20.25H9C9.41 20.25 9.75 20.59 9.75 21C9.75 21.41 9.41 21.75 9 21.75Z" />
      <path d="M13.4999 11.2495C13.3099 11.2495 13.1199 11.1795 12.9699 11.0295C12.6799 10.7395 12.6799 10.2595 12.9699 9.96945L20.4699 2.46945C20.7599 2.17945 21.2399 2.17945 21.5299 2.46945C21.8199 2.75945 21.8199 3.23945 21.5299 3.52945L14.0299 11.0295C13.8799 11.1795 13.6899 11.2495 13.4999 11.2495Z" />
      <path d="M2.99994 21.7495C2.80994 21.7495 2.61994 21.6795 2.46994 21.5295C2.17994 21.2395 2.17994 20.7595 2.46994 20.4695L9.96994 12.9695C10.2599 12.6795 10.7399 12.6795 11.0299 12.9695C11.3199 13.2595 11.3199 13.7395 11.0299 14.0295L3.52994 21.5295C3.37994 21.6795 3.18994 21.7495 2.99994 21.7495Z" />
    </DesktopToolbarSvgIcon>
  )
}

const ICON_CLASS = "size-3.5 shrink-0"

export function DesktopDynamicIslandChrome({
  appearance,
  activeCanvasTool,
  activePaneId,
  appearanceLayer,
  canAddQrCode,
  canRedo,
  canUndo,
  insertNodeId,
  onAddQrCode,
  onBrowseStockPhotos,
  onCanvasToolChange,
  onInsertLayer,
  onOpenCardPatternSettings,
  onAppearancePatch,
  onRedo,
  onElementLayerPatch,
  layersSettings,
  onLayersReorder,
  onLayersSettingsChange,
  onTransformLayerPatch,
  onSelectSizeTemplate,
  onSnapEnabledChange,
  onThemeChange,
  onUndo,
  selectedElementLayer,
  selectedTransformLayer,
  snapEnabled,
  sizePresetId,
  theme = "dark",
}: {
  appearance?: DesktopAppearanceSnapshot | null
  activeCanvasTool?: DraftingPaneCanvasTool | null
  activePaneId?: string
  appearanceLayer?: DraftingCanvasLayer | null
  canAddQrCode?: boolean
  canRemoveQrCode?: boolean
  canRedo?: boolean
  canUndo?: boolean
  insertNodeId?: string
  onAddQrCode?: () => void
  onAddTextLayerAt?: (paneId: string, point: { x: number; y: number }) => void
  onBrowseStockPhotos?: () => void
  onCanvasToolChange?: (tool: DraftingPaneCanvasTool | null) => void
  onInsertLayer?: (layer: DraftingCanvasLayer) => void
  onOpenCardPatternSettings?: () => void
  onAppearancePatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onRedo?: () => void
  onRemoveQrCode?: () => void
  onElementLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  layersSettings?: DesktopLayersSettings
  onLayersReorder?: (orderedIds: string[]) => void
  onLayersSettingsChange?: (patch: Partial<DesktopLayersSettings>) => void
  onTransformLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onSelectSizeTemplate?: (template: SizeTemplate) => void
  onSnapEnabledChange?: (enabled: boolean) => void
  onThemeChange?: (theme: DesktopThemeMode) => void
  onUndo?: () => void
  selectedElementLayer?: DraftingCanvasLayer | null
  selectedTransformLayer?: DraftingCanvasLayer | null
  snapEnabled?: boolean
  sizePresetId?: string
  theme?: DesktopThemeMode
}) {
  const hasLayerControls = Boolean(onLayersSettingsChange && layersSettings)
  const hasProperties =
    Boolean(selectedTransformLayer && onTransformLayerPatch) ||
    Boolean(selectedElementLayer && onElementLayerPatch) ||
    Boolean(appearance && onAppearancePatch)
  const propertyLayer = selectedTransformLayer ?? selectedElementLayer ?? appearanceLayer ?? null
  const propertyCapabilities = getDesktopLayerToolbarCapabilities(propertyLayer, appearance)
  const hasComposeControls =
    Boolean(onCanvasToolChange) &&
    Boolean(activePaneId) &&
    typeof snapEnabled === "boolean" &&
    Boolean(onSnapEnabledChange)

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

    if (hasComposeControls) {
      const isSelectTool = activeCanvasTool === "select"

      nextItems.push(
        {
          ariaLabel: "Select and move elements",
          icon: <MousePointer2Icon className={ICON_CLASS} />,
          label: "Select",
          pressed: isSelectTool,
          onClick: () => onCanvasToolChange?.(isSelectTool ? "pan" : "select"),
        },
        {
          ariaLabel: snapEnabled ? "Disable snapping" : "Enable snapping",
          icon: <MagnetIcon className={ICON_CLASS} />,
          label: snapEnabled ? "Snapping on" : "Snapping off",
          onClick: () => onSnapEnabledChange?.(!snapEnabled),
        },
      )

      if (onInsertLayer && insertNodeId) {
        nextItems.push({
          ariaLabel: "Add content",
          icon: <InsertMenuAddIcon className={ICON_CLASS} />,
          label: "Add content",
          popover: (
            <InsertMenuPopoverContent
              canAddQrCode={Boolean(canAddQrCode)}
              nodeId={insertNodeId}
              onAddQrCode={onAddQrCode}
              onBrowseStockPhotos={onBrowseStockPhotos}
              onInsertLayer={onInsertLayer}
              onOpenCardPatternSettings={onOpenCardPatternSettings}
            />
          ),
        })
      }
    }

    if (hasLayerControls) {
      nextItems.push({
        ariaLabel: "Layers",
        dataSlot: "desktop-layers-trigger",
        icon: <LayersIcon className={ICON_CLASS} />,
        label: "Layers",
        popover: (
          <DesktopToolbarPopoverContent dataSlot="desktop-layers-popover" fitContent flush>
            <DesktopLayersPopoverContent
              layersSettings={layersSettings!}
              onLayersReorder={onLayersReorder}
              onLayersSettingsChange={onLayersSettingsChange!}
            />
          </DesktopToolbarPopoverContent>
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
          <DesktopToolbarPopoverContent dataSlot="desktop-layer-properties-popover" fitContent flush>
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

    if (onThemeChange) {
      nextItems.push({
        ariaLabel: `Switch to ${theme === "light" ? "dark" : "light"} mode`,
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
    activeCanvasTool,
    canAddQrCode,
    canRedo,
    canUndo,
    hasComposeControls,
    hasLayerControls,
    hasProperties,
    layersSettings,
    onLayersReorder,
    onLayersSettingsChange,
    propertyCapabilities.maxEffects,
    propertyCapabilities.propertyTabs,
    propertyCapabilities.showStyleInDesign,
    insertNodeId,
    onAddQrCode,
    onAppearancePatch,
    onBrowseStockPhotos,
    onCanvasToolChange,
    onElementLayerPatch,
    onInsertLayer,
    onOpenCardPatternSettings,
    onRedo,
    onSelectSizeTemplate,
    onSnapEnabledChange,
    onThemeChange,
    onTransformLayerPatch,
    onUndo,
    selectedElementLayer,
    selectedTransformLayer,
    sizePresetId,
    snapEnabled,
    theme,
  ])

  return (
    <div data-slot="desktop-dynamic-island-content">
      <TooltipNavbar items={items} />
    </div>
  )
}
