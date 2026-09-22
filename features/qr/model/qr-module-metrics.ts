import { getQrModuleMetrics } from "@qrafty/qr-internal/core"
import type { QraftyState } from "@/features/qr/model/state"

type QrModuleMetricsState = Pick<
  QraftyState,
  "data" | "margin" | "qrOptions" | "valueSegments"
>

const quietZoneFractionCache = new Map<string, number>()
const QUIET_ZONE_CACHE_LIMIT = 64

function getQrModuleMetricsCacheKey(state: QrModuleMetricsState) {
  return JSON.stringify({
    boostLevel: state.qrOptions.boostLevel,
    data: state.data,
    level: state.qrOptions.errorCorrectionLevel,
    margin: state.margin,
    minVersion: state.qrOptions.typeNumber,
    valueSegments: state.valueSegments,
  })
}

function getQrModuleMetricsValue(state: QrModuleMetricsState) {
  return state.valueSegments?.length
    ? state.valueSegments.flatMap((segment) => {
        const trimmed = segment.trim()
        return trimmed ? [trimmed] : []
      })
    : state.data.trim()
}

/**
 * Fraction of the QR box edge occupied by the quiet zone on each side
 * (margin cells / numCells). Content-dependent: denser payloads produce more
 * modules, so the same margin occupies a smaller share of the box. Falls back
 * to 0 when the payload cannot be encoded (degrades to box-edge geometry).
 */
export function getQraftyQrQuietZoneFraction(state: QrModuleMetricsState) {
  const cacheKey = getQrModuleMetricsCacheKey(state)
  const cached = quietZoneFractionCache.get(cacheKey)

  if (cached !== undefined) {
    return cached
  }

  const metrics = getQrModuleMetrics({
    boostLevel: state.qrOptions.boostLevel,
    level: state.qrOptions.errorCorrectionLevel,
    marginSize: Number.isFinite(state.margin)
      ? Math.min(80, Math.max(0, Math.floor(state.margin)))
      : 12,
    minVersion: Math.max(1, state.qrOptions.typeNumber || 1),
    value: getQrModuleMetricsValue(state),
  })
  const fraction = metrics ? metrics.margin / metrics.numCells : 0

  quietZoneFractionCache.set(cacheKey, fraction)

  while (quietZoneFractionCache.size > QUIET_ZONE_CACHE_LIMIT) {
    const oldestKey = quietZoneFractionCache.keys().next().value
    if (!oldestKey) {
      break
    }
    quietZoneFractionCache.delete(oldestKey)
  }

  return fraction
}
