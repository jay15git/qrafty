import { getQrModuleGrid, type QrModuleGrid } from "@qrafty/qr-internal/core";
import type { QraftyState } from "@/features/qr/model/state";

type QrGridState = Pick<QraftyState, "data" | "margin" | "qrOptions" | "valueSegments">;

const gridCache = new Map<string, QrModuleGrid | null>();
const GRID_CACHE_LIMIT = 64;

function getGridCacheKey(state: QrGridState) {
  return JSON.stringify({
    boostLevel: state.qrOptions.boostLevel,
    data: state.data,
    level: state.qrOptions.errorCorrectionLevel,
    margin: state.margin,
    minVersion: state.qrOptions.typeNumber,
    valueSegments: state.valueSegments,
  });
}

function getQrGridValue(state: QrGridState) {
  return state.valueSegments?.length
    ? state.valueSegments.flatMap((segment) => {
        const trimmed = segment.trim();
        return trimmed ? [trimmed] : [];
      })
    : state.data.trim();
}

/** Payload text a decoder must return after segment concatenation. */
export function getQraftyQrExpectedText(state: QrGridState) {
  const value = getQrGridValue(state);
  return Array.isArray(value) ? value.join("") : value;
}

/** Encoded module matrix for the current payload; null when unencodable. */
export function getQraftyQrModuleGrid(state: QrGridState): QrModuleGrid | null {
  const cacheKey = getGridCacheKey(state);

  if (gridCache.has(cacheKey)) {
    return gridCache.get(cacheKey) ?? null;
  }

  const grid = getQrModuleGrid({
    boostLevel: state.qrOptions.boostLevel,
    level: state.qrOptions.errorCorrectionLevel,
    marginSize: Number.isFinite(state.margin)
      ? Math.min(80, Math.max(0, Math.floor(state.margin)))
      : 12,
    minVersion: Math.max(1, state.qrOptions.typeNumber || 1),
    value: getQrGridValue(state),
  });

  gridCache.set(cacheKey, grid);

  while (gridCache.size > GRID_CACHE_LIMIT) {
    const oldestKey = gridCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    gridCache.delete(oldestKey);
  }

  return grid;
}
