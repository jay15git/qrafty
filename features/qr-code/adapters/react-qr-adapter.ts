import type { QrGradientSettings, QrFinderPatternInnerStyle, ReactQRCodeProps } from "@/features/qr-code/model/types";
import {
  clampQrBackgroundRound,
  clampQrSize,
  getAssetValue,
  hasActiveBackgroundShapeOptions,
  type QraftyState,
  type QraftyCornerDotStyle,
  type QraftyGradient,
} from "@/features/qr-code/model/state";
import { isCustomCornerDotShape } from "@/features/qr-code/styles/custom-corner-dot-shapes";

export function toReactQrCodeProps(state: QraftyState): ReactQRCodeProps {
  const logoImage = getAssetValue(state.logo);
  const backgroundImage = getAssetValue(state.backgroundImage);
  const customBackgroundSurfaceActive =
    !backgroundImage &&
    (state.backgroundShapeId !== "none" ||
      hasActiveBackgroundShapeOptions(state.backgroundShapeOptions));
  const qrSize = clampQrSize(state.width);
  const marginFactor = 1 - coerceNumber(state.imageOptions.margin, 0, 40, 0) / qrSize;
  const ratioSize = Math.max(
    0,
    coerceNumber(state.imageOptions.imageSize, 0, 1, 0.1) * marginFactor,
  );
  const defaultLogoSize = Math.max(1, Math.round(qrSize * ratioSize));
  const unifiedGradient =
    state.gradientLinkMode === "unified" &&
    state.dotsColorMode === "gradient" &&
    state.dataModulesGradient.enabled
  const unifiedImage =
    state.dotsColorMode === "image" && Boolean(getAssetValue(state.moduleFillImage))
  const unifiedFill = unifiedGradient || unifiedImage

  return {
    background:
      backgroundImage || customBackgroundSurfaceActive || state.backgroundOptions.transparent
        ? "transparent"
        : buildGradient(state.backgroundGradient) ?? state.backgroundOptions.color,
    boostLevel: state.qrOptions.boostLevel,
    dataModulesSettings: {
      color: getDotsColor(state, unifiedFill),
      randomSize: !state.dataModulesSettings.roundSize,
      style: state.dataModulesSettings.type,
      ...(state.dataModulesSettings.moduleSize !== undefined
        ? { size: state.dataModulesSettings.moduleSize }
        : {}),
      ...(state.dataModulesSettings.lineWidth !== undefined
        ? { lineWidth: state.dataModulesSettings.lineWidth }
        : {}),
    },
    finderPatternInnerSettings: {
      color: unifiedFill ? undefined : state.finderPatternInnerSettings.color,
      style: resolveFinderInnerStyle(state.finderPatternInnerSettings.type),
    },
    finderPatternOuterSettings: {
      color: unifiedFill ? undefined : state.finderPatternOuterSettings.color,
      style: state.finderPatternOuterSettings.type,
    },
    gradient: unifiedGradient ? buildGradient(state.dataModulesGradient) : undefined,
    imageSettings: logoImage
      ? {
          crossOrigin: state.imageOptions.crossOrigin || undefined,
          excavate: state.imageOptions.hideBackgroundDots,
          height:
            state.imageOptions.sizeMode === "pixels" && state.imageOptions.heightPx !== undefined
              ? Math.max(1, state.imageOptions.heightPx)
              : state.imageOptions.sizeMode === "pixels" && state.imageOptions.widthPx !== undefined
                ? Math.max(1, state.imageOptions.widthPx)
                : defaultLogoSize,
          opacity: state.imageOptions.opacity,
          src: logoImage,
          width:
            state.imageOptions.sizeMode === "pixels" && state.imageOptions.widthPx !== undefined
              ? Math.max(1, state.imageOptions.widthPx)
              : defaultLogoSize,
          ...(state.imageOptions.logoPositionMode === "custom" && state.imageOptions.x !== undefined
            ? { x: state.imageOptions.x }
            : {}),
          ...(state.imageOptions.logoPositionMode === "custom" && state.imageOptions.y !== undefined
            ? { y: state.imageOptions.y }
            : {}),
        }
      : undefined,
    level: state.qrOptions.errorCorrectionLevel,
    marginSize: Math.max(0, Math.floor(coerceNumber(state.margin, 0, 80, 12))),
    minVersion: Math.max(1, state.qrOptions.typeNumber || 1),
    size: qrSize,
    svgProps: {
      ...(state.ariaLabel ? { "aria-label": state.ariaLabel } : {}),
      xmlns: "http://www.w3.org/2000/svg",
      style: {
        borderRadius: `${clampQrBackgroundRound(state.backgroundOptions.round) * 100}%`,
        display: "block",
        height: "100%",
        width: "100%",
      },
    },
    value: state.valueSegments?.length
      ? state.valueSegments.flatMap((segment) => {
          const trimmed = segment.trim()
          return trimmed ? [trimmed] : []
        })
      : state.data.trim(),
  };
}

function resolveFinderInnerStyle(type: QraftyCornerDotStyle): QrFinderPatternInnerStyle {
  return isCustomCornerDotShape(type) ? "square" : type;
}

function getDotsColor(state: QraftyState, unifiedFill: boolean) {
  if (unifiedFill || state.dotsColorMode !== "solid") {
    return undefined;
  }

  return state.dataModulesSettings.color;
}

function buildGradient(gradient: QraftyGradient): QrGradientSettings | undefined {
  if (!gradient.enabled) {
    return undefined;
  }

  return {
    type: gradient.type,
    rotation: gradient.rotation,
    stops: gradient.colorStops.map((stop) => ({
      offset: String(coerceNumber(stop.offset, 0, 1, 0)),
      color: stop.color,
    })),
  };
}

function coerceNumber(
  value: number,
  min: number,
  max: number,
  fallback: number,
) {
  if (Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}
