import type { QraftyQrGradientConfig } from "../types"

const SVG_NS = "http://www.w3.org/2000/svg"

type FinderCornerKind = "inner" | "outer"

type FinderCornerRegion = {
  height: number
  width: number
  x: number
  y: number
}

function isSvgElementLike(node: Element): node is SVGElement {
  return typeof node.getAttribute === "function" && typeof node.setAttribute === "function"
}

function getNumericAttribute(element: Element, name: string) {
  const value = element.getAttribute(name)

  if (value === null) {
    return null
  }

  const numericValue = Number.parseFloat(value)

  return Number.isFinite(numericValue) ? numericValue : null
}

export function getQrSvgNumCells(svg: SVGElement) {
  const viewBox = svg.getAttribute("viewBox")

  if (viewBox) {
    const parts = viewBox
      .trim()
      .split(/[\s,]+/)
      .map((value) => Number.parseFloat(value))

    const width = parts[2]
    const height = parts[3]

    if (
      width !== undefined &&
      height !== undefined &&
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width > 0 &&
      height > 0
    ) {
      return Math.min(width, height)
    }
  }

  const width = getNumericAttribute(svg, "width")
  const height = getNumericAttribute(svg, "height")

  if (width !== null && height !== null && width > 0 && height > 0) {
    return Math.min(width, height)
  }

  return null
}

export function getFinderCornerRegions(
  margin: number,
  numCells: number,
  kind: FinderCornerKind,
): FinderCornerRegion[] {
  const moduleCount = numCells - margin * 2
  const outerSize = 7
  const innerSize = 3
  const innerInset = 2
  const innerPadding = kind === "inner" ? 0.75 : 0

  if (moduleCount <= outerSize || margin < 0) {
    return []
  }

  if (kind === "outer") {
    return [
      { height: outerSize, width: outerSize, x: margin, y: margin },
      {
        height: outerSize,
        width: outerSize,
        x: moduleCount + margin - outerSize,
        y: margin,
      },
      {
        height: outerSize,
        width: outerSize,
        x: margin,
        y: moduleCount + margin - outerSize,
      },
    ]
  }

  const size = innerSize + innerPadding * 2
  const inset = innerInset - innerPadding
  const innerX = moduleCount + margin - outerSize + inset
  const innerY = moduleCount + margin - outerSize + inset

  return [
    { height: size, width: size, x: margin + inset, y: margin + inset },
    { height: size, width: size, x: innerX, y: margin + inset },
    { height: size, width: size, x: margin + inset, y: innerY },
  ]
}

function formatSvgNumber(value: number) {
  if (Math.abs(value) < 0.000001) {
    return "0"
  }

  return Number(value.toFixed(4)).toString()
}

function getLinearGradientEndpoints({
  height,
  rotation,
  width,
  x,
  y,
}: {
  height: number
  rotation: number
  width: number
  x: number
  y: number
}) {
  const normalizedRotation = (rotation + 2 * Math.PI) % (2 * Math.PI)
  let x1 = x + width / 2
  let y1 = y + height / 2
  let x2 = x + width / 2
  let y2 = y + height / 2

  if (
    (normalizedRotation >= 0 && normalizedRotation <= 0.25 * Math.PI) ||
    (normalizedRotation > 1.75 * Math.PI && normalizedRotation <= 2 * Math.PI)
  ) {
    x1 -= width / 2
    y1 -= (height / 2) * Math.tan(rotation)
    x2 += width / 2
    y2 += (height / 2) * Math.tan(rotation)
  } else if (
    normalizedRotation > 0.25 * Math.PI &&
    normalizedRotation <= 0.75 * Math.PI
  ) {
    y1 -= height / 2
    x1 -= (width / 2) / Math.tan(rotation)
    y2 += height / 2
    x2 += (width / 2) / Math.tan(rotation)
  } else if (
    normalizedRotation > 0.75 * Math.PI &&
    normalizedRotation <= 1.25 * Math.PI
  ) {
    x1 += width / 2
    y1 += (height / 2) * Math.tan(rotation)
    x2 -= width / 2
    y2 -= (height / 2) * Math.tan(rotation)
  } else if (
    normalizedRotation > 1.25 * Math.PI &&
    normalizedRotation <= 1.75 * Math.PI
  ) {
    y1 += height / 2
    x1 += (width / 2) / Math.tan(rotation)
    y2 -= height / 2
    x2 -= (width / 2) / Math.tan(rotation)
  }

  return { x1, x2, y1, y2 }
}

export function createCornerGradientElement(
  document: Document,
  gradient: QraftyQrGradientConfig,
  {
    height,
    id,
    width,
    x,
    y,
  }: {
    height: number
    id: string
    width: number
    x: number
    y: number
  },
) {
  const gradientElement = document.createElementNS(
    SVG_NS,
    gradient.type === "radial" ? "radialGradient" : "linearGradient",
  )

  gradientElement.setAttribute("id", id)
  gradientElement.setAttribute("gradientUnits", "userSpaceOnUse")

  if (gradient.type === "radial") {
    const center = gradient.center ?? { x: 0.5, y: 0.5 }
    gradientElement.setAttribute("cx", String(x + center.x * width))
    gradientElement.setAttribute("cy", String(y + center.y * height))
    gradientElement.setAttribute("r", String(Math.max(width, height) / 2))
  } else {
    const endpoints = getLinearGradientEndpoints({
      height,
      rotation: gradient.rotation ?? 0,
      width,
      x,
      y,
    })

    gradientElement.setAttribute("x1", String(endpoints.x1))
    gradientElement.setAttribute("y1", String(endpoints.y1))
    gradientElement.setAttribute("x2", String(endpoints.x2))
    gradientElement.setAttribute("y2", String(endpoints.y2))
  }

  for (const stop of gradient.stops) {
    const stopElement = document.createElementNS(SVG_NS, "stop")
    stopElement.setAttribute("offset", String(stop.offset))
    stopElement.setAttribute("stop-color", stop.color)
    gradientElement.appendChild(stopElement)
  }

  return gradientElement
}

function findDotMatrixLayerAnchor(svg: SVGElement) {
  return Array.from(svg.children).find((child) => child.tagName.toLowerCase() === "image") ?? null
}

function applyFinderGradientOverlay(
  svg: SVGElement,
  {
    gradient,
    gradientIdPrefix,
    groupLayer,
    kind,
    margin,
    testId,
  }: {
    gradient: QraftyQrGradientConfig
    gradientIdPrefix: string
    groupLayer: string
    kind: FinderCornerKind
    margin: number
    testId: "finder-patterns-inner" | "finder-patterns-outer"
  },
) {
  const document = svg.ownerDocument

  if (!document) {
    return
  }

  svg.querySelectorAll(`[data-qr-layer="${groupLayer}"]`).forEach((node) => {
    node.remove()
  })

  const patterns = Array.from(svg.querySelectorAll(`[data-testid="${testId}"]`)).filter(
    isSvgElementLike,
  )

  if (patterns.length === 0) {
    return
  }

  const numCells = getQrSvgNumCells(svg)
  const cornerRegions = numCells === null ? [] : getFinderCornerRegions(margin, numCells, kind)

  if (cornerRegions.length === 0) {
    return
  }

  const group = document.createElementNS(SVG_NS, "g")
  const defs = document.createElementNS(SVG_NS, "defs")

  group.setAttribute("data-qr-layer", groupLayer)
  group.appendChild(defs)

  let overlaysCreated = 0

  for (const region of cornerRegions) {
    const gradientId = `${gradientIdPrefix}${Math.round(region.x)}-${Math.round(region.y)}-1`
    const gradientElement = createCornerGradientElement(document, gradient, {
      height: region.height,
      id: gradientId,
      width: region.width,
      x: region.x,
      y: region.y,
    })

    const clipPathId = `clip-path-${gradientId}`
    const clipPath = document.createElementNS(SVG_NS, "clipPath")

    clipPath.setAttribute("id", clipPathId)
    clipPath.setAttribute("data-qr-layer", `${groupLayer}-clip`)

    for (const pattern of patterns) {
      const clonedPattern = pattern.cloneNode(true) as SVGElement
      clonedPattern.removeAttribute("clip-path")
      clonedPattern.removeAttribute("opacity")
      clipPath.appendChild(clonedPattern)
    }

    defs.appendChild(gradientElement)
    defs.appendChild(clipPath)

    const gradientFill = document.createElementNS(SVG_NS, "rect")
    gradientFill.setAttribute("x", formatSvgNumber(region.x))
    gradientFill.setAttribute("y", formatSvgNumber(region.y))
    gradientFill.setAttribute("width", formatSvgNumber(region.width))
    gradientFill.setAttribute("height", formatSvgNumber(region.height))
    gradientFill.setAttribute("clip-path", `url('#${clipPathId}')`)
    gradientFill.setAttribute("fill", `url('#${gradientId}')`)
    gradientFill.setAttribute("data-qr-layer", `${groupLayer}-fill`)
    group.appendChild(gradientFill)
    overlaysCreated += 1
  }

  if (overlaysCreated !== cornerRegions.length) {
    return
  }

  for (const pattern of patterns) {
    pattern.setAttribute("opacity", "0")
  }

  svg.insertBefore(group, findDotMatrixLayerAnchor(svg))
}

export function applyPortableFinderGradientOverlays(
  svg: SVGElement,
  {
    finderInnerGradient,
    finderOuterGradient,
    margin,
  }: {
    finderInnerGradient?: QraftyQrGradientConfig | "none"
    finderOuterGradient?: QraftyQrGradientConfig | "none"
    margin: number
  },
) {
  if (finderOuterGradient && finderOuterGradient !== "none") {
    applyFinderGradientOverlay(svg, {
      gradient: finderOuterGradient,
      gradientIdPrefix: "corners-square-color-",
      groupLayer: "corner-frame-gradient",
      kind: "outer",
      margin,
      testId: "finder-patterns-outer",
    })
  }

  if (finderInnerGradient && finderInnerGradient !== "none") {
    applyFinderGradientOverlay(svg, {
      gradient: finderInnerGradient,
      gradientIdPrefix: "corners-dot-color-",
      groupLayer: "corner-dot-gradient",
      kind: "inner",
      margin,
      testId: "finder-patterns-inner",
    })
  }
}
