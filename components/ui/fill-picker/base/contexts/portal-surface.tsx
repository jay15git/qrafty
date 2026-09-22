"use client"

import * as React from "react"

export type FillPickerPortalSurface = {
  /** Theme + design tokens for any fill-picker UI portaled to `document.body`. */
  portaledSurfaceClassName?: string
  portaledSurfaceDataTheme?: "light" | "dark"
  /** Desktop accordion / settings popover — borderless controls + app Select. */
  desktopAccordion?: boolean
}

const FillPickerPortalSurfaceContext =
  React.createContext<FillPickerPortalSurface>({})

export function useFillPickerPortalSurface() {
  return React.useContext(FillPickerPortalSurfaceContext)
}

export function FillPickerPortalSurfaceProvider({
  value,
  children,
}: {
  value: FillPickerPortalSurface
  children: React.ReactNode
}) {
  return (
    <FillPickerPortalSurfaceContext.Provider value={value}>
      {children}
    </FillPickerPortalSurfaceContext.Provider>
  )
}
