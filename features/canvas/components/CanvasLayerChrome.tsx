"use client";

import {
  forwardRef,
  useMemo,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { CopyIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";

import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import { FloatingLayerToolbarSettings } from "@/features/canvas/components/FloatingLayerToolbarSettings";
import { isProtectedCanvasLayerId, type CanvasLayer } from "@/features/canvas/model/layers/shared";
import type { ChromeBounds } from "@/features/canvas/components/canvas-layer-chrome-overlay";
import {
  type ResizeDirection,
  type SnapGuides,
} from "@/features/canvas/components/canvas-layer-geometry";
import { type CanvasLayerMenuAction } from "@/features/canvas/components/canvas-layer-chrome.constants";
import { cn } from "@/lib/utils";

const CORNER_RESIZE_HANDLES: Array<{
  className: string;
  cursorClassName: string;
  direction: ResizeDirection;
  label: string;
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
];

const EDGE_RESIZE_ZONES: Array<{
  className: string;
  cursorClassName: string;
  direction: ResizeDirection;
  label: string;
  style: CSSProperties;
}> = [
  {
    className: "top-0 -translate-y-1/2",
    cursorClassName: "cursor-ns-resize",
    direction: "n",
    label: "top",
    style: {
      height: "var(--canvas-resize-edge-hit, 8px)",
      left: "var(--canvas-resize-corner-hit, 16px)",
      right: "var(--canvas-resize-corner-hit, 16px)",
    },
  },
  {
    className: "right-0 translate-x-1/2",
    cursorClassName: "cursor-ew-resize",
    direction: "e",
    label: "right",
    style: {
      bottom: "var(--canvas-resize-corner-hit, 16px)",
      top: "var(--canvas-resize-corner-hit, 16px)",
      width: "var(--canvas-resize-edge-hit, 8px)",
    },
  },
  {
    className: "bottom-0 translate-y-1/2",
    cursorClassName: "cursor-ns-resize",
    direction: "s",
    label: "bottom",
    style: {
      height: "var(--canvas-resize-edge-hit, 8px)",
      left: "var(--canvas-resize-corner-hit, 16px)",
      right: "var(--canvas-resize-corner-hit, 16px)",
    },
  },
  {
    className: "left-0 -translate-x-1/2",
    cursorClassName: "cursor-ew-resize",
    direction: "w",
    label: "left",
    style: {
      bottom: "var(--canvas-resize-corner-hit, 16px)",
      top: "var(--canvas-resize-corner-hit, 16px)",
      width: "var(--canvas-resize-edge-hit, 8px)",
    },
  },
];

export function ResizeFrameControls({
  onPointerCancel,
  onPointerMove,
  onPointerUp,
  onResizePointerDown,
  targetLabel,
}: {
  targetLabel: string;
  onResizePointerDown: (event: PointerEvent<HTMLButtonElement>, direction: ResizeDirection) => void;
  onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <>
      {EDGE_RESIZE_ZONES.map((zone) => (
        <button
          aria-label={`Resize ${targetLabel} from ${zone.label}`}
          className={cn(
            "pointer-events-auto absolute z-20 touch-none border-0 bg-transparent p-0",
            zone.className,
            zone.cursorClassName,
          )}
          data-resize-direction={zone.direction}
          data-slot="canvas-layer-resize-edge"
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
            "pointer-events-auto absolute z-30 flex size-4 touch-none items-center justify-center border-0 bg-transparent p-0",
            handle.className,
            handle.cursorClassName,
          )}
          data-resize-direction={handle.direction}
          data-slot="canvas-layer-resize-handle"
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
            className="size-2 rounded-xs border-2 border-[var(--canvas-resize-frame)] bg-white shadow-[var(--canvas-shadow-rest)]"
            data-slot="canvas-layer-resize-handle-knob"
          />
        </button>
      ))}
    </>
  );
}

export function SnapGuideOverlay({
  clipBounds,
  guides,
}: {
  clipBounds?: ChromeBounds | null;
  guides: SnapGuides;
}) {
  if (guides.horizontal.length === 0 && guides.vertical.length === 0) {
    return null;
  }

  return (
    <>
      {guides.vertical.map((x) => (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[var(--z-canvas-guide)] w-px bg-[var(--canvas-resize-frame)]"
          data-slot="canvas-layer-snap-guide"
          data-axis="vertical"
          key={`v-${x}`}
          style={
            clipBounds
              ? {
                  height: `${clipBounds.height}px`,
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${clipBounds.y}px)`,
                }
              : { bottom: 0, left: `calc(50% + ${x}px)`, top: 0 }
          }
        />
      ))}
      {guides.horizontal.map((y) => (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[var(--z-canvas-guide)] h-px bg-[var(--canvas-resize-frame)]"
          data-slot="canvas-layer-snap-guide"
          data-axis="horizontal"
          key={`h-${y}`}
          style={
            clipBounds
              ? {
                  left: `calc(50% + ${clipBounds.x}px)`,
                  top: `calc(50% + ${y}px)`,
                  width: `${clipBounds.width}px`,
                }
              : { left: 0, right: 0, top: `calc(50% + ${y}px)` }
          }
        />
      ))}
    </>
  );
}

export function LayerContextMenu({
  anchor,
  layerCount,
  layers,
  onAction,
  onClose,
  theme = "dark",
}: {
  /** Client-space point the menu anchors to (pointer or trigger rect). */
  anchor: { x: number; y: number };
  layerCount: number;
  layers: CanvasLayer[];
  onAction: (action: CanvasLayerMenuAction) => void;
  onClose: () => void;
  theme?: ThemeMode;
}) {
  const isMultiLayer = layerCount > 1;
  const hasSelection = layerCount > 0;
  const hasGroupLayer = layers.some((layer) => layer.kind === "group");
  const virtualAnchor = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () => new DOMRect(anchor.x, anchor.y, 0, 0),
      },
    }),
    [anchor.x, anchor.y],
  );

  return (
    <Popover modal={false} open onOpenChange={(open) => !open && onClose()}>
      <PopoverAnchor virtualRef={virtualAnchor} />
      <PopoverContent
        align="start"
        avoidCollisions
        collisionPadding={8}
        side="bottom"
        sideOffset={4}
        className={cn(
          "ds-portal-surface ds-popover-content ds-popover-flat z-[var(--z-popover)] w-52 p-1.5 ds-squircle-md",
          theme === "dark" && "dark",
        )}
        data-canvas-dropdown-content="true"
        data-slot="canvas-layer-context-menu"
        data-toolbar-appearance="glass"
        data-theme={theme}
        role="menu"
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
            <LayerContextMenuButton
              label="Reset rotation"
              onClick={() => onAction("reset-rotation")}
            />
            {isMultiLayer ? (
              <>
                <LayerContextMenuSeparator />
                <LayerContextMenuButton label="Group" onClick={() => onAction("group")} />
                <LayerContextMenuButton
                  label="Distribute selection horizontally"
                  onClick={() => onAction("horizontal")}
                />
                <LayerContextMenuButton
                  label="Distribute selection vertically"
                  onClick={() => onAction("vertical")}
                />
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
      </PopoverContent>
    </Popover>
  );
}

function LayerContextMenuButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      className="block h-8 w-full cursor-pointer rounded-full px-3 text-left text-[length:var(--type-value)] font-semibold text-current transition-[background-color,color] duration-[var(--motion-fast)] hover:bg-[var(--control)] hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,var(--ring))]"
      role="menuitem"
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function LayerContextMenuSeparator() {
  return (
    <div
      aria-hidden="true"
      className="my-1 h-px bg-[var(--line)]"
      data-slot="canvas-layer-context-menu-separator"
    />
  );
}

export const FloatingLayerToolbar = forwardRef<
  HTMLDivElement,
  {
    layers: CanvasLayer[];
    onAction?: (action: CanvasLayerMenuAction) => void;
    onCopy?: () => void;
    onLayerChange?: (patch: Partial<CanvasLayer>) => void;
    onMore: (event: MouseEvent<HTMLButtonElement>) => void;
    style: CSSProperties;
    theme?: ThemeMode;
  }
>(function FloatingLayerToolbar(
  { layers, onAction, onCopy, onLayerChange, onMore, style, theme = "dark" },
  ref,
) {
  const hasRemovableLayer = layers.some((layer) => !isProtectedCanvasLayerId(layer.id, layers));
  const settingsLayer = layers.length === 1 ? layers[0] : null;
  const showLayerSettings = Boolean(settingsLayer && onLayerChange);

  return (
    <div
      ref={ref}
      className={cn(
        "ds-portal-surface ds-popover-content pointer-events-auto absolute left-1/2 top-1/2 z-[var(--z-canvas-toolbar)] inline-flex h-9 max-w-[calc(100%-1rem)] items-center justify-start gap-0.5 overflow-x-auto rounded-full px-1 text-[var(--fg)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        theme === "dark" && "dark",
      )}
      data-slot="canvas-layer-floating-toolbar"
      data-toolbar-appearance="glass"
      role="toolbar"
      data-theme={theme}
      aria-label="Layer actions"
      style={style}
      tabIndex={-1}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {showLayerSettings ? (
        <FloatingLayerToolbarSettings
          layer={settingsLayer!}
          theme={theme}
          onPatch={onLayerChange!}
        />
      ) : null}
      <FloatingLayerToolbarButton
        label="Copy selection"
        disabled={!onCopy}
        onClick={() => onCopy?.()}
      >
        <CopyIcon aria-hidden="true" className="size-4" strokeWidth={2} />
      </FloatingLayerToolbarButton>
      <FloatingLayerToolbarButton
        label="Delete selection"
        disabled={!onAction || !hasRemovableLayer}
        onClick={() => onAction?.("delete")}
      >
        <Trash2Icon aria-hidden="true" className="size-4" strokeWidth={2} />
      </FloatingLayerToolbarButton>
      <FloatingLayerToolbarButton label="More layer actions" onClick={onMore}>
        <MoreHorizontalIcon aria-hidden="true" className="size-4" strokeWidth={2} />
      </FloatingLayerToolbarButton>
    </div>
  );
});

function FloatingLayerToolbarButton({
  children,
  disabled = false,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[color-mix(in_srgb,var(--fg)_78%,transparent)] transition-colors duration-[var(--motion-fast)] hover:text-[var(--fg)] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,var(--ring))]"
      data-slot="canvas-layer-floating-toolbar-button"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
