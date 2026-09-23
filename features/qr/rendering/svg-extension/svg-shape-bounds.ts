import {
  isSvgElementLike,
  getDotNumericAttribute,
} from "./svg-dom-utils"

export type SvgShapeBounds = {
  height: number
  width: number
  x: number
  y: number
}

export const PATH_COMMAND_ARG_COUNTS: Record<string, number> = {
  a: 7,
  c: 6,
  h: 1,
  l: 2,
  m: 2,
  q: 4,
  s: 4,
  t: 2,
  v: 1,
  z: 0,
}

export function getPathDataBounds(pathDefinition: string | null): SvgShapeBounds | null {
  const tokens = pathDefinition?.match(/[a-zA-Z]|[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi)

  if (!tokens) {
    return null
  }

  let command = ""
  let cursorX = 0
  let cursorY = 0
  let index = 0
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  const pushPoint = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return
    }

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  while (index < tokens.length) {
    const token = tokens[index]!

    if (/^[a-zA-Z]$/.test(token)) {
      command = token
      index += 1

      if (command.toLowerCase() === "z") {
        continue
      }
    }

    const normalized = command.toLowerCase()
    const arity = PATH_COMMAND_ARG_COUNTS[normalized]

    if (arity === undefined || arity === 0) {
      index += 1
      continue
    }

    if (index + arity > tokens.length) {
      break
    }

    const params = tokens.slice(index, index + arity).map(Number)
    index += arity
    const isRelative = command !== normalized
    const abs = (value: number, base: number) => (isRelative ? base + value : value)

    if (normalized === "h") {
      cursorX = abs(params[0]!, cursorX)
      pushPoint(cursorX, cursorY)
      continue
    }

    if (normalized === "v") {
      cursorY = abs(params[0]!, cursorY)
      pushPoint(cursorX, cursorY)
      continue
    }

    if (normalized === "a") {
      cursorX = abs(params[5]!, cursorX)
      cursorY = abs(params[6]!, cursorY)
      pushPoint(cursorX, cursorY)
      continue
    }

    const baseX = cursorX
    const baseY = cursorY

    for (let pair = 0; pair + 1 < arity; pair += 2) {
      const x = abs(params[pair]!, baseX)
      const y = abs(params[pair + 1]!, baseY)

      pushPoint(x, y)

      if (pair === arity - 2) {
        cursorX = x
        cursorY = y
      }
    }

    if (normalized === "m") {
      command = isRelative ? "l" : "L"
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return null
  }

  return { height: maxY - minY, width: maxX - minX, x: minX, y: minY }
}

export function getBoxShapeBounds(shape: SVGElement): SvgShapeBounds | null {
  const width = getDotNumericAttribute(shape, "width")
  const height = getDotNumericAttribute(shape, "height")

  if (width === null || height === null) {
    return null
  }

  return {
    height,
    width,
    x: getDotNumericAttribute(shape, "x") ?? 0,
    y: getDotNumericAttribute(shape, "y") ?? 0,
  }
}

export function getCircleShapeBounds(shape: SVGElement): SvgShapeBounds | null {
  const cx = getDotNumericAttribute(shape, "cx")
  const cy = getDotNumericAttribute(shape, "cy")
  const r = getDotNumericAttribute(shape, "r")

  if (cx === null || cy === null || r === null) {
    return null
  }

  return { height: r * 2, width: r * 2, x: cx - r, y: cy - r }
}

export function getEllipseShapeBounds(shape: SVGElement): SvgShapeBounds | null {
  const cx = getDotNumericAttribute(shape, "cx")
  const cy = getDotNumericAttribute(shape, "cy")
  const rx = getDotNumericAttribute(shape, "rx")
  const ry = getDotNumericAttribute(shape, "ry")

  if (cx === null || cy === null || rx === null || ry === null) {
    return null
  }

  return { height: ry * 2, width: rx * 2, x: cx - rx, y: cy - ry }
}

export function unionShapeBounds(a: SvgShapeBounds, b: SvgShapeBounds): SvgShapeBounds {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    height: Math.max(a.y + a.height, b.y + b.height) - y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    x,
    y,
  }
}

export function getGroupShapeBounds(shape: SVGElement): SvgShapeBounds | null {
  let combined: SvgShapeBounds | null = null

  for (const child of Array.from(shape.children)) {
    if (!isSvgElementLike(child)) {
      continue
    }

    const childBounds = getSvgShapeBounds(child)

    if (childBounds) {
      combined = combined ? unionShapeBounds(combined, childBounds) : childBounds
    }
  }

  return combined
}

export const SVG_SHAPE_BOUNDS_READERS: Record<
  string,
  (shape: SVGElement) => SvgShapeBounds | null
> = {
  circle: getCircleShapeBounds,
  ellipse: getEllipseShapeBounds,
  g: getGroupShapeBounds,
  image: getBoxShapeBounds,
  path: (shape) => getPathDataBounds(shape.getAttribute("d")),
  rect: getBoxShapeBounds,
  svg: getBoxShapeBounds,
}

export function getSvgShapeBounds(shape: SVGElement): SvgShapeBounds | null {
  return SVG_SHAPE_BOUNDS_READERS[shape.tagName.toLowerCase()]?.(shape) ?? null
}
