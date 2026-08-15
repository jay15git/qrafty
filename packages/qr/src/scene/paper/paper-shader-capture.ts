export async function capturePaperShaderFrame(
  canvas: HTMLCanvasElement,
  mimeType = "image/png",
  quality = 0.92,
) {
  return canvas.toDataURL(mimeType, quality)
}
