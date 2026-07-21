import type { DomLayerNode } from "./types"
import { flattenNestedSvgs } from "./preprocess-svg"

export type ConvertQrSvgOptions = {
  width: number
  height: number
  idPrefix?: string
}

type GradientStop = {
  offset: number
  color: string
}

type GradientDefinition = {
  css: string
}

let moduleCounter = 0

export function convertQrSvgToDom(svgMarkup: string, options: ConvertQrSvgOptions): DomLayerNode[] {
  if (typeof DOMParser === "undefined") {
    return []
  }

  moduleCounter = 0
  const flattenedMarkup = flattenNestedSvgs(svgMarkup)
  const parser = new DOMParser()
  const document = parser.parseFromString(flattenedMarkup, "image/svg+xml")
  const svg = document.documentElement

  if (svg.tagName.toLowerCase() !== "svg" || document.querySelector("parsererror")) {
    return []
  }

  const viewBox = readSvgViewBox(svg, options)
  const gradients = collectGradientDefinitions(svg)
  const prefix = options.idPrefix ?? "qr-module"

  const children = Array.from(svg.children).flatMap((child) =>
    convertSvgNode(child, {
      document,
      gradients,
      idPrefix: prefix,
      inheritedOpacity: 1,
      inheritedTransform: undefined,
      viewBox,
    }),
  )

  return children
}

function readSvgViewBox(svg: Element, options: ConvertQrSvgOptions) {
  const viewBoxAttr = svg.getAttribute("viewBox")
  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/[\s,]+/).map(Number.parseFloat)
    if (parts.length === 4 && parts.every((value) => Number.isFinite(value))) {
      return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] }
    }
  }

  const width = Number.parseFloat(svg.getAttribute("width") ?? "") || options.width
  const height = Number.parseFloat(svg.getAttribute("height") ?? "") || options.height

  return { x: 0, y: 0, width, height }
}

function collectGradientDefinitions(svg: Element) {
  const gradients = new Map<string, GradientDefinition>()

  for (const element of svg.querySelectorAll("linearGradient, radialGradient")) {
    const id = element.getAttribute("id")
    if (!id) {
      continue
    }

    const css = gradientElementToCss(element)
    if (css) {
      gradients.set(id, { css })
    }
  }

  return gradients
}

function gradientElementToCss(element: Element) {
  const stops = Array.from(element.querySelectorAll("stop"))
    .map((stop) => {
      const offset = parseGradientOffset(stop.getAttribute("offset") ?? "0")
      const color = stop.getAttribute("stop-color") ?? stop.style?.stopColor ?? "currentColor"
      const opacity = stop.getAttribute("stop-opacity") ?? stop.style?.stopOpacity
      return {
        offset,
        color: opacity && opacity !== "1" ? withAlpha(color, Number.parseFloat(opacity)) : color,
      }
    })
    .filter((stop) => stop.color)

  if (stops.length === 0) {
    return null
  }

  const stopCss = stops.map((stop) => `${stop.color} ${formatPercent(stop.offset)}`).join(", ")

  if (element.tagName.toLowerCase() === "radialgradient") {
    return `radial-gradient(circle, ${stopCss})`
  }

  const x1 = parseGradientCoord(element.getAttribute("x1"), 0)
  const y1 = parseGradientCoord(element.getAttribute("y1"), 0)
  const x2 = parseGradientCoord(element.getAttribute("x2"), 1)
  const y2 = parseGradientCoord(element.getAttribute("y2"), 1)
  const angle = Math.round((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + 90)

  return `linear-gradient(${angle}deg, ${stopCss})`
}

function parseGradientOffset(value: string) {
  if (value.endsWith("%")) {
    return Number.parseFloat(value) / 100
  }

  return Number.parseFloat(value)
}

function parseGradientCoord(value: string | null, fallback: number) {
  if (!value) {
    return fallback
  }

  if (value.endsWith("%")) {
    return Number.parseFloat(value) / 100
  }

  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatPercent(value: number) {
  return `${Math.round(value * 1000) / 10}%`
}

function withAlpha(color: string, alpha: number) {
  if (color.startsWith("#") && color.length === 7) {
    const r = Number.parseInt(color.slice(1, 3), 16)
    const g = Number.parseInt(color.slice(3, 5), 16)
    const b = Number.parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return color
}

type ConvertContext = {
  document: Document
  gradients: Map<string, GradientDefinition>
  idPrefix: string
  inheritedOpacity: number
  inheritedTransform?: string
  viewBox: { x: number; y: number; width: number; height: number }
}

function convertSvgNode(node: Element, context: ConvertContext): DomLayerNode[] {
  const tag = node.tagName.toLowerCase()

  if (tag === "defs") {
    return []
  }

  if (tag === "g") {
    return convertGroupNode(node, context) as DomLayerNode[]
  }

  if (tag === "svg") {
    return Array.from(node.children).flatMap((child) => convertSvgNode(child, context))
  }

  if (tag === "rect") {
    return convertRectNode(node, context)
  }

  if (tag === "path") {
    return convertPathNode(node, context) as DomLayerNode[]
  }

  if (tag === "circle") {
    return convertCircleNode(node, context)
  }

  if (tag === "image") {
    return convertImageNode(node, context) as DomLayerNode[]
  }

  return []
}

function convertGroupNode(node: Element, context: ConvertContext) {
  if (shouldSkipNode(node)) {
    return []
  }

  const opacity = resolveOpacity(node, context.inheritedOpacity)
  const transform = combineTransforms(context.inheritedTransform, node.getAttribute("transform"))
  const filter = node.getAttribute("filter")
  const childContext: ConvertContext = {
    ...context,
    inheritedOpacity: opacity,
    inheritedTransform: transform,
  }

  const children = Array.from(node.children).flatMap((child) => convertSvgNode(child, childContext))

  if (children.length === 0) {
    return []
  }

  if (!transform && !filter && opacity === 1 && children.length === 1) {
    return children
  }

  const groupStyle: Record<string, string | number> = {
    position: "absolute",
    left: 0,
    top: 0,
    width: context.viewBox.width,
    height: context.viewBox.height,
    pointerEvents: "none",
  }

  if (transform) {
    groupStyle.transform = transform
    groupStyle.transformOrigin = "0 0"
  }

  if (opacity < 1) {
    groupStyle.opacity = opacity
  }

  const dropShadow = filter ? resolveSvgFilterToDropShadow(filter, context.document) : null
  if (dropShadow) {
    groupStyle.filter = dropShadow
  }

  return [
    {
      kind: "group",
      id: nextModuleId(context.idPrefix, "group"),
      bounds: { x: 0, y: 0, width: context.viewBox.width, height: context.viewBox.height },
      style: groupStyle,
      children,
    },
  ]
}

function convertRectNode(node: Element, context: ConvertContext) {
  if (shouldSkipNode(node)) {
    return []
  }

  const clipPathRef = node.getAttribute("clip-path")
  if (clipPathRef) {
    const clipPathId = resolveUrlReference(clipPathRef)
    const clipPathElement = clipPathId ? context.document.getElementById(clipPathId) : null
    const fill = resolveFill(node.getAttribute("fill"), context.gradients)

    if (clipPathElement && fill) {
      return convertClipPathDefinition(clipPathElement, fill, context)
    }
  }

  const x = Number.parseFloat(node.getAttribute("x") ?? "0")
  const y = Number.parseFloat(node.getAttribute("y") ?? "0")
  const width = Number.parseFloat(node.getAttribute("width") ?? "0")
  const height = Number.parseFloat(node.getAttribute("height") ?? "0")
  const fill = resolveFill(node.getAttribute("fill"), context.gradients)

  if (!fill || width <= 0 || height <= 0) {
    return []
  }

  const rx = Number.parseFloat(node.getAttribute("rx") ?? node.getAttribute("ry") ?? "0")
  const opacity = resolveOpacity(node, context.inheritedOpacity)
  const inlineStyle = parseSvgInlineStyle(node.getAttribute("style"))
  const rectShape = resolveRectShapeStyle(width, height, rx)

  const style = buildModuleStyle({
    context,
    left: x,
    top: y,
    width,
    height,
    fill,
    borderRadius: rectShape.borderRadius,
    clipPath: rectShape.clipPath,
    opacity,
    inlineStyle,
  })

  return [
    createModuleNode(
      context.idPrefix,
      { x, y, width, height },
      style,
      {},
      getModuleSuffix(node),
    ),
  ]
}

function convertClipPathDefinition(clipPathElement: Element, fill: string, context: ConvertContext) {
  return Array.from(clipPathElement.children).flatMap((child) => {
    const tag = child.tagName.toLowerCase()

    if (tag === "path") {
      const pathData = child.getAttribute("d")?.trim()
      if (!pathData) {
        return []
      }

      const style = buildModuleStyle({
        context,
        left: 0,
        top: 0,
        width: context.viewBox.width,
        height: context.viewBox.height,
        fill,
        clipPath: buildPathClipPath(pathData, child.getAttribute("fill-rule")),
        opacity: context.inheritedOpacity,
      })

      return [
        createModuleNode(
          context.idPrefix,
          { x: 0, y: 0, width: context.viewBox.width, height: context.viewBox.height },
          style,
        ),
      ]
    }

    if (tag === "rect") {
      const x = Number.parseFloat(child.getAttribute("x") ?? "0")
      const y = Number.parseFloat(child.getAttribute("y") ?? "0")
      const width = Number.parseFloat(child.getAttribute("width") ?? "0")
      const height = Number.parseFloat(child.getAttribute("height") ?? "0")
      const rx = Number.parseFloat(child.getAttribute("rx") ?? child.getAttribute("ry") ?? "0")

      if (width <= 0 || height <= 0) {
        return []
      }

      const style = buildModuleStyle({
        context,
        left: x,
        top: y,
        width,
        height,
        fill,
        borderRadius: rx > 0 ? rx : undefined,
        opacity: context.inheritedOpacity,
      })

      return [createModuleNode(context.idPrefix, { x, y, width, height }, style)]
    }

    return []
  })
}

function convertPathNode(node: Element, context: ConvertContext) {
  if (shouldSkipNode(node)) {
    return []
  }

  const pathData = node.getAttribute("d")?.trim()
  const fill = resolveFill(node.getAttribute("fill"), context.gradients)

  if (!pathData || !fill) {
    return []
  }

  const pathContext: ConvertContext = {
    ...context,
    inheritedTransform: combineTransforms(context.inheritedTransform, node.getAttribute("transform")),
  }
  const opacity = resolveOpacity(node, pathContext.inheritedOpacity)
  const inlineStyle = parseSvgInlineStyle(node.getAttribute("style"))
  const attributeTransform = node.getAttribute("transform")
  const hasInlineTransform = Boolean(
    inlineStyle.transform && !isNoOpTransform(inlineStyle.transform),
  )

  if (attributeTransform && !hasInlineTransform) {
    const grouped = convertTransformedPathToGroupNode(
      node,
      pathData,
      fill,
      opacity,
      pathContext,
      context,
      attributeTransform,
    )
    if (grouped) {
      return grouped
    }
  }

  if (hasInlineTransform) {
    const bounds = measurePathBoundingBox(pathData, node, pathContext.viewBox)
    if (bounds && bounds.width > 0 && bounds.height > 0) {
      const localPath = translatePathMoveToOrigin(pathData, bounds.x, bounds.y)
      const style = buildModuleStyle({
        context: pathContext,
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        fill,
        clipPath: buildPathClipPath(localPath, node.getAttribute("fill-rule")),
        opacity,
        inlineStyle,
      })

      return [
        createModuleNode(
          pathContext.idPrefix,
          bounds,
          style,
          {},
          getModuleSuffix(node),
        ),
      ]
    }
  }

  const style = buildModuleStyle({
    context: pathContext,
    left: 0,
    top: 0,
    width: pathContext.viewBox.width,
    height: pathContext.viewBox.height,
    fill,
    clipPath: buildPathClipPath(pathData, node.getAttribute("fill-rule")),
    opacity,
    inlineStyle,
  })

  return [
    createModuleNode(
      pathContext.idPrefix,
      { x: 0, y: 0, width: pathContext.viewBox.width, height: pathContext.viewBox.height },
      style,
      {},
      getModuleSuffix(node),
    ),
  ]
}

function convertTransformedPathToGroupNode(
  node: Element,
  pathData: string,
  fill: string,
  opacity: number,
  pathContext: ConvertContext,
  context: ConvertContext,
  attributeTransform: string,
) {
  const untransformedBounds =
    measureUntransformedPathBounds(pathData, node) ?? readShapeViewBoxBounds(node)
  if (!untransformedBounds || untransformedBounds.width <= 0 || untransformedBounds.height <= 0) {
    return null
  }

  const localPath = translatePathMoveToOrigin(
    pathData,
    untransformedBounds.x,
    untransformedBounds.y,
  )
  const childStyle = buildModuleStyle({
    context: { ...pathContext, inheritedTransform: undefined },
    left: 0,
    top: 0,
    width: untransformedBounds.width,
    height: untransformedBounds.height,
    fill,
    clipPath: buildPathClipPath(localPath, node.getAttribute("fill-rule")),
    opacity,
  })
  const child = createModuleNode(
    pathContext.idPrefix,
    { x: 0, y: 0, width: untransformedBounds.width, height: untransformedBounds.height },
    childStyle,
    {},
    getModuleSuffix(node),
  )
  const cssTransform = combineTransforms(context.inheritedTransform, attributeTransform)
  const groupStyle: Record<string, string | number> = {
    position: "absolute",
    left: 0,
    top: 0,
    width: pathContext.viewBox.width,
    height: pathContext.viewBox.height,
    pointerEvents: "none",
  }

  if (cssTransform) {
    groupStyle.transform = cssTransform
    groupStyle.transformOrigin = "0 0"
  }

  if (opacity < 1) {
    groupStyle.opacity = opacity
  }

  return [
    {
      kind: "group",
      id: nextModuleId(pathContext.idPrefix, "group"),
      bounds: { x: 0, y: 0, width: pathContext.viewBox.width, height: pathContext.viewBox.height },
      style: groupStyle,
      children: [child],
    },
  ]
}

function measureUntransformedPathBounds(pathData: string, node: Element) {
  const hadTransform = node.hasAttribute("transform")
  const savedTransform = node.getAttribute("transform")

  if (hadTransform) {
    node.removeAttribute("transform")
  }

  try {
    const graphics = node as SVGGraphicsElement
    if (typeof graphics.getBBox === "function") {
      const bbox = graphics.getBBox()
      if (
        bbox &&
        Number.isFinite(bbox.width) &&
        bbox.width > 0 &&
        Number.isFinite(bbox.height) &&
        bbox.height > 0
      ) {
        return {
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height,
        }
      }
    }
  } catch {
    return estimatePathBoundsFromPathData(pathData)
  } finally {
    if (hadTransform && savedTransform !== null) {
      node.setAttribute("transform", savedTransform)
    }
  }

  return estimatePathBoundsFromPathData(pathData)
}

function readShapeViewBoxBounds(node: Element) {
  const raw = node.getAttribute("data-shape-view-box")
  if (!raw) {
    return null
  }

  const parts = raw.split(/[\s,]+/).map(Number.parseFloat)
  if (parts.length !== 2 || !parts.every((value) => Number.isFinite(value) && value > 0)) {
    return null
  }

  return {
    x: 0,
    y: 0,
    width: parts[0],
    height: parts[1],
  }
}

function estimatePathBoundsFromPathData(pathData: string) {
  const numbers = pathData.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi)
  if (!numbers || numbers.length < 2) {
    return null
  }

  const values = numbers.map((value) => Number.parseFloat(value)).filter(Number.isFinite)
  if (values.length < 2) {
    return null
  }

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (let index = 0; index + 1 < values.length; index += 2) {
    const x = values[index]
    const y = values[index + 1]
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  }
}

function splitPathSubpaths(pathData: string) {
  return pathData
    .split(/(?=[Mm])/)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function buildPathClipPath(pathData: string, fillRule?: string | null) {
  const escaped = escapeCssPath(pathData)
  if (splitPathSubpaths(pathData).length <= 1) {
    return `path('${escaped}')`
  }

  const rule = fillRule === "evenodd" ? "evenodd" : "nonzero"
  return `path(${rule}, '${escaped}')`
}

function convertCircleNode(node: Element, context: ConvertContext) {
  if (shouldSkipNode(node)) {
    return []
  }

  const cx = Number.parseFloat(node.getAttribute("cx") ?? "0")
  const cy = Number.parseFloat(node.getAttribute("cy") ?? "0")
  const radius = Number.parseFloat(node.getAttribute("r") ?? "0")
  const fill = resolveFill(node.getAttribute("fill"), context.gradients)

  if (!fill || radius <= 0) {
    return []
  }

  const diameter = radius * 2
  const style = buildModuleStyle({
    context,
    left: cx - radius,
    top: cy - radius,
    width: diameter,
    height: diameter,
    fill,
    borderRadius: "50%",
    opacity: resolveOpacity(node, context.inheritedOpacity),
  })

  return [
    createModuleNode(
      context.idPrefix,
      { x: cx - radius, y: cy - radius, width: diameter, height: diameter },
      style,
    ),
  ]
}

function convertImageNode(node: Element, context: ConvertContext) {
  if (shouldSkipNode(node)) {
    return []
  }

  const href =
    node.getAttribute("href") ??
    node.getAttributeNS("http://www.w3.org/1999/xlink", "href") ??
    ""
  if (!href) {
    return []
  }

  const x = Number.parseFloat(node.getAttribute("x") ?? "0")
  const y = Number.parseFloat(node.getAttribute("y") ?? "0")
  const width = Number.parseFloat(node.getAttribute("width") ?? "0")
  const height = Number.parseFloat(node.getAttribute("height") ?? "0")
  const opacity = resolveOpacity(node, context.inheritedOpacity)

  const imageStyle = [
    "position:absolute",
    `left:${x}px`,
    `top:${y}px`,
    `width:${width}px`,
    `height:${height}px`,
    opacity < 1 ? `opacity:${opacity}` : "",
  ]
    .filter(Boolean)
    .join(";")

  return [
    {
      kind: "module",
      id: nextModuleId(context.idPrefix, "image"),
      bounds: { x, y, width, height },
      style: {
        position: "absolute",
        left: 0,
        top: 0,
        width: context.viewBox.width,
        height: context.viewBox.height,
        pointerEvents: "none",
        ...(context.inheritedTransform ? { transform: context.inheritedTransform, transformOrigin: "0 0" } : {}),
      },
      htmlContent: `<img alt="" src="${escapeHtmlAttribute(href)}" style="${imageStyle}" />`,
    },
  ]
}

function buildModuleStyle({
  context,
  left,
  top,
  width,
  height,
  fill,
  clipPath,
  borderRadius,
  opacity,
  inlineStyle,
}: {
  context: ConvertContext
  left: number
  top: number
  width: number
  height: number
  fill: string
  clipPath?: string
  borderRadius?: number | string
  opacity: number
  inlineStyle?: SvgInlineStyle
}) {
  const style: Record<string, string | number> = {
    position: "absolute",
    left,
    top,
    width,
    height,
    pointerEvents: "none",
  }

  if (fill.startsWith("linear-gradient") || fill.startsWith("radial-gradient")) {
    style.background = fill
  } else {
    style.backgroundColor = fill
  }

  if (clipPath) {
    style.clipPath = clipPath
  }

  if (borderRadius !== undefined) {
    style.borderRadius = borderRadius
  }

  if (opacity < 1) {
    style.opacity = opacity
  }

  applyInlineTransforms(style, context, inlineStyle)

  return style
}

type SvgInlineStyle = {
  transform?: string
  transformOrigin?: string
  transformBox?: string
}

function parseSvgInlineStyle(value: string | null): SvgInlineStyle {
  if (!value) {
    return {}
  }

  const parsed: SvgInlineStyle = {}

  for (const rule of value.split(";")) {
    const separatorIndex = rule.indexOf(":")
    if (separatorIndex === -1) {
      continue
    }

    const key = rule.slice(0, separatorIndex).trim().toLowerCase()
    const rawValue = rule.slice(separatorIndex + 1).trim()
    if (!key || !rawValue) {
      continue
    }

    if (key === "transform") {
      parsed.transform = rawValue
    }

    if (key === "transform-origin") {
      parsed.transformOrigin = rawValue
    }

    if (key === "transform-box") {
      parsed.transformBox = rawValue
    }
  }

  return parsed
}

function isNoOpTransform(transform: string) {
  return /^rotate\(\s*0deg\s*\)$/i.test(transform.trim())
}

function mapSvgTransformOrigin(origin: string) {
  const normalized = origin.trim().toLowerCase()
  if (normalized === "center" || normalized === "center center") {
    return "50% 50%"
  }

  return origin
}

function applyInlineTransforms(
  style: Record<string, string | number>,
  context: ConvertContext,
  inlineStyle?: SvgInlineStyle,
) {
  const localTransform =
    inlineStyle?.transform && !isNoOpTransform(inlineStyle.transform)
      ? inlineStyle.transform
      : undefined
  const transforms = [context.inheritedTransform, localTransform].filter(Boolean)

  if (transforms.length === 0) {
    return
  }

  style.transform = transforms.join(" ")

  if (localTransform && inlineStyle?.transformOrigin) {
    style.transformOrigin = mapSvgTransformOrigin(inlineStyle.transformOrigin)
    return
  }

  if (context.inheritedTransform) {
    style.transformOrigin = "0 0"
  }
}

function measurePathBoundingBox(
  pathData: string,
  node: Element,
  viewBox: { width: number; height: number },
) {
  const graphics = node as SVGGraphicsElement
  if (typeof graphics.getBBox === "function") {
    try {
      const bbox = graphics.getBBox()
      if (Number.isFinite(bbox.width) && bbox.width > 0 && Number.isFinite(bbox.height) && bbox.height > 0) {
        return {
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height,
        }
      }
    } catch {
      // Fall back to finder-cell snapping in environments without SVG geometry APIs.
    }
  }

  return resolveFinderInnerCellBounds(pathData, viewBox)
}

function parsePathMovePoint(pathData: string) {
  const match = pathData.match(
    /^M\s*([+-]?(?:\d+\.?\d*|\.\d+))(?:[\s,]+([+-]?(?:\d+\.?\d*|\.\d+)))?/,
  )

  if (!match) {
    return null
  }

  return {
    x: Number.parseFloat(match[1]),
    y: Number.parseFloat(match[2] ?? "0"),
  }
}

function resolveFinderInnerCellBounds(
  pathData: string,
  viewBox: { width: number; height: number },
) {
  const anchor = parsePathMovePoint(pathData)
  if (!anchor) {
    return null
  }

  const finderCellSize = 3

  for (let margin = 0; margin <= viewBox.width; margin += 1) {
    const moduleCount = viewBox.width - margin * 2
    if (moduleCount < 7) {
      continue
    }

    const origins = [
      { x: margin + 2, y: margin + 2 },
      { x: moduleCount + margin - 7 + 2, y: margin + 2 },
      { x: margin + 2, y: moduleCount + margin - 7 + 2 },
    ]

    for (const origin of origins) {
      if (
        anchor.x >= origin.x &&
        anchor.x <= origin.x + finderCellSize &&
        anchor.y >= origin.y &&
        anchor.y <= origin.y + finderCellSize
      ) {
        return {
          x: origin.x,
          y: origin.y,
          width: finderCellSize,
          height: finderCellSize,
        }
      }
    }
  }

  return null
}

function translatePathMoveToOrigin(pathData: string, originX: number, originY: number) {
  return pathData.replace(
    /M\s*([+-]?(?:\d+\.?\d*|\.\d+))(?:[\s,]+([+-]?(?:\d+\.?\d*|\.\d+)))?/g,
    (_match, xValue, yValue) => {
      const x = formatPathCoord(Number.parseFloat(xValue) - originX)
      const y = formatPathCoord(
        (yValue === undefined ? 0 : Number.parseFloat(yValue)) - originY,
      )
      return `M ${x} ${y}`
    },
  )
}

function formatPathCoord(value: number) {
  if (!Number.isFinite(value)) {
    return "0"
  }

  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)))
}

function resolveRectShapeStyle(width: number, height: number, rx: number) {
  if (rx <= 0) {
    return {
      borderRadius: undefined,
      clipPath: undefined,
    }
  }

  const cap = Math.min(width, height) / 2
  if (rx >= cap) {
    return {
      borderRadius: undefined,
      clipPath: `circle(${cap}px at ${width / 2}px ${height / 2}px)`,
    }
  }

  return {
    borderRadius: rx,
    clipPath: undefined,
  }
}

function createModuleNode(
  idPrefix: string,
  bounds: { x: number; y: number; width: number; height: number },
  style: Record<string, string | number>,
  extras: Pick<DomLayerNode, "svgInner" | "htmlContent"> = {},
  moduleSuffix = "shape",
): DomLayerNode {
  return {
    kind: "module",
    id: nextModuleId(idPrefix, moduleSuffix),
    bounds,
    style,
    ...extras,
  }
}

function getModuleSuffix(node: Element) {
  const testId = node.getAttribute("data-testid")
  if (testId === "finder-patterns-outer") {
    return "finder-outer"
  }

  if (testId === "finder-patterns-inner") {
    return "finder-inner"
  }

  return "shape"
}

function shouldSkipNode(node: Element) {
  const opacity = Number.parseFloat(node.getAttribute("opacity") ?? "1")
  if (opacity <= 0) {
    return true
  }

  const fill = node.getAttribute("fill")
  if (fill === "none") {
    return true
  }

  const display = node.getAttribute("display")
  if (display === "none") {
    return true
  }

  return false
}

function resolveOpacity(node: Element, inherited: number) {
  const local = Number.parseFloat(node.getAttribute("opacity") ?? "1")
  return inherited * (Number.isFinite(local) ? local : 1)
}

function resolveFill(fill: string | null, gradients: Map<string, GradientDefinition>) {
  if (!fill || fill === "none" || fill === "transparent") {
    return null
  }

  const gradientId = resolveUrlReference(fill)
  if (gradientId) {
    return gradients.get(gradientId)?.css ?? null
  }

  return fill
}

function resolveUrlReference(value: string) {
  const match = value.match(/^url\((['"]?)#([^'")]+)\1\)$/)
  return match?.[2] ?? null
}

function resolveSvgFilterToDropShadow(filterValue: string, document: Document) {
  const filterId = resolveUrlReference(filterValue)
  if (!filterId) {
    return null
  }

  const filter = document.getElementById(filterId)
  const dropShadow = filter?.querySelector("feDropShadow")
  if (!dropShadow) {
    return null
  }

  const dx = dropShadow.getAttribute("dx") ?? "0"
  const dy = dropShadow.getAttribute("dy") ?? "0"
  const stdDeviation = dropShadow.getAttribute("stdDeviation") ?? "0"
  const floodColor = dropShadow.getAttribute("flood-color") ?? "#000000"
  const floodOpacity = dropShadow.getAttribute("flood-opacity") ?? "1"
  const blur = Number.parseFloat(stdDeviation) * 2

  return `drop-shadow(${dx}px ${dy}px ${blur}px ${withAlpha(floodColor, Number.parseFloat(floodOpacity))})`
}

function combineTransforms(inherited: string | undefined, local: string | null) {
  const parts = [inherited, local ? svgTransformToCss(local) : null].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : undefined
}

function svgTransformToCss(transform: string) {
  return transform
    .replace(/\bmatrix\(([^)]+)\)/g, "matrix($1)")
    .replace(/\btranslate\(([^)]+)\)/g, (_match, values: string) => {
      const parts = values.split(/[\s,]+/).filter(Boolean)
      if (parts.length === 1) {
        return `translate(${parts[0]}px)`
      }
      return `translate(${parts[0]}px, ${parts[1]}px)`
    })
    .replace(/\bscale\(([^)]+)\)/g, "scale($1)")
    .replace(/\brotate\(([^)]+)\)/g, (_match, values: string) => {
      const parts = values.split(/[\s,]+/).filter(Boolean)
      if (parts.length === 1) {
        return `rotate(${parts[0]}deg)`
      }
      return `rotate(${parts[0]}deg ${parts[1]}px ${parts[2]}px)`
    })
    .replace(/\bskewX\(([^)]+)\)/g, (_match, value: string) => `skewX(${value}deg)`)
    .replace(/\bskewY\(([^)]+)\)/g, (_match, value: string) => `skewY(${value}deg)`)
}

function nextModuleId(prefix: string, suffix: string) {
  moduleCounter += 1
  return `${prefix}-${suffix}-${moduleCounter}`
}

function escapeCssPath(pathData: string) {
  return pathData.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
}
