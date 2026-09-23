"use client"

import { createContext, useContext } from "react"
import type { RectReadOnly } from "react-use-measure"

export type ViewComponent = React.ComponentType<Record<string, unknown>>

export interface ViewsRegistry {
  [viewName: string]: ViewComponent
}

/** Ref callback returned by `useMeasure` — attach to the measured element. */
export type FamilyDrawerMeasureRef = (
  element: HTMLElement | SVGElement | null,
) => void

export interface FamilyDrawerContextValue {
  isOpen: boolean
  view: string
  setView: (view: string) => void
  opacityDuration: number
  elementRef: FamilyDrawerMeasureRef
  bounds: RectReadOnly
  views: ViewsRegistry | undefined
}

export const FamilyDrawerContext = createContext<FamilyDrawerContextValue | undefined>(undefined)

export function useFamilyDrawer() {
  const context = useContext(FamilyDrawerContext)
  if (!context) {
    throw new Error("FamilyDrawer components must be used within FamilyDrawerRoot")
  }
  return context
}
