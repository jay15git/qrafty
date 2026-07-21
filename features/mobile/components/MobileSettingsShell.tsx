"use client"

import { ExpandableTab } from "@/components/atomixui/expandable-tab"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  DESKTOP_TOOLBAR_TOOLS,
  DesktopFloatingInspector,
  DesktopThemeStyles,
  useDesktopToolbarInspectorModel,
  type DesktopToolbarToolId,
} from "@/features/desktop-shell/components/FloatingToolbar"

const MOBILE_TOOL_IDS = new Set<DesktopToolbarToolId>([
  "content",
  "pattern",
  "corners",
  "logo",
  "shape",
  "motion",
  "layers",
])

const MOBILE_PANEL_WIDTH = 380

export function MobileSettingsShell() {
  const model = useDesktopToolbarInspectorModel({ theme: "light" })
  const mobileTools = DESKTOP_TOOLBAR_TOOLS.filter((tool) => MOBILE_TOOL_IDS.has(tool.id))

  return (
    <TooltipProvider delayDuration={150}>
      <div
        data-desktop-theme={model.actualDesktopTheme}
        data-slot="desktop-floating-toolbar-root"
        className="text-white"
      >
        <DesktopThemeStyles />
        <ExpandableTab
          defaultActiveId="content"
          panelWidth={MOBILE_PANEL_WIDTH}
          tabs={mobileTools.map((tool) => ({
            id: tool.id,
            label: tool.title,
            icon: tool.renderIcon(),
          }))}
          renderPanel={(activeTool) => (
            <DesktopFloatingInspector
              activeTool={activeTool as DesktopToolbarToolId}
              className="h-[min(24rem,50dvh)]"
              model={model}
            />
          )}
        />
      </div>
    </TooltipProvider>
  )
}
