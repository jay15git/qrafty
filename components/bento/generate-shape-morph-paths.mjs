import { writeFileSync } from "node:fs"

import SVGPathCommander from "svg-path-commander"

import { QR_BACKGROUND_SHAPES } from "../../features/qr-code/styles/background-shapes.ts"

const BENTO_MORPH_SHAPE_IDS = [
  "heart",
  "spark",
  "atom",
  "flower",
  "ghost",
  "hexagon",
  "butterfly",
  "diamond",
]

function normalizeShapePath(path) {
  const normalized = SVGPathCommander.normalizePath(path)
  const bbox = SVGPathCommander.getPathBBox(normalized)
  const inner = 84
  const scale = inner / Math.max(bbox.width, bbox.height, 1)
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2
  const centered = SVGPathCommander.transformPath(normalized, {
    translate: [-centerX, -centerY, 0],
  })
  const scaled = SVGPathCommander.transformPath(centered, {
    scale: [scale, scale, 1],
  })
  return new SVGPathCommander(
    SVGPathCommander.transformPath(scaled, { translate: [50, 50, 0] }),
  ).toString()
}

function equalizeMorphPaths(paths) {
  let master = paths[0]
  for (let index = 1; index < paths.length; index += 1) {
    master = new SVGPathCommander(
      SVGPathCommander.equalizePaths(master, paths[index])[0],
    ).toString()
  }
  return paths.map(
    (path) =>
      new SVGPathCommander(SVGPathCommander.equalizePaths(master, path)[1]).toString(),
  )
}

const normalized = BENTO_MORPH_SHAPE_IDS.map((shapeId) => {
  const shape = QR_BACKGROUND_SHAPES.find((entry) => entry.id === shapeId)
  if (!shape) throw new Error(`Missing background shape: ${shapeId}`)
  return normalizeShapePath(shape.path)
})

const paths = equalizeMorphPaths(normalized)

writeFileSync(
  new URL("./shape-morph-paths.ts", import.meta.url),
  `// Precomputed QR catalogue morph paths for the shapes bento card.

export const BENTO_MORPH_SHAPE_IDS = ${JSON.stringify(BENTO_MORPH_SHAPE_IDS)} as const

export const BENTO_SHAPE_MORPH_PATHS = ${JSON.stringify(paths, null, 2)} as const
`,
)

console.log(`Wrote ${paths.length} morph paths`)
