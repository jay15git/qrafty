"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type MobileSettingsTabDockContextValue = {
  active: boolean
  target: HTMLElement | null
}

const MobileSettingsTabDockContext =
  createContext<MobileSettingsTabDockContextValue | null>(null)

/**
 * Hosts a family's tab bars at the bottom of the drawer, below the options they
 * switch. Every tab bar mounted inside the family docks, stacked in mount order
 * (outermost navigation first); tab bars belonging to a pushed detail page stay
 * inline because their family view is no longer the active drawer view.
 */
export function MobileSettingsTabDockProvider({
  active,
  children,
}: {
  active: boolean
  children: ReactNode
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null)

  const value = useMemo<MobileSettingsTabDockContextValue>(
    () => ({ active, target }),
    [active, target],
  )

  return (
    <MobileSettingsTabDockContext.Provider value={value}>
      {children}
      <div
        ref={(node) => {
          setTarget(node)
        }}
        className="dn-mobile-tab-dock"
        data-slot="mobile-tab-dock"
      />
    </MobileSettingsTabDockContext.Provider>
  )
}

/** Returns the dock node when this tab bar should render into it. */
export function useMobileSettingsTabDock({ enabled }: { enabled: boolean }) {
  const dock = useContext(MobileSettingsTabDockContext)

  if (!enabled || !dock?.active) {
    return null
  }

  return dock.target
}
