"use client";

import { createPortal } from "react-dom";
import type { CSSProperties, MouseEvent, PointerEvent, ReactNode, RefObject } from "react";

import {
  LayerContextMenu,
  FloatingLayerToolbar,
  ResizeFrameControls,
  SnapGuideOverlay,
} from "@/features/canvas/components/CanvasLayerChrome";
import {
  LAYER_TOOLBAR_EDGE_GUTTER_PX,
  LAYER_TOOLBAR_GAP_PX,
  LAYER_TOOLBAR_HEIGHT_PX,
  RESIZE_CONTROL_PADDING_PX,
  ROTATE_HANDLE_OFFSET_PX,
  ROTATE_HANDLE_RADIUS_PX,
  ROTATE_HANDLE_STEM_PX,
  ROTATE_LABEL_GAP_PX,
  type CanvasLayerMenuAction,
} from "@/features/canvas/components/canvas-layer-chrome.constants";
import {
  documentToChromeOffset,
  documentToChromeSize,
  type ChromeBounds,
  type ChromeSpace,
  getChromeFrameRect,
  getFloatingLayerToolbarPosition,
} from "@/features/canvas/components/canvas-layer-chrome-overlay";
import { SceneCompositionTransform } from "@/features/canvas/components/SceneBackgroundLayer";
import { CanvasDocumentCardLayer } from "@/features/canvas/components/CanvasLayerViews";
import { cornerRadiiToCss } from "@/features/canvas/model/corner-radius";
import type { DraftingCardState } from "@/features/canvas/model/card-state";
import type { SceneCompositionState } from "@/features/canvas/model/scene-templates";
import type { PreviewStageSize } from "@/features/canvas/preview/preview-camera";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import {
  getLayerRotationLabel,
  getMarqueeBounds,
  type ResizeDirection,
  type SnapGuides,
} from "@/features/canvas/components/canvas-layer-geometry";
import type {
  CanvasContextMenuState,
  CanvasMarqueeState,
  CanvasMultiSelectionPreview,
} from "@/features/canvas/components/use-canvas-workspace-interactions";

type CanvasLayerControlsFrameProps = {
  activeSelectedLayerIdSet: Set<string>;
  activeSelectedLayerIds: string[];
  chromeSpace: ChromeSpace;
  editingTextLayerId: string | null;
  layer: CanvasLayer;
  onEndLayerInteraction: (event: PointerEvent<HTMLElement>) => void;
  onOpenLayerContextMenu: (event: MouseEvent<HTMLElement>, layerIds: string[]) => void;
  onStartLayerInteraction: (
    event: PointerEvent<HTMLElement>,
    layer: CanvasLayer,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) => void;
  onUpdateLayerInteraction: (event: PointerEvent<HTMLElement>) => void;
  rotatingLayerId: string | null;
  rotationPreviewDegrees: number | null;
};

function CanvasLayerControlsFrame({
  activeSelectedLayerIdSet,
  activeSelectedLayerIds,
  chromeSpace,
  editingTextLayerId,
  layer,
  onEndLayerInteraction,
  onOpenLayerContextMenu,
  onStartLayerInteraction,
  onUpdateLayerInteraction,
  rotatingLayerId,
  rotationPreviewDegrees,
}: CanvasLayerControlsFrameProps) {
  if (activeSelectedLayerIds.length !== 1 || !activeSelectedLayerIdSet.has(layer.id)) {
    return null;
  }

  if (layer.kind === "text" && editingTextLayerId === layer.id) {
    return null;
  }

  const frame = getChromeFrameRect(layer, RESIZE_CONTROL_PADDING_PX, chromeSpace);
  const isRotating = rotatingLayerId === layer.id;
  const rotationDegrees = rotationPreviewDegrees ?? getLayerRotationLabel(layer.rotation);
  const rotation =
    Number.isFinite(layer.rotation) && layer.rotation !== 0 ? ` rotate(${layer.rotation}deg)` : "";

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 touch-none overflow-visible border-2 border-[var(--canvas-resize-frame)]"
      data-layer-id={layer.id}
      data-slot="canvas-layer-resize-frame"
      key={`${layer.id}:controls`}
      style={{
        height: frame.height,
        transform: `translate3d(${frame.x}px, ${frame.y}px, 0)${rotation}`,
        transformOrigin: "center center",
        width: frame.width,
        zIndex: 10000,
      }}
      onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 w-0.5 -translate-x-1/2 -translate-y-full bg-[var(--canvas-resize-frame)]"
        style={{ height: ROTATE_HANDLE_OFFSET_PX }}
      />
      {isRotating ? (
        <div
          className="pointer-events-none absolute left-1/2 top-0 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--glass-fg)] shadow-[var(--glass-shadow)] backdrop-blur-2xl"
          data-slot="canvas-layer-rotation-value"
          data-toolbar-appearance="glass"
          style={{
            transform: `translate(-50%, calc(-${ROTATE_HANDLE_OFFSET_PX}px - ${ROTATE_HANDLE_RADIUS_PX}px - ${ROTATE_LABEL_GAP_PX}px - 100%))`,
          }}
        >
          {rotationDegrees}°
        </div>
      ) : null}
      <button
        aria-label={`Rotate ${layer.name}`}
        className="pointer-events-auto absolute left-1/2 top-0 z-30 flex size-4 touch-none items-center justify-center border-0 bg-transparent p-0"
        data-slot="canvas-layer-rotate-handle"
        onClick={(event) => event.stopPropagation()}
        onPointerCancel={onEndLayerInteraction}
        onPointerDown={(event) => onStartLayerInteraction(event, layer, "rotate")}
        onPointerMove={onUpdateLayerInteraction}
        onPointerUp={onEndLayerInteraction}
        style={{
          transform: `translate(-50%, calc(-${ROTATE_HANDLE_OFFSET_PX}px - 50%))`,
        }}
        type="button"
      >
        <span
          aria-hidden="true"
          className="size-2 rounded-full border-2 border-[var(--canvas-resize-frame)] bg-white shadow-[var(--canvas-shadow-rest)]"
          data-slot="canvas-layer-rotate-handle-knob"
        />
      </button>
      <ResizeFrameControls
        onPointerCancel={onEndLayerInteraction}
        onPointerMove={onUpdateLayerInteraction}
        onPointerUp={onEndLayerInteraction}
        onResizePointerDown={(event, direction) =>
          onStartLayerInteraction(event, layer, "resize", direction)
        }
        targetLabel={layer.name}
      />
    </div>
  );
}

type CanvasMultiSelectFrameProps = {
  activeSelectedLayerIds: string[];
  chromeSpace: ChromeSpace;
  combinedLayerBounds:
    (Pick<CanvasLayer, "height" | "width" | "x" | "y"> & { rotation?: number }) | null;
  multiSelectionPreview: CanvasMultiSelectionPreview | null;
  onEndLayerInteraction: (event: PointerEvent<HTMLElement>) => void;
  onOpenLayerContextMenu: (event: MouseEvent<HTMLElement>, layerIds: string[]) => void;
  onStartMultiLayerInteraction: (
    event: PointerEvent<HTMLElement>,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) => void;
  onUpdateLayerInteraction: (event: PointerEvent<HTMLElement>) => void;
  rotatingLayerId: string | null;
  rotationPreviewDegrees: number | null;
};

function CanvasMultiSelectFrame({
  activeSelectedLayerIds,
  chromeSpace,
  combinedLayerBounds,
  multiSelectionPreview,
  onEndLayerInteraction,
  onOpenLayerContextMenu,
  onStartMultiLayerInteraction,
  onUpdateLayerInteraction,
  rotatingLayerId,
  rotationPreviewDegrees,
}: CanvasMultiSelectFrameProps) {
  const bounds = multiSelectionPreview?.bounds ?? combinedLayerBounds;

  if (activeSelectedLayerIds.length < 2 || !bounds) {
    return null;
  }

  const frame = getChromeFrameRect(bounds, RESIZE_CONTROL_PADDING_PX, chromeSpace);
  const isRotating = rotatingLayerId === "selection";
  const rotationDegrees =
    multiSelectionPreview?.rotation ?? bounds.rotation ?? rotationPreviewDegrees ?? 0;
  const rotationTransform = rotationDegrees ? ` rotate(${rotationDegrees}deg)` : "";

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 touch-none overflow-visible border-2 border-[var(--canvas-resize-frame)]"
      data-layer-ids={activeSelectedLayerIds.join(" ")}
      data-slot="canvas-layer-multi-select-frame"
      style={{
        height: frame.height,
        transform: `translate3d(${frame.x}px, ${frame.y}px, 0)${rotationTransform}`,
        transformOrigin: "center center",
        width: frame.width,
        zIndex: 50,
      }}
      onContextMenu={(event) => onOpenLayerContextMenu(event, activeSelectedLayerIds)}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 w-0.5 -translate-x-1/2 -translate-y-full bg-[var(--canvas-resize-frame)]"
        style={{ height: ROTATE_HANDLE_OFFSET_PX }}
      />
      {isRotating ? (
        <div
          className="pointer-events-none absolute left-1/2 top-0 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--glass-fg)] shadow-[var(--glass-shadow)] backdrop-blur-2xl"
          data-slot="canvas-layer-rotation-value"
          data-toolbar-appearance="glass"
          style={{
            transform: `translate(-50%, calc(-${ROTATE_HANDLE_OFFSET_PX}px - ${ROTATE_HANDLE_RADIUS_PX}px - ${ROTATE_LABEL_GAP_PX}px - 100%))`,
          }}
        >
          {rotationDegrees}°
        </div>
      ) : null}
      <button
        aria-label="Rotate selection"
        className="pointer-events-auto absolute left-1/2 top-0 z-30 flex size-4 touch-none items-center justify-center border-0 bg-transparent p-0"
        data-slot="canvas-layer-rotate-handle"
        onClick={(event) => event.stopPropagation()}
        onPointerCancel={onEndLayerInteraction}
        onPointerDown={(event) => onStartMultiLayerInteraction(event, "rotate")}
        onPointerMove={onUpdateLayerInteraction}
        onPointerUp={onEndLayerInteraction}
        style={{
          transform: `translate(-50%, calc(-${ROTATE_HANDLE_OFFSET_PX}px - 50%))`,
        }}
        type="button"
      >
        <span
          aria-hidden="true"
          className="size-2 rounded-full border-2 border-[var(--canvas-resize-frame)] bg-white shadow-[var(--canvas-shadow-rest)]"
          data-slot="canvas-layer-rotate-handle-knob"
        />
      </button>
      <ResizeFrameControls
        onPointerCancel={onEndLayerInteraction}
        onPointerMove={onUpdateLayerInteraction}
        onPointerUp={onEndLayerInteraction}
        onResizePointerDown={(event, direction) =>
          onStartMultiLayerInteraction(event, "resize", direction)
        }
        targetLabel="selection"
      />
    </div>
  );
}

type CanvasLayerToolbarProps = {
  canvasHeight: number;
  canvasWidth: number;
  chromeSpace: ChromeSpace;
  combinedLayerBounds:
    (Pick<CanvasLayer, "height" | "width" | "x" | "y"> & { rotation?: number }) | null;
  isLayerInteracting: boolean;
  marquee: CanvasMarqueeState | null;
  onLayerAction?: (layerIds: string[], action: CanvasLayerMenuAction) => void;
  onLayerChange?: (layerId: string, patch: Partial<CanvasLayer>) => void;
  onLayerCopy?: (layerIds: string[]) => void;
  onOpenFloatingLayerContextMenu: (
    event: MouseEvent<HTMLButtonElement>,
    layerIds: string[],
  ) => void;
  onRunSelectedLayerAction: (action: CanvasLayerMenuAction) => void;
  onRunSelectedLayerCopy: () => void;
  rotatingLayerId: string | null;
  selectedVisibleLayers: CanvasLayer[];
  selectedVisibleLayerIds: string[];
  theme: ThemeMode;
  toolbarRef: RefObject<HTMLDivElement | null>;
  toolbarWidth: number;
};

function CanvasLayerToolbar({
  canvasHeight,
  canvasWidth,
  chromeSpace,
  combinedLayerBounds,
  isLayerInteracting,
  marquee,
  onLayerAction,
  onLayerChange,
  onLayerCopy,
  onOpenFloatingLayerContextMenu,
  onRunSelectedLayerAction,
  onRunSelectedLayerCopy,
  rotatingLayerId,
  selectedVisibleLayers,
  selectedVisibleLayerIds,
  theme,
  toolbarRef,
  toolbarWidth,
}: CanvasLayerToolbarProps) {
  const bounds = combinedLayerBounds;

  if (
    !bounds ||
    selectedVisibleLayers.length === 0 ||
    isLayerInteracting ||
    marquee ||
    rotatingLayerId !== null
  ) {
    return null;
  }

  const { x, y } = getFloatingLayerToolbarPosition({
    bounds,
    canvasHeight,
    canvasWidth,
    gapPx: LAYER_TOOLBAR_GAP_PX,
    gutterPx: LAYER_TOOLBAR_EDGE_GUTTER_PX,
    paddingPx: RESIZE_CONTROL_PADDING_PX,
    rotateStemPx: ROTATE_HANDLE_STEM_PX,
    space: chromeSpace,
    toolbarHeightPx: LAYER_TOOLBAR_HEIGHT_PX,
    toolbarWidthPx: toolbarWidth,
  });

  return (
    <FloatingLayerToolbar
      ref={toolbarRef}
      layers={selectedVisibleLayers}
      onAction={onLayerAction ? onRunSelectedLayerAction : undefined}
      onCopy={onLayerCopy ? onRunSelectedLayerCopy : undefined}
      onLayerChange={
        onLayerChange && selectedVisibleLayers.length === 1
          ? (patch) => onLayerChange(selectedVisibleLayers[0]!.id, patch)
          : undefined
      }
      onMore={(event) => onOpenFloatingLayerContextMenu(event, selectedVisibleLayerIds)}
      style={{
        transform: `translate3d(${x}px, ${y}px, 0) translateX(-50%)`,
      }}
      theme={theme}
    />
  );
}

type CanvasMarqueeOverlayProps = {
  chromeSpace: ChromeSpace;
  marquee: CanvasMarqueeState | null;
};

function CanvasMarqueeOverlay({ chromeSpace, marquee }: CanvasMarqueeOverlayProps) {
  if (!marquee) {
    return null;
  }

  const bounds = getMarqueeBounds(marquee.start, marquee.end);
  const origin = documentToChromeOffset(bounds.x, bounds.y, chromeSpace);

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-[var(--z-canvas-overlay)] border-2 border-[var(--canvas-ink)] bg-[var(--canvas-ink)]/10"
      data-slot="canvas-layer-marquee"
      style={{
        height: documentToChromeSize(bounds.height, chromeSpace),
        transform: `translate3d(${origin.x}px, ${origin.y}px, 0)`,
        width: documentToChromeSize(bounds.width, chromeSpace),
      }}
    />
  );
}

export type CanvasChromeOverlayProps = {
  activeSelectedLayerIdSet: Set<string>;
  activeSelectedLayerIds: string[];
  canvasHeight: number;
  canvasWidth: number;
  chromeSnapGuides: SnapGuides;
  chromeSpace: ChromeSpace;
  combinedLayerBounds:
    (Pick<CanvasLayer, "height" | "width" | "x" | "y"> & { rotation?: number }) | null;
  contentLayers: CanvasLayer[];
  editingTextLayerId: string | null;
  isLayerInteracting: boolean;
  marquee: CanvasMarqueeState | null;
  multiSelectionPreview: CanvasMultiSelectionPreview | null;
  onLayerAction?: (layerIds: string[], action: CanvasLayerMenuAction) => void;
  onLayerChange?: (layerId: string, patch: Partial<CanvasLayer>) => void;
  onLayerCopy?: (layerIds: string[]) => void;
  onEndLayerInteraction: (event: PointerEvent<HTMLElement>) => void;
  onOpenFloatingLayerContextMenu: (
    event: MouseEvent<HTMLButtonElement>,
    layerIds: string[],
  ) => void;
  onOpenLayerContextMenu: (event: MouseEvent<HTMLElement>, layerIds: string[]) => void;
  onRunSelectedLayerAction: (action: CanvasLayerMenuAction) => void;
  onRunSelectedLayerCopy: () => void;
  onStartLayerInteraction: (
    event: PointerEvent<HTMLElement>,
    layer: CanvasLayer,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) => void;
  onStartMultiLayerInteraction: (
    event: PointerEvent<HTMLElement>,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) => void;
  onUpdateLayerInteraction: (event: PointerEvent<HTMLElement>) => void;
  rotatingLayerId: string | null;
  rotationPreviewDegrees: number | null;
  selectedVisibleLayers: CanvasLayer[];
  selectedVisibleLayerIds: string[];
  snapGuideClipBounds: ChromeBounds | null;
  theme: ThemeMode;
  toolbarRef: RefObject<HTMLDivElement | null>;
  toolbarWidth: number;
};

function CanvasChromeOverlay({
  activeSelectedLayerIdSet,
  activeSelectedLayerIds,
  canvasHeight,
  canvasWidth,
  chromeSnapGuides,
  chromeSpace,
  combinedLayerBounds,
  contentLayers,
  editingTextLayerId,
  isLayerInteracting,
  marquee,
  multiSelectionPreview,
  onLayerAction,
  onLayerChange,
  onLayerCopy,
  onEndLayerInteraction,
  onOpenFloatingLayerContextMenu,
  onOpenLayerContextMenu,
  onRunSelectedLayerAction,
  onRunSelectedLayerCopy,
  onStartLayerInteraction,
  onStartMultiLayerInteraction,
  onUpdateLayerInteraction,
  rotatingLayerId,
  rotationPreviewDegrees,
  selectedVisibleLayers,
  selectedVisibleLayerIds,
  snapGuideClipBounds,
  theme,
  toolbarRef,
  toolbarWidth,
}: CanvasChromeOverlayProps) {
  return (
    <>
      <SnapGuideOverlay clipBounds={snapGuideClipBounds} guides={chromeSnapGuides} />
      <CanvasMarqueeOverlay chromeSpace={chromeSpace} marquee={marquee} />
      {activeSelectedLayerIds.length > 0
        ? contentLayers.map((layer) => (
            <CanvasLayerControlsFrame
              key={`${layer.id}:controls`}
              activeSelectedLayerIdSet={activeSelectedLayerIdSet}
              activeSelectedLayerIds={activeSelectedLayerIds}
              chromeSpace={chromeSpace}
              editingTextLayerId={editingTextLayerId}
              layer={layer}
              onEndLayerInteraction={onEndLayerInteraction}
              onOpenLayerContextMenu={onOpenLayerContextMenu}
              onStartLayerInteraction={onStartLayerInteraction}
              onUpdateLayerInteraction={onUpdateLayerInteraction}
              rotatingLayerId={rotatingLayerId}
              rotationPreviewDegrees={rotationPreviewDegrees}
            />
          ))
        : null}
      <CanvasMultiSelectFrame
        activeSelectedLayerIds={activeSelectedLayerIds}
        chromeSpace={chromeSpace}
        combinedLayerBounds={combinedLayerBounds}
        multiSelectionPreview={multiSelectionPreview}
        onEndLayerInteraction={onEndLayerInteraction}
        onOpenLayerContextMenu={onOpenLayerContextMenu}
        onStartMultiLayerInteraction={onStartMultiLayerInteraction}
        onUpdateLayerInteraction={onUpdateLayerInteraction}
        rotatingLayerId={rotatingLayerId}
        rotationPreviewDegrees={rotationPreviewDegrees}
      />
      <CanvasLayerToolbar
        canvasHeight={canvasHeight}
        canvasWidth={canvasWidth}
        chromeSpace={chromeSpace}
        combinedLayerBounds={combinedLayerBounds}
        isLayerInteracting={isLayerInteracting}
        marquee={marquee}
        onLayerAction={onLayerAction}
        onLayerChange={onLayerChange}
        onLayerCopy={onLayerCopy}
        onOpenFloatingLayerContextMenu={onOpenFloatingLayerContextMenu}
        onRunSelectedLayerAction={onRunSelectedLayerAction}
        onRunSelectedLayerCopy={onRunSelectedLayerCopy}
        rotatingLayerId={rotatingLayerId}
        selectedVisibleLayers={selectedVisibleLayers}
        selectedVisibleLayerIds={selectedVisibleLayerIds}
        theme={theme}
        toolbarRef={toolbarRef}
        toolbarWidth={toolbarWidth}
      />
    </>
  );
}

export type CanvasWorkspaceContentProps = CanvasChromeOverlayProps & {
  cardLayers: CanvasLayer[];
  cardState: DraftingCardState;
  contentOnlyZoom: boolean;
  contentTransformStyle: CSSProperties | undefined;
  contextMenu: CanvasContextMenuState | null;
  contextMenuLayers: CanvasLayer[];
  isImageFilterMode: boolean;
  isImageMode: boolean;
  isPaperShaderMode: boolean;
  onCloseContextMenu: () => void;
  onRunLayerAction: (action: CanvasLayerMenuAction) => void;
  previewCameraStyle: CSSProperties;
  previewStageBorderRadius: string;
  previewStageSize: PreviewStageSize;
  renderLayerView: (layer: CanvasLayer) => ReactNode;
  sceneLayout: SceneCompositionState["layout"];
  visibleLayers: CanvasLayer[];
};

export function CanvasWorkspaceContent(props: CanvasWorkspaceContentProps) {
  const {
    cardLayers,
    cardState,
    contentOnlyZoom,
    contentTransformStyle,
    contextMenu,
    contextMenuLayers,
    isImageFilterMode,
    isImageMode,
    isPaperShaderMode,
    onCloseContextMenu,
    onRunLayerAction,
    previewCameraStyle,
    previewStageBorderRadius,
    previewStageSize,
    renderLayerView,
    sceneLayout,
    visibleLayers,
  } = props;

  return (
    <>
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden"
        data-slot="canvas-artboard-stage"
        style={{
          borderRadius: previewStageBorderRadius,
          height: previewStageSize.height,
          transform: "translate(-50%, -50%)",
          width: previewStageSize.width,
        }}
      >
        <div
          className="overflow-hidden"
          data-slot="canvas-artboard"
          style={{
            ...previewCameraStyle,
            borderRadius: cornerRadiiToCss(cardState.cornerRadii),
          }}
        >
          {contentOnlyZoom ? (
            <div className="relative h-full w-full" data-export-root>
              {cardLayers.map((layer) => (
                <CanvasDocumentCardLayer
                  key={layer.id}
                  cardState={cardState}
                  isImageFilterMode={isImageFilterMode}
                  isImageMode={isImageMode}
                  isPaperShaderMode={isPaperShaderMode}
                  isLayerSelected={props.activeSelectedLayerIdSet.has(layer.id)}
                  layer={layer}
                />
              ))}
              <SceneCompositionTransform layout={sceneLayout}>
                <div
                  className="relative h-full w-full"
                  data-slot="canvas-content-zoom"
                  style={contentTransformStyle}
                >
                  {props.contentLayers.map((layer) => renderLayerView(layer))}
                </div>
              </SceneCompositionTransform>
            </div>
          ) : (
            <SceneCompositionTransform layout={sceneLayout}>
              <div className="relative h-full w-full" data-export-root>
                {visibleLayers.map((layer) => renderLayerView(layer))}
              </div>
            </SceneCompositionTransform>
          )}
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[var(--z-canvas-chrome)] overflow-visible"
        data-slot="canvas-layer-chrome-overlay"
      >
        <CanvasChromeOverlay {...props} />
      </div>
      {contextMenu && typeof document !== "undefined"
        ? createPortal(
            <LayerContextMenu
              anchor={{ x: contextMenu.x, y: contextMenu.y }}
              layerCount={contextMenu.layerIds.length}
              layers={contextMenuLayers}
              onAction={onRunLayerAction}
              onClose={onCloseContextMenu}
              theme={props.theme}
            />,
            document.body,
          )
        : null}
    </>
  );
}
