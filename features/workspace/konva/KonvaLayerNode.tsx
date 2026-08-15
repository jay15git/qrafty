"use client"

import { Ellipse, Image, Line, Path, Rect, Text } from "react-konva"

import type { DraftingCardState } from "@/features/workspace/model/card-state"
import { resolveLayerCornerRadii } from "@/features/workspace/model/corner-radius"
import { cssFillToBackgroundStyle } from "@/features/workspace/model/css-fill-style"
import {
  createDefaultDraftingLayers,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import { getDraftingFontCssFamily } from "@/features/workspace/model/fonts"
import { getStrokeDasharray } from "@/features/workspace/rendering/layer-appearance"
import { getShapeSvgPath } from "@/features/workspace/rendering/shape-layer-paths"
import { layoutDraftingText } from "@/features/workspace/rendering/text-layout"
import { QR_BACKGROUND_SHAPES } from "@/features/qr-code/styles/background-shapes"
import type { QrStudioState } from "@/features/qr-code/model/state"
import type { DraftingQrStateByLayerId } from "@/features/workspace/model/document"
import { useDraftingQrMarkup } from "@/features/workspace/hooks/use-drafting-qr-markup"
import { useKonvaImage, useKonvaSvgMarkup } from "@/features/workspace/konva/use-konva-image"

type KonvaLayerContentProps = {
  cardState: DraftingCardState
  layer: DraftingCanvasLayer
  qrStateByLayerId: DraftingQrStateByLayerId
  state: QrStudioState
}

function getCardFill(cardState: DraftingCardState) {
  const fillStyle = cssFillToBackgroundStyle(cardState.fill)
  return fillStyle.backgroundColor ?? cardState.fill
}

function getShapePathData(shapeId: NonNullable<DraftingCanvasLayer["shapeId"]>) {
  const definition = QR_BACKGROUND_SHAPES.find((shape) => shape.id === shapeId)
  if (definition) {
    return definition.path
  }

  const svgMarkup = getShapeSvgPath(shapeId)
  const match = /d="([^"]+)"/.exec(svgMarkup)
  return match?.[1] ?? ""
}

function KonvaQrLayerContent({
  layer,
  qrState,
}: {
  layer: DraftingCanvasLayer
  qrState: QrStudioState
}) {
  const { markup } = useDraftingQrMarkup(qrState)
  const image = useKonvaSvgMarkup(markup)

  if (!image) {
    return <Rect fill="#f4f4f5" height={layer.height} listening={false} width={layer.width} x={0} y={0} />
  }

  return <Image height={layer.height} image={image} listening={false} width={layer.width} x={0} y={0} />
}

function KonvaImageLayerContent({ layer }: { layer: DraftingCanvasLayer }) {
  const image = useKonvaImage(layer.imageValue)
  const cornerRadius = resolveLayerCornerRadii(layer, 0).topLeft

  if (!image) {
    return (
      <Rect
        cornerRadius={cornerRadius}
        fill="#e4e4e7"
        height={layer.height}
        listening={false}
        width={layer.width}
        x={0}
        y={0}
      />
    )
  }

  return (
    <Image
      cornerRadius={cornerRadius}
      height={layer.height}
      image={image}
      listening={false}
      width={layer.width}
      x={0}
      y={0}
    />
  )
}

function KonvaTextLayerContent({ layer }: { layer: DraftingCanvasLayer }) {
  const layout = layoutDraftingText(layer)
  const fontFamily = getDraftingFontCssFamily(layer.fontId, layer.fontFamily)

  return (
    <Text
      align={layer.textAlign ?? "left"}
      fill={layer.fill ?? "#171717"}
      fontFamily={fontFamily}
      fontSize={layer.fontSize ?? 32}
      fontStyle={layer.fontStyle === "italic" ? "italic" : "normal"}
      height={layer.height}
      lineHeight={layer.lineHeight ?? 1.22}
      listening={false}
      text={layout.text}
      width={layer.width}
      wrap="word"
      x={0}
      y={0}
    />
  )
}

function KonvaShapeLayerContent({ layer }: { layer: DraftingCanvasLayer }) {
  const stroke = layer.stroke ?? "#171717"
  const strokeWidth = layer.strokeWidth ?? 0
  const strokeOpacity = (layer.strokeOpacity ?? 100) / 100
  const fill = layer.fillMode === "none" ? undefined : (layer.fill ?? "#E8E8E8")
  const dash = getStrokeDasharray(layer.strokeStyle)
    ?.split(" ")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
  const shapeId = layer.shapeId ?? "rounded-square"
  const cornerRadius = resolveLayerCornerRadii(layer, 16).topLeft

  if (shapeId === "ellipse") {
    return (
      <Ellipse
        dash={dash}
        fill={fill}
        listening={false}
        radiusX={layer.width / 2}
        radiusY={layer.height / 2}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
        x={layer.width / 2}
        y={layer.height / 2}
      />
    )
  }

  if (shapeId === "line") {
    return (
      <Line
        dash={dash}
        listening={false}
        points={[0, layer.height / 2, layer.width, layer.height / 2]}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth={Math.max(1, strokeWidth || 4)}
      />
    )
  }

  if (shapeId === "arrow") {
    return (
      <Line
        dash={dash}
        listening={false}
        points={[
          layer.width * 0.1,
          layer.height / 2,
          layer.width * 0.62,
          layer.height / 2,
          layer.width * 0.44,
          layer.height * 0.34,
          layer.width * 0.62,
          layer.height / 2,
          layer.width * 0.44,
          layer.height * 0.66,
        ]}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth={Math.max(1, strokeWidth || 4)}
      />
    )
  }

  if (shapeId === "rect" || shapeId === "rounded-square") {
    return (
      <Rect
        cornerRadius={cornerRadius}
        dash={dash}
        fill={fill}
        height={layer.height}
        listening={false}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
        width={layer.width}
        x={0}
        y={0}
      />
    )
  }

  const pathData = getShapePathData(shapeId)
  if (!pathData) {
    return (
      <Rect
        cornerRadius={cornerRadius}
        fill={fill}
        height={layer.height}
        listening={false}
        width={layer.width}
        x={0}
        y={0}
      />
    )
  }

  return (
    <Path
      data={pathData}
      fill={fill}
      listening={false}
      scaleX={layer.width / 100}
      scaleY={layer.height / 100}
      stroke={stroke}
      strokeOpacity={strokeOpacity}
      strokeWidth={strokeWidth}
      x={0}
      y={0}
    />
  )
}

export function KonvaLayerContent({
  cardState,
  layer,
  qrStateByLayerId,
  state,
}: KonvaLayerContentProps) {
  if (layer.kind === "card") {
    return (
      <Rect
        fill={getCardFill(cardState)}
        height={layer.height}
        listening={false}
        opacity={layer.opacity}
        width={layer.width}
        x={0}
        y={0}
      />
    )
  }

  if (layer.kind === "shader") {
    return (
      <Rect
        cornerRadius={resolveLayerCornerRadii(layer, 0).topLeft}
        fill="#dbeafe"
        height={layer.height}
        listening={false}
        width={layer.width}
        x={0}
        y={0}
      />
    )
  }

  if (layer.kind === "qr") {
    return (
      <KonvaQrLayerContent layer={layer} qrState={qrStateByLayerId[layer.id] ?? state} />
    )
  }

  if (layer.kind === "text") {
    return <KonvaTextLayerContent layer={layer} />
  }

  if (layer.kind === "image") {
    return <KonvaImageLayerContent layer={layer} />
  }

  if (layer.kind === "shape") {
    return <KonvaShapeLayerContent layer={layer} />
  }

  if (layer.kind === "group") {
    return (
      <>
        {(layer.children ?? [])
          .filter((child) => child.isVisible)
          .sort((left, right) => left.zIndex - right.zIndex)
          .map((child) => (
            <KonvaLayerContent
              key={child.id}
              cardState={cardState}
              layer={child}
              qrStateByLayerId={qrStateByLayerId}
              state={state}
            />
          ))}
      </>
    )
  }

  return null
}

export function resolveKonvaLayers(
  layers: DraftingCanvasLayer[] | undefined,
  cardState: DraftingCardState,
  state: QrStudioState,
) {
  return layers && layers.length > 0
    ? layers
    : createDefaultDraftingLayers("preview", state, cardState)
}
