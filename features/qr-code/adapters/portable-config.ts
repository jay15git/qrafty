import {
  getAssetValue,
  hasActiveBackgroundShapeOptions,
  resolveBitjsonMotionPreset,
  type QrStudioState,
} from "@/features/qr-code/model/state"
import type {
  NewQrCodeProps,
  QrFinderInnerStyle,
  QrFinderOuterStyle,
  QrModuleStyle,
} from "@new-qr/qr"

function mapBackground(state: QrStudioState): NewQrCodeProps["background"] {
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

function mapStudioGradient(
  gradient: QrStudioState["dataModulesGradient"],
  enabled: boolean,
): NewQrCodeProps["gradient"] {
  if (!enabled || !gradient.enabled) {
    return "none"
  }

  return {
    type: gradient.type,
    rotation: gradient.rotation,
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

function mapBackgroundGradient(state: QrStudioState): NewQrCodeProps["backgroundGradient"] {
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

  return mapStudioGradient(state.backgroundGradient, state.backgroundGradient.enabled)
}

function mapGradient(state: QrStudioState): NewQrCodeProps["gradient"] {
  if (state.dotsColorMode !== "gradient") {
    return "none"
  }

  return mapStudioGradient(state.dataModulesGradient, true)
}

function mapLogo(state: QrStudioState): NewQrCodeProps["logo"] | undefined {
  const src = getAssetValue(state.logo)
  if (!src) {
    return undefined
  }

  const logo: NonNullable<NewQrCodeProps["logo"]> = {
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

function mapMotion(state: QrStudioState): Pick<NewQrCodeProps, "motion" | "motionPreset"> {
  if (!state.dotMatrixAnimation.enabled || !state.dotMatrixAnimation.animated) {
    return { motion: "none" }
  }

  return {
    motion: "bitjson",
    motionPreset: resolveBitjsonMotionPreset(state.dotMatrixAnimation),
  }
}

function mapValue(state: QrStudioState): NewQrCodeProps["value"] {
  if (state.valueSegments?.length) {
    return state.valueSegments.map((segment) => segment.trim()).filter(Boolean)
  }

  return state.data.trim()
}

export function toPortableQrConfig(state: QrStudioState): NewQrCodeProps {
  const logo = mapLogo(state)
  const motion = mapMotion(state)
  const unifiedGradient =
    state.gradientLinkMode === "unified" && state.dotsColorMode === "gradient"

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
      : mapStudioGradient(
          state.finderPatternInnerGradient,
          state.finderPatternInnerGradient.enabled,
        ),
    finderOuterGradient: unifiedGradient
      ? "none"
      : mapStudioGradient(
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
    motion: motion.motion,
    motionPreset: motion.motionPreset,
    palette: state.dotsPalette,
    size: state.width,
    value: mapValue(state),
    ...(unifiedGradient ? { gradientMode: "unified" as const } : {}),
    ...(logo ? { logo } : {}),
  }
}
