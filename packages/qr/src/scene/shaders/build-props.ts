import { LIVE_PAPER_SHADER_RENDER_OPTIONS } from "./live-render-options"
import { shaderRequiresImage } from "./registry"
import { buildPaperShaderWorldSize } from "./world-size"

export type PaperShaderParamValue =
  | boolean
  | number
  | number[]
  | number[][]
  | string
  | string[]
  | undefined

export type PaperShaderParams = Record<string, PaperShaderParamValue>

export type SerializablePaperShaderState = {
  shaderId: string
  params: PaperShaderParams
  frame: number
  speed: number
  paused: boolean
  image?: {
    value?: string
  }
  renderOptions?: Record<string, unknown>
  /** Document/layout px — pins pattern scale independent of WebGL buffer size. */
  worldWidth?: number
  worldHeight?: number
}

export type PaperShaderRenderQuality = "live" | "export"

export function buildPaperShaderRenderProps(
  shader: SerializablePaperShaderState,
  options?: { quality?: PaperShaderRenderQuality },
) {
  const worldWidth =
    shader.worldWidth ??
    (typeof shader.params.worldWidth === "number" ? shader.params.worldWidth : undefined)
  const worldHeight =
    shader.worldHeight ??
    (typeof shader.params.worldHeight === "number" ? shader.params.worldHeight : undefined)
  const worldSize =
    worldWidth !== undefined && worldHeight !== undefined
      ? buildPaperShaderWorldSize(worldWidth, worldHeight)
      : null

  const props = {
    ...shader.params,
    frame: shader.frame,
    speed: shader.paused ? 0 : shader.speed,
    ...(shaderRequiresImage(shader.shaderId) && shader.image?.value
      ? { image: shader.image.value }
      : {}),
    ...shader.renderOptions,
    ...(worldSize ?? {}),
  }

  if ((options?.quality ?? "live") === "live") {
    return {
      ...props,
      ...LIVE_PAPER_SHADER_RENDER_OPTIONS,
    }
  }

  return props
}
