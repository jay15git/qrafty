export type PaperShaderWorldSize = {
  worldWidth: number
  worldHeight: number
}

/** Layout-space world size for Paper Shaders. Keeps pattern scale stable when the WebGL buffer is downscaled. */
export function buildPaperShaderWorldSize(
  width: number,
  height: number,
): PaperShaderWorldSize | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null
  }

  return {
    worldWidth: width,
    worldHeight: height,
  }
}
