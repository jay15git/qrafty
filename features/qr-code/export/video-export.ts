export const VIDEO_EXPORT_MIN_DURATION_SECONDS = 5
export const VIDEO_EXPORT_MAX_DURATION_SECONDS = 60

const VIDEO_EXPORT_FRAME_RATES = [30, 60] as const
const VIDEO_EXPORT_FORMATS = ["mp4", "webm"] as const
const VIDEO_EXPORT_LONG_EDGES = [720, 1080, 1440, 2160] as const

export type VideoExportDuration = number
export type VideoExportFrameRate = (typeof VIDEO_EXPORT_FRAME_RATES)[number]
export type VideoExportFormat = (typeof VIDEO_EXPORT_FORMATS)[number]
export type VideoExportLongEdge = (typeof VIDEO_EXPORT_LONG_EDGES)[number]

/** @deprecated Server ffmpeg transcode only. Client export uses aspect-aware long-edge sizing. */
export type VideoExportRequest = {
  durationSeconds: VideoExportDuration
  frameRate: VideoExportFrameRate
  format: VideoExportFormat
  longEdge: VideoExportLongEdge
  width: number
  height: number
}

export function validateVideoExportRequest(value: unknown): VideoExportRequest {
  if (!value || typeof value !== "object") throw new Error("Invalid video export request.")
  const input = value as Record<string, unknown>
  const durationSeconds = input.durationSeconds
  const frameRate = input.frameRate
  const format = input.format
  const longEdge = input.longEdge
  const width = input.width
  const height = input.height

  if (
    typeof durationSeconds !== "number" ||
    !Number.isInteger(durationSeconds) ||
    durationSeconds < VIDEO_EXPORT_MIN_DURATION_SECONDS ||
    durationSeconds > VIDEO_EXPORT_MAX_DURATION_SECONDS
  ) {
    throw new Error("Unsupported video export duration.")
  }
  if (!VIDEO_EXPORT_FRAME_RATES.includes(frameRate as VideoExportFrameRate)) {
    throw new Error("Unsupported video export frame rate.")
  }
  if (!VIDEO_EXPORT_FORMATS.includes(format as VideoExportFormat)) {
    throw new Error("Unsupported video export format.")
  }
  if (!VIDEO_EXPORT_LONG_EDGES.includes(longEdge as VideoExportLongEdge)) {
    throw new Error("Unsupported video export long edge.")
  }
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    width < 2 ||
    height < 2 ||
    width % 2 !== 0 ||
    height % 2 !== 0
  ) {
    throw new Error("Unsupported video export dimensions.")
  }

  return {
    durationSeconds,
    frameRate,
    format,
    longEdge,
    width,
    height,
  } as VideoExportRequest
}

export function clampVideoExportDuration(value: number): VideoExportDuration {
  return Math.min(
    Math.max(Math.round(value), VIDEO_EXPORT_MIN_DURATION_SECONDS),
    VIDEO_EXPORT_MAX_DURATION_SECONDS,
  )
}

export function getVideoExportMimeType(format: VideoExportFormat) {
  return format === "mp4" ? "video/mp4" : "video/webm"
}

export function getVideoExportFilename(
  format: VideoExportFormat,
  frameRate: VideoExportFrameRate,
  duration: VideoExportDuration,
) {
  return `animated-qr-${duration}s-${frameRate}fps.${format}`
}

/** @deprecated Optional server transcode path. Product export uses client WebCodecs / MediaRecorder. */
export function getFfmpegVideoArgs(
  request: VideoExportRequest,
  inputPath: string,
  outputPath: string,
) {
  const codecArgs =
    request.format === "mp4"
      ? ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
      : ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30"]

  return [
    "-y",
    "-i",
    inputPath,
    "-t",
    String(request.durationSeconds),
    "-r",
    String(request.frameRate),
    "-vsync",
    "cfr",
    "-vf",
    `scale=${request.width}:${request.height}`,
    ...codecArgs,
    outputPath,
  ]
}
