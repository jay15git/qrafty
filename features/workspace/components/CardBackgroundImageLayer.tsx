"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"

import { preloadRasterImage } from "@/features/workspace/rendering/preload-raster-image"
import { cn } from "@/lib/utils"

const CROSSFADE_MS = 180

type ImageSlot = {
  opacity: number
  url: string
}

type CardBackgroundImageLayerProps = {
  className?: string
  fit: "contain" | "cover"
  imageUrl: string
  opacity: number
  reduceMotion?: boolean
}

function buildImageBackgroundStyle(url: string, fit: "contain" | "cover"): CSSProperties {
  return {
    backgroundImage: `url("${url}")`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: fit,
  }
}

export function CardBackgroundImageLayer({
  className,
  fit,
  imageUrl,
  opacity,
  reduceMotion = false,
}: CardBackgroundImageLayerProps) {
  const [current, setCurrent] = useState<ImageSlot>({ opacity: 1, url: imageUrl })
  const [incoming, setIncoming] = useState<ImageSlot | null>(null)
  const pendingUrlRef = useRef(imageUrl)
  const transition =
    reduceMotion ? undefined : `opacity ${CROSSFADE_MS}ms ease-out`

  useEffect(() => {
    pendingUrlRef.current = imageUrl

    if (imageUrl === current.url) {
      return
    }

    let cancelled = false
    let settleTimer = 0

    void preloadRasterImage(imageUrl)
      .then(() => {
        if (cancelled || pendingUrlRef.current !== imageUrl) {
          return
        }

        if (reduceMotion) {
          setIncoming(null)
          setCurrent({ opacity: 1, url: imageUrl })
          return
        }

        setIncoming({ opacity: 0, url: imageUrl })
        requestAnimationFrame(() => {
          if (cancelled || pendingUrlRef.current !== imageUrl) {
            return
          }

          setIncoming({ opacity: 1, url: imageUrl })
        })

        settleTimer = window.setTimeout(() => {
          if (cancelled || pendingUrlRef.current !== imageUrl) {
            return
          }

          setCurrent({ opacity: 1, url: imageUrl })
          setIncoming(null)
        }, CROSSFADE_MS)
      })
      .catch(() => {
        if (cancelled || pendingUrlRef.current !== imageUrl) {
          return
        }

        setIncoming(null)
        setCurrent({ opacity: 1, url: imageUrl })
      })

    return () => {
      cancelled = true
      if (settleTimer) {
        window.clearTimeout(settleTimer)
      }
    }
  }, [current.url, imageUrl, reduceMotion])

  return (
    <>
      {incoming ? (
        <div
          aria-hidden="true"
          data-slot="desktop-compose-card-image-incoming"
          className={cn("pointer-events-none absolute inset-0 z-[1]", className)}
          style={{
            ...buildImageBackgroundStyle(incoming.url, fit),
            borderRadius: "inherit",
            opacity: incoming.opacity * opacity,
            transition,
          }}
        />
      ) : null}
      <div
        aria-hidden="true"
        data-slot="desktop-compose-card-image"
        className={cn(
          "pointer-events-none absolute inset-0",
          incoming ? "z-0" : "z-[1]",
          className,
        )}
        style={{
          ...buildImageBackgroundStyle(current.url, fit),
          borderRadius: "inherit",
          opacity: current.opacity * opacity,
          transition,
        }}
      />
    </>
  )
}
