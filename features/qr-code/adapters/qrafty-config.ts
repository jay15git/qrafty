import {
  getAssetValue,
  hasActiveBackgroundShapeOptions,
  type QraftyState,
} from "@/features/qr-code/model/state"
import type {
  QraftyQrCodeProps,
  QrFinderInnerStyle,
  QrFinderOuterStyle,
  QrModuleStyle,
} from "@qrafty/qr"

function mapBackground(state: QraftyState): QraftyQrCodeProps["background"] {
  const backgroundImage = getAssetValue(state.backgroundImage)
  const customBackgroundSurfaceActive =
    !backgroundImage &&
    (state.backgroundShapeId !== "none" ||
      hasActiveBackgroundShapeOptions(state.backgroundShapeOptions))

  if (
    backgroundImage ||
    customBackgroundSurfaceActive ||
    state.backgroundOptions.transparent
  ) {
    return "transparent"
  }

  return state.backgroundOptions.color
}

function mapQraftyGradient(
  gradient: QraftyState["dataModulesGradient"],
  enabled: boolean,
): QraftyQrCodeProps["gradient"] {
  if (!enabled || !gradient.enabled) {
    return "none"
  }

  return {
    type: gradient.type,
    rotation: gradient.rotation,
    center: gradient.type === "radial" ? gradient.center : undefined,
    stops: [
      {
        offset: gradient.colorStops[0].offset,
        color: gradient.colorStops[0].color,
      },
      {
        offset: gradient.colorStops[1].offset,
        color: gradient.colorStops[1].color,
      },
    ],
  }
}

function mapBackgroundGradient(state: QraftyState): QraftyQrCodeProps["backgroundGradient"] {
  const backgroundImage = getAssetValue(state.backgroundImage)
  const customBackgroundSurfaceActive =
    !backgroundImage &&
    (state.backgroundShapeId !== "none" ||
      hasActiveBackgroundShapeOptions(state.backgroundShapeOptions))

  if (
    backgroundImage ||
    customBackgroundSurfaceActive ||
    state.backgroundOptions.transparent
  ) {
    return "none"
  }

  return mapQraftyGradient(state.backgroundGradient, state.backgroundGradient.enabled)
}

function mapGradient(state: QraftyState): QraftyQrCodeProps["gradient"] {
  if (state.dotsColorMode !== "gradient") {
    return "none"
  }

  return mapQraftyGradient(state.dataModulesGradient, true)
}

function mapLogo(state: QraftyState): QraftyQrCodeProps["logo"] | undefined {
  const src = getAssetValue(state.logo)
  if (!src) {
    return undefined
  }

  const logo: NonNullable<QraftyQrCodeProps["logo"]> = {
    crossOrigin: state.imageOptions.crossOrigin || undefined,
    excavate: state.imageOptions.hideBackgroundDots,
    src,
  }

  if (state.imageOptions.sizeMode === "pixels") {
    if (state.imageOptions.widthPx !== undefined) {
      logo.width = Math.max(1, state.imageOptions.widthPx)
    }
    if (state.imageOptions.heightPx !== undefined) {
      logo.height = Math.max(1, state.imageOptions.heightPx)
    }
  } else {
    logo.size = state.imageOptions.imageSize
  }

  if (state.imageOptions.opacity !== 1) {
    logo.opacity = state.imageOptions.opacity
  }

  if (state.imageOptions.logoPositionMode === "custom") {
    if (state.imageOptions.x !== undefined) {
      logo.x = state.imageOptions.x
    }
    if (state.imageOptions.y !== undefined) {
      logo.y = state.imageOptions.y
    }
  }

  return logo
}

function mapValue(state: QraftyState): QraftyQrCodeProps["value"] {
  if (state.valueSegments?.length) {
    return state.valueSegments.flatMap((segment) => {
      const trimmed = segment.trim()
      return trimmed ? [trimmed] : []
    })
  }

  return state.data.trim()
}

function mapModuleFillImage(state: QraftyState): string | undefined {
  if (state.dotsColorMode !== "image") {
    return undefined
  }

  return getAssetValue(state.moduleFillImage) || undefined
}

export function toQraftyQrConfig(state: QraftyState): QraftyQrCodeProps {
  const logo = mapLogo(state)
  const unifiedGradient =
    state.gradientLinkMode === "unified" && state.dotsColorMode === "gradient"
  const unifiedImage = state.dotsColorMode === "image" && Boolean(mapModuleFillImage(state))

  return {
    ...(state.ariaLabel ? { ariaLabel: state.ariaLabel } : {}),
    background: mapBackground(state),
    backgroundGradient: mapBackgroundGradient(state),
    boostLevel: state.qrOptions.boostLevel,
    colorMode: state.dotsColorMode,
    finderInner: state.finderPatternInnerSettings.type as QrFinderInnerStyle,
    finderOuter: state.finderPatternOuterSettings.type as QrFinderOuterStyle,
    finderInnerColor: state.finderPatternInnerSettings.color,
    finderOuterColor: state.finderPatternOuterSettings.color,
    finderInnerGradient: unifiedGradient
      ? "none"
      : mapQraftyGradient(
          state.finderPatternInnerGradient,
          state.finderPatternInnerGradient.enabled,
        ),
    finderOuterGradient: unifiedGradient
      ? "none"
      : mapQraftyGradient(
          state.finderPatternOuterGradient,
          state.finderPatternOuterGradient.enabled,
        ),
    foreground: state.dataModulesSettings.color,
    gradient: mapGradient(state),
    level: state.qrOptions.errorCorrectionLevel,
    margin: state.margin,
    minVersion: Math.max(1, state.qrOptions.typeNumber || 1),
    module: state.dataModulesSettings.type as QrModuleStyle,
    ...(state.dataModulesSettings.moduleSize !== undefined
      ? { moduleSize: state.dataModulesSettings.moduleSize }
      : {}),
    ...(state.dataModulesSettings.lineWidth !== undefined
      ? { moduleLineWidth: state.dataModulesSettings.lineWidth }
      : {}),
    moduleRoundSize: state.dataModulesSettings.roundSize,
    palette: state.dotsPalette,
    size: state.width,
    value: mapValue(state),
    ...(unifiedGradient ? { gradientMode: "unified" as const } : {}),
    ...(unifiedImage ? { gradientMode: "unified-image" as const } : {}),
    ...(mapModuleFillImage(state) ? { moduleFillImage: mapModuleFillImage(state) } : {}),
    ...(logo ? { logo } : {}),
  }
}
