"use client"

import { useContext, type ReactNode } from "react"

import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { cn } from "@/lib/utils"

export function SpellUiScope({ children }: { children: ReactNode }) {
  const theme = useContext(DesktopnewThemeContext)

  return <div className={cn("spell-ui-scope", theme === "dark" && "dark")}>{children}</div>
}
