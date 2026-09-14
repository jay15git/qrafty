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

import {
  CardBackgroundLayers,
  cardBackgroundSurfaceStyle,
} from "@/features/workspace/components/CardBackgroundLayers"
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
  getLayerPlacementStyle,
  getTextLayerStyle,
  getTextRunStyle,
} from "@/features/workspace/rendering/layer-dom-styles"
import { isDraftingEmojiLayer } from "@/features/workspace/model/layer-floating-settings"
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
import type { QraftyState } from "@/features/qr-code/model/state"
import { getContentValidationOverlayMessage } from "@/features/qr-code/content/static-payload"
import type { StaticQrValidationResult } from "@/features/qr-code/content/static-payload"
import { getDraftingQrLayerLayout } from "@/features/qr-code/rendering/svg-extension"
import { useDraftingQrMarkup } from "@/features/workspace/hooks/use-drafting-qr-markup"
import type { DraftingQrStateByLayerId } from "@/features/workspace/model/document"
import { usePreviewInteraction } from "@/features/workspace/preview/preview-context"
import {
  useDraftingLayerEffectStyle,
  usePreviewShaderDisplaySize,
} from "@/features/workspace/preview/use-preview-layer-effects"
import { scaleNestedSvgMarkup } from "@/features/workspace/rendering/qr-artwork"
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
  return {
    ...cardBackgroundSurfaceStyle(cardState, isImageFilterMode, isImageMode, isPaperShaderMode),
    borderRadius: cornerRadiiToCss(cardState.cornerRadii),
  }
}

function buildPaneDocumentCardBorderOverlayStyle(
  cardState: DraftingCardState,
): CSSProperties | undefined {
  const borderStyle = getDraftingCardBorderStyle(cardState)

  if (!borderStyle || Object.keys(borderStyle).length === 0) {
    return undefined
  }

  return {
    ...borderStyle,
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
  const layerEffectStyle = useDraftingLayerEffectStyle(layer)
  const shaderDisplaySize = usePreviewShaderDisplaySize(layer.width, layer.height)
  const isInteracting = usePreviewInteraction()
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
  const borderOverlayStyle = useMemo(
    () => buildPaneDocumentCardBorderOverlayStyle(cardState),
    [cardState],
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
          ...layerEffectStyle,
        }}
      >
        <CardBackgroundLayers
          animateTransitions={!isInteracting}
          cardState={cardState}
          imageFilterShader={imageFilterShader}
          isImageFilterMode={isImageFilterMode}
          isImageMode={isImageMode}
          isPaperShaderMode={isPaperShaderMode}
          layoutHeight={layer.height}
          layoutWidth={layer.width}
          shaderDisplayHeight={shaderDisplaySize.displayHeight}
          shaderDisplayWidth={shaderDisplaySize.displayWidth}
        />
        {borderOverlayStyle ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[3]"
            data-slot="desktop-compose-card-border"
            style={borderOverlayStyle}
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
        !isInteracting && "transition-[filter,background-color,border-radius] duration-150",
      )}
      style={{
        ...surfaceStyle,
        ...getLayerPlacementStyle(layer),
        ...layerEffectStyle,
      }}
    >
      <DraftingLayerTiltShell layer={layer}>
        <CardBackgroundLayers
          animateTransitions={!isInteracting}
          cardState={cardState}
          imageFilterShader={imageFilterShader}
          isImageFilterMode={isImageFilterMode}
          isImageMode={isImageMode}
          isPaperShaderMode={isPaperShaderMode}
          layoutHeight={layer.height}
          layoutWidth={layer.width}
          shaderDisplayHeight={shaderDisplaySize.displayHeight}
          shaderDisplayWidth={shaderDisplaySize.displayWidth}
        />
        {borderOverlayStyle ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[3]"
            data-slot="desktop-compose-card-border"
            style={borderOverlayStyle}
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
  fallbackState: QraftyState,
) {
  return qrStateByLayerId[layerId] ?? fallbackState
}

function PaneQrLayerSurface({
  activeQrLayerId,
  contentValidation,
  layer,
  qrOverlayScale,
  qrState,
}: {
  activeQrLayerId?: string
  contentValidation?: StaticQrValidationResult
  layer: DraftingCanvasLayer
  qrOverlayScale?: number
  qrState: QraftyState
}) {
  const layout = useMemo(
    () => getDraftingQrLayerLayout(layer.width, qrState, layer.height),
    [layer.height, layer.width, qrState],
  )
  const { markup } = useDraftingQrMarkup(qrState)
  const displayMarkup = useMemo(() => {
    if (!markup) {
      return ""
    }

    return scaleNestedSvgMarkup(markup, layout.innerWidth, layout.innerHeight)
  }, [layout.innerHeight, layout.innerWidth, markup])
  const shapeTiltPerspectiveStyle = getBackgroundShapeTiltPerspectiveStyle(
    qrState.backgroundShapeOptions,
  )
  const shapeTiltInnerStyle = getBackgroundShapeTiltInnerStyle(qrState.backgroundShapeOptions)
  const overlayMessage =
    activeQrLayerId && contentValidation && layer.id === activeQrLayerId
      ? getContentValidationOverlayMessage(contentValidation, qrState.data)
      : null

  return (
    <DraftingQrLayerContent
      canvasSvgMarkup={markup}
      layer={layer}
      overlayMessage={overlayMessage}
      overlayScale={qrOverlayScale}
      qrMarkup={displayMarkup}
      shapeTiltInnerStyle={shapeTiltInnerStyle}
      shapeTiltPerspectiveStyle={shapeTiltPerspectiveStyle}
      state={qrState}
    />
  )
}

export type PaneLayerViewSharedProps = {
  activeQrLayerId?: string
  activeSelectedLayerIdSet: Set<string>
  cardImageStyle: CSSProperties | undefined
  cardState: DraftingCardState
  cardStyle: CSSProperties
  contentValidation?: StaticQrValidationResult
  imageFilterShader: DraftingCardPaperShaderState
  isImageFilterMode: boolean
  isImageMode: boolean
  isPaperShaderMode: boolean
  qrOverlayScale?: number
  qrStateByLayerId: DraftingQrStateByLayerId
  state: QraftyState
}

export type PaneNestedLayerViewProps = PaneLayerViewSharedProps & {
  layer: DraftingCanvasLayer
}

export function PaneNestedLayerView({
  activeQrLayerId,
  activeSelectedLayerIdSet,
  cardImageStyle,
  cardState,
  cardStyle,
  contentValidation,
  imageFilterShader,
  isImageFilterMode,
  isImageMode,
  isPaperShaderMode,
  layer,
  qrOverlayScale,
  qrStateByLayerId,
  state,
}: PaneNestedLayerViewProps) {
  const isLayerSelected = activeSelectedLayerIdSet.has(layer.id)
  const layerEffectStyle = useDraftingLayerEffectStyle(layer)
  const shaderDisplaySize = usePreviewShaderDisplaySize(layer.width, layer.height)

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
          ...layerEffectStyle,
        }}
      >
        {(layer.children ?? [])
          .filter((child) => child.isVisible)
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((child) => (
            <PaneNestedLayerView
              key={child.id}
              activeQrLayerId={activeQrLayerId}
              activeSelectedLayerIdSet={activeSelectedLayerIdSet}
              cardImageStyle={cardImageStyle}
              cardState={cardState}
              cardStyle={cardStyle}
              contentValidation={contentValidation}
              imageFilterShader={imageFilterShader}
              isImageFilterMode={isImageFilterMode}
              isImageMode={isImageMode}
              isPaperShaderMode={isPaperShaderMode}
              layer={child}
              qrOverlayScale={qrOverlayScale}
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
          ...layerEffectStyle,
        }}
      >
        <PaneQrLayerSurface
          activeQrLayerId={activeQrLayerId}
          contentValidation={contentValidation}
          layer={layer}
          qrOverlayScale={qrOverlayScale}
          qrState={qrState}
        />
      </div>
    )
  }

  if (layer.kind === "text") {
    const isEmojiLayer = isDraftingEmojiLayer(layer)

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
          ...layerEffectStyle,
        }}
      >
        <div
          className={cn("h-full w-full", isEmojiLayer && "flex items-center justify-center")}
          data-slot="drafting-text-content"
          style={getTextLayerStyle(layer)}
        >
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
          ...layerEffectStyle,
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
          ...layerEffectStyle,
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
          ...layerEffectStyle,
        }}
      >
        <DraftingCardPaperShaderLayer
          displayHeight={shaderDisplaySize.displayHeight}
          displayWidth={shaderDisplaySize.displayWidth}
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

function arePaneLayerViewPropsEqual(
  previous: PaneLayerViewProps,
  next: PaneLayerViewProps,
) {
  if (
    previous.layer !== next.layer ||
    previous.cardState !== next.cardState ||
    previous.cardStyle !== next.cardStyle ||
    previous.cardImageStyle !== next.cardImageStyle ||
    previous.imageFilterShader !== next.imageFilterShader ||
    previous.isImageFilterMode !== next.isImageFilterMode ||
    previous.isImageMode !== next.isImageMode ||
    previous.isPaperShaderMode !== next.isPaperShaderMode ||
    previous.textEditorRefs !== next.textEditorRefs
  ) {
    return false
  }

  if (previous.layer.kind === "qr" || next.layer.kind === "qr") {
    if (previous.state !== next.state) {
      return false
    }

    if (previous.contentValidation !== next.contentValidation) {
      return false
    }

    if (previous.activeQrLayerId !== next.activeQrLayerId) {
      return false
    }

    if (previous.qrOverlayScale !== next.qrOverlayScale) {
      return false
    }

    if (
      previous.qrStateByLayerId[previous.layer.id] !==
      next.qrStateByLayerId[next.layer.id]
    ) {
      return false
    }
  }

  const wasSelected = previous.activeSelectedLayerIdSet.has(previous.layer.id)
  const isSelected = next.activeSelectedLayerIdSet.has(next.layer.id)
  if (wasSelected !== isSelected) {
    return false
  }

  const wasEditing = previous.editingTextLayerId === previous.layer.id
  const isEditing = next.editingTextLayerId === next.layer.id
  if (wasEditing !== isEditing) {
    return false
  }
  if (isEditing && previous.editingTextDraft !== next.editingTextDraft) {
    return false
  }

  return true
}

export const PaneLayerView = memo(function PaneLayerView({
  activeQrLayerId,
  activeSelectedLayerIdSet,
  cardImageStyle,
  cardState,
  cardStyle,
  contentValidation,
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
  qrOverlayScale,
  state,
  textEditorRefs,
}: PaneLayerViewProps) {
  const isLayerSelected = activeSelectedLayerIdSet.has(layer.id)
  const layerEffectStyle = useDraftingLayerEffectStyle(layer)
  const shaderDisplaySize = usePreviewShaderDisplaySize(layer.width, layer.height)

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
        )}
        style={{
          ...getLayerPlacementStyle(layer),
          ...layerEffectStyle,
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
                activeQrLayerId={activeQrLayerId}
                activeSelectedLayerIdSet={activeSelectedLayerIdSet}
                cardImageStyle={cardImageStyle}
                cardState={cardState}
                cardStyle={cardStyle}
                contentValidation={contentValidation}
                imageFilterShader={imageFilterShader}
                isImageFilterMode={isImageFilterMode}
                isImageMode={isImageMode}
                isPaperShaderMode={isPaperShaderMode}
                layer={child}
                qrOverlayScale={qrOverlayScale}
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
        )}
        style={{
          ...getLayerPlacementStyle(layer),
          ...layerEffectStyle,
        }}
        onClick={(event) => onSelectLayerFromClick(event, layer, { qr: true })}
        onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
        onPointerMove={onUpdateLayerInteraction}
        onPointerUp={onEndLayerInteraction}
        onPointerCancel={onEndLayerInteraction}
        onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
      >
        <DraftingLayerTiltShell layer={layer}>
          <PaneQrLayerSurface
          activeQrLayerId={activeQrLayerId}
          contentValidation={contentValidation}
          layer={layer}
          qrOverlayScale={qrOverlayScale}
          qrState={qrState}
        />
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
        )}
        style={{
          ...getLayerPlacementStyle(layer),
          ...layerEffectStyle,
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
        )}
        style={{
          ...getLayerPlacementStyle(layer),
          borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
          ...layerEffectStyle,
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
        )}
        style={{
          ...getLayerPlacementStyle(layer),
          ...layerEffectStyle,
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
        )}
        style={{
          ...getLayerPlacementStyle(layer),
          borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
          ...layerEffectStyle,
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
            displayHeight={shaderDisplaySize.displayHeight}
            displayWidth={shaderDisplaySize.displayWidth}
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
}, arePaneLayerViewPropsEqual)
