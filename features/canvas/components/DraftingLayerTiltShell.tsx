"use client"

import type { CSSProperties, ReactNode } from "react"

import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared"
import { getLayerTiltInnerStyle } from "@/features/canvas/rendering/layer-transform"
import { cn } from "@/lib/utils"

export function DraftingLayerTiltShell({
  children,
  className,
  layer,
  style,
}: {
  children: ReactNode
  className?: string
  layer: Pick<DraftingCanvasLayer, "tiltX" | "tiltY">
  style?: CSSProperties
}) {
  const tiltInnerStyle = getLayerTiltInnerStyle(layer)

  if (!tiltInnerStyle.transform) {
    return <>{children}</>
  }

  return (
    <div className={cn("h-full w-full", className)} style={{ ...style, ...tiltInnerStyle }}>
      {children}
    </div>
  )
}
