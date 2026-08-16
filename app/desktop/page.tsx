import type { Metadata } from "next"
import localFont from "next/font/local"
import { Suspense } from "react"

import { DesktopPageClient } from "@/features/desktop-shell/components/DesktopPageClient"

const satoshi = localFont({
  src: "../../public/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Variable.woff2",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
  weight: "300 900",
})

export const metadata: Metadata = {
  title: "Desktop Workspace",
  description: "A desktop QR workspace with the full drafting canvas and floating toolbar.",
}

export default function DesktopPage() {
  return (
    <main
      data-slot="desktop-page"
      className={`${satoshi.className} min-h-dvh overflow-hidden bg-[#07080a] text-white`}
    >
      <Suspense fallback={null}>
        <DesktopPageClient fontClassName={satoshi.className} />
      </Suspense>
    </main>
  )
}
