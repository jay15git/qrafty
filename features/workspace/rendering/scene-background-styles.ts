import type { CSSProperties } from "react"

import { createDefaultDraftingCardPaperShader } from "@/features/workspace/model/card-state"
import type { SceneBackground } from "@/features/workspace/model/scene-templates"

export function getSceneBackgroundStyle(background: SceneBackground): CSSProperties {
  switch (background.kind) {
    case "solid":
      return { backgroundColor: background.color }
    case "gradient":
      return {
        backgroundImage: `linear-gradient(${background.angle}deg, ${background.stops[0].color} ${background.stops[0].offset * 100}%, ${background.stops[1].color} ${background.stops[1].offset * 100}%)`,
      }
    case "image":
      return {
        backgroundImage: `url("${background.src}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: background.fit,
      }
    case "paper-shader":
      return { backgroundColor: "#0f172a" }
    default:
      return { backgroundColor: "#f4f4f5" }
  }
}

export function getSceneLayoutTransformStyle(layout: {
  rotation: number
  tiltX: number
  tiltY: number
  zoom: number
}): CSSProperties {
  const transforms = [
    layout.zoom !== 1 ? `scale(${layout.zoom})` : null,
    layout.rotation !== 0 ? `rotate(${layout.rotation}deg)` : null,
    layout.tiltX !== 0 || layout.tiltY !== 0
      ? `rotateX(${layout.tiltY}deg) rotateY(${layout.tiltX}deg)`
      : null,
  ].filter(Boolean)

  if (transforms.length === 0) {
    return {}
  }

  return {
    perspective: "600px",
    transform: transforms.join(" "),
    transformOrigin: "center center",
    transformStyle: "preserve-3d",
  }
}

export function createScenePaperShaderState(shaderId: string) {
  return {
    ...createDefaultDraftingCardPaperShader(shaderId),
    shaderId,
  }
}
