import type { Metadata } from "next"
import localFont from "next/font/local"
import { cookies } from "next/headers"
import { Suspense } from "react"

import { DesktopPageClient } from "@/features/desktop-shell/components/DesktopPageClient"
import {
  DESKTOP_THEME_COOKIE,
  parseDesktopTheme,
} from "@/features/desktop-shell/model/desktop-theme"
import { cn } from "@/lib/utils"

const satoshi = localFont({
  src: "../../public/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Variable.woff2",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
  weight: "300 900",
})

export const metadata: Metadata = {
  title: "Design QR",
  description: "A desktop QR workspace with the full drafting canvas and floating toolbar.",
}

export default async function DesktopPage() {
  const cookieStore = await cookies()
  const initialTheme = parseDesktopTheme(cookieStore.get(DESKTOP_THEME_COOKIE)?.value)

  return (
    <main
      data-slot="desktop-page"
      className={cn(
        satoshi.className,
        "h-dvh min-h-0 overflow-hidden",
        initialTheme === "light" ? "bg-[#f0f1f2] text-neutral-950" : "bg-[#07080a] text-white",
      )}
    >
      <Suspense fallback={null}>
        <DesktopPageClient fontClassName={satoshi.className} initialTheme={initialTheme} />
      </Suspense>
    </main>
  )
}
