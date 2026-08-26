import type { DesktopToolbarToolId } from "@/features/desktop-shell/model/desktop-toolbar-types"

export const DESKTOP_SETTINGS_SECTIONS = [
  "Content",
  "QR",
  "Motion",
  "Shape",
  "Background",
  "Elements",
] as const

export type DesktopSettingsSectionId = (typeof DESKTOP_SETTINGS_SECTIONS)[number]

export const SECTION_TO_TOOL: Partial<Record<DesktopSettingsSectionId, DesktopToolbarToolId>> = {
  Content: "content",
  QR: "pattern",
  Shape: "shape",
  Background: "background",
  Motion: "motion",
}

export const TOOL_TO_SECTION: Partial<Record<DesktopToolbarToolId, DesktopSettingsSectionId>> = {
  content: "Content",
  pattern: "QR",
  corners: "QR",
  logo: "QR",
  shape: "Shape",
  background: "Background",
  motion: "Motion",
}

export function sectionForTool(tool: DesktopToolbarToolId | null): DesktopSettingsSectionId {
  if (!tool) return "Content"
  return TOOL_TO_SECTION[tool] ?? "Content"
}

export const MOBILE_DRAWER_VIEW_FOR_SECTION: Record<DesktopSettingsSectionId, string> = {
  Content: "content",
  QR: "qr",
  Motion: "motion",
  Shape: "shape",
  Background: "background",
  Elements: "elements",
}
