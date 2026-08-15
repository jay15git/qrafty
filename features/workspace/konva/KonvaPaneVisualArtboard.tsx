"use client"

import { useMemo, type CSSProperties, type MouseEvent } from "react"

import { DraftingCardPaperShaderLayer } from "@/features/workspace/components/CardPaperShaderLayer"
import { DraftingLayerTiltShell } from "@/features/workspace/components/DraftingLayerTiltShell"
import { DraftingQrLayerContent } from "@/features/workspace/components/DraftingQrLayerContent"
import {
  createDefaultDraftingCardPaperShader,
  type DraftingCardPaperShaderState,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import { getDraftingCardPatternStyle } from "@/features/workspace/model/card-patterns"
import { cornerRadiiToCss, resolveLayerCornerRadii } from "@/features/workspace/model/corner-radius"
import { cssFillToBackgroundStyle } from "@/features/workspace/model/css-fill-style"
import type { DraftingQrStateByLayerId } from "@/features/workspace/model/document"
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type DraftingCanvasLayer,
  type DraftingTextRun,
} from "@/features/workspace/model/layers"
import { useDraftingQrMarkup } from "@/features/workspace/hooks/use-drafting-qr-markup"
import type { QrStudioState } from "@/features/qr-code/model/state"
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
  DraftingImageLayerContent,
  DraftingShapeLayerContent,
} from "@/features/workspace/rendering/shape-layer"
import { layoutDraftingText } from "@/features/workspace/rendering/text-layout"
import { cn } from "@/lib/utils"

const LAYER_MOVE_CURSOR_CLASS = "cursor-all-scroll"

type KonvaPaneVisualArtboardProps = {
  activeSelectedLayerIds: string[]
  cardState: DraftingCardState
  interactionScale: number
  layers: DraftingCanvasLayer[]
  onLayerSelect?: (layerId: string, additive: boolean) => void
  qrStateByLayerId: DraftingQrStateByLayerId
  state: QrStudioState
}

type KonvaPaneVisualLayerProps = {
  activeSelectedLayerIds: string[]
  cardImageStyle: CSSProperties | undefined
  cardState: DraftingCardState
  cardStyle: CSSProperties
  imageFilterShader: DraftingCardPaperShaderState
  isImageFilterMode: boolean
  isImageMode: boolean
  isPaperShaderMode: boolean
  layer: DraftingCanvasLayer
  nested?: boolean
  onLayerSelect?: (layerId: string, additive: boolean) => void
  qrStateByLayerId: DraftingQrStateByLayerId
  state: QrStudioState
}

function getVisualLayerClassName(layer: DraftingCanvasLayer, nested = false) {
  if (nested || layer.kind === "card") {
    return layer.isLocked ? "cursor-default" : undefined
  }

  return cn(
    !layer.isLocked && LAYER_MOVE_CURSOR_CLASS,
    layer.isLocked && "cursor-default",
  )
}

function getVisualLayerChrome(
  layer: DraftingCanvasLayer,
  activeSelectedLayerIds: string[],
  nested = false,
) {
  return {
    className: cn("absolute max-h-none max-w-none", getVisualLayerClassName(layer, nested)),
    "data-layer-id": layer.id,
    "data-selected": activeSelectedLayerIds.includes(layer.id) ? "true" : "false",
    style: {
      zIndex: layer.zIndex,
    } as CSSProperties,
  }
}

function hasTranslucentCardFill(fill: string) {
  const rgbaMatch = /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/i.exec(fill)

  if (rgbaMatch) {
    const alpha = Number.parseFloat(rgbaMatch[1] ?? "1")
    return Number.isFinite(alpha) && alpha < 1
  }

  return false
}

function buildKonvaPaneCardStyles(cardState: DraftingCardState) {
  const isPaperShaderMode = cardState.styleMode === "paper-shader"
  const isImageMode = cardState.styleMode === "image"
  const isImageFilterMode = cardState.styleMode === "image-filter"
  const cardPatternStyle = getDraftingCardPatternStyle(
    cardState.patternId,
    cardState.patternId === "none" ? undefined : cardState.patternColors[cardState.patternId],
  )
  const cardImageStyle =
    (isImageMode || isImageFilterMode) && cardState.cardImage.value
      ? {
          backgroundImage: `url("${cardState.cardImage.value}")`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: cardState.cardImage.fit,
        }
      : undefined
  const cardStyle: CSSProperties = {
    ...cssFillToBackgroundStyle(cardState.fill),
    ...(isPaperShaderMode || isImageFilterMode || isImageMode ? undefined : cardPatternStyle),
    ...cardImageStyle,
    ...getDraftingCardBorderStyle(cardState),
    borderRadius: cornerRadiiToCss(cardState.cornerRadii),
    ...(hasTranslucentCardFill(cardState.fill) ? { backdropFilter: "blur(16px)" } : {}),
  }
  const imageFilterShader = {
    ...cardState.imageFilter,
    image: {
      ...cardState.imageFilter.image,
      source:
        cardState.cardImage.source === "none"
          ? cardState.imageFilter.image.source
          : cardState.cardImage.source,
      value: cardState.cardImage.value ?? cardState.imageFilter.image.value,
    },
  }

  return {
    cardImageStyle,
    cardStyle,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isPaperShaderMode,
  }
}

function resolveQrLayerState(
  layerId: string,
  qrStateByLayerId: DraftingQrStateByLayerId,
  fallbackState: QrStudioState,
) {
  return qrStateByLayerId[layerId] ?? fallbackState
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

function KonvaPaneQrLayerSurface({
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

function KonvaPaneVisualLayer({
  activeSelectedLayerIds,
  cardImageStyle,
  cardState,
  cardStyle,
  imageFilterShader,
  isImageFilterMode,
  isImageMode,
  isPaperShaderMode,
  layer,
  nested = false,
  onLayerSelect,
  qrStateByLayerId,
  state,
}: KonvaPaneVisualLayerProps) {
  const placementStyle = getLayerPlacementStyle(layer, nested)
  const effectStyle = getDraftingLayerEffectStyle(layer)
  const layerChrome = getVisualLayerChrome(layer, activeSelectedLayerIds, nested)
  const layerClickProps = onLayerSelect
    ? {
        onClick: (event: MouseEvent<HTMLDivElement>) => {
          event.stopPropagation()
          onLayerSelect(
            layer.id,
            event.shiftKey || event.metaKey || event.ctrlKey,
          )
        },
      }
    : {}

  if (layer.kind === "group") {
    return (
      <div
        data-slot="drafting-layer-group"
        {...layerChrome}
        style={{
          ...placementStyle,
          ...effectStyle,
          ...layerChrome.style,
        }}
        {...layerClickProps}
      >
        {(layer.children ?? [])
          .filter((child) => child.isVisible)
          .sort((left, right) => left.zIndex - right.zIndex)
          .map((child) => (
            <KonvaPaneVisualLayer
              key={child.id}
              activeSelectedLayerIds={activeSelectedLayerIds}
              cardImageStyle={cardImageStyle}
              cardState={cardState}
              cardStyle={cardStyle}
              imageFilterShader={imageFilterShader}
              isImageFilterMode={isImageFilterMode}
              isImageMode={isImageMode}
              isPaperShaderMode={isPaperShaderMode}
              layer={child}
              nested
              onLayerSelect={onLayerSelect}
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
        data-node-id={qrState.data}
        data-slot="desktop-compose-node"
        {...layerChrome}
        className={cn(layerChrome.className, "overflow-visible")}
        style={{
          ...placementStyle,
          ...effectStyle,
          ...layerChrome.style,
        }}
        {...layerClickProps}
      >
        <DraftingLayerTiltShell layer={layer}>
          <KonvaPaneQrLayerSurface layer={layer} qrState={qrState} />
        </DraftingLayerTiltShell>
      </div>
    )
  }

  if (layer.kind === "text") {
    return (
      <div
        data-slot="drafting-text-layer"
        {...layerChrome}
        className={cn(layerChrome.className, "overflow-hidden")}
        style={{
          ...placementStyle,
          ...effectStyle,
          ...layerChrome.style,
        }}
        {...layerClickProps}
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
        data-slot="drafting-image-layer"
        {...layerChrome}
        className={cn(layerChrome.className, "overflow-hidden")}
        style={{
          ...placementStyle,
          borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
          ...effectStyle,
          ...layerChrome.style,
        }}
        {...layerClickProps}
      >
        <DraftingImageLayerContent layer={layer} />
      </div>
    )
  }

  if (layer.kind === "shape") {
    return (
      <div
        data-shape-id={layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId}
        data-slot="drafting-shape-layer"
        {...layerChrome}
        className={cn(layerChrome.className, "overflow-visible")}
        style={{
          ...placementStyle,
          ...effectStyle,
          ...layerChrome.style,
        }}
        {...layerClickProps}
      >
        <DraftingShapeLayerContent layer={layer} />
      </div>
    )
  }

  if (layer.kind === "shader") {
    const paperShader = layer.paperShader ?? createDefaultDraftingCardPaperShader()

    return (
      <div
        data-paper-shader-id={paperShader.shaderId}
        data-slot="drafting-shader-layer"
        {...layerChrome}
        className={cn(layerChrome.className, "overflow-hidden")}
        style={{
          ...placementStyle,
          borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
          ...effectStyle,
          ...layerChrome.style,
        }}
        {...layerClickProps}
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
    <div
      data-slot="desktop-compose-card"
      {...layerChrome}
      className={cn(layerChrome.className, "overflow-hidden")}
      style={{
        ...cardStyle,
        ...placementStyle,
        ...effectStyle,
        ...layerChrome.style,
      }}
      {...layerClickProps}
    >
      <DraftingLayerTiltShell layer={layer}>
        {isImageMode && cardState.cardImage.value ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0"
            data-slot="desktop-compose-card-image"
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
}

export function KonvaPaneVisualArtboard({
  activeSelectedLayerIds,
  cardState,
  interactionScale,
  layers,
  onLayerSelect,
  qrStateByLayerId,
  state,
}: KonvaPaneVisualArtboardProps) {
  const cardVisualStyles = useMemo(() => buildKonvaPaneCardStyles(cardState), [cardState])

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 overflow-hidden"
      data-slot="konva-pane-visual-artboard"
      style={{
        borderRadius: cornerRadiiToCss(cardState.cornerRadii),
        height: cardState.height * interactionScale,
        transform: "translate(-50%, -50%)",
        width: cardState.width * interactionScale,
      }}
    >
      <div
        className="relative origin-top-left"
        data-export-root
        style={{
          height: cardState.height,
          transform: `scale(${interactionScale})`,
          width: cardState.width,
        }}
      >
        {layers.map((layer) => (
          <KonvaPaneVisualLayer
            key={layer.id}
            activeSelectedLayerIds={activeSelectedLayerIds}
            cardImageStyle={cardVisualStyles.cardImageStyle}
            cardState={cardState}
            cardStyle={cardVisualStyles.cardStyle}
            imageFilterShader={cardVisualStyles.imageFilterShader}
            isImageFilterMode={cardVisualStyles.isImageFilterMode}
            isImageMode={cardVisualStyles.isImageMode}
            isPaperShaderMode={cardVisualStyles.isPaperShaderMode}
            layer={layer}
            onLayerSelect={onLayerSelect}
            qrStateByLayerId={qrStateByLayerId}
            state={state}
          />
        ))}
      </div>
    </div>
  )
}
