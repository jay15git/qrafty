import type { ToolbarToolId } from "@/features/shell/components/WorkspaceChrome";

const TOOLBAR_TOOL_IDS: ToolbarToolId[] = [
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
];

export function getVisibleToolbarToolIds(): ToolbarToolId[] {
  return TOOLBAR_TOOL_IDS;
}
