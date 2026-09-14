#!/usr/bin/env node
/**
 * Measures the largest axis-aligned square inscribed in each QR background
 * shape and prints an updated QR_BACKGROUND_SHAPE_CONTENT_FRAMES table.
 *
 * Usage: node scripts/measure-qr-shape-frames.mjs
 */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

import SVGPathCommander from "svg-path-commander"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE = join(ROOT, "features/qr-code/styles/background-shapes.ts")

const SAMPLES_PER_EDGE = 16

function extractShapes(source) {
  const shapes = []
  const entryRe =
    /id:\s*"([^"]+)",\s*label:\s*"[^"]*",\s*viewBox:\s*\{\s*width:\s*([\d.]+),\s*height:\s*([\d.]+)\s*\},\s*path:\s*"((?:[^"\\]|\\.)*)"/g

  for (const match of source.matchAll(entryRe)) {
    shapes.push({
      id: match[1],
      viewBox: { width: Number(match[2]), height: Number(match[3]) },
      path: match[4],
    })
  }

  return shapes
}

function pointInPolygon(x, y, polygon) {
  let inside = false

  for (let index = 0, prev = polygon.length - 1; index < polygon.length; prev = index, index += 1) {
    const [xi, yi] = polygon[index]
    const [xj, yj] = polygon[prev]

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}

/**
 * Replicates the strict safe-area check in
 * features/qr-code/model/qr-module-metrics.test.ts: a denser polygon sampled
 * every min(viewBox)/300 units and 17 points along each frame edge.
 */
function strictPolygon(d, viewBox) {
  const sampleLength = Math.max(
    0.02,
    Math.min(viewBox.width, viewBox.height) / 300,
  )
  const commander = new SVGPathCommander(d)
  const total = commander.getTotalLength()
  const points = []
  let last = null

  for (let length = 0; length < total; length += sampleLength) {
    const point = commander.getPointAtLength(length)

    if (!last || point.x !== last[0] || point.y !== last[1]) {
      points.push([point.x, point.y])
      last = [point.x, point.y]
    }
  }

  const finalPoint = commander.getPointAtLength(total)

  if (last && (finalPoint.x !== last[0] || finalPoint.y !== last[1])) {
    points.push([finalPoint.x, finalPoint.y])
  }

  return points
}

function strictFrameInside(x, y, size, polygon) {
  for (let index = 0; index <= SAMPLES_PER_EDGE; index += 1) {
    const ratio = index / SAMPLES_PER_EDGE
    const px = x + size * ratio
    const py = y + size * ratio

    if (
      !pointInPolygon(px, y, polygon) ||
      !pointInPolygon(px, y + size, polygon) ||
      !pointInPolygon(x, py, polygon) ||
      !pointInPolygon(x + size, py, polygon)
    ) {
      return false
    }
  }

  return true
}

/** Validates the post-safety-inset frame, matching the vitest check exactly. */
function tableEntryInside(x, y, size, polygon) {
  const inset = Math.min(0.5, size * 0.0025)

  return strictFrameInside(x + inset, y + inset, size - inset * 2, polygon)
}

function strictMaxSquareAt(cx, cy, polygon, maxHalf) {
  let low = 0
  let high = maxHalf

  for (let index = 0; index < 18; index += 1) {
    const mid = (low + high) / 2

    if (
      tableEntryInside(cx - mid, cy - mid, mid * 2, polygon)
    ) {
      low = mid
    } else {
      high = mid
    }
  }

  return low
}

function polygonCentroid(polygon) {
  let area = 0
  let cx = 0
  let cy = 0

  for (let index = 0, prev = polygon.length - 1; index < polygon.length; prev = index, index += 1) {
    const [xi, yi] = polygon[index]
    const [xj, yj] = polygon[prev]
    const cross = xj * yi - xi * yj

    area += cross
    cx += (xj + xi) * cross
    cy += (yj + yi) * cross
  }

  area /= 2

  if (Math.abs(area) < 1e-9) {
    return null
  }

  return { cx: cx / (6 * area), cy: cy / (6 * area) }
}

function measureFrame(shape) {
  const verifierPolygon = strictPolygon(shape.path, shape.viewBox)
  const { width, height } = shape.viewBox
  const maxHalf = Math.min(width, height) / 2
  const safety = Math.max(0.02, Math.min(width, height) / 300)
  const centroid = polygonCentroid(verifierPolygon)
  const candidates = []

  if (centroid && pointInPolygon(centroid.cx, centroid.cy, verifierPolygon)) {
    candidates.push(centroid)
  }

  candidates.push({ cx: width / 2, cy: height / 2 })

  for (const candidate of candidates) {
    const half = strictMaxSquareAt(
      candidate.cx,
      candidate.cy,
      verifierPolygon,
      maxHalf,
    ) - safety

    if (half > 0) {
      return {
        x: candidate.cx - half,
        y: candidate.cy - half,
        size: half * 2,
      }
    }
  }

  return { x: width / 2, y: height / 2, size: 0 }
}

const source = readFileSync(SOURCE, "utf8")
const shapes = extractShapes(source)
const oldFrames = new Map()

const frameRe = /^\s*"?([a-z-]+)"?:\s*\[([\d.]+),\s*([\d.]+),\s*([\d.]+)\]/gm
const tableStart = source.indexOf("QR_BACKGROUND_SHAPE_CONTENT_FRAMES")

for (const match of source.slice(tableStart).matchAll(frameRe)) {
  oldFrames.set(match[1], [Number(match[2]), Number(match[3]), Number(match[4])])
}

console.log(`measured ${shapes.length} shapes\n`)
console.log("id                   old[x,y,size]            new[x,y,size]            delta")

const results = []

for (const shape of shapes) {
  const old = oldFrames.get(shape.id) ?? [NaN, NaN, NaN]
  const frame = measureFrame(shape)
  const delta = frame.size - old[2]

  results.push({ id: shape.id, frame })

  console.log(
    `${shape.id.padEnd(20)} [${old.map((v) => v.toFixed(2)).join(", ")}]`.padEnd(52) +
      `[${frame.x.toFixed(2)}, ${frame.y.toFixed(2)}, ${frame.size.toFixed(2)}]`.padEnd(26) +
      `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`,
  )
}

console.log("\n--- table ---\n")

for (const { id, frame } of results) {
  console.log(
    `  ${JSON.stringify(id)}: [${frame.x.toFixed(2)}, ${frame.y.toFixed(2)}, ${frame.size.toFixed(2)}],`,
  )
}
