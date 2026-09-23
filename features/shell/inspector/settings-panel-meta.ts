import type { DesktopToolbarToolId } from "@/features/shell/model/desktop-toolbar-types"

export const DESKTOP_SETTINGS_SECTIONS = [
  "Content",
  "QR",
  "Color",
  "Motion",
  "Shape",
  "Background",
  "Elements",
] as const

export type DesktopSettingsSectionId = (typeof DESKTOP_SETTINGS_SECTIONS)[number]

const DESKTOP_SETTINGS_SECTION_LABELS: Record<DesktopSettingsSectionId, string> = {
  Content: "Content",
  QR: "Style",
  Color: "Color",
  Motion: "Motion",
  Shape: "Shape",
  Background: "Background",
  Elements: "Layers",
}

export function getDesktopSettingsSectionLabel(section: DesktopSettingsSectionId): string {
  return DESKTOP_SETTINGS_SECTION_LABELS[section]
}

export const SECTION_TO_TOOL: Partial<Record<DesktopSettingsSectionId, DesktopToolbarToolId>> = {
  Content: "content",
  QR: "pattern",
  Color: "pattern",
  Shape: "shape",
  Background: "background",
  Motion: "motion",
}
