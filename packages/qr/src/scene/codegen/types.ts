import type { SerializablePaperShaderState } from "../shaders"
import type { NewQrCodeProps } from "../../types"

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
  qrProps?: NewQrCodeProps
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

export type CodeExportTarget =
  | { format: "html" }
  | { format: "css" }
  | { format: "react"; dialect: "jsx" | "tsx"; componentName?: string }
  | { format: "svg" }

export type FrameworkTarget =
  | { framework: "svg" }
  | { framework: "react"; dialect: "jsx" | "tsx"; mode: "static"; componentName?: string }
  | { framework: "react"; dialect: "jsx" | "tsx"; mode: "live"; componentName?: string }
  | { framework: "vue"; lang: "js" | "ts" }
  | { framework: "svelte"; lang: "js" | "ts" }

export type CodegenTarget = CodeExportTarget | FrameworkTarget

export function isCodeExportTarget(target: CodegenTarget): target is CodeExportTarget {
  return "format" in target
}

export function isLiveReactTarget(
  target: FrameworkTarget,
): target is Extract<FrameworkTarget, { framework: "react"; mode: "live" }> {
  return target.framework === "react" && "mode" in target && target.mode === "live"
}
