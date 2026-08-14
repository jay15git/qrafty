const VIDEO_EXPORT_DURATIONS = [5, 10] as const
const VIDEO_EXPORT_FRAME_RATES = [30, 60] as const
const VIDEO_EXPORT_FORMATS = ["mp4", "webm"] as const

export type VideoExportDuration = (typeof VIDEO_EXPORT_DURATIONS)[number]
export type VideoExportFrameRate = (typeof VIDEO_EXPORT_FRAME_RATES)[number]
export type VideoExportFormat = (typeof VIDEO_EXPORT_FORMATS)[number]

export type VideoExportRequest = {
  durationSeconds: VideoExportDuration
  frameRate: VideoExportFrameRate
  format: VideoExportFormat
  width: 1080 | 2160
  height: 1080 | 2160
}

export function validateVideoExportRequest(value: unknown): VideoExportRequest {
  if (!value || typeof value !== "object") throw new Error("Invalid video export request.")
  const input = value as Record<string, unknown>
  const durationSeconds = input.durationSeconds
  const frameRate = input.frameRate
  const format = input.format
  const width = input.width
  const height = input.height
  if (!VIDEO_EXPORT_DURATIONS.includes(durationSeconds as VideoExportDuration)) {
    throw new Error("Unsupported video export duration.")
  }
  if (!VIDEO_EXPORT_FRAME_RATES.includes(frameRate as VideoExportFrameRate)) {
    throw new Error("Unsupported video export frame rate.")
  }
  if (!VIDEO_EXPORT_FORMATS.includes(format as VideoExportFormat)) {
    throw new Error("Unsupported video export format.")
  }
  if (![1080, 2160].includes(width as number) || width !== height) {
    throw new Error("Unsupported video export dimensions.")
  }
  return { durationSeconds, frameRate, format, width, height } as VideoExportRequest
}

export function getVideoExportMimeType(format: VideoExportFormat) {
  return format === "mp4" ? "video/mp4" : "video/webm"
}

export function getVideoExportFilename(format: VideoExportFormat, frameRate: VideoExportFrameRate, duration: VideoExportDuration) {
  return `animated-qr-${duration}s-${frameRate}fps.${format}`
}

export function getFfmpegVideoArgs(request: VideoExportRequest, inputPath: string, outputPath: string) {
  const codecArgs = request.format === "mp4"
    ? ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
    : ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30"]
  return ["-y", "-i", inputPath, "-t", String(request.durationSeconds), "-r", String(request.frameRate), "-vsync", "cfr", "-vf", `scale=${request.width}:${request.height}:flags=neighbor`, ...codecArgs, outputPath]
}

