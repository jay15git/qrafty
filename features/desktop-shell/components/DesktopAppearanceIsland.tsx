"use client"

import { type ReactNode } from "react"

import {
  DesktopKeyboardShortcutsTrigger,
  DesktopThemeToggleButton,
} from "@/features/desktop-shell/components/DesktopChromeControls"
import { DesktopCanvasRatioPresetPopover } from "@/features/desktop-shell/components/DesktopCanvasRatioPresetRow"
import { DesktopLayerSettingsTrigger } from "@/features/desktop-shell/components/DesktopLayerSettingsTrigger"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { DesktopUtilityToolbarButton } from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import {
  DESKTOP_BOXED_TOOLBAR_BUTTON_CLASS,
  DESKTOP_BOXED_TOOLBAR_ICON_CLASS,
} from "@/features/desktop-shell/components/desktop-utility-toolbar.constants"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import DynamicIsland from "@/components/smoothui/dynamic-island"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { SizeTemplate } from "@/features/workspace/model/size-templates"
import type { DraftingPaneCanvasTool } from "@/features/workspace/components/DraftingPaneSurface"
import { DynamicIslandComposeToolbar } from "@/features/workspace/components/canvas-compose-toolbar"
import { cn } from "@/lib/utils"

function DesktopDynamicIslandDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-0.5 h-6 w-px shrink-0 bg-[var(--desktop-glass-border)]"
    />
  )
}

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

function DesktopHistoryActionButtons({
  canRedo,
  canUndo,
  onRedo,
  onSelectSizeTemplate,
  onUndo,
  sizePresetId,
}: {
  canRedo?: boolean
  canUndo?: boolean
  onRedo?: () => void
  onSelectSizeTemplate?: (template: SizeTemplate) => void
  onUndo?: () => void
  sizePresetId?: string
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-0.5"
      data-slot="desktop-history-actions"
    >
      <DesktopTooltip content="Undo" side="bottom" sideOffset={10}>
        <DesktopUtilityToolbarButton
          aria-label="Undo"
          className={DESKTOP_BOXED_TOOLBAR_BUTTON_CLASS}
          disabled={!canUndo || !onUndo}
          onClick={onUndo}
        >
          <DesktopUndoIcon className={DESKTOP_BOXED_TOOLBAR_ICON_CLASS} />
        </DesktopUtilityToolbarButton>
      </DesktopTooltip>
      <DesktopTooltip content="Redo" side="bottom" sideOffset={10}>
        <DesktopUtilityToolbarButton
          aria-label="Redo"
          className={DESKTOP_BOXED_TOOLBAR_BUTTON_CLASS}
          disabled={!canRedo || !onRedo}
          onClick={onRedo}
        >
          <DesktopRedoIcon className={DESKTOP_BOXED_TOOLBAR_ICON_CLASS} />
        </DesktopUtilityToolbarButton>
      </DesktopTooltip>
      {onSelectSizeTemplate ? (
        <DesktopCanvasRatioPresetPopover
          selectedPresetId={sizePresetId}
          onSelectTemplate={onSelectSizeTemplate}
        />
      ) : null}
    </div>
  )
}

export function DesktopDynamicIslandChrome({
  appearance,
  activeCanvasTool,
  activePaneId,
  appearanceLayer,
  canAddQrCode,
  canRemoveQrCode,
  canRedo,
  canUndo,
  insertNodeId,
  onAddQrCode,
  onAddTextLayerAt,
  onBrowseStockPhotos,
  onCanvasToolChange,
  onInsertLayer,
  onOpenCardPatternSettings,
  onAppearancePatch,
  onRedo,
  onRemoveQrCode,
  onElementLayerPatch,
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
  const hasAppearance = Boolean(appearance && onAppearancePatch)
  const hasLayerSettings =
    Boolean(selectedElementLayer && onElementLayerPatch) ||
    hasAppearance ||
    Boolean(selectedTransformLayer && onTransformLayerPatch)
  const hasComposeControls =
    Boolean(onCanvasToolChange) &&
    Boolean(activePaneId) &&
    typeof snapEnabled === "boolean" &&
    Boolean(onSnapEnabledChange)
  const activeInteractionTool =
    activeCanvasTool === "pan"
      ? "pan"
      : activeCanvasTool === "text"
        ? "text"
        : "select"

  return (
    <DynamicIsland
      appearance="desktop-glass"
      idleContent={
        <div
          className="flex min-w-0 items-center gap-1 px-1"
          data-slot="desktop-dynamic-island-content"
        >
          <DesktopHistoryActionButtons
            canRedo={canRedo}
            canUndo={canUndo}
            onRedo={onRedo}
            onSelectSizeTemplate={onSelectSizeTemplate}
            onUndo={onUndo}
            sizePresetId={sizePresetId}
          />
          {hasComposeControls ? (
            <>
              <DesktopDynamicIslandDivider />
              <DynamicIslandComposeToolbar
                activeCanvasTool={activeCanvasTool}
                activeInteractionTool={activeInteractionTool}
                activePaneId={activePaneId!}
                canRemove={Boolean(canRemoveQrCode)}
                insertNodeId={insertNodeId}
                isMaximized={false}
                qr={{
                  canAdd: Boolean(canAddQrCode),
                  onAdd: onAddQrCode,
                }}
                onAddTextLayerAt={onAddTextLayerAt}
                onBrowseStockPhotos={onBrowseStockPhotos}
                onCanvasToolChange={onCanvasToolChange}
                onInsertLayer={onInsertLayer}
                onOpenCardPatternSettings={onOpenCardPatternSettings}
                onRemoveQrCode={
                  onRemoveQrCode && activePaneId
                    ? () => onRemoveQrCode()
                    : undefined
                }
                onResetView={() => undefined}
                onToggleMaximize={() => undefined}
                onZoomIn={() => undefined}
                onZoomOut={() => undefined}
                paneCount={1}
                snapEnabled={snapEnabled!}
                onSnapEnabledChange={onSnapEnabledChange!}
                zoomPercent="100%"
              />
            </>
          ) : null}
          {hasLayerSettings ? (
            <>
              <DesktopDynamicIslandDivider />
              <DesktopLayerSettingsTrigger
                appearance={appearance}
                appearanceLayer={appearanceLayer}
                onAppearancePatch={onAppearancePatch}
                onElementLayerPatch={onElementLayerPatch}
                onTransformLayerPatch={onTransformLayerPatch}
                selectedElementLayer={selectedElementLayer}
                selectedTransformLayer={selectedTransformLayer}
                theme={theme}
              />
            </>
          ) : null}
          <DesktopDynamicIslandDivider />
          <DesktopKeyboardShortcutsTrigger popoverSide="bottom" variant="glass" />
          {onThemeChange ? (
            <DesktopThemeToggleButton
              theme={theme}
              onToggle={() => onThemeChange(theme === "light" ? "dark" : "light")}
              variant="glass"
            />
          ) : null}
        </div>
      }
      showViewControls={false}
      className={cn(hasAppearance || hasComposeControls || hasLayerSettings ? "min-w-[12rem]" : undefined)}
    />
  )
}
