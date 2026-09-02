"use client"

import { GlimmProvider } from "glimm/next"
import type { ReactNode } from "react"

export function GlimmRootProvider({ children }: { children: ReactNode }) {
  return <GlimmProvider>{children}</GlimmProvider>
}
