"use client"

import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DesktopFloatingInspector,
  useDesktopToolbarInspectorModel,
} from "@/features/desktop-shell/components/FloatingToolbar"
import { ShapeProvider } from "@/lib/shape-context"

export function DesktopLegacySettingsShell() {
  const { resolvedTheme, setTheme } = useTheme()
  const theme = resolvedTheme === "dark" ? "dark" : "light"
  const model = useDesktopToolbarInspectorModel({
    theme,
    onThemeChange: (nextTheme) => setTheme(nextTheme),
  })

  return (
    <ShapeProvider defaultShape="rounded">
      <div className="min-h-dvh bg-background text-foreground">
        <Button
          className="fixed right-4 top-4 h-8 px-3 text-xs"
          type="button"
          variant="outline"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "Light" : "Dark"}
        </Button>
        <div className="mx-auto flex min-h-dvh max-w-[380px] flex-col p-4 pt-16">
          <p className="mb-3 text-xs text-muted-foreground">
            Legacy `/desktop` settings panel (reference).
          </p>
          <div className="h-[min(72dvh,40rem)] min-h-0 overflow-hidden rounded-xl border border-border/80 bg-card">
            <DesktopFloatingInspector activeTool={model.actualActiveTool} model={model} />
          </div>
        </div>
      </div>
    </ShapeProvider>
  )
}
