import type { DesktopToolbarToolId } from "@/features/desktop-shell/components/FloatingToolbar"

export type WorkspaceEditingMode = "free" | "template"

export const WORKSPACE_EDITING_MODE_STORAGE_KEY = "desktop-workspace-editing-mode"

export const TEMPLATE_MODE_TOOL_IDS: DesktopToolbarToolId[] = [
  "templates",
  "layout",
  "content",
  "pattern",
  "corners",
  "logo",
  "shape",
  "card-pattern",
  "decorations",
  "effects",
  "export",
]

const COMPOSITION_TOOL_IDS: DesktopToolbarToolId[] = ["text", "image", "layers"]

export function isWorkspaceEditingMode(value: unknown): value is WorkspaceEditingMode {
  return value === "free" || value === "template"
}

export function readWorkspaceEditingMode(): WorkspaceEditingMode {
  if (typeof window === "undefined") {
    return "free"
  }

  const stored = window.localStorage.getItem(WORKSPACE_EDITING_MODE_STORAGE_KEY)
  return isWorkspaceEditingMode(stored) ? stored : "free"
}

export function writeWorkspaceEditingMode(mode: WorkspaceEditingMode): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(WORKSPACE_EDITING_MODE_STORAGE_KEY, mode)
}

export function isFreeEditingMode(mode: WorkspaceEditingMode): boolean {
  return mode === "free"
}

export function getVisibleToolbarToolIds(mode: WorkspaceEditingMode): DesktopToolbarToolId[] {
  if (mode === "free") {
    return [...TEMPLATE_MODE_TOOL_IDS, ...COMPOSITION_TOOL_IDS]
  }

  return TEMPLATE_MODE_TOOL_IDS
}

export function isToolbarToolVisible(
  toolId: DesktopToolbarToolId,
  mode: WorkspaceEditingMode,
): boolean {
  return getVisibleToolbarToolIds(mode).includes(toolId)
}
