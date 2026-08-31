import type { SerializablePaperShaderState } from "../shaders"
import type { QraftyQrCodeProps } from "../../types"

export type SceneIrBounds = {
  minX: number
  minY: number
  width: number
  height: number
}

export type SceneIrShaderNode = {
  kind: "shader"
  shader: SerializablePaperShaderState
  bounds: { x: number; y: number; width: number; height: number }
  snapshotUrl?: string
  fallbackFill?: string
}

export type SceneIrAnimatedQrNode = {
  kind: "animated-qr"
  contents: string
  externalSvg: string
  bounds: { x: number; y: number; width: number; height: number }
  preset: string
  hoverEffect: string
}

export type SceneIrFontRef = {
  id: string
  family: string
  cssText?: string
  cssUrl?: string
}

export type DomLayerKind = "card" | "text" | "image" | "shape" | "qr" | "group" | "module"

export type DomLayerNode = {
  kind: DomLayerKind
  id: string
  bounds: { x: number; y: number; width: number; height: number }
  style: Record<string, string | number>
  content?: string
  htmlContent?: string
  svgInner?: string
  qrProps?: QraftyQrCodeProps
  children?: DomLayerNode[]
}

export type SceneIr = {
  bounds: SceneIrBounds
  defs: string
  body: string
  domLayers: DomLayerNode[]
  shaders: SceneIrShaderNode[]
  animatedQr?: SceneIrAnimatedQrNode
  fonts: SceneIrFontRef[]
  componentName?: string
}
