import type { Metadata } from "next"

import { DesktopLegacySettingsShell } from "@/features/desktopnew/DesktopLegacySettingsShell"

export const metadata: Metadata = {
  title: "Desktop New — Legacy Settings Reference",
  description: "Reference copy of the original /desktop settings panel.",
}

export default function DesktopNewPage() {
  return (
    <main className="min-h-dvh">
      <DesktopLegacySettingsShell />
    </main>
  )
}
