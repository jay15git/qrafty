import type { ExportScale } from "@/features/workspace/export/export-scale"
import { resolveScaledExportDimensions } from "@/features/workspace/export/pipeline/bounds"

export function formatExportPixelDimensions(width: number, height: number) {
  return `${width} × ${height} px`
}

export function resolveActiveExportDimensions({
  artboardHeight,
  artboardWidth,
  exportScale,
}: {
  artboardHeight: number
  artboardWidth: number
  exportScale: ExportScale
}) {
  return resolveScaledExportDimensions(artboardWidth, artboardHeight, exportScale)
}

export function formatScaledExportSummary(
  exportScale: ExportScale,
  artboardWidth: number,
  artboardHeight: number,
) {
  const dimensions = resolveActiveExportDimensions({
    artboardHeight,
    artboardWidth,
    exportScale,
  })

  return `${exportScale}x — ${formatExportPixelDimensions(dimensions.width, dimensions.height)}`
}
