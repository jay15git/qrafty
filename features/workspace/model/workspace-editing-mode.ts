import type { DesktopToolbarToolId } from "@/features/desktop-shell/components/FloatingToolbar"

export type WorkspaceEditingMode = "free" | "template"

export const DEFAULT_WORKSPACE_EDITING_MODE: WorkspaceEditingMode = "free"
export const WORKSPACE_EDITING_MODE_STORAGE_KEY = "desktop-workspace-editing-mode"

const TEMPLATE_MODE_TOOL_IDS: DesktopToolbarToolId[] = [
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
]

const COMPOSITION_TOOL_IDS: DesktopToolbarToolId[] = ["text", "image", "layers"]

function isWorkspaceEditingMode(value: unknown): value is WorkspaceEditingMode {
  return value === "free" || value === "template"
}

export function readWorkspaceEditingMode(): WorkspaceEditingMode {
  if (typeof window === "undefined") {
    return DEFAULT_WORKSPACE_EDITING_MODE
  }

  const stored = window.localStorage.getItem(WORKSPACE_EDITING_MODE_STORAGE_KEY)
  return isWorkspaceEditingMode(stored) ? stored : DEFAULT_WORKSPACE_EDITING_MODE
}

export function writeWorkspaceEditingMode(mode: WorkspaceEditingMode): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(WORKSPACE_EDITING_MODE_STORAGE_KEY, mode)
}

function isFreeEditingMode(mode: WorkspaceEditingMode): boolean {
  return mode === "free"
}

export function getVisibleToolbarToolIds(mode: WorkspaceEditingMode): DesktopToolbarToolId[] {
  if (mode === "free") {
    return [...TEMPLATE_MODE_TOOL_IDS, ...COMPOSITION_TOOL_IDS]
  }

  return TEMPLATE_MODE_TOOL_IDS
}

function isToolbarToolVisible(
  toolId: DesktopToolbarToolId,
  mode: WorkspaceEditingMode,
): boolean {
  return getVisibleToolbarToolIds(mode).includes(toolId)
}
