"use client"

import type { CSSProperties } from "react"

import { DraftingCardPaperShaderLayer } from "@/features/workspace/components/CardPaperShaderLayer"
import type { SceneBackground, SceneLayoutPreset } from "@/features/workspace/model/scene-templates"
import {
  createScenePaperShaderState,
  getSceneBackgroundStyle,
  getSceneLayoutTransformStyle,
} from "@/features/workspace/rendering/scene-background-styles"
import { cn } from "@/lib/utils"

type SceneBackgroundLayerProps = {
  background: SceneBackground
  className?: string
  height: number
  layout?: SceneLayoutPreset
  width: number
}

export function SceneBackgroundLayer({
  background,
  className,
  height,
  layout,
  width,
}: SceneBackgroundLayerProps) {
  const backgroundStyle = getSceneBackgroundStyle(background)
  const layoutStyle = layout ? getSceneLayoutTransformStyle(layout) : undefined

  return (
    <div
      aria-hidden="true"
      data-export-kind="scene-background"
      data-export-layer="true"
      data-slot="scene-background-layer"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        width,
        height,
        ...backgroundStyle,
      }}
    >
      {background.kind === "paper-shader" ? (
        <DraftingCardPaperShaderLayer
          paperShader={createScenePaperShaderState(background.shaderId)}
        />
      ) : null}
      {layoutStyle ? (
        <div
          className="absolute inset-0"
          style={layoutStyle as CSSProperties}
        />
      ) : null}
    </div>
  )
}

export function SceneCompositionTransform({
  children,
  layout,
}: {
  children: React.ReactNode
  layout: SceneLayoutPreset
}) {
  const layoutStyle = getSceneLayoutTransformStyle(layout)

  if (!layoutStyle.transform) {
    return <>{children}</>
  }

  return (
    <div
      data-slot="scene-composition-transform"
      className="relative h-full w-full"
      style={layoutStyle}
    >
      {children}
    </div>
  )
}
