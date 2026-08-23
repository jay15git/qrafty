import type { CSSProperties } from "react"
import Image from "next/image"

import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  buildRoundedRectPath,
  cornerRadiiToCss,
  resolveLayerCornerRadii,
  scaleCornerRadiiToBounds,
} from "@/features/workspace/model/corner-radius"
import { QR_BACKGROUND_SHAPES } from "@/features/qr-code/styles/background-shapes"
import { getStrokeDasharray } from "@/features/workspace/rendering/layer-appearance"
import {
  resolveShapeSvgFill,
  ShapeFillGradientDefs,
  shouldRenderShapeFillGradient,
} from "@/features/workspace/rendering/shape-fill"

function getShapeDefinition(shapeId: NonNullable<DraftingCanvasLayer["shapeId"]>) {
  if (shapeId === "rect" || shapeId === "ellipse" || shapeId === "line" || shapeId === "arrow") {
    return null
  }

  return QR_BACKGROUND_SHAPES.find((shape) => shape.id === shapeId) ?? null
}

function getShapeFillStyle(layer: DraftingCanvasLayer): CSSProperties {
  if (layer.fillMode === "none") {
    return { backgroundColor: "transparent" }
  }

  if (layer.fillMode === "image" && layer.imageValue) {
    return {
      backgroundColor: "transparent",
      backgroundImage: `url("${layer.imageValue}")`,
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: layer.imageFit ?? "cover",
    }
  }

  return {
    backgroundColor: "transparent",
  }
}

function getShapePathFill(layer: DraftingCanvasLayer) {
  return resolveShapeSvgFill(layer)
}

function renderShapeGradientDefs(layer: DraftingCanvasLayer) {
  if (!shouldRenderShapeFillGradient(layer) || !layer.fillGradient) {
    return null
  }

  return <ShapeFillGradientDefs gradient={layer.fillGradient} layerId={layer.id} />
}

function renderPrimitiveShape(
  shapeId: "arrow" | "ellipse" | "line" | "rect",
  layer: DraftingCanvasLayer,
) {
  const stroke = layer.stroke ?? "#171717"
  const strokeWidth = layer.strokeWidth ?? 0
  const strokeOpacity = (layer.strokeOpacity ?? 100) / 100
  const fill = resolveShapeSvgFill(layer)
  const strokeDasharray = getStrokeDasharray(layer.strokeStyle)

  if (shapeId === "line") {
    return (
      <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 100 100">
        <defs>{renderShapeGradientDefs(layer)}</defs>
        <line
          stroke={stroke}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          strokeOpacity={strokeOpacity}
          strokeWidth={Math.max(1, strokeWidth || 4)}
          x1="8"
          x2="92"
          y1="50"
          y2="50"
        />
      </svg>
    )
  }

  if (shapeId === "arrow") {
    return (
      <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 100 100">
        <defs>{renderShapeGradientDefs(layer)}</defs>
        <path
          d="M10 50 H62 M62 50 L44 34 M62 50 L44 66"
          fill="none"
          stroke={stroke}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={strokeOpacity}
          strokeWidth={Math.max(1, strokeWidth || 4)}
        />
      </svg>
    )
  }

  if (shapeId === "ellipse") {
    return (
      <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 100 100">
        <defs>{renderShapeGradientDefs(layer)}</defs>
        <ellipse
          cx="50"
          cy="50"
          fill={fill}
          rx="42"
          ry="42"
          stroke={stroke}
          strokeDasharray={strokeDasharray}
          strokeOpacity={strokeOpacity}
          strokeWidth={strokeWidth}
        />
      </svg>
    )
  }

  if (shapeId === "rect") {
    const radii = scaleCornerRadiiToBounds(
      resolveLayerCornerRadii(layer, 0),
      layer.width,
      layer.height,
      84,
      84,
    )
    const path = buildRoundedRectPath(84, 84, radii, 8, 8)

    return (
      <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 100 100">
        <defs>{renderShapeGradientDefs(layer)}</defs>
        <path
          d={path}
          fill={fill}
          stroke={stroke}
          strokeDasharray={strokeDasharray}
          strokeOpacity={strokeOpacity}
          strokeWidth={strokeWidth}
        />
      </svg>
    )
  }

  return null
}

export function DraftingShapeLayerContent({ layer }: { layer: DraftingCanvasLayer }) {
  const shapeId = layer.shapeId ?? "rounded-square"
  const definition = getShapeDefinition(shapeId)
  const fillStyle = getShapeFillStyle(layer)

  if (definition) {
    return (
      <div className="relative h-full w-full" style={fillStyle}>
        <svg
          aria-hidden="true"
          className="h-full w-full"
          preserveAspectRatio="none"
          viewBox={`0 0 ${definition.viewBox.width} ${definition.viewBox.height}`}
        >
          <defs>{renderShapeGradientDefs(layer)}</defs>
          <path
            d={definition.path}
            fill={getShapePathFill(layer)}
            stroke={layer.stroke ?? "#171717"}
            strokeDasharray={getStrokeDasharray(layer.strokeStyle)}
            strokeOpacity={(layer.strokeOpacity ?? 100) / 100}
            strokeWidth={layer.strokeWidth ?? 0}
          />
        </svg>
      </div>
    )
  }

  if (shapeId === "rect" || shapeId === "ellipse" || shapeId === "line" || shapeId === "arrow") {
    return <div className="h-full w-full">{renderPrimitiveShape(shapeId, layer)}</div>
  }

  return null
}

export function DraftingImageLayerContent({ layer }: { layer: DraftingCanvasLayer }) {
  const imageValue = layer.imageValue
  const cornerStyle = cornerRadiiToCss(resolveLayerCornerRadii(layer, 0))
  const fit = layer.imageFit ?? "cover"

  if (!imageValue) {
    return (
      <div
        aria-hidden="true"
        className="grid h-full w-full place-items-center border border-dashed border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] text-[11px] font-semibold text-[var(--ws-ink-muted)]"
        style={{ borderRadius: cornerStyle }}
      >
        Image
      </div>
    )
  }

  return (
    <div className="relative h-full w-full" style={{ borderRadius: cornerStyle }}>
      <Image
        alt=""
        className="h-full w-full"
        draggable={false}
        fill
        sizes="(max-width: 768px) 100vw, 320px"
        src={imageValue}
        style={{
          borderRadius: cornerStyle,
          objectFit: fit,
        }}
        unoptimized
      />
    </div>
  )
}
