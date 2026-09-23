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
  applySoundPreferences,
  readSoundsEnabled,
  setSoundsEnabled as persistSoundsEnabled,
} from "@/features/shell/audio/cuelume"

type CuelumeContextValue = {
  soundsEnabled: boolean
  setSoundsEnabled: (enabled: boolean) => void
  toggleSoundsEnabled: () => void
}

const CuelumeContext = createContext<CuelumeContextValue | null>(null)

// The sounds preference lives in localStorage; this registry lets
// `useSyncExternalStore` re-read it when the provider writes a new value.
const soundsListeners = new Set<() => void>()

function subscribeSounds(listener: () => void) {
  soundsListeners.add(listener)
  return () => {
    soundsListeners.delete(listener)
  }
}

export function CuelumeProvider({ children }: { children: ReactNode }) {
  const soundsEnabled = useSyncExternalStore(
    subscribeSounds,
    readSoundsEnabled,
    () => true,
  )

  useEffect(() => {
    bind()
    applySoundPreferences()

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleMotionChange = () => {
      applySoundPreferences()
    }

    motionQuery.addEventListener("change", handleMotionChange)

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange)
    }
  }, [])

  const setSoundsEnabled = useCallback((enabled: boolean) => {
    persistSoundsEnabled(enabled)
    for (const listener of soundsListeners) {
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

  return <CuelumeContext.Provider value={value}>{children}</CuelumeContext.Provider>
}

export function useCuelume() {
  const context = useContext(CuelumeContext)
  if (!context) {
    throw new Error("useCuelume must be used within CuelumeProvider")
  }

  return context
}
