"use client"

import { useEffect, useState } from "react"

import {
  getCachedIllustrationSvgMarkup,
  loadIllustrationSvgMarkup,
} from "@/features/workspace/assets/illustration-recolor"

export function useIllustrationSvgMarkup(path: string | undefined) {
  const [markup, setMarkup] = useState(() =>
    path ? getCachedIllustrationSvgMarkup(path) : null,
  )

  useEffect(() => {
    if (!path) {
      setMarkup(null)
      return
    }

    const cached = getCachedIllustrationSvgMarkup(path)
    if (cached) {
      setMarkup(cached)
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
