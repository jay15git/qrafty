export const SCENE_DOCUMENT_VERSION = 1 as const

export type SceneRenderMode = "live" | "static" | "snapshot" | "fallback" | "hybrid"

export type SceneAssetSource = "data" | "url" | "blob"

export type SceneAsset = {
  id: string
  kind: "font" | "image" | "shader-snapshot"
  mimeType?: string
  source: SceneAssetSource
  url: string
  width?: number
  height?: number
  integrity?: string
}

export type SceneFont = {
  id: string
  family: string
  url?: string
  weight?: number | string
  style?: string
}

export type ScenePaperShaderState = {
  shaderId: string
  params: Record<string, unknown>
  frame: number
  speed: number
  paused: boolean
  image?: {
    source: "none" | "sample" | "upload" | "url" | "data"
    value?: string
  }
  presetName?: string
}

export type SceneCardState = {
  styleMode: "pattern" | "image" | "image-filter" | "paper-shader"
  fill: string
  cornerRadius: number
  border: { color: string; opacity: number; width: number }
  shadow?: { blur: number; color: string; offsetX: number; offsetY: number; opacity: number }
  paperShader?: ScenePaperShaderState
  imageFilter?: ScenePaperShaderState
  patternId?: string
  cardImage?: {
    fit: "contain" | "cover"
    opacity: number
    source: "none" | "upload" | "url"
    value?: string
  }
}

export type SceneQrMotionState = {
  enabled: boolean
  animated: boolean
  preset: string
  hoverEffect: string
  hoverColorMode: "both" | "modules" | "overlay"
  autoAnimate: string
  autoAnimateInterval: number
  speed: number
  motionIntensity: "subtle" | "premium" | "dramatic"
  respectReducedMotion: boolean
  pressPreset?: string
}

export type SceneQrState = {
  contents: string
  externalSvg: string
  motion: SceneQrMotionState
  width: number
  height: number
}

export type SceneLayerKind = "card" | "group" | "image" | "qr" | "shader" | "shape" | "text"

export type SceneLayer = {
  id: string
  kind: SceneLayerKind
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  zIndex: number
  isVisible: boolean
  blur?: number
  tiltX?: number
  tiltY?: number
  scaleX?: number
  scaleY?: number
  text?: string
  fontFamily?: string
  fontSize?: number
  fill?: string
  imageValue?: string
  imageFit?: "contain" | "cover"
  shapeId?: string
  paperShader?: ScenePaperShaderState
  children?: SceneLayer[]
}

export type SceneNodeDocument = {
  nodeId: string
  width: number
  height: number
  layers: SceneLayer[]
  card: SceneCardState
  qr: SceneQrState
  decorSvg?: string
}

export type SceneDocumentV1 = {
  version: typeof SCENE_DOCUMENT_VERSION
  sceneId?: string
  publishedVersion?: number
  sceneUrl?: string
  width: number
  height: number
  nodes: string[]
  activeNodeId: string
  layersByNodeId: Record<string, SceneLayer[]>
  cardStateByNodeId: Record<string, SceneCardState>
  qrStateByNodeId: Record<string, SceneQrState>
  decorSvgByNodeId?: Record<string, string>
  assets: Record<string, SceneAsset>
  fonts: SceneFont[]
}

export type SceneDependencyManifest = {
  dependencies: Record<string, string>
  features: {
    paperShaders: boolean
    animatedQr: boolean
    staticFallback: boolean
  }
}

export function isSceneDocumentV1(value: unknown): value is SceneDocumentV1 {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    (value as SceneDocumentV1).version === SCENE_DOCUMENT_VERSION
  )
}
