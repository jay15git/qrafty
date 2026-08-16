"use client"

import {
  Redo2Icon,
  SquareRoundCornerIcon,
  SquareIcon,
  Undo2Icon,
} from "lucide-react"
import { type ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"

import {
  AppearanceOutlineControls,
  AppearanceRadiusControls,
} from "@/features/desktop-shell/components/AppearancePopoverControls"
import {
  DesktopKeyboardShortcutsTrigger,
  DesktopThemeToggleButton,
} from "@/features/desktop-shell/components/DesktopChromeControls"
import { DesktopCanvasRatioPresetPopover } from "@/features/desktop-shell/components/DesktopCanvasRatioPresetRow"
import { DesktopLayerToolbar } from "@/features/desktop-shell/components/DesktopLayerToolbar"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { DesktopUtilityToolbarButton } from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import DynamicIsland from "@/components/smoothui/dynamic-island"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { SizeTemplate } from "@/features/workspace/model/size-templates"
import type { DraftingPaneCanvasTool } from "@/features/workspace/components/DraftingPaneSurface"
import { DynamicIslandComposeToolbar } from "@/features/workspace/components/canvas-compose-toolbar"
import { cn } from "@/lib/utils"

type AppearancePopoverId = "radius" | "outline"

function getAppearancePopoverLabel(
  popoverId: AppearancePopoverId,
  appearance: DesktopAppearanceSnapshot,
): string {
  switch (popoverId) {
    case "outline":
      return "Outline settings"
    case "radius":
      return "Corner radius settings"
  }
}

const APPEARANCE_POPOVERS: Array<{
  id: AppearancePopoverId
  renderIcon: () => ReactNode
  renderControls: (props: {
    appearance: DesktopAppearanceSnapshot
    onPatch: (patch: Partial<DraftingCanvasLayer>) => void
    theme: DesktopThemeMode
  }) => ReactNode
}> = [
  {
    id: "outline",
    renderIcon: () => <SquareIcon className="size-3.5" />,
    renderControls: ({ appearance, onPatch, theme }) => (
      <AppearanceOutlineControls appearance={appearance} onPatch={onPatch} theme={theme} />
    ),
  },
  {
    id: "radius",
    renderIcon: () => <SquareRoundCornerIcon className="size-3.5" />,
    renderControls: ({ appearance, onPatch }) => (
      <AppearanceRadiusControls appearance={appearance} onPatch={onPatch} />
    ),
  },
]

function DesktopAppearancePopover({
  appearance,
  label,
  onPatch,
  popoverId,
  renderControls,
  renderIcon,
  theme,
}: {
  appearance: DesktopAppearanceSnapshot
  label: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  popoverId: AppearancePopoverId
  theme: DesktopThemeMode
  renderControls: (props: {
    appearance: DesktopAppearanceSnapshot
    onPatch: (patch: Partial<DraftingCanvasLayer>) => void
    theme: DesktopThemeMode
  }) => ReactNode
  renderIcon: () => ReactNode
}) {
  if (popoverId === "outline" && !appearance.supportsOutline) {
    return null
  }

  if (popoverId === "radius" && !appearance.supportsCornerRadius) {
    return null
  }

  return (
    <Popover>
      <DesktopTooltip content={label} side="bottom" sideOffset={10}>
        <PopoverTrigger asChild>
          <DesktopUtilityToolbarButton
            aria-label={label}
            data-slot={`desktop-appearance-${popoverId}-trigger`}
          >
            {renderIcon()}
          </DesktopUtilityToolbarButton>
        </PopoverTrigger>
      </DesktopTooltip>
      <PopoverContent
        align="center"
        data-slot={`desktop-appearance-${popoverId}-popover`}
        sideOffset={12}
        className="z-[20000] flex h-[min(28rem,calc(100dvh-8rem))] max-h-[min(28rem,calc(100dvh-8rem))] w-[min(18rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[16px] border border-[var(--desktop-appearance-popover-border)] bg-[var(--desktop-appearance-popover-bg)] p-0 text-[var(--desktop-inspector-fg-secondary)] shadow-[var(--desktop-appearance-popover-shadow)] backdrop-blur-xl"
      >
        <ScrollArea
          chevron
          cueSize="comfortable"
          className="h-full min-h-0 flex-1"
          data-slot="desktop-inspector-scroll-area"
          scrollFade
          viewportClassName="px-3 py-3"
        >
          <div data-slot="desktop-inspector-scroll">
            <div data-slot="desktop-floating-inspector">{renderControls({ appearance, onPatch, theme })}</div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function DesktopDynamicIslandDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-0.5 h-6 w-px shrink-0 bg-[var(--desktop-glass-border)]"
    />
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
          disabled={!canUndo || !onUndo}
          onClick={onUndo}
        >
          <Undo2Icon className="size-3.5" />
        </DesktopUtilityToolbarButton>
      </DesktopTooltip>
      <DesktopTooltip content="Redo" side="bottom" sideOffset={10}>
        <DesktopUtilityToolbarButton
          aria-label="Redo"
          disabled={!canRedo || !onRedo}
          onClick={onRedo}
        >
          <Redo2Icon className="size-3.5" />
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

function DesktopAppearanceIsland({
  appearance,
  onPatch,
  theme,
}: {
  appearance: DesktopAppearanceSnapshot
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-1 px-1"
      data-slot="desktop-appearance-island"
    >
      {APPEARANCE_POPOVERS.map((popover) => (
        <DesktopAppearancePopover
          key={popover.id}
          appearance={appearance}
          label={getAppearancePopoverLabel(popover.id, appearance)}
          onPatch={onPatch}
          popoverId={popover.id}
          renderControls={popover.renderControls}
          renderIcon={popover.renderIcon}
          theme={theme}
        />
      ))}
    </div>
  )
}

export function DesktopDynamicIslandChrome({
  appearance,
  activeCanvasTool,
  activePaneId,
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
  onPatch,
  onRedo,
  onRemoveQrCode,
  onElementLayerPatch,
  onSelectSizeTemplate,
  onSnapEnabledChange,
  onThemeChange,
  onUndo,
  selectedElementLayer,
  snapEnabled,
  sizePresetId,
  theme = "dark",
}: {
  appearance?: DesktopAppearanceSnapshot | null
  activeCanvasTool?: DraftingPaneCanvasTool | null
  activePaneId?: string
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
  onPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onRedo?: () => void
  onRemoveQrCode?: () => void
  onElementLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onSelectSizeTemplate?: (template: SizeTemplate) => void
  onSnapEnabledChange?: (enabled: boolean) => void
  onThemeChange?: (theme: DesktopThemeMode) => void
  onUndo?: () => void
  selectedElementLayer?: DraftingCanvasLayer | null
  snapEnabled?: boolean
  sizePresetId?: string
  theme?: DesktopThemeMode
}) {
  const hasAppearance = Boolean(appearance && onPatch)
  const hasLayerToolbar = Boolean(selectedElementLayer && onElementLayerPatch)
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
          {hasLayerToolbar ? (
            <>
              <DesktopDynamicIslandDivider />
              <DesktopLayerToolbar
                layer={selectedElementLayer!}
                theme={theme}
                onPatch={onElementLayerPatch!}
              />
            </>
          ) : null}
          {hasAppearance ? (
            <>
              <DesktopDynamicIslandDivider />
              <DesktopAppearanceIsland
                appearance={appearance!}
                onPatch={onPatch!}
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
      className={cn(hasAppearance || hasComposeControls || hasLayerToolbar ? "min-w-[12rem]" : undefined)}
    />
  )
}
