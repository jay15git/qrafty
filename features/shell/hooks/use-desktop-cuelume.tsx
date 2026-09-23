"use client"

import { bind } from "cuelume"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import {
  applyDesktopSoundPreferences,
  readDesktopSoundsEnabled,
  setDesktopSoundsEnabled,
} from "@/features/shell/audio/desktop-cuelume"

type DesktopCuelumeContextValue = {
  soundsEnabled: boolean
  setSoundsEnabled: (enabled: boolean) => void
  toggleSoundsEnabled: () => void
}

const DesktopCuelumeContext = createContext<DesktopCuelumeContextValue | null>(null)

// The sounds preference lives in localStorage; this registry lets
// `useSyncExternalStore` re-read it when the provider writes a new value.
const desktopSoundsListeners = new Set<() => void>()

function subscribeDesktopSounds(listener: () => void) {
  desktopSoundsListeners.add(listener)
  return () => {
    desktopSoundsListeners.delete(listener)
  }
}

export function DesktopCuelumeProvider({ children }: { children: ReactNode }) {
  const soundsEnabled = useSyncExternalStore(
    subscribeDesktopSounds,
    readDesktopSoundsEnabled,
    () => true,
  )

  useEffect(() => {
    bind()
    applyDesktopSoundPreferences()

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
    setDesktopSoundsEnabled(enabled)
    for (const listener of desktopSoundsListeners) {
      listener()
    }
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
