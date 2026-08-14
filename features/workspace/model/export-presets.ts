import type { QrFileExtension } from "@/features/qr-code/model/types"
import { getSizeTemplate } from "@/features/workspace/model/size-templates"

export type ExportPresetScale = 1 | 2

export type ExportPreset = {
  format: QrFileExtension
  height: number
  id: string
  label: string
  scale: ExportPresetScale
  sizePresetId?: string
  width: number
}

export const EXPORT_PRESETS: readonly ExportPreset[] = [
  { id: "og-1x", label: "Open Graph", width: 1200, height: 630, format: "png", scale: 1, sizePresetId: "web-open-graph" },
  { id: "og-2x", label: "Open Graph 2x", width: 2400, height: 1260, format: "png", scale: 2, sizePresetId: "web-open-graph" },
  { id: "x-card-1x", label: "X card", width: 1200, height: 628, format: "png", scale: 1, sizePresetId: "web-x-card" },
  { id: "square-1080", label: "Square 1080", width: 1080, height: 1080, format: "png", scale: 1, sizePresetId: "ratio-1-1" },
  { id: "story-1080", label: "Story 9:16", width: 1080, height: 1920, format: "png", scale: 1, sizePresetId: "ratio-9-16" },
  { id: "landscape-1920", label: "Landscape 16:9", width: 1920, height: 1080, format: "png", scale: 1, sizePresetId: "ratio-16-9" },
  { id: "portrait-1080", label: "Portrait 4:5", width: 1080, height: 1350, format: "png", scale: 1, sizePresetId: "ratio-4-5" },
  { id: "business-card", label: "Business card", width: 1050, height: 600, format: "png", scale: 1, sizePresetId: "qr-business-card" },
  { id: "a4-print", label: "A4 print", width: 2480, height: 3508, format: "png", scale: 1, sizePresetId: "print-a4" },
] as const

export type ExportPresetId = (typeof EXPORT_PRESETS)[number]["id"]

export function getExportPreset(id: string): ExportPreset | undefined {
  return EXPORT_PRESETS.find((preset) => preset.id === id)
}

function getExportPresetForSizeTemplate(sizePresetId: string): ExportPreset | undefined {
  return EXPORT_PRESETS.find((preset) => preset.sizePresetId === sizePresetId)
}

export function resolveExportDimensions(preset: ExportPreset): { height: number; width: number } {
  const template = preset.sizePresetId ? getSizeTemplate(preset.sizePresetId) : undefined
  if (template) {
    return {
      width: Math.round(template.width * (preset.scale / 1)),
      height: Math.round(template.height * (preset.scale / 1)),
    }
  }

  return { width: preset.width, height: preset.height }
}

export function formatExportPresetLabel(preset: ExportPreset): string {
  const { width, height } = resolveExportDimensions(preset)
  return `${preset.scale}x ${preset.format.toUpperCase()} — ${preset.label} (${width} × ${height})`
}
