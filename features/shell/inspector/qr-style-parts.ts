import type { DesktopInspectorModel } from "@/features/shell/hooks/useDesktopToolbarInspectorModel"
import type { StylePreviewKind } from "@/features/qr/components/StylePreview"
import type {
  QraftyCornerDotStyle,
  QraftyDataModulesStyle,
} from "@/features/qr/model/state"
import type { QrFinderPatternOuterStyle } from "@/features/qr/model/types"
import {
  CORNER_DOT_STYLE_OPTIONS,
  CORNER_SQUARE_STYLE_OPTIONS,
  DOT_STYLE_OPTIONS,
} from "@/features/qr/styles/style-options"

/** Style parts that carry a style catalogue, mirroring the `Part` control. */
const QR_STYLE_PARTS = ["Module", "Eye", "Frame"] as const

export type QrStylePartId = (typeof QR_STYLE_PARTS)[number]

export function isQrStylePartId(value: string): value is QrStylePartId {
  return (QR_STYLE_PARTS as readonly string[]).includes(value)
}

type QrStylePartDefinition = {
  label: string
  previewKind: StylePreviewKind
  options: ReadonlyArray<{ label: string; value: string }>
  readSelected: (model: DesktopInspectorModel) => string
  applySelected: (model: DesktopInspectorModel, value: string) => void
}

/**
 * Single source of truth for the Module/Eye/Frame catalogues, so the desktop
 * Style section and the mobile rail cannot drift apart.
 */
export const QR_STYLE_PART_DEFINITIONS: Record<QrStylePartId, QrStylePartDefinition> = {
  Module: {
    label: "Module",
    previewKind: "dots",
    options: DOT_STYLE_OPTIONS,
    readSelected: (model) => model.actualPatternSettings.qrDotType,
    applySelected: (model, value) =>
      model.onPatternSettingsChange({ qrDotType: value as QraftyDataModulesStyle }),
  },
  Eye: {
    label: "Eye",
    previewKind: "corner-dot",
    options: CORNER_DOT_STYLE_OPTIONS,
    readSelected: (model) => model.actualCornersSettings.cornerDotType,
    applySelected: (model, value) =>
      model.onCornersSettingsChange({ cornerDotType: value as QraftyCornerDotStyle }),
  },
  Frame: {
    label: "Frame",
    previewKind: "corner-square",
    options: CORNER_SQUARE_STYLE_OPTIONS,
    readSelected: (model) => model.actualCornersSettings.cornerSquareType,
    applySelected: (model, value) =>
      model.onCornersSettingsChange({ cornerSquareType: value as QrFinderPatternOuterStyle }),
  },
}
