import { wcagContrast } from "culori"

import { cornerRadiiToLegacyRadius } from "@/features/workspace/model/corner-radius"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

export type TemplateIssueCode =
  | "bounds-overflow"
  | "contrast-too-low"
  | "field-desync"
  | "layer-occluded"
  | "layer-renders-nothing"
  | "qr-quiet-zone-collision"
  | "qr-too-small"

export type TemplateIssue = {
  code: TemplateIssueCode
  layerId?: string
  message: string
  severity: "error" | "warning"
}

export type ValidateTemplateOptions = {
  minQrRatio?: number
}

export type LayerRect = {
  bottom: number
  left: number
  right: number
  top: number
}

export function layerRect(layer: DraftingCanvasLayer): LayerRect {
  return {
    bottom: layer.y + layer.height,
    left: layer.x,
    right: layer.x + layer.width,
    top: layer.y,
  }
}

function contains(outer: LayerRect, inner: LayerRect) {
  return (
    outer.left <= inner.left &&
    outer.top <= inner.top &&
    outer.right >= inner.right &&
    outer.bottom >= inner.bottom
  )
}

function intersects(a: LayerRect, b: LayerRect) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

function isOpaqueCover(layer: DraftingCanvasLayer) {
  if (!layer.isVisible || layer.opacity < 1 || layer.rotation !== 0) {
    return false
  }

  if (layer.kind === "image" || layer.kind === "card" || layer.kind === "shader") {
    return true
  }

  if (layer.kind !== "shape") {
    return false
  }

  const isRectangular = (layer.shapeId ?? "rounded-square") === "rect"
  const radius = layer.cornerRadii
    ? cornerRadiiToLegacyRadius(layer.cornerRadii)
    : (layer.cornerRadius ?? 0)

  return isRectangular && radius <= 8 && layer.fillMode === "solid" && Boolean(layer.fill)
}

function rendersNothing(layer: DraftingCanvasLayer): string | null {
  if (!layer.isVisible) {
    return "layer is hidden"
  }

  if (layer.opacity <= 0) {
    return "opacity is 0"
  }

  if (layer.width <= 0 || layer.height <= 0) {
    return "width or height is 0"
  }

  if (layer.kind === "text" && !layer.text?.trim()) {
    return "text is empty"
  }

  if (layer.kind === "image" && !layer.imageValue) {
    return "image has no source"
  }

  if (layer.kind === "shape") {
    const hasFill =
      layer.fillMode === "solid" || layer.fillMode === "gradient" || layer.fillMode === "image"
    const hasStroke = (layer.strokeWidth ?? 0) > 0

    if (!hasFill && !hasStroke) {
      return "shape has neither fill nor stroke"
    }
  }

  return null
}

function fieldDesync(layer: DraftingCanvasLayer): string | null {
  if (layer.cornerRadii && layer.cornerRadius !== undefined) {
    const modern = cornerRadiiToLegacyRadius(layer.cornerRadii)

    if (modern !== layer.cornerRadius) {
      return `cornerRadius ${layer.cornerRadius} disagrees with cornerRadii ${modern}; the renderer reads cornerRadii`
    }
  }

  if (layer.shadow?.visible && (layer.shadows ?? []).length === 0) {
    return "shadow is visible but shadows[] is empty; the renderer reads shadows[]"
  }

  if (layer.blur > 0 && !(layer.layerFilters ?? []).some((filter) => filter.type === "blur")) {
    return "blur is set but layerFilters has no blur entry; the renderer reads layerFilters"
  }

  return null
}

function isSolidBackdrop(layer: DraftingCanvasLayer) {
  if (!layer.isVisible || layer.opacity < 1) {
    return false
  }

  if (layer.kind === "image" || layer.kind === "card" || layer.kind === "shader") {
    return true
  }

  if (layer.kind !== "shape") {
    return false
  }

  return layer.fillMode === "solid" && Boolean(layer.fill)
}

function resolveBackdropFill(
  layer: DraftingCanvasLayer,
  below: DraftingCanvasLayer[],
  cardFill: string,
): string {
  const rect = layerRect(layer)

  for (const candidate of [...below].reverse()) {
    if (!isSolidBackdrop(candidate) || candidate.fillMode === "image") {
      continue
    }

    if (candidate.fill && contains(layerRect(candidate), rect)) {
      return candidate.fill
    }
  }

  return cardFill
}

function contrastIssue(
  layer: DraftingCanvasLayer,
  below: DraftingCanvasLayer[],
  cardFill: string,
): TemplateIssue | null {
  if (layer.kind !== "text" || !layer.fill) {
    return null
  }

  const backdrop = resolveBackdropFill(layer, below, cardFill)
  const ratio = wcagContrast(layer.fill, backdrop)

  if (!Number.isFinite(ratio)) {
    return null
  }

  const minimum = (layer.fontSize ?? 16) >= 24 ? 3 : 4.5

  if (ratio >= minimum) {
    return null
  }

  return {
    code: "contrast-too-low",
    layerId: layer.id,
    message: `${layer.name}: ${layer.fill} on ${backdrop} is ${ratio.toFixed(2)}:1, below the ${minimum}:1 minimum`,
    severity: "error",
  }
}

export function validateTemplateDocument(
  document: DraftingWorkspaceDocumentV1,
  options: ValidateTemplateOptions = {},
): TemplateIssue[] {
  const nodeId = document.activeQrNodeId
  const cardState = document.cardStateByNodeId[nodeId]
  const layers = document.layerStateByNodeId[nodeId] ?? []
  const issues: TemplateIssue[] = []

  if (!cardState) {
    return [
      {
        code: "bounds-overflow",
        message: `document has no card state for node ${nodeId}`,
        severity: "error",
      },
    ]
  }

  const canvas: LayerRect = {
    bottom: cardState.height / 2,
    left: -cardState.width / 2,
    right: cardState.width / 2,
    top: -cardState.height / 2,
  }

  const ordered = [...layers].sort((left, right) => left.zIndex - right.zIndex)

  for (const [index, layer] of ordered.entries()) {
    const noop = rendersNothing(layer)
    if (noop) {
      issues.push({
        code: "layer-renders-nothing",
        layerId: layer.id,
        message: `${layer.name}: ${noop}`,
        severity: "warning",
      })
      continue
    }

    const desync = fieldDesync(layer)
    if (desync) {
      issues.push({
        code: "field-desync",
        layerId: layer.id,
        message: `${layer.name}: ${desync}`,
        severity: "error",
      })
    }

    const rect = layerRect(layer)

    if (!intersects(canvas, rect)) {
      issues.push({
        code: "bounds-overflow",
        layerId: layer.id,
        message: `${layer.name} is entirely outside the canvas`,
        severity: "error",
      })
    } else if (!contains(canvas, rect) && layer.kind !== "card") {
      issues.push({
        code: "bounds-overflow",
        layerId: layer.id,
        message: `${layer.name} extends past the canvas edge`,
        severity: "warning",
      })
    }

    const contrast = contrastIssue(layer, ordered.slice(0, index), cardState.fill)
    if (contrast) {
      issues.push(contrast)
    }

    if (layer.kind === "card") {
      continue
    }

    const covered = ordered
      .slice(index + 1)
      .some((above) => isOpaqueCover(above) && contains(layerRect(above), rect))

    if (covered) {
      issues.push({
        code: "layer-occluded",
        layerId: layer.id,
        message: `${layer.name} is completely hidden behind a later opaque layer`,
        severity: "error",
      })
    }
  }

  const qrLayer = ordered.find((layer) => layer.kind === "qr" && layer.isVisible)

  if (qrLayer) {
    const margin = document.qrStateByNodeId[nodeId]?.margin ?? 0
    const qrRect = layerRect(qrLayer)
    const quietZone: LayerRect = {
      bottom: qrRect.bottom + margin,
      left: qrRect.left - margin,
      right: qrRect.right + margin,
      top: qrRect.top - margin,
    }

    for (const layer of ordered) {
      if (layer.kind === "qr" || layer.kind === "card" || !layer.isVisible) {
        continue
      }

      if (
        layer.zIndex > qrLayer.zIndex &&
        layer.opacity > 0 &&
        intersects(quietZone, layerRect(layer))
      ) {
        issues.push({
          code: "qr-quiet-zone-collision",
          layerId: layer.id,
          message: `${layer.name} overlaps the QR quiet zone and can break scanning`,
          severity: "error",
        })
      }
    }

    const minQrRatio = options.minQrRatio ?? 0.28
    const ratio =
      Math.min(qrLayer.width, qrLayer.height) /
      Math.max(1, Math.min(cardState.width, cardState.height))

    if (ratio < minQrRatio) {
      issues.push({
        code: "qr-too-small",
        layerId: qrLayer.id,
        message: `QR occupies ${(ratio * 100).toFixed(1)}% of the shorter canvas side, below the ${(minQrRatio * 100).toFixed(0)}% minimum`,
        severity: ratio < minQrRatio / 2 ? "error" : "warning",
      })
    }
  }

  return issues
}
