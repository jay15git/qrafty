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
  isInteracting: boolean
  preferLowPowerShaders: boolean
}

const PreviewRuntimeContext = createContext<PreviewRuntimeValue>({
  artboardScale: 1,
  isInteracting: false,
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
  const isInteracting = useSyncExternalStore(
    previewSession.subscribe,
    previewSession.getIsInteracting,
    () => false,
  )

  const value = useMemo(
    () => ({
      artboardScale,
      isInteracting,
      preferLowPowerShaders,
    }),
    [artboardScale, isInteracting, preferLowPowerShaders],
  )

  return (
    <PreviewRuntimeContext.Provider value={value}>{children}</PreviewRuntimeContext.Provider>
  )
}

export function usePreviewRuntime() {
  return useContext(PreviewRuntimeContext)
}
