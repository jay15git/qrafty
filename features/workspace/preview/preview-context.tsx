"use client"

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import { previewSession } from "@/features/workspace/preview/preview-session"

export type PreviewRuntimeValue = {
  artboardScale: number
  preferLowPowerShaders: boolean
}

const PreviewRuntimeContext = createContext<PreviewRuntimeValue>({
  artboardScale: 1,
  preferLowPowerShaders: false,
})

export function PreviewRuntimeProvider({
  artboardScale,
  children,
  preferLowPowerShaders,
}: {
  artboardScale: number
  children: ReactNode
  preferLowPowerShaders: boolean
}) {
  const value = useMemo(
    () => ({
      artboardScale,
      preferLowPowerShaders,
    }),
    [artboardScale, preferLowPowerShaders],
  )

  return (
    <PreviewRuntimeContext.Provider value={value}>{children}</PreviewRuntimeContext.Provider>
  )
}

export function usePreviewRuntime() {
  return useContext(PreviewRuntimeContext)
}

export function usePreviewInteraction() {
  return useSyncExternalStore(
    previewSession.subscribe,
    previewSession.getIsInteracting,
    () => false,
  )
}
