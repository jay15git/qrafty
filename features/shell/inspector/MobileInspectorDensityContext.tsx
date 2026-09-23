"use client"

import { createContext, useContext } from "react"

export const MobileInspectorDensityContext = createContext(false)

export function useMobileInspectorDensity() {
  return useContext(MobileInspectorDensityContext)
}
