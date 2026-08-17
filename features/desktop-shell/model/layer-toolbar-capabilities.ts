import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

export type LayerPropertyTab = "transform" | "design"

export type LayerToolbarCapabilities = {
  maxEffects: number
  propertyTabs: LayerPropertyTab[]
  showStyleInDesign: boolean
}

const DEFAULT_CAPABILITIES: LayerToolbarCapabilities = {
  maxEffects: 2,
  propertyTabs: ["transform", "design"],
  showStyleInDesign: false,
}

export function getDesktopLayerToolbarCapabilities(
  layer: DraftingCanvasLayer | null | undefined,
  appearance?: DesktopAppearanceSnapshot | null,
): LayerToolbarCapabilities {
  if (!layer) {
    return DEFAULT_CAPABILITIES
  }

  switch (layer.kind) {
    case "text":
    case "shape":
    case "image":
    case "shader":
      return {
        maxEffects: 2,
        propertyTabs: ["transform", "design"],
        showStyleInDesign: true,
      }
    case "card":
      return {
        maxEffects: 1,
        propertyTabs: ["transform", "design"],
        showStyleInDesign: false,
      }
    case "qr":
      return {
        maxEffects: 2,
        propertyTabs: ["transform", "design"],
        showStyleInDesign: false,
      }
    case "group":
      return {
        maxEffects: 0,
        propertyTabs: ["transform"],
        showStyleInDesign: false,
      }
    default:
      return {
        ...DEFAULT_CAPABILITIES,
        showStyleInDesign: Boolean(appearance?.supportsOutline || appearance?.supportsCornerRadius),
      }
  }
}

export function getLayerPropertyTabLabel(tab: LayerPropertyTab, layer: DraftingCanvasLayer | null) {
  if (tab === "transform") {
    return "Transform"
  }

  if (layer?.kind === "qr") {
    return "Effects"
  }

  if (layer?.kind === "card") {
    return "Appearance"
  }

  return "Design"
}
