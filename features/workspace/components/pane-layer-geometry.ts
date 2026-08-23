import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

export type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"
type SnapAxis = "x" | "y"
export type SnapGuides = {
  horizontal: number[]
  vertical: number[]
}
type LayerBounds = Pick<DraftingCanvasLayer, "height" | "id" | "width" | "x" | "y">

const ROTATION_SNAP_THRESHOLD_DEGREES = 4
const ROTATION_SNAP_TARGETS = [0, 90, 180, 270] as const

export function resizeDraftingLayer(
  layer: DraftingCanvasLayer,
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number,
  lockedResizeAxis?: "horizontal" | "vertical",
): Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y"> {
  if (layer.kind === "qr") {
    return resizeSquareLayer(layer, direction, deltaX, deltaY, lockedResizeAxis)
  }

  const affectsWest = direction.includes("w")
  const affectsEast = direction.includes("e")
  const affectsNorth = direction.includes("n")
  const affectsSouth = direction.includes("s")
  const widthDelta = affectsEast ? deltaX : affectsWest ? -deltaX : 0
  const heightDelta = affectsSouth ? deltaY : affectsNorth ? -deltaY : 0
  const width = Math.max(24, layer.width + widthDelta)
  const height = Math.max(24, layer.height + heightDelta)

  return {
    height,
    width,
    x: affectsWest ? layer.x + (layer.width - width) : layer.x,
    y: affectsNorth ? layer.y + (layer.height - height) : layer.y,
  }
}

function resizeSquareLayer(
  layer: DraftingCanvasLayer,
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number,
  lockedResizeAxis?: "horizontal" | "vertical",
): Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y"> {
  const affectsWest = direction.includes("w")
  const affectsEast = direction.includes("e")
  const affectsNorth = direction.includes("n")
  const affectsSouth = direction.includes("s")
  const horizontalDelta = affectsEast ? deltaX : affectsWest ? -deltaX : 0
  const verticalDelta = affectsSouth ? deltaY : affectsNorth ? -deltaY : 0
  const sizeDelta =
    horizontalDelta !== 0 && verticalDelta !== 0
      ? lockedResizeAxis === "horizontal"
        ? horizontalDelta
        : lockedResizeAxis === "vertical"
          ? verticalDelta
          : Math.abs(horizontalDelta) > Math.abs(verticalDelta)
            ? horizontalDelta
            : verticalDelta
      : horizontalDelta || verticalDelta
  const size = Math.max(24, layer.width + sizeDelta)

  return anchorSquareLayerResize(layer, direction, {
    height: size,
    width: size,
    x: layer.x,
    y: layer.y,
  })
}

function anchorSquareLayerResize(
  layer: DraftingCanvasLayer,
  direction: ResizeDirection,
  geometry: Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y">,
): Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y"> {
  const affectsWest = direction.includes("w")
  const affectsEast = direction.includes("e")
  const affectsNorth = direction.includes("n")
  const affectsSouth = direction.includes("s")
  const size = Math.max(24, Math.max(geometry.width, geometry.height))
  const right = layer.x + layer.width
  const bottom = layer.y + layer.height

  return {
    height: size,
    width: size,
    x: affectsWest
      ? right - size
      : affectsEast
        ? geometry.x
        : layer.x + (layer.width - size) / 2,
    y: affectsNorth
      ? bottom - size
      : affectsSouth
        ? geometry.y
        : layer.y + (layer.height - size) / 2,
  }
}

export function normalizeLayerRotation(rotation: number) {
  if (!Number.isFinite(rotation)) {
    return 0
  }

  const normalized = rotation % 360
  return normalized < 0 ? normalized + 360 : normalized
}

export function getLayerRotationLabel(rotation: number) {
  return Math.round(normalizeLayerRotation(rotation)) % 360
}

export function getCombinedLayerBounds(layers: DraftingCanvasLayer[]) {
  if (layers.length === 0) {
    return null
  }

  const layerCorners = layers.flatMap(getLayerRotatedCorners)
  const commonRotation = getCommonLayerRotation(layers)

  if (commonRotation !== null) {
    const localCorners = layerCorners.map((point) =>
      rotatePoint(point, { x: 0, y: 0 }, -commonRotation),
    )
    const localBounds = getPointBounds(localCorners)
    const localCenter = {
      x: localBounds.x + localBounds.width / 2,
      y: localBounds.y + localBounds.height / 2,
    }
    const center = rotatePoint(localCenter, { x: 0, y: 0 }, commonRotation)

    return {
      height: roundLayerNumber(localBounds.height),
      rotation: commonRotation,
      width: roundLayerNumber(localBounds.width),
      x: roundLayerNumber(center.x - localBounds.width / 2),
      y: roundLayerNumber(center.y - localBounds.height / 2),
    }
  }

  const bounds = getPointBounds(layerCorners)

  return {
    height: roundLayerNumber(bounds.height),
    rotation: 0,
    width: roundLayerNumber(bounds.width),
    x: roundLayerNumber(bounds.x),
    y: roundLayerNumber(bounds.y),
  }
}

function getLayerRotatedCorners(layer: DraftingCanvasLayer) {
  const center = {
    x: layer.x + layer.width / 2,
    y: layer.y + layer.height / 2,
  }
  const corners = [
    { x: layer.x, y: layer.y },
    { x: layer.x + layer.width, y: layer.y },
    { x: layer.x + layer.width, y: layer.y + layer.height },
    { x: layer.x, y: layer.y + layer.height },
  ]

  return corners.map((point) => rotatePoint(point, center, layer.rotation))
}

function getCommonLayerRotation(layers: DraftingCanvasLayer[]) {
  const [firstLayer] = layers
  const firstRotation = normalizeLayerRotation(firstLayer?.rotation ?? 0)

  return layers.every((layer) => Math.abs(normalizeLayerRotation(layer.rotation) - firstRotation) < 0.001)
    ? firstRotation
    : null
}

function getPointBounds(points: { x: number; y: number }[]) {
  const left = Math.min(...points.map((point) => point.x))
  const top = Math.min(...points.map((point) => point.y))
  const right = Math.max(...points.map((point) => point.x))
  const bottom = Math.max(...points.map((point) => point.y))

  return {
    height: bottom - top,
    width: right - left,
    x: left,
    y: top,
  }
}

export function getMarqueeBounds(
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const x = Math.min(start.x, end.x)
  const y = Math.min(start.y, end.y)

  return {
    height: Math.abs(end.y - start.y),
    width: Math.abs(end.x - start.x),
    x,
    y,
  }
}

export function rotatePoint(
  point: { x: number; y: number },
  center: { x: number; y: number },
  degrees: number,
) {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = point.x - center.x
  const dy = point.y - center.y

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

export function roundLayerNumber(value: number) {
  return Math.round(value * 1000) / 1000
}

export function snapLayerMove({
  layer,
  layers,
  proposedX,
  proposedY,
  threshold,
}: {
  layer: DraftingCanvasLayer
  layers: DraftingCanvasLayer[]
  proposedX: number
  proposedY: number
  threshold: number
}) {
  const horizontal = snapAxis({
    axis: "y",
    bounds: { ...layer, x: proposedX, y: proposedY },
    layers,
    threshold,
  })
  const vertical = snapAxis({
    axis: "x",
    bounds: { ...layer, x: proposedX, y: proposedY },
    layers,
    threshold,
  })

  return {
    guides: {
      horizontal: horizontal.guide === null ? [] : [horizontal.guide],
      vertical: vertical.guide === null ? [] : [vertical.guide],
    },
    x: proposedX + vertical.offset,
    y: proposedY + horizontal.offset,
  }
}

export function snapLayerResize({
  direction,
  layer,
  layers,
  geometry,
  threshold,
}: {
  direction: ResizeDirection
  layer: DraftingCanvasLayer
  layers: DraftingCanvasLayer[]
  geometry: Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y">
  threshold: number
}) {
  const nextGeometry = { ...geometry }
  const vertical = snapResizeAxis({
    affectsEnd: direction.includes("e"),
    affectsStart: direction.includes("w"),
    axis: "x",
    bounds: { ...layer, ...nextGeometry },
    layers,
    threshold,
  })

  if (vertical.guide !== null) {
    if (vertical.edge === "start") {
      nextGeometry.x += vertical.offset
      nextGeometry.width = Math.max(24, nextGeometry.width - vertical.offset)
    } else {
      nextGeometry.width = Math.max(24, nextGeometry.width + vertical.offset)
    }
  }

  const horizontal = snapResizeAxis({
    affectsEnd: direction.includes("s"),
    affectsStart: direction.includes("n"),
    axis: "y",
    bounds: { ...layer, ...nextGeometry },
    layers,
    threshold,
  })

  if (horizontal.guide !== null) {
    if (horizontal.edge === "start") {
      nextGeometry.y += horizontal.offset
      nextGeometry.height = Math.max(24, nextGeometry.height - horizontal.offset)
    } else {
      nextGeometry.height = Math.max(24, nextGeometry.height + horizontal.offset)
    }
  }

  if (layer.kind === "qr" && (vertical.guide !== null || horizontal.guide !== null)) {
    Object.assign(nextGeometry, anchorSquareLayerResize(layer, direction, nextGeometry))
  }

  return {
    guides: {
      horizontal: horizontal.guide === null ? [] : [horizontal.guide],
      vertical: vertical.guide === null ? [] : [vertical.guide],
    },
    geometry: nextGeometry,
  }
}

function snapResizeAxis({
  affectsEnd,
  affectsStart,
  axis,
  bounds,
  layers,
  threshold,
}: {
  affectsEnd: boolean
  affectsStart: boolean
  axis: SnapAxis
  bounds: LayerBounds
  layers: DraftingCanvasLayer[]
  threshold: number
}) {
  if (!affectsStart && !affectsEnd) {
    return { edge: null, guide: null, offset: 0 } as const
  }

  const source = axis === "x"
    ? affectsStart
      ? bounds.x
      : bounds.x + bounds.width
    : affectsStart
      ? bounds.y
      : bounds.y + bounds.height
  const edge = affectsStart ? "start" : "end"
  let best: { distance: number; edge: "start" | "end"; guide: number; offset: number } | null = null

  for (const target of getSnapTargets(layers, bounds.id, axis)) {
    const distance = Math.abs(target - source)

    if (distance <= threshold && (!best || distance < best.distance)) {
      best = {
        distance,
        edge,
        guide: target,
        offset: target - source,
      }
    }
  }

  return best ?? { edge: null, guide: null, offset: 0 }
}

function snapAxis({
  axis,
  bounds,
  layers,
  threshold,
}: {
  axis: SnapAxis
  bounds: LayerBounds
  layers: DraftingCanvasLayer[]
  threshold: number
}) {
  let best: { distance: number; guide: number; offset: number } | null = null

  for (const source of getBoundsSnapPoints(bounds, axis)) {
    for (const target of getSnapTargets(layers, bounds.id, axis)) {
      const distance = Math.abs(target - source)

      if (distance <= threshold && (!best || distance < best.distance)) {
        best = {
          distance,
          guide: target,
          offset: target - source,
        }
      }
    }
  }

  return best ?? { guide: null, offset: 0 }
}

function getSnapTargets(
  layers: DraftingCanvasLayer[],
  activeLayerId: string,
  axis: SnapAxis,
) {
  const targets = [0]

  for (const layer of layers) {
    if (layer.id === activeLayerId || !layer.isVisible) {
      continue
    }

    targets.push(...getBoundsSnapPoints(layer, axis))
  }

  return targets
}

function getBoundsSnapPoints(bounds: LayerBounds, axis: SnapAxis) {
  if (axis === "x") {
    return [bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width]
  }

  return [bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height]
}

export function snapLayerRotation(rotation: number) {
  const normalized = normalizeLayerRotation(rotation)
  let closest: number | null = null
  let closestDistance = Number.POSITIVE_INFINITY

  for (const target of ROTATION_SNAP_TARGETS) {
    const distance = getShortestAngleDistance(normalized, target)

    if (distance < closestDistance) {
      closest = target
      closestDistance = distance
    }
  }

  return closest !== null && closestDistance <= ROTATION_SNAP_THRESHOLD_DEGREES
    ? closest
    : normalized
}

function getShortestAngleDistance(left: number, right: number) {
  const distance = Math.abs(left - right) % 360
  return Math.min(distance, 360 - distance)
}
