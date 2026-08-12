import type { Metadata } from "next"

import { DesktopNewShell } from "@/features/desktopnew/DesktopNewSettingsPanel"

export const metadata: Metadata = {
  title: "Desktop New — Settings",
  description: "Settings panel preview with shadcn components.",
}

export default function DesktopNewPage() {
  return (
    <main className="min-h-dvh">
      <DesktopNewShell />
    </main>
  )
}
