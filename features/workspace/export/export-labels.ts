import { resolveVideoOutputDimensions } from "@/features/workspace/export/pipeline/bounds"

export function formatExportPixelDimensions(width: number, height: number) {
  return `${width} × ${height} px`
}

export function resolveActiveExportDimensions({
  artboardHeight,
  artboardWidth,
  photoLongEdge,
}: {
  artboardHeight: number
  artboardWidth: number
  photoLongEdge: number
}) {
  return resolveVideoOutputDimensions(artboardWidth, artboardHeight, photoLongEdge)
}

export function formatScaledExportSummary(
  photoLongEdge: number,
  artboardWidth: number,
  artboardHeight: number,
) {
  const dimensions = resolveActiveExportDimensions({
    artboardHeight,
    artboardWidth,
    photoLongEdge,
  })

  return `${photoLongEdge}p — ${formatExportPixelDimensions(dimensions.width, dimensions.height)}`
}
