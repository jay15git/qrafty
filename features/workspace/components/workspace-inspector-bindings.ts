import type { ReactNode } from "react"

import type { DesktopToolbarController } from "@/features/desktop-shell/components/FloatingToolbar"

export type WorkspaceInspectorBindings = {
  controller: DesktopToolbarController
  renderPanelContent: (toolId: string, tabId: string) => ReactNode
}
