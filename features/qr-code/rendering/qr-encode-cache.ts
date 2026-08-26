import type { QrStudioState } from "@/features/qr-code/model/state"
import { getAssetValue } from "@/features/qr-code/model/state"

export function getQrEncodeCacheKey(state: QrStudioState) {
  return JSON.stringify({
    ariaLabel: state.ariaLabel,
    boostLevel: state.qrOptions.boostLevel,
    data: state.data,
    dotType: state.dataModulesSettings.type,
    finderInnerStyle: state.finderPatternInnerSettings.type,
    finderOuterStyle: state.finderPatternOuterSettings.type,
    height: state.height,
    hideBackgroundDots: state.imageOptions.hideBackgroundDots,
    level: state.qrOptions.errorCorrectionLevel,
    lineWidth: state.dataModulesSettings.lineWidth,
    logo: state.logo,
    logoHeightPx: state.imageOptions.heightPx,
    logoPositionMode: state.imageOptions.logoPositionMode,
    logoSize: state.imageOptions.imageSize,
    logoSizeMode: state.imageOptions.sizeMode,
    logoWidthPx: state.imageOptions.widthPx,
    logoX: state.imageOptions.x,
    logoY: state.imageOptions.y,
    margin: state.margin,
    minVersion: state.qrOptions.typeNumber,
    moduleFillImage: getAssetValue(state.moduleFillImage),
    moduleSize: state.dataModulesSettings.moduleSize,
    roundSize: state.dataModulesSettings.roundSize,
    valueSegments: state.valueSegments,
    width: state.width,
  })
}

const encodeMarkupCache = new Map<string, string>()
const ENCODE_MARKUP_CACHE_LIMIT = 64

export function readCachedQrEncodeMarkup(cacheKey: string) {
  return encodeMarkupCache.get(cacheKey)
}

export function writeCachedQrEncodeMarkup(cacheKey: string, markup: string) {
  if (encodeMarkupCache.has(cacheKey)) {
    encodeMarkupCache.delete(cacheKey)
  }

  encodeMarkupCache.set(cacheKey, markup)

  while (encodeMarkupCache.size > ENCODE_MARKUP_CACHE_LIMIT) {
    const oldestKey = encodeMarkupCache.keys().next().value
    if (!oldestKey) {
      break
    }
    encodeMarkupCache.delete(oldestKey)
  }
}

export function clearQrEncodeMarkupCache() {
  encodeMarkupCache.clear()
}
