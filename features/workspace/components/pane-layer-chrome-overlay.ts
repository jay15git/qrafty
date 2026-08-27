export type ChromeSpace = {
  contentOnlyZoom: boolean
  contentPanX: number
  contentPanY: number
  interactionScale: number
  viewFitScale: number
}

export type ChromeBounds = {
  height: number
  width: number
  x: number
  y: number
}

function safeScale(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 1
}

export function getChromeVisualScale(
  space: Pick<ChromeSpace, "interactionScale" | "viewFitScale">,
) {
  return safeScale(space.viewFitScale) * safeScale(space.interactionScale)
}

export function documentToChromeOffset(
  x: number,
  y: number,
  space: ChromeSpace,
): { x: number; y: number } {
  const scale = getChromeVisualScale(space)
  const panScale = space.contentOnlyZoom ? safeScale(space.viewFitScale) : 0

  return {
    x: x * scale + space.contentPanX * panScale,
    y: y * scale + space.contentPanY * panScale,
  }
}

export function documentToChromeSize(
  size: number,
  space: Pick<ChromeSpace, "interactionScale" | "viewFitScale">,
) {
  return size * getChromeVisualScale(space)
}

export function getChromeFrameRect(
  bounds: ChromeBounds,
  paddingPx: number,
  space: ChromeSpace,
) {
  const origin = documentToChromeOffset(bounds.x, bounds.y, space)
  const width = documentToChromeSize(bounds.width, space)
  const height = documentToChromeSize(bounds.height, space)

  return {
    height: height + paddingPx * 2,
    width: width + paddingPx * 2,
    x: origin.x - paddingPx,
    y: origin.y - paddingPx,
  }
}

export function getFloatingToolbarChromePosition({
  bounds,
  canvasHeight,
  canvasWidth,
  gapPx,
  gutterPx,
  paddingPx,
  rotateStemPx,
  space,
  toolbarHeightPx,
  toolbarWidthPx,
}: {
  bounds: ChromeBounds
  canvasHeight: number
  canvasWidth: number
  gapPx: number
  gutterPx: number
  paddingPx: number
  rotateStemPx: number
  space: ChromeSpace
  toolbarHeightPx: number
  toolbarWidthPx: number
}) {
  const origin = documentToChromeOffset(bounds.x, bounds.y, space)
  const width = documentToChromeSize(bounds.width, space)
  const height = documentToChromeSize(bounds.height, space)
  const x = origin.x + width / 2
  const frameTop = origin.y - paddingPx
  const rawY = frameTop - rotateStemPx - gapPx - toolbarHeightPx
  const yBelow = origin.y + height + paddingPx + gapPx
  const topBoundary = canvasHeight > 0 ? -canvasHeight / 2 + gutterPx : rawY
  const bottomBoundary =
    canvasHeight > 0 ? canvasHeight / 2 - toolbarHeightPx - gutterPx : rawY
  const yAbove = Math.min(rawY, bottomBoundary)
  const y =
    rawY < topBoundary
      ? Math.max(Math.min(yBelow, bottomBoundary), topBoundary)
      : Math.max(yAbove, topBoundary)
  const halfToolbar = toolbarWidthPx / 2
  const horizontalLimit =
    canvasWidth > 0
      ? Math.max(0, canvasWidth / 2 - halfToolbar - gutterPx)
      : Number.POSITIVE_INFINITY

  return {
    x: Math.min(horizontalLimit, Math.max(-horizontalLimit, x)),
    y,
  }
}
