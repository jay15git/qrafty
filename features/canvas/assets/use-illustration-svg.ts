"use client"

import { useEffect, useState } from "react"

import {
  getCachedIllustrationSvgMarkup,
  loadIllustrationSvgMarkup,
} from "@/features/canvas/assets/illustration-recolor"

export function useIllustrationSvgMarkup(path: string | undefined) {
  const [markup, setMarkup] = useState(() =>
    path ? getCachedIllustrationSvgMarkup(path) : null,
  )
  const [resolvedPath, setResolvedPath] = useState(path)

  // Adjust state during render when the requested path changes so cached
  // markup is applied immediately without a cascading effect render.
  if (path !== resolvedPath) {
    setResolvedPath(path)
    if (!path) {
      setMarkup(null)
    } else {
      const cached = getCachedIllustrationSvgMarkup(path)
      if (cached) {
        setMarkup(cached)
      }
    }
  }

  useEffect(() => {
    if (!path || getCachedIllustrationSvgMarkup(path)) {
      return
    }

    let cancelled = false
    void loadIllustrationSvgMarkup(path).then((next) => {
      if (!cancelled) {
        setMarkup(next)
      }
    })

    return () => {
      cancelled = true
    }
  }, [path])

  return markup
}
