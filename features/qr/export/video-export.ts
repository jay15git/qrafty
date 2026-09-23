export const VIDEO_EXPORT_MIN_DURATION_SECONDS = 5;
export const VIDEO_EXPORT_MAX_DURATION_SECONDS = 60;

const VIDEO_EXPORT_FRAME_RATES = [30, 60] as const;
const VIDEO_EXPORT_FORMATS = ["mp4", "webm"] as const;
const VIDEO_EXPORT_LONG_EDGES = [720, 1080, 1440, 2160] as const;

export type VideoExportDuration = number;
export type VideoExportFrameRate = (typeof VIDEO_EXPORT_FRAME_RATES)[number];
export type VideoExportFormat = (typeof VIDEO_EXPORT_FORMATS)[number];
export type VideoExportLongEdge = (typeof VIDEO_EXPORT_LONG_EDGES)[number];

export function clampVideoExportDuration(value: number): VideoExportDuration {
  return Math.min(
    Math.max(Math.round(value), VIDEO_EXPORT_MIN_DURATION_SECONDS),
    VIDEO_EXPORT_MAX_DURATION_SECONDS,
  );
}
