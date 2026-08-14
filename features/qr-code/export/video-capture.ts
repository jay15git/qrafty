import type { VideoExportFormat, VideoExportFrameRate } from "./video-export"

function getSupportedRecordingMimeType(format: VideoExportFormat) {
  const candidates = format === "webm"
    ? ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
    : ["video/mp4;codecs=avc1", "video/mp4"]
  return candidates.find((type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) ?? null
}

function createFixedRateCapture(canvas: HTMLCanvasElement, frameRate: VideoExportFrameRate) {
  if (typeof canvas.captureStream !== "function") throw new Error("Canvas capture is unavailable in this browser.")
  return canvas.captureStream(frameRate)
}

async function encodeRecordedVideo(stream: MediaStream, durationSeconds: 5 | 10, mimeType: string) {
  if (typeof MediaRecorder === "undefined") throw new Error("Video recording is unavailable in this browser.")
  const recorder = new MediaRecorder(stream, { mimeType })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data)
  const result = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("Video recording failed."))
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
  })
  recorder.start(250)
  await new Promise((resolve) => setTimeout(resolve, durationSeconds * 1000))
  recorder.stop()
  return result
}

export async function exportAnimatedQrVideo(options: { durationSeconds: 5 | 10; frameRate: VideoExportFrameRate; format: VideoExportFormat; width: 1080 | 2160 }) {
  const host = document.querySelector<HTMLElement>("[data-export-animated-qr]")
  const canvas = host?.querySelector<HTMLCanvasElement>("canvas") ??
    document.querySelector<HTMLCanvasElement>("[data-export-animated-qr] canvas")
  if (!canvas) throw new Error("Animated QR canvas is unavailable.")
  const mimeType = getSupportedRecordingMimeType("webm")
  if (!mimeType) throw new Error("WebM recording is unavailable in this browser.")
  const stream = createFixedRateCapture(canvas, options.frameRate)
  try {
    const source = await encodeRecordedVideo(stream, options.durationSeconds, mimeType)
    const response = await fetch("/api/animated-qr/export", {
      method: "POST",
      headers: {
        "Content-Type": "video/webm",
        "x-animated-qr-export": JSON.stringify(options),
      },
      body: source,
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.error ?? "Video export failed.")
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `animated-qr-${options.durationSeconds}s-${options.frameRate}fps.${options.format}`
    link.click()
    URL.revokeObjectURL(url)
  } finally {
    stream.getTracks().forEach((track) => track.stop())
  }
}
