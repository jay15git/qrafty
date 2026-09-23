"use client"

import { createPortal } from "react-dom"
import type {
  CSSProperties,
  MouseEvent,
  PointerEvent,
  ReactNode,
  RefObject,
} from "react"

import {
  LayerContextMenu,
  LayerFloatingToolbar,
  ResizeFrameControls,
  SnapGuideOverlay,
} from "@/features/canvas/components/PaneLayerChrome"
import {
  FLOATING_TOOLBAR_EDGE_GUTTER_PX,
  FLOATING_TOOLBAR_GAP_PX,
  FLOATING_TOOLBAR_HEIGHT_PX,
  RESIZE_CONTROL_PADDING_PX,
  ROTATE_HANDLE_OFFSET_PX,
  ROTATE_HANDLE_RADIUS_PX,
  ROTATE_HANDLE_STEM_PX,
  ROTATE_LABEL_GAP_PX,
  type DraftingLayerMenuAction,
} from "@/features/canvas/components/pane-layer-chrome.constants"
import {
  documentToChromeOffset,
  documentToChromeSize,
  type ChromeBounds,
  type ChromeSpace,
  getChromeFrameRect,
  getFloatingToolbarChromePosition,
} from "@/features/canvas/components/pane-layer-chrome-overlay"
import {
  SceneCompositionTransform,
} from "@/features/canvas/components/SceneBackgroundLayer"
import { PaneDocumentCardLayer } from "@/features/canvas/components/PaneLayerViews"
import { cornerRadiiToCss } from "@/features/canvas/model/corner-radius"
import type { DraftingCardState } from "@/features/canvas/model/card-state"
import type { SceneCompositionState } from "@/features/canvas/model/scene-templates"
import type { PreviewStageSize } from "@/features/canvas/preview/preview-camera"
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared"
import type { DesktopThemeMode } from "@/features/shell/components/FloatingToolbar"
import {
  getLayerRotationLabel,
  getMarqueeBounds,
  type ResizeDirection,
  type SnapGuides,
} from "@/features/canvas/components/pane-layer-geometry"
import type {
  PaneContextMenuState,
  PaneMarqueeState,
  PaneMultiSelectionPreview,
} from "@/features/canvas/components/use-pane-workspace-interactions"

type PaneLayerControlsFrameProps = {
  activeSelectedLayerIdSet: Set<string>
  activeSelectedLayerIds: string[]
  chromeSpace: ChromeSpace
  editingTextLayerId: string | null
  layer: DraftingCanvasLayer
  onEndLayerInteraction: (event: PointerEvent<HTMLElement>) => void
  onOpenLayerContextMenu: (event: MouseEvent<HTMLElement>, layerIds: string[]) => void
  onStartLayerInteraction: (
    event: PointerEvent<HTMLElement>,
    layer: DraftingCanvasLayer,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) => void
  onUpdateLayerInteraction: (event: PointerEvent<HTMLElement>) => void
  rotatingLayerId: string | null
  rotationPreviewDegrees: number | null
}

function PaneLayerControlsFrame({
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
}: PaneLayerControlsFrameProps) {
  if (activeSelectedLayerIds.length !== 1 || !activeSelectedLayerIdSet.has(layer.id)) {
    return null
  }

  if (layer.kind === "text" && editingTextLayerId === layer.id) {
    return null
  }

  const frame = getChromeFrameRect(layer, RESIZE_CONTROL_PADDING_PX, chromeSpace)
  const isRotating = rotatingLayerId === layer.id
  const rotationDegrees = rotationPreviewDegrees ?? getLayerRotationLabel(layer.rotation)
  const rotation =
    Number.isFinite(layer.rotation) && layer.rotation !== 0
      ? ` rotate(${layer.rotation}deg)`
      : ""

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 touch-none overflow-visible border-2 border-[var(--canvas-resize-frame)]"
      data-layer-id={layer.id}
      data-slot="drafting-layer-resize-frame"
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
          data-slot="drafting-layer-rotation-value"
          data-toolbar-appearance="desktop-glass"
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
        data-slot="drafting-layer-rotate-handle"
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
          data-slot="drafting-layer-rotate-handle-knob"
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
  )
}

type PaneMultiSelectFrameProps = {
  activeSelectedLayerIds: string[]
  chromeSpace: ChromeSpace
  combinedLayerBounds:
    | (Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y"> & { rotation?: number })
    | null
  multiSelectionPreview: PaneMultiSelectionPreview | null
  onEndLayerInteraction: (event: PointerEvent<HTMLElement>) => void
  onOpenLayerContextMenu: (event: MouseEvent<HTMLElement>, layerIds: string[]) => void
  onStartMultiLayerInteraction: (
    event: PointerEvent<HTMLElement>,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) => void
  onUpdateLayerInteraction: (event: PointerEvent<HTMLElement>) => void
  rotatingLayerId: string | null
  rotationPreviewDegrees: number | null
}

function PaneMultiSelectFrame({
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
}: PaneMultiSelectFrameProps) {
  const bounds = multiSelectionPreview?.bounds ?? combinedLayerBounds

  if (activeSelectedLayerIds.length < 2 || !bounds) {
    return null
  }

  const frame = getChromeFrameRect(bounds, RESIZE_CONTROL_PADDING_PX, chromeSpace)
  const isRotating = rotatingLayerId === "selection"
  const rotationDegrees = multiSelectionPreview?.rotation ?? bounds.rotation ?? rotationPreviewDegrees ?? 0
  const rotationTransform = rotationDegrees ? ` rotate(${rotationDegrees}deg)` : ""

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 touch-none overflow-visible border-2 border-[var(--canvas-resize-frame)]"
      data-layer-ids={activeSelectedLayerIds.join(" ")}
      data-slot="drafting-layer-multi-select-frame"
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
          data-slot="drafting-layer-rotation-value"
          data-toolbar-appearance="desktop-glass"
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
        data-slot="drafting-layer-rotate-handle"
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
          data-slot="drafting-layer-rotate-handle-knob"
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
  )
}

type PaneFloatingToolbarProps = {
  canvasHeight: number
  canvasWidth: number
  chromeSpace: ChromeSpace
  combinedLayerBounds:
    | (Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y"> & { rotation?: number })
    | null
  isLayerInteracting: boolean
  marquee: PaneMarqueeState | null
  onLayerAction?: (layerIds: string[], action: DraftingLayerMenuAction) => void
  onLayerChange?: (layerId: string, patch: Partial<DraftingCanvasLayer>) => void
  onLayerCopy?: (layerIds: string[]) => void
  onOpenFloatingLayerContextMenu: (
    event: MouseEvent<HTMLButtonElement>,
    layerIds: string[],
  ) => void
  onRunSelectedLayerAction: (action: DraftingLayerMenuAction) => void
  onRunSelectedLayerCopy: () => void
  rotatingLayerId: string | null
  selectedVisibleLayers: DraftingCanvasLayer[]
  selectedVisibleLayerIds: string[]
  theme: DesktopThemeMode
  toolbarRef: RefObject<HTMLDivElement | null>
  toolbarWidth: number
}

function PaneFloatingToolbar({
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
}: PaneFloatingToolbarProps) {
  const bounds = combinedLayerBounds

  if (
    !bounds ||
    selectedVisibleLayers.length === 0 ||
    isLayerInteracting ||
    marquee ||
    rotatingLayerId !== null
  ) {
    return null
  }

  const { x, y } = getFloatingToolbarChromePosition({
    bounds,
    canvasHeight,
    canvasWidth,
    gapPx: FLOATING_TOOLBAR_GAP_PX,
    gutterPx: FLOATING_TOOLBAR_EDGE_GUTTER_PX,
    paddingPx: RESIZE_CONTROL_PADDING_PX,
    rotateStemPx: ROTATE_HANDLE_STEM_PX,
    space: chromeSpace,
    toolbarHeightPx: FLOATING_TOOLBAR_HEIGHT_PX,
    toolbarWidthPx: toolbarWidth,
  })

  return (
    <LayerFloatingToolbar
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
  )
}

type PaneMarqueeOverlayProps = {
  chromeSpace: ChromeSpace
  marquee: PaneMarqueeState | null
}

function PaneMarqueeOverlay({ chromeSpace, marquee }: PaneMarqueeOverlayProps) {
  if (!marquee) {
    return null
  }

  const bounds = getMarqueeBounds(marquee.start, marquee.end)
  const origin = documentToChromeOffset(bounds.x, bounds.y, chromeSpace)

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-[9998] border-2 border-[var(--canvas-ink)] bg-[var(--canvas-ink)]/10"
      data-slot="drafting-layer-marquee"
      style={{
        height: documentToChromeSize(bounds.height, chromeSpace),
        transform: `translate3d(${origin.x}px, ${origin.y}px, 0)`,
        width: documentToChromeSize(bounds.width, chromeSpace),
      }}
    />
  )
}

export type PaneChromeOverlayProps = {
  activeSelectedLayerIdSet: Set<string>
  activeSelectedLayerIds: string[]
  canvasHeight: number
  canvasWidth: number
  chromeSnapGuides: SnapGuides
  chromeSpace: ChromeSpace
  combinedLayerBounds:
    | (Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y"> & { rotation?: number })
    | null
  contentLayers: DraftingCanvasLayer[]
  editingTextLayerId: string | null
  isLayerInteracting: boolean
  marquee: PaneMarqueeState | null
  multiSelectionPreview: PaneMultiSelectionPreview | null
  onLayerAction?: (layerIds: string[], action: DraftingLayerMenuAction) => void
  onLayerChange?: (layerId: string, patch: Partial<DraftingCanvasLayer>) => void
  onLayerCopy?: (layerIds: string[]) => void
  onEndLayerInteraction: (event: PointerEvent<HTMLElement>) => void
  onOpenFloatingLayerContextMenu: (
    event: MouseEvent<HTMLButtonElement>,
    layerIds: string[],
  ) => void
  onOpenLayerContextMenu: (event: MouseEvent<HTMLElement>, layerIds: string[]) => void
  onRunSelectedLayerAction: (action: DraftingLayerMenuAction) => void
  onRunSelectedLayerCopy: () => void
  onStartLayerInteraction: (
    event: PointerEvent<HTMLElement>,
    layer: DraftingCanvasLayer,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) => void
  onStartMultiLayerInteraction: (
    event: PointerEvent<HTMLElement>,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) => void
  onUpdateLayerInteraction: (event: PointerEvent<HTMLElement>) => void
  rotatingLayerId: string | null
  rotationPreviewDegrees: number | null
  selectedVisibleLayers: DraftingCanvasLayer[]
  selectedVisibleLayerIds: string[]
  snapGuideClipBounds: ChromeBounds | null
  theme: DesktopThemeMode
  toolbarRef: RefObject<HTMLDivElement | null>
  toolbarWidth: number
}

function PaneChromeOverlay({
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
}: PaneChromeOverlayProps) {
  return (
    <>
      <SnapGuideOverlay clipBounds={snapGuideClipBounds} guides={chromeSnapGuides} />
      <PaneMarqueeOverlay chromeSpace={chromeSpace} marquee={marquee} />
      {activeSelectedLayerIds.length > 0
        ? contentLayers.map((layer) => (
            <PaneLayerControlsFrame
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
      <PaneMultiSelectFrame
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
      <PaneFloatingToolbar
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
  )
}

export type PaneCanvasContentProps = PaneChromeOverlayProps & {
  cardLayers: DraftingCanvasLayer[]
  cardState: DraftingCardState
  contentOnlyZoom: boolean
  contentTransformStyle: CSSProperties | undefined
  contextMenu: PaneContextMenuState | null
  contextMenuLayers: DraftingCanvasLayer[]
  isImageFilterMode: boolean
  isImageMode: boolean
  isPaperShaderMode: boolean
  onCloseContextMenu: () => void
  onRunLayerAction: (action: DraftingLayerMenuAction) => void
  previewCameraStyle: CSSProperties
  previewStageBorderRadius: string
  previewStageSize: PreviewStageSize
  renderLayerView: (layer: DraftingCanvasLayer) => ReactNode
  sceneLayout: SceneCompositionState["layout"]
  visibleLayers: DraftingCanvasLayer[]
}

export function PaneCanvasContent(props: PaneCanvasContentProps) {
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
  } = props

  return (
    <>
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden"
        data-slot="desktop-compose-artboard-stage"
        style={{
          borderRadius: previewStageBorderRadius,
          height: previewStageSize.height,
          transform: "translate(-50%, -50%)",
          width: previewStageSize.width,
        }}
      >
        <div
          className="overflow-hidden"
          data-slot="desktop-compose-artboard"
          style={{
            ...previewCameraStyle,
            borderRadius: cornerRadiiToCss(cardState.cornerRadii),
          }}
        >
        {contentOnlyZoom ? (
          <div className="relative h-full w-full" data-export-root>
            {cardLayers.map((layer) => (
              <PaneDocumentCardLayer
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
                data-slot="desktop-compose-content-zoom"
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
        className="pointer-events-none absolute inset-0 z-[10000] overflow-visible"
        data-slot="drafting-layer-chrome-overlay"
      >
        <PaneChromeOverlay {...props} />
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
  )
}
