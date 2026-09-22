"use client"

import { useSyncExternalStore } from "react"

export const DESKTOP_WORKSPACE_MOBILE_QUERY = "(max-width: 767px)"

function subscribeToMediaQuery(query: string, onStoreChange: () => void) {
  const mediaQueryList = window.matchMedia(query)
  mediaQueryList.addEventListener("change", onStoreChange)

  return () => mediaQueryList.removeEventListener("change", onStoreChange)
}

function getMediaQuerySnapshot(query: string) {
  return window.matchMedia(query).matches
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => subscribeToMediaQuery(query, onStoreChange),
    () => getMediaQuerySnapshot(query),
    () => false,
  )
}
