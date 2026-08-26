export const EXPORT_SCALE_OPTIONS = [1, 2, 3, 4] as const

export type ExportScale = (typeof EXPORT_SCALE_OPTIONS)[number]

export const DEFAULT_EXPORT_SCALE: ExportScale = 2

export function formatExportScaleLabel(scale: ExportScale | number) {
  return `${scale}x`
}

export function clampExportScale(value: number): ExportScale {
  const rounded = Math.round(value)

  if (rounded <= 1) {
    return 1
  }

  if (rounded >= 4) {
    return 4
  }

  return rounded as ExportScale
}
