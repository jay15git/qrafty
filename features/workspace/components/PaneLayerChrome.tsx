"use client"

import {
  forwardRef,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react"
import {
  CopyIcon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react"

import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { LayerFloatingToolbarSettings } from "@/features/workspace/components/LayerFloatingToolbarSettings"
import {
  isProtectedDraftingLayerId,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import {
  type ResizeDirection,
  type SnapGuides,
} from "@/features/workspace/components/pane-layer-geometry"
import {
  RESIZE_CORNER_HIT_SIZE_PX,
  RESIZE_EDGE_HIT_SIZE_PX,
  type DraftingLayerMenuAction,
} from "@/features/workspace/components/pane-layer-chrome.constants"
import { cn } from "@/lib/utils"

const CORNER_RESIZE_HANDLES: Array<{
  className: string
  cursorClassName: string
  direction: ResizeDirection
  label: string
}> = [
  {
    className: "right-0 top-0 translate-x-1/2 -translate-y-1/2",
    cursorClassName: "cursor-nesw-resize",
    direction: "ne",
    label: "top right",
  },
  {
    className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
    cursorClassName: "cursor-nwse-resize",
    direction: "se",
    label: "bottom right",
  },
  {
    className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
    cursorClassName: "cursor-nesw-resize",
    direction: "sw",
    label: "bottom left",
  },
  {
    className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
    cursorClassName: "cursor-nwse-resize",
    direction: "nw",
    label: "top left",
  },
]

const EDGE_RESIZE_ZONES: Array<{
  className: string
  cursorClassName: string
  direction: ResizeDirection
  label: string
  style: CSSProperties
}> = [
  {
    className: "top-0 -translate-y-1/2",
    cursorClassName: "cursor-ns-resize",
    direction: "n",
    label: "top",
    style: {
      height: RESIZE_EDGE_HIT_SIZE_PX,
      left: RESIZE_CORNER_HIT_SIZE_PX,
      right: RESIZE_CORNER_HIT_SIZE_PX,
    },
  },
  {
    className: "right-0 translate-x-1/2",
    cursorClassName: "cursor-ew-resize",
    direction: "e",
    label: "right",
    style: {
      bottom: RESIZE_CORNER_HIT_SIZE_PX,
      top: RESIZE_CORNER_HIT_SIZE_PX,
      width: RESIZE_EDGE_HIT_SIZE_PX,
    },
  },
  {
    className: "bottom-0 translate-y-1/2",
    cursorClassName: "cursor-ns-resize",
    direction: "s",
    label: "bottom",
    style: {
      height: RESIZE_EDGE_HIT_SIZE_PX,
      left: RESIZE_CORNER_HIT_SIZE_PX,
      right: RESIZE_CORNER_HIT_SIZE_PX,
    },
  },
  {
    className: "left-0 -translate-x-1/2",
    cursorClassName: "cursor-ew-resize",
    direction: "w",
    label: "left",
    style: {
      bottom: RESIZE_CORNER_HIT_SIZE_PX,
      top: RESIZE_CORNER_HIT_SIZE_PX,
      width: RESIZE_EDGE_HIT_SIZE_PX,
    },
  },
]

export function ResizeFrameControls({
  onPointerCancel,
  onPointerMove,
  onPointerUp,
  onResizePointerDown,
  targetLabel,
}: {
  targetLabel: string
  onResizePointerDown: (event: PointerEvent<HTMLButtonElement>, direction: ResizeDirection) => void
  onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void
}) {
  return (
    <>
      {EDGE_RESIZE_ZONES.map((zone) => (
        <button
          aria-label={`Resize ${targetLabel} from ${zone.label}`}
          className={cn(
            "pointer-events-auto absolute z-20 border-0 bg-transparent p-0",
            zone.className,
            zone.cursorClassName,
          )}
          data-resize-direction={zone.direction}
          data-slot="drafting-layer-resize-edge"
          key={zone.direction}
          onClick={(event) => event.stopPropagation()}
          onPointerCancel={onPointerCancel}
          onPointerDown={(event) => onResizePointerDown(event, zone.direction)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={zone.style}
          type="button"
        />
      ))}
      {CORNER_RESIZE_HANDLES.map((handle) => (
        <button
          aria-label={`Resize ${targetLabel} from ${handle.label}`}
          className={cn(
            "pointer-events-auto absolute z-30 flex size-4 items-center justify-center border-0 bg-transparent p-0",
            handle.className,
            handle.cursorClassName,
          )}
          data-resize-direction={handle.direction}
          data-slot="drafting-layer-resize-handle"
          key={handle.direction}
          onClick={(event) => event.stopPropagation()}
          onPointerCancel={onPointerCancel}
          onPointerDown={(event) => onResizePointerDown(event, handle.direction)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          type="button"
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-[2px] border-2 border-[var(--ws-resize-frame)] bg-white shadow-[var(--ws-shadow-rest)]"
            data-slot="drafting-layer-resize-handle-knob"
          />
        </button>
      ))}
    </>
  )
}

export function SnapGuideOverlay({ guides }: { guides: SnapGuides }) {
  if (guides.horizontal.length === 0 && guides.vertical.length === 0) {
    return null
  }

  return (
    <>
      {guides.vertical.map((x) => (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-[9999] w-px bg-[var(--ws-ink)] opacity-55"
          data-slot="drafting-layer-snap-guide"
          data-axis="vertical"
          key={`v-${x}`}
          style={{ left: `calc(50% + ${x}px)` }}
        />
      ))}
      {guides.horizontal.map((y) => (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-[9999] h-px bg-[var(--ws-ink)] opacity-55"
          data-slot="drafting-layer-snap-guide"
          data-axis="horizontal"
          key={`h-${y}`}
          style={{ top: `calc(50% + ${y}px)` }}
        />
      ))}
    </>
  )
}

export function LayerContextMenu({
  layerCount,
  layers,
  onAction,
  style,
}: {
  layerCount: number
  layers: DraftingCanvasLayer[]
  onAction: (action: DraftingLayerMenuAction) => void
  style: CSSProperties
}) {
  const isMultiLayer = layerCount > 1
  const hasSelection = layerCount > 0
  const hasGroupLayer = layers.some((layer) => layer.kind === "group")

  return (
    <div
      className="fixed z-[20000] min-w-52 rounded-[18px] border border-[var(--ws-dropdown-border)] bg-[var(--ws-dropdown-menu-surface-open)] p-1.5 text-[var(--ws-dropdown-text)] shadow-[var(--ws-dropdown-menu-shadow-open)]"
      data-drafting-dropdown-content="true"
      data-slot="drafting-layer-context-menu"
      data-toolbar-appearance="desktop-glass"
      role="menu"
      style={style}
      tabIndex={-1}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {hasSelection ? (
        <>
          <LayerContextMenuButton label="Bring to front" onClick={() => onAction("front")} />
          <LayerContextMenuButton label="Bring forward" onClick={() => onAction("forward")} />
          <LayerContextMenuButton label="Send backward" onClick={() => onAction("backward")} />
          <LayerContextMenuButton label="Send to back" onClick={() => onAction("back")} />
          <LayerContextMenuSeparator />
          <LayerContextMenuButton label="Reset rotation" onClick={() => onAction("reset-rotation")} />
          {isMultiLayer ? (
            <>
              <LayerContextMenuSeparator />
              <LayerContextMenuButton label="Group" onClick={() => onAction("group")} />
              <LayerContextMenuButton label="Distribute selection horizontally" onClick={() => onAction("horizontal")} />
              <LayerContextMenuButton label="Distribute selection vertically" onClick={() => onAction("vertical")} />
            </>
          ) : null}
          {hasGroupLayer ? (
            <>
              <LayerContextMenuSeparator />
              <LayerContextMenuButton label="Ungroup" onClick={() => onAction("ungroup")} />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function LayerContextMenuButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      className="block h-8 w-full cursor-pointer rounded-full px-3 text-left text-[12px] font-semibold text-current transition-[background-color,color] duration-150 hover:bg-white/[0.11] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
      role="menuitem"
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function LayerContextMenuSeparator() {
  return (
    <div
      aria-hidden="true"
      className="my-1 h-px bg-white/[0.12]"
      data-slot="drafting-layer-context-menu-separator"
    />
  )
}

export const LayerFloatingToolbar = forwardRef<
  HTMLDivElement,
  {
    layers: DraftingCanvasLayer[]
    onAction?: (action: DraftingLayerMenuAction) => void
    onCopy?: () => void
    onLayerChange?: (patch: Partial<DraftingCanvasLayer>) => void
    onMore: (event: MouseEvent<HTMLButtonElement>) => void
    style: CSSProperties
    theme?: DesktopThemeMode
  }
>(function LayerFloatingToolbar(
  {
    layers,
    onAction,
    onCopy,
    onLayerChange,
    onMore,
    style,
    theme = "dark",
  },
  ref,
) {
  const hasRemovableLayer = layers.some(
    (layer) => !isProtectedDraftingLayerId(layer.id, layers),
  )
  const settingsLayer = layers.length === 1 ? layers[0] : null
  const showLayerSettings = Boolean(settingsLayer && onLayerChange)

  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute left-1/2 top-1/2 z-[10001] inline-flex h-12 min-w-48 items-center justify-center gap-1 rounded-2xl border border-white/[0.12] bg-[#171717] px-1.5 text-white/78 shadow-[var(--desktop-glass-shadow)]"
      data-slot="drafting-layer-floating-toolbar"
      data-toolbar-appearance="desktop-glass"
      role="toolbar"
      aria-label="Layer actions"
      style={style}
      tabIndex={-1}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {showLayerSettings ? (
        <>
          <LayerFloatingToolbarSettings
            layer={settingsLayer!}
            theme={theme}
            onPatch={onLayerChange!}
          />
          <div
            className="mx-0.5 h-4 w-px bg-white/[0.12]"
            data-slot="drafting-layer-toolbar-settings-separator"
          />
        </>
      ) : null}
      <LayerFloatingToolbarButton
        label="Copy selection"
        disabled={!onCopy}
        onClick={() => onCopy?.()}
      >
        <CopyIcon aria-hidden="true" className="size-4" strokeWidth={2} />
      </LayerFloatingToolbarButton>
      <LayerFloatingToolbarButton
        label="Delete selection"
        disabled={!onAction || !hasRemovableLayer}
        onClick={() => onAction?.("delete")}
      >
        <Trash2Icon aria-hidden="true" className="size-4" strokeWidth={2} />
      </LayerFloatingToolbarButton>
      <div className="mx-0.5 h-4 w-px bg-white/[0.12]" data-slot="drafting-layer-toolbar-separator" />
      <LayerFloatingToolbarButton label="More layer actions" onClick={onMore}>
        <MoreHorizontalIcon aria-hidden="true" className="size-4" strokeWidth={2} />
      </LayerFloatingToolbarButton>
    </div>
  )
})

function LayerFloatingToolbarButton({
  children,
  disabled = false,
  label,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  label: string
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      aria-label={label}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-current transition-[background-color,color] duration-150 hover:bg-[var(--ws-layer-toolbar-button-hover-bg,rgba(255,255,255,0.11))] hover:text-[var(--ws-layer-toolbar-button-hover-text,white)] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
      data-slot="drafting-layer-floating-toolbar-button"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
