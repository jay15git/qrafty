"use client"

import {
  memo,
  useMemo,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type MutableRefObject,
  type PointerEvent,
} from "react"

import { DraftingCardPaperShaderLayer } from "@/features/workspace/components/CardPaperShaderLayer"
import { DraftingLayerTiltShell } from "@/features/workspace/components/DraftingLayerTiltShell"
import { DraftingQrLayerContent } from "@/features/workspace/components/DraftingQrLayerContent"
import {
  createDefaultDraftingCardPaperShader,
  type DraftingCardPaperShaderState,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import { cornerRadiiToCss, resolveLayerCornerRadii } from "@/features/workspace/model/corner-radius"
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type DraftingCanvasLayer,
  type DraftingTextRun,
} from "@/features/workspace/model/layers"
import {
  getDraftingCardBorderStyle,
  getDraftingLayerEffectStyle,
  getLayerPlacementStyle,
  getTextLayerStyle,
  getTextRunStyle,
} from "@/features/workspace/rendering/layer-dom-styles"
import {
  getBackgroundShapeTiltInnerStyle,
  getBackgroundShapeTiltPerspectiveStyle,
} from "@/features/workspace/rendering/layer-transform"
import {
  layoutDraftingText,
} from "@/features/workspace/rendering/text-layout"
import {
  DraftingImageLayerContent,
  DraftingShapeLayerContent,
} from "@/features/workspace/rendering/shape-layer"
import type { QrStudioState } from "@/features/qr-code/model/state"
import { useDraftingQrMarkup } from "@/features/workspace/hooks/use-drafting-qr-markup"
import type { DraftingQrStateByLayerId } from "@/features/workspace/model/document"
import { cssFillToBackgroundStyle } from "@/features/workspace/model/css-fill-style"
import { cn } from "@/lib/utils"
import type { ResizeDirection } from "@/features/workspace/components/pane-layer-geometry"
import { PaneLayerInteractive } from "@/features/workspace/components/pane-layer-a11y"

const LAYER_MOVE_CURSOR_CLASS = "cursor-all-scroll"

function layerExportAttrs(kind: DraftingCanvasLayer["kind"]) {
  return {
    "data-export-kind": kind,
    "data-export-layer": "true",
  } as const
}

function buildPaneDocumentCardSurfaceStyle(
  cardState: DraftingCardState,
  isImageFilterMode: boolean,
  isImageMode: boolean,
  isPaperShaderMode: boolean,
): CSSProperties {
  const usesShaderOrImageSurface = isPaperShaderMode || isImageFilterMode || isImageMode
  return {
    ...(usesShaderOrImageSurface
      ? { backgroundColor: "transparent" }
      : cssFillToBackgroundStyle(cardState.fill)),
    ...getDraftingCardBorderStyle(cardState),
    borderRadius: cornerRadiiToCss(cardState.cornerRadii),
  }
}

type PaneDocumentCardLayerProps = {
  cardState: DraftingCardState
  isImageFilterMode: boolean
  isImageMode: boolean
  isPaperShaderMode: boolean
  isLayerSelected: boolean
  layer: DraftingCanvasLayer
  nested?: boolean
}

export const PaneDocumentCardLayer = memo(function PaneDocumentCardLayer({
  cardState,
  isImageFilterMode,
  isImageMode,
  isPaperShaderMode,
  isLayerSelected,
  layer,
  nested = false,
}: PaneDocumentCardLayerProps) {
  const cardImageStyle =
    (isImageMode || isImageFilterMode) && cardState.cardImage.value
      ? {
          backgroundImage: `url("${cardState.cardImage.value}")`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: cardState.cardImage.fit,
        }
      : undefined
  const imageFilterShader = useMemo(
    () => ({
      ...cardState.imageFilter,
      image: {
        ...cardState.imageFilter.image,
        source:
          cardState.cardImage.source === "none"
            ? cardState.imageFilter.image.source
            : cardState.cardImage.source,
        value: cardState.cardImage.value ?? cardState.imageFilter.image.value,
      },
    }),
    [cardState.cardImage.source, cardState.cardImage.value, cardState.imageFilter],
  )
  const surfaceStyle = useMemo(
    () => buildPaneDocumentCardSurfaceStyle(cardState, isImageFilterMode, isImageMode, isPaperShaderMode),
    [cardState, isImageFilterMode, isImageMode, isPaperShaderMode],
  )

  if (nested) {
    return (
      <div
        key={layer.id}
        data-slot="desktop-compose-card"
        data-layer-id={layer.id}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("card")}
        className="absolute max-h-none max-w-none overflow-visible"
        style={{
          ...surfaceStyle,
          ...getLayerPlacementStyle(layer, true),
          ...getDraftingLayerEffectStyle(layer),
        }}
      >
        {isPaperShaderMode ? (
          <DraftingCardPaperShaderLayer
            layoutHeight={layer.height}
            layoutWidth={layer.width}
            paperShader={cardState.paperShader}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div
      key={layer.id}
      data-slot="desktop-compose-card"
      data-layer-id={layer.id}
      data-card-paper-shader={
        isPaperShaderMode
          ? cardState.paperShader.shaderId
          : isImageFilterMode
            ? cardState.imageFilter.shaderId
            : "none"
      }
      data-card-shadow-blur={layer.shadow.blur}
      data-card-shadow-offset-x={layer.shadow.offsetX}
      data-card-shadow-offset-y={layer.shadow.offsetY}
      data-card-style-mode={cardState.styleMode}
      data-card-enabled={layer.isVisible ? "true" : "false"}
      data-card-border-width={cardState.border.width}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("card")}
      className={cn(
        "pointer-events-none absolute max-h-none max-w-none overflow-hidden",
        isPaperShaderMode
          ? "transition-[filter,border-radius] duration-150"
          : "transition-[filter,background-color,border-radius] duration-150",
      )}
      style={{
        ...surfaceStyle,
        ...getLayerPlacementStyle(layer),
        ...getDraftingLayerEffectStyle(layer),
      }}
    >
      <DraftingLayerTiltShell layer={layer}>
        {isImageMode && cardState.cardImage.value ? (
          <div
            aria-hidden="true"
            data-slot="desktop-compose-card-image"
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              ...cardImageStyle,
              borderRadius: "inherit",
              opacity: cardState.cardImage.opacity / 100,
            }}
          />
        ) : null}
        {isPaperShaderMode ? (
          <DraftingCardPaperShaderLayer
            layoutHeight={layer.height}
            layoutWidth={layer.width}
            paperShader={cardState.paperShader}
          />
        ) : null}
        {isImageFilterMode ? (
          <DraftingCardPaperShaderLayer
            layoutHeight={layer.height}
            layoutWidth={layer.width}
            paperShader={imageFilterShader}
          />
        ) : null}
      </DraftingLayerTiltShell>
    </div>
  )
}, paneDocumentCardLayerPropsAreEqual)

function paneDocumentCardLayerPropsAreEqual(
  previous: PaneDocumentCardLayerProps,
  next: PaneDocumentCardLayerProps,
) {
  return (
    previous.layer === next.layer &&
    previous.cardState === next.cardState &&
    previous.isImageFilterMode === next.isImageFilterMode &&
    previous.isImageMode === next.isImageMode &&
    previous.isPaperShaderMode === next.isPaperShaderMode &&
    previous.isLayerSelected === next.isLayerSelected &&
    previous.nested === next.nested
  )
}

function getTextLayerRuns(layer: DraftingCanvasLayer): DraftingTextRun[] {
  const text = layer.text ?? ""
  const runs = layer.textRuns

  if (!runs?.length || runs.map((run) => run.text).join("") !== text) {
    return text ? [{ text }] : []
  }

  return runs
}

function hasValidTextRuns(layer: DraftingCanvasLayer) {
  return Boolean(layer.textRuns?.length) && layer.textRuns?.map((run) => run.text).join("") === (layer.text ?? "")
}

function getTextRunKey(layerId: string, run: DraftingTextRun, index: number) {
  return `${layerId}:run:${index}:${run.text.length}`
}

function renderTextLayerContent(layer: DraftingCanvasLayer) {
  if (hasValidTextRuns(layer)) {
    return getTextLayerRuns(layer).map((run, index) => (
      <span
        data-slot="drafting-text-run"
        key={getTextRunKey(layer.id, run, index)}
        style={getTextRunStyle(layer, run)}
      >
        {run.text}
      </span>
    ))
  }

  const layout = layoutDraftingText(layer)

  return layout.lines.map((line, index) => (
    <div
      data-slot="drafting-text-line"
      key={`${layer.id}:line:${index}`}
      style={{ minHeight: layout.lineHeight }}
    >
      {line || "\u00a0"}
      {line && index < layout.lines.length - 1 ? " " : null}
    </div>
  ))
}

function resolveQrLayerState(
  layerId: string,
  qrStateByLayerId: DraftingQrStateByLayerId,
  fallbackState: QrStudioState,
) {
  return qrStateByLayerId[layerId] ?? fallbackState
}

function PaneQrLayerSurface({
  layer,
  qrState,
}: {
  layer: DraftingCanvasLayer
  qrState: QrStudioState
}) {
  const { markup } = useDraftingQrMarkup(qrState)
  const shapeTiltPerspectiveStyle = getBackgroundShapeTiltPerspectiveStyle(
    qrState.backgroundShapeOptions,
  )
  const shapeTiltInnerStyle = getBackgroundShapeTiltInnerStyle(qrState.backgroundShapeOptions)

  return (
    <DraftingQrLayerContent
      canvasSvgMarkup={markup}
      layer={layer}
      qrMarkup={markup ?? ""}
      shapeTiltInnerStyle={shapeTiltInnerStyle}
      shapeTiltPerspectiveStyle={shapeTiltPerspectiveStyle}
      state={qrState}
    />
  )
}

export type PaneLayerViewSharedProps = {
  activeSelectedLayerIdSet: Set<string>
  cardImageStyle: CSSProperties | undefined
  cardState: DraftingCardState
  cardStyle: CSSProperties
  imageFilterShader: DraftingCardPaperShaderState
  isImageFilterMode: boolean
  isImageMode: boolean
  isPaperShaderMode: boolean
  qrStateByLayerId: DraftingQrStateByLayerId
  state: QrStudioState
}

export type PaneNestedLayerViewProps = PaneLayerViewSharedProps & {
  layer: DraftingCanvasLayer
}

export function PaneNestedLayerView({
  activeSelectedLayerIdSet,
  cardImageStyle,
  cardState,
  cardStyle,
  imageFilterShader,
  isImageFilterMode,
  isImageMode,
  isPaperShaderMode,
  layer,
  qrStateByLayerId,
  state,
}: PaneNestedLayerViewProps) {
  const isLayerSelected = activeSelectedLayerIdSet.has(layer.id)

  if (layer.kind === "group") {
    return (
      <div
        key={layer.id}
        data-slot="drafting-layer-group"
        data-layer-id={layer.id}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("group")}
        className="absolute max-h-none max-w-none"
        style={{
          ...getLayerPlacementStyle(layer, true),
          ...getDraftingLayerEffectStyle(layer),
        }}
      >
        {(layer.children ?? [])
          .filter((child) => child.isVisible)
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((child) => (
            <PaneNestedLayerView
              key={child.id}
              activeSelectedLayerIdSet={activeSelectedLayerIdSet}
              cardImageStyle={cardImageStyle}
              cardState={cardState}
              cardStyle={cardStyle}
              imageFilterShader={imageFilterShader}
              isImageFilterMode={isImageFilterMode}
              isImageMode={isImageMode}
              isPaperShaderMode={isPaperShaderMode}
              layer={child}
              qrStateByLayerId={qrStateByLayerId}
              state={state}
            />
          ))}
      </div>
    )
  }

  if (layer.kind === "qr") {
    const qrState = resolveQrLayerState(layer.id, qrStateByLayerId, state)

    return (
      <div
        key={layer.id}
        data-slot="desktop-compose-node"
        data-layer-id={layer.id}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("qr")}
        className="absolute max-h-none max-w-none"
        style={{
          ...getLayerPlacementStyle(layer, true),
          ...getDraftingLayerEffectStyle(layer),
        }}
      >
        <PaneQrLayerSurface layer={layer} qrState={qrState} />
      </div>
    )
  }

  if (layer.kind === "text") {
    return (
      <div
        key={layer.id}
        data-slot="drafting-text-layer"
        data-layer-id={layer.id}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("text")}
        className="absolute max-h-none max-w-none overflow-hidden"
        style={{
          ...getLayerPlacementStyle(layer, true),
          ...getDraftingLayerEffectStyle(layer),
        }}
      >
        <div className="h-full w-full" data-slot="drafting-text-content" style={getTextLayerStyle(layer)}>
          {renderTextLayerContent(layer)}
        </div>
      </div>
    )
  }

  if (layer.kind === "image") {
    return (
      <div
        key={layer.id}
        data-slot="drafting-image-layer"
        data-layer-id={layer.id}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("image")}
        className="absolute max-h-none max-w-none overflow-hidden"
        style={{
          ...getLayerPlacementStyle(layer, true),
          ...getDraftingLayerEffectStyle(layer),
        }}
      >
        <DraftingImageLayerContent layer={layer} />
      </div>
    )
  }

  if (layer.kind === "shape") {
    return (
      <div
        key={layer.id}
        data-shape-id={layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId}
        data-slot="drafting-shape-layer"
        data-layer-id={layer.id}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("shape")}
        className="absolute max-h-none max-w-none overflow-visible"
        style={{
          ...getLayerPlacementStyle(layer, true),
          ...getDraftingLayerEffectStyle(layer),
        }}
      >
        <DraftingShapeLayerContent layer={layer} />
      </div>
    )
  }

  if (layer.kind === "shader") {
    const paperShader = layer.paperShader ?? createDefaultDraftingCardPaperShader()

    return (
      <div
        key={layer.id}
        data-slot="drafting-shader-layer"
        data-layer-id={layer.id}
        data-paper-shader-id={paperShader.shaderId}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("shader")}
        className="absolute max-h-none max-w-none overflow-hidden"
        style={{
          ...getLayerPlacementStyle(layer, true),
          borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
          ...getDraftingLayerEffectStyle(layer),
        }}
      >
        <DraftingCardPaperShaderLayer
          layoutHeight={layer.height}
          layoutWidth={layer.width}
          paperShader={paperShader}
        />
      </div>
    )
  }

  return (
    <PaneDocumentCardLayer
      cardState={cardState}
      isImageFilterMode={isImageFilterMode}
      isImageMode={isImageMode}
      isPaperShaderMode={isPaperShaderMode}
      isLayerSelected={isLayerSelected}
      layer={layer}
      nested
    />
  )
}

export type PaneLayerViewProps = PaneLayerViewSharedProps & {
  editingTextDraft: string
  editingTextLayerId: string | null
  layer: DraftingCanvasLayer
  onActivateLayerSelection: (
    layer: DraftingCanvasLayer,
    options?: { additive?: boolean; qr?: boolean },
  ) => void
  onCommitEditingTextDraft: () => void
  onEndLayerInteraction: (event: PointerEvent<HTMLElement>) => void
  onHandleTextEditorInput: (event: FormEvent<HTMLTextAreaElement>) => void
  onOpenLayerContextMenu: (event: MouseEvent<HTMLElement>, layerIds: string[]) => void
  onSelectLayerFromClick: (
    event: MouseEvent<HTMLElement>,
    layer: DraftingCanvasLayer,
    options?: { qr?: boolean },
  ) => void
  onStartLayerInteraction: (
    event: PointerEvent<HTMLElement>,
    layer: DraftingCanvasLayer,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) => void
  onStartTextEditing: (event: MouseEvent<HTMLElement>, layer: DraftingCanvasLayer) => void
  onUpdateLayerInteraction: (event: PointerEvent<HTMLElement>) => void
  textEditorRefs: MutableRefObject<Record<string, HTMLTextAreaElement | null>>
}

export function PaneLayerView({
  activeSelectedLayerIdSet,
  cardImageStyle,
  cardState,
  cardStyle,
  editingTextDraft,
  editingTextLayerId,
  imageFilterShader,
  isImageFilterMode,
  isImageMode,
  isPaperShaderMode,
  layer,
  qrStateByLayerId,
  onActivateLayerSelection,
  onCommitEditingTextDraft,
  onEndLayerInteraction,
  onHandleTextEditorInput,
  onOpenLayerContextMenu,
  onSelectLayerFromClick,
  onStartLayerInteraction,
  onStartTextEditing,
  onUpdateLayerInteraction,
  state,
  textEditorRefs,
}: PaneLayerViewProps) {
  const isLayerSelected = activeSelectedLayerIdSet.has(layer.id)

  if (layer.kind === "group") {
    return (
      <PaneLayerInteractive
        key={layer.id}
        layer={layer}
        isSelected={isLayerSelected}
        onActivate={(additive) => onActivateLayerSelection(layer, { additive })}
        data-slot="drafting-layer-group"
        data-layer-id={layer.id}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("group")}
        className={cn(
          "absolute max-h-none max-w-none touch-none",
          LAYER_MOVE_CURSOR_CLASS,
          layer.isLocked && "cursor-default",
        )}
        style={{
          ...getLayerPlacementStyle(layer),
          ...getDraftingLayerEffectStyle(layer),
        }}
        onClick={(event) => onSelectLayerFromClick(event, layer)}
        onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
        onPointerMove={onUpdateLayerInteraction}
        onPointerUp={onEndLayerInteraction}
        onPointerCancel={onEndLayerInteraction}
        onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
      >
        <DraftingLayerTiltShell layer={layer}>
          {(layer.children ?? [])
            .filter((child) => child.isVisible)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((child) => (
              <PaneNestedLayerView
                key={child.id}
                activeSelectedLayerIdSet={activeSelectedLayerIdSet}
                cardImageStyle={cardImageStyle}
                cardState={cardState}
                cardStyle={cardStyle}
                imageFilterShader={imageFilterShader}
                isImageFilterMode={isImageFilterMode}
                isImageMode={isImageMode}
                isPaperShaderMode={isPaperShaderMode}
                layer={child}
                qrStateByLayerId={qrStateByLayerId}
                state={state}
              />
            ))}
        </DraftingLayerTiltShell>
      </PaneLayerInteractive>
    )
  }

  if (layer.kind === "qr") {
    const qrState = resolveQrLayerState(layer.id, qrStateByLayerId, state)

    return (
      <PaneLayerInteractive
        key={layer.id}
        layer={layer}
        isSelected={isLayerSelected}
        onActivate={(additive) => onActivateLayerSelection(layer, { additive, qr: true })}
        data-slot="desktop-compose-node"
        data-layer-id={layer.id}
        data-node-id={qrState.data}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("qr")}
        className={cn(
          "absolute max-h-none max-w-none touch-none",
          LAYER_MOVE_CURSOR_CLASS,
          layer.isLocked && "cursor-default",
        )}
        style={{
          ...getLayerPlacementStyle(layer),
          ...getDraftingLayerEffectStyle(layer),
        }}
        onClick={(event) => onSelectLayerFromClick(event, layer, { qr: true })}
        onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
        onPointerMove={onUpdateLayerInteraction}
        onPointerUp={onEndLayerInteraction}
        onPointerCancel={onEndLayerInteraction}
        onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
      >
        <DraftingLayerTiltShell layer={layer}>
          <PaneQrLayerSurface layer={layer} qrState={qrState} />
        </DraftingLayerTiltShell>
      </PaneLayerInteractive>
    )
  }

  if (layer.kind === "text") {
    const isEditing = editingTextLayerId === layer.id

    return (
      <PaneLayerInteractive
        key={layer.id}
        layer={layer}
        isSelected={isLayerSelected}
        onActivate={(additive) => onActivateLayerSelection(layer, { additive })}
        data-slot="drafting-text-layer"
        data-layer-id={layer.id}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("text")}
        className={cn(
          "absolute max-h-none max-w-none touch-none overflow-hidden",
          isEditing ? "cursor-text" : LAYER_MOVE_CURSOR_CLASS,
          layer.isLocked && !isEditing && "cursor-default",
        )}
        style={{
          ...getLayerPlacementStyle(layer),
          ...getDraftingLayerEffectStyle(layer),
        }}
        onClick={(event) => onSelectLayerFromClick(event, layer)}
        onDoubleClick={(event) => onStartTextEditing(event, layer)}
        onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
        onPointerMove={onUpdateLayerInteraction}
        onPointerUp={onEndLayerInteraction}
        onPointerCancel={onEndLayerInteraction}
        onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
      >
        <DraftingLayerTiltShell layer={layer}>
          {isEditing ? (
            <textarea
              aria-label="Edit text layer"
              className="h-full w-full resize-none cursor-text overflow-hidden border-0 bg-transparent p-0 outline-none"
              data-slot="drafting-text-editor"
              ref={(element) => {
                textEditorRefs.current[layer.id] = element
              }}
              spellCheck={false}
              style={getTextLayerStyle(layer)}
              value={editingTextDraft}
              onBlur={onCommitEditingTextDraft}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
              onInput={onHandleTextEditorInput}
              onKeyDown={(event) => {
                event.stopPropagation()
                if (event.key === "Escape") {
                  event.preventDefault()
                  onCommitEditingTextDraft()
                }
              }}
              onPointerDown={(event) => event.stopPropagation()}
            />
          ) : (
            <div className="h-full w-full" data-slot="drafting-text-content" style={getTextLayerStyle(layer)}>
              {renderTextLayerContent(layer)}
            </div>
          )}
        </DraftingLayerTiltShell>
      </PaneLayerInteractive>
    )
  }

  if (layer.kind === "image") {
    return (
      <PaneLayerInteractive
        key={layer.id}
        layer={layer}
        isSelected={isLayerSelected}
        onActivate={(additive) => onActivateLayerSelection(layer, { additive })}
        data-slot="drafting-image-layer"
        data-layer-id={layer.id}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("image")}
        className={cn(
          "absolute max-h-none max-w-none touch-none overflow-hidden",
          LAYER_MOVE_CURSOR_CLASS,
          layer.isLocked && "cursor-default",
        )}
        style={{
          ...getLayerPlacementStyle(layer),
          borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
          ...getDraftingLayerEffectStyle(layer),
        }}
        onClick={(event) => onSelectLayerFromClick(event, layer)}
        onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
        onPointerMove={onUpdateLayerInteraction}
        onPointerUp={onEndLayerInteraction}
        onPointerCancel={onEndLayerInteraction}
        onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
      >
        <DraftingLayerTiltShell layer={layer}>
          <DraftingImageLayerContent layer={layer} />
        </DraftingLayerTiltShell>
      </PaneLayerInteractive>
    )
  }

  if (layer.kind === "shape") {
    return (
      <PaneLayerInteractive
        key={layer.id}
        layer={layer}
        isSelected={isLayerSelected}
        onActivate={(additive) => onActivateLayerSelection(layer, { additive })}
        data-shape-id={layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId}
        data-slot="drafting-shape-layer"
        data-layer-id={layer.id}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("shape")}
        className={cn(
          "absolute max-h-none max-w-none touch-none overflow-visible",
          LAYER_MOVE_CURSOR_CLASS,
          layer.isLocked && "cursor-default",
        )}
        style={{
          ...getLayerPlacementStyle(layer),
          ...getDraftingLayerEffectStyle(layer),
        }}
        onClick={(event) => onSelectLayerFromClick(event, layer)}
        onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
        onPointerMove={onUpdateLayerInteraction}
        onPointerUp={onEndLayerInteraction}
        onPointerCancel={onEndLayerInteraction}
        onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
      >
        <DraftingLayerTiltShell layer={layer}>
          <DraftingShapeLayerContent layer={layer} />
        </DraftingLayerTiltShell>
      </PaneLayerInteractive>
    )
  }

  if (layer.kind === "shader") {
    const paperShader = layer.paperShader ?? createDefaultDraftingCardPaperShader()

    return (
      <PaneLayerInteractive
        key={layer.id}
        layer={layer}
        isSelected={isLayerSelected}
        onActivate={(additive) => onActivateLayerSelection(layer, { additive })}
        data-slot="drafting-shader-layer"
        data-layer-id={layer.id}
        data-paper-shader-id={paperShader.shaderId}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("shader")}
        className={cn(
          "absolute max-h-none max-w-none touch-none overflow-hidden",
          LAYER_MOVE_CURSOR_CLASS,
          layer.isLocked && "cursor-default",
        )}
        style={{
          ...getLayerPlacementStyle(layer),
          borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
          ...getDraftingLayerEffectStyle(layer),
        }}
        onClick={(event) => onSelectLayerFromClick(event, layer)}
        onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
        onPointerMove={onUpdateLayerInteraction}
        onPointerUp={onEndLayerInteraction}
        onPointerCancel={onEndLayerInteraction}
        onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
      >
        <DraftingLayerTiltShell layer={layer}>
          <DraftingCardPaperShaderLayer
            layoutHeight={layer.height}
            layoutWidth={layer.width}
            paperShader={paperShader}
          />
        </DraftingLayerTiltShell>
      </PaneLayerInteractive>
    )
  }

  return (
    <PaneDocumentCardLayer
      cardState={cardState}
      isImageFilterMode={isImageFilterMode}
      isImageMode={isImageMode}
      isPaperShaderMode={isPaperShaderMode}
      isLayerSelected={isLayerSelected}
      layer={layer}
    />
  )
}
