"use client"

import { useEffect, useState } from "react"
import type Konva from "konva"

export function useKonvaImage(source: string | null | undefined) {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined)

  useEffect(() => {
    if (!source) {
      setImage(undefined)
      return
    }

    let cancelled = false
    const nextImage = new window.Image()
    nextImage.crossOrigin = "anonymous"

    const onLoad = () => {
      if (!cancelled) {
        setImage(nextImage)
      }
    }

    const onError = () => {
      if (!cancelled) {
        setImage(undefined)
      }
    }

    nextImage.addEventListener("load", onLoad)
    nextImage.addEventListener("error", onError)
    nextImage.src = source

    return () => {
      cancelled = true
      nextImage.removeEventListener("load", onLoad)
      nextImage.removeEventListener("error", onError)
    }
  }, [source])

  return image
}

export function useKonvaSvgMarkup(markup: string | null | undefined) {
  const dataUrl =
    markup && markup.length > 0
      ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
      : null

  return useKonvaImage(dataUrl)
}

export function resetNodeScaleToSize(node: Konva.Node) {
  const scaleX = node.scaleX()
  const scaleY = node.scaleY()

  node.scaleX(1)
  node.scaleY(1)

  return {
    width: Math.max(1, node.width() * scaleX),
    height: Math.max(1, node.height() * scaleY),
  }
}
