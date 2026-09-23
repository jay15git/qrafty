import type { QrDotMatrixAnimationOptions } from "@/features/qr/model/state"
import {
  DEFAULT_DOT_MATRIX_TILE_SIZE,
  type DotMatrixMetrics,
  type DotMatrixCoordinates,
  type DotMatrixModule,
  type DotMatrixCell,
} from "./dot-matrix-model"

export type DotMatrixPatternCellContext = {
  row: number
  col: number
  center: number
  distance: number
  manhattan: number
  angle: number
  onEdge: boolean
  diamondRadius: number
}

export function getDotMatrixRegionCoordinate(value: number, matrixSize: number) {
  return Math.min(
    matrixSize - 1,
    Math.max(0, Math.floor(clampDotMatrixUnit(value) * matrixSize)),
  )
}

export function getDotMatrixCell(module: DotMatrixModule): DotMatrixCell {
  return {
    col: module.regionCol,
    index: module.regionIndex,
    matrixSize: module.matrixSize,
    row: module.regionRow,
  }
}

export function rowMajorIndex(row: number, col: number, matrixSize = DEFAULT_DOT_MATRIX_TILE_SIZE) {
  return row * matrixSize + col
}

export function indexToCoord(index: number, matrixSize = DEFAULT_DOT_MATRIX_TILE_SIZE): DotMatrixCell {
  return {
    col: index % matrixSize,
    index,
    matrixSize,
    row: Math.floor(index / matrixSize),
  }
}

export function findDotMatrixCellIndex(
  path: ReadonlyArray<readonly [number, number]>,
  col: number,
  row: number,
) {
  return path.findIndex(([pathCol, pathRow]) => pathCol === col && pathRow === row)
}

export function getDotMatrixCenter(matrixSize: number) {
  return (matrixSize - 1) / 2
}

export function radialDistanceFromCenter(cell: DotMatrixCell) {
  const center = getDotMatrixCenter(cell.matrixSize)
  return Math.hypot(cell.row - center, cell.col - center)
}

export function getShapeExpansionProgress(
  cell: DotMatrixCell,
  metricAt: (row: number, col: number, matrixSize: number) => number,
  maxMetricAt: (matrixSize: number) => number,
) {
  const maxMetric = maxMetricAt(cell.matrixSize)
  return maxMetric > 0 ? metricAt(cell.row, cell.col, cell.matrixSize) / maxMetric : 0
}

export function chevronDistance(cell: DotMatrixCell) {
  const center = getDotMatrixCenter(cell.matrixSize)
  return cell.matrixSize - 1 - cell.row + Math.abs(cell.col - center)
}

export function trBlPathNormFromIndex(cell: DotMatrixCell) {
  const { col, matrixSize, row } = cell

  return (row + (matrixSize - 1 - col)) / ((matrixSize - 1) * 2)
}

export const DOT_MATRIX_PATTERN_PREDICATES: Record<
  QrDotMatrixAnimationOptions["pattern"],
  (cell: DotMatrixPatternCellContext) => boolean
> = {
  full: () => true,
  diamond: (c) => c.manhattan <= c.diamondRadius,
  outline: (c) => c.onEdge,
  cross: (c) => Math.abs(c.row - c.center) < 0.5 || Math.abs(c.col - c.center) < 0.5,
  rings: (c) => c.distance >= 1 || c.onEdge,
  rose: (c) => Math.abs(Math.sin(3 * c.angle)) > 0.5 && c.distance >= 1,
}

export function getDotMatrixPatternIndexes(pattern: QrDotMatrixAnimationOptions["pattern"], matrixSize: number) {
  const indexes: number[] = []
  const center = getDotMatrixCenter(matrixSize)
  const diamondRadius = Math.max(2, Math.floor(matrixSize / 2))
  const predicate = DOT_MATRIX_PATTERN_PREDICATES[pattern]

  for (let row = 0; row < matrixSize; row += 1) {
    for (let col = 0; col < matrixSize; col += 1) {
      const active = predicate({
        row,
        col,
        center,
        distance: Math.hypot(row - center, col - center),
        manhattan: Math.abs(row - center) + Math.abs(col - center),
        angle: Math.atan2(row - center, col - center),
        onEdge: row === 0 || col === 0 || row === matrixSize - 1 || col === matrixSize - 1,
        diamondRadius,
      })

      if (active) {
        indexes.push(rowMajorIndex(row, col, matrixSize))
      }
    }
  }

  return indexes
}

export function stableDotMatrixStyleVarSignature(styleVars: Record<string, number | string>) {
  return Object.keys(styleVars)
    .sort()
    .map((key) => `${key}=${styleVars[key]}`)
    .join(";")
}

export function getDotMatrixPerimeterIndex(
  coordinates: DotMatrixCoordinates,
  metrics: DotMatrixMetrics,
) {
  const { col, row } = coordinates

  if (row === 0) {
    return col
  }

  if (col === metrics.maxCol) {
    return metrics.maxCol + row
  }

  if (row === metrics.maxRow) {
    return metrics.maxCol + metrics.maxRow + (metrics.maxCol - col)
  }

  if (col === 0) {
    return metrics.maxCol * 2 + metrics.maxRow + (metrics.maxRow - row)
  }

  return -1
}

export function getDotMatrixRing(coordinates: DotMatrixCoordinates, metrics: DotMatrixMetrics) {
  return Math.min(
    coordinates.row,
    coordinates.col,
    metrics.maxRow - coordinates.row,
    metrics.maxCol - coordinates.col,
  )
}

export function getDotMatrixHash01(index: number, salt = 1) {
  const hash =
    (Math.imul(index + 1, 2654435761) ^
      Math.imul(index + salt + 7, 2246822519) ^
      Math.imul(salt + 3, 3266489917)) >>>
    0

  return (hash % 1000) / 1000
}

export function clampDotMatrixUnit(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(0.999, value))
}
