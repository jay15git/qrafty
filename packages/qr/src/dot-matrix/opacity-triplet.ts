export const SOURCE_BASE_OPACITY = 0.08;
export const SOURCE_MID_OPACITY = 0.34;
export const SOURCE_PEAK_OPACITY = 0.94;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function normalizeProgress(value: number, start: number, end: number): number {
  const span = end - start;
  if (Math.abs(span) < Number.EPSILON) {
    return 0;
  }
  return clamp01((value - start) / span);
}

function coerceOpacity(value: number | undefined): number | undefined {
  if (value == null || !Number.isFinite(value)) {
    return undefined;
  }
  return clamp01(value);
}

export function remapOpacityToTriplet(
  opacity: number,
  opacityBase: number | undefined,
  opacityMid: number | undefined,
  opacityPeak: number | undefined
): number {
  if (!Number.isFinite(opacity)) {
    return opacity;
  }

  const hasOverrides =
    opacityBase !== undefined ||
    opacityMid !== undefined ||
    opacityPeak !== undefined;
  if (!hasOverrides) {
    return clamp01(opacity);
  }

  const targetBase =
    coerceOpacity(opacityBase) !== undefined
      ? coerceOpacity(opacityBase)!
      : SOURCE_BASE_OPACITY;
  const targetMid =
    coerceOpacity(opacityMid) !== undefined
      ? coerceOpacity(opacityMid)!
      : SOURCE_MID_OPACITY;
  const targetPeak =
    coerceOpacity(opacityPeak) !== undefined
      ? coerceOpacity(opacityPeak)!
      : SOURCE_PEAK_OPACITY;

  const safeOpacity = clamp01(opacity);
  if (safeOpacity <= SOURCE_BASE_OPACITY) {
    const progress = normalizeProgress(safeOpacity, 0, SOURCE_BASE_OPACITY);
    return clamp01(lerp(0, targetBase, progress));
  }

  if (safeOpacity <= SOURCE_MID_OPACITY) {
    const progress = normalizeProgress(
      safeOpacity,
      SOURCE_BASE_OPACITY,
      SOURCE_MID_OPACITY
    );
    return clamp01(lerp(targetBase, targetMid, progress));
  }

  if (safeOpacity <= SOURCE_PEAK_OPACITY) {
    const progress = normalizeProgress(
      safeOpacity,
      SOURCE_MID_OPACITY,
      SOURCE_PEAK_OPACITY
    );
    return clamp01(lerp(targetMid, targetPeak, progress));
  }

  const progress = normalizeProgress(safeOpacity, SOURCE_PEAK_OPACITY, 1);
  return clamp01(lerp(targetPeak, 1, progress));
}
