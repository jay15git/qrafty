import type { DesktopToolbarToolId } from "@/features/shell/components/FloatingToolbar"

const TOOLBAR_TOOL_IDS: DesktopToolbarToolId[] = [
  "layout",
  "content",
  "pattern",
  "corners",
  "logo",
  "shape",
  "background",
  "motion",
  "effects",
  "export",
  "text",
  "image",
  "layers",
]

export function getVisibleToolbarToolIds(): DesktopToolbarToolId[] {
  return TOOLBAR_TOOL_IDS
}
