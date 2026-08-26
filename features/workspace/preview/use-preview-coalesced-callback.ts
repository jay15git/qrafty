"use client"

import { useCallback, useEffect, useRef } from "react"

import { previewSession } from "@/features/workspace/preview/preview-session"

export function usePreviewCoalescedCallback<T extends (...args: never[]) => void>(callback: T) {
  const callbackRef = useRef(callback)
  const frameRef = useRef<number | null>(null)
  const pendingArgsRef = useRef<Parameters<T> | null>(null)

  callbackRef.current = callback

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return useCallback((...args: Parameters<T>) => {
    previewSession.beginInteraction()
    pendingArgsRef.current = args

    if (frameRef.current !== null) {
      return
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      const pendingArgs = pendingArgsRef.current
      pendingArgsRef.current = null

      if (pendingArgs) {
        callbackRef.current(...pendingArgs)
      }
    })
  }, []) as T
}

export function usePreviewInteractionEnd() {
  return useCallback(() => {
    previewSession.endInteraction()
  }, [])
}
