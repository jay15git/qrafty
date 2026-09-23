"use client"

import { createContext, useContext, type ReactNode } from "react"

const SettingsPanelMotionFrozenContext = createContext(false)

export function SettingsPanelMotionFrozenProvider({
  children,
  frozen,
}: {
  children: ReactNode
  frozen: boolean
}) {
  return (
    <SettingsPanelMotionFrozenContext.Provider value={frozen}>
      {children}
    </SettingsPanelMotionFrozenContext.Provider>
  )
}

export function useSettingsPanelMotionFrozen() {
  return useContext(SettingsPanelMotionFrozenContext)
}
