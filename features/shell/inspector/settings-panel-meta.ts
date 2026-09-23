import type { ToolbarToolId } from "@/features/shell/model/toolbar-types"

export const SETTINGS_SECTIONS = [
  "Content",
  "QR",
  "Color",
  "Motion",
  "Shape",
  "Background",
  "Elements",
] as const

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]

const SETTINGS_SECTION_LABELS: Record<SettingsSectionId, string> = {
  Content: "Content",
  QR: "Style",
  Color: "Color",
  Motion: "Motion",
  Shape: "Shape",
  Background: "Background",
  Elements: "Layers",
}

export function getSettingsSectionLabel(section: SettingsSectionId): string {
  return SETTINGS_SECTION_LABELS[section]
}

export const SECTION_TO_TOOL: Partial<Record<SettingsSectionId, ToolbarToolId>> = {
  Content: "content",
  QR: "pattern",
  Color: "pattern",
  Shape: "shape",
  Background: "background",
  Motion: "motion",
}
