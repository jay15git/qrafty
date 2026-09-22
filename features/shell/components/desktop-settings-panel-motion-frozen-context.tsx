"use client"

import { createContext, useContext, type ReactNode } from "react"

const DesktopSettingsPanelMotionFrozenContext = createContext(false)

export function DesktopSettingsPanelMotionFrozenProvider({
  children,
  frozen,
}: {
  children: ReactNode
  frozen: boolean
}) {
  return (
    <DesktopSettingsPanelMotionFrozenContext.Provider value={frozen}>
      {children}
    </DesktopSettingsPanelMotionFrozenContext.Provider>
  )
}

export function useDesktopSettingsPanelMotionFrozen() {
  return useContext(DesktopSettingsPanelMotionFrozenContext)
}
