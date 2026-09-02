"use client"

import { bind } from "cuelume"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  applyDesktopSoundPreferences,
  readDesktopSoundsEnabled,
  setDesktopSoundsEnabled,
} from "@/features/desktop-shell/audio/desktop-cuelume"

type DesktopCuelumeContextValue = {
  soundsEnabled: boolean
  setSoundsEnabled: (enabled: boolean) => void
  toggleSoundsEnabled: () => void
}

const DesktopCuelumeContext = createContext<DesktopCuelumeContextValue | null>(null)

export function DesktopCuelumeProvider({ children }: { children: ReactNode }) {
  const [soundsEnabled, setSoundsEnabledState] = useState(true)

  useEffect(() => {
    bind()
    applyDesktopSoundPreferences()
    setSoundsEnabledState(readDesktopSoundsEnabled())

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleMotionChange = () => {
      applyDesktopSoundPreferences()
    }

    motionQuery.addEventListener("change", handleMotionChange)

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange)
    }
  }, [])

  const setSoundsEnabled = useCallback((enabled: boolean) => {
    setSoundsEnabledState(enabled)
    setDesktopSoundsEnabled(enabled)
  }, [])

  const toggleSoundsEnabled = useCallback(() => {
    setSoundsEnabled(!soundsEnabled)
  }, [setSoundsEnabled, soundsEnabled])

  const value = useMemo(
    () => ({
      soundsEnabled,
      setSoundsEnabled,
      toggleSoundsEnabled,
    }),
    [soundsEnabled, setSoundsEnabled, toggleSoundsEnabled],
  )

  return <DesktopCuelumeContext.Provider value={value}>{children}</DesktopCuelumeContext.Provider>
}

export function useDesktopCuelume() {
  const context = useContext(DesktopCuelumeContext)
  if (!context) {
    throw new Error("useDesktopCuelume must be used within DesktopCuelumeProvider")
  }

  return context
}
