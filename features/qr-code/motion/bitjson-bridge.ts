import { adaptExternalQRCodeSVG } from "@new-qr/qr-internal/bitjson-vendor";
import { QRCodeSVG } from "qrcode.react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { annotateCanvasSvgForBitjson } from "@/features/qr-code/motion/canvas-svg-adapter";
import {
  DEFAULT_DOT_MATRIX_ANIMATION,
  MOTION_COLOR_SWATCHES,
  clampQrSize,
  getAssetValue,
  resolveBitjsonAutoAnimatePreset,
  resolveBitjsonMotionPreset,
  type QrDotMatrixAnimationOptions,
  type QrStudioState,
} from "@/features/qr-code/model/state";
import { sanitizeDraftingQrArtworkMarkup } from "@/features/workspace/rendering/qr-artwork";

export type BitjsonQrElementConfig = {
  animationPreset: string;
  animationSpeed: number;
  autoAnimate: string;
  autoAnimateInterval: number;
  contents: string;
  dotMatrixColorBase: string;
  dotMatrixColorMid: string;
  dotMatrixColorPeak: string;
  dotMatrixOpacityBase: number;
  dotMatrixOpacityMid: number;
  dotMatrixOpacityPeak: number;
  externalSvg: string;
  hoverColorMode: QrDotMatrixAnimationOptions["hoverColorMode"];
  hoverEffect: string;
  logoSrc?: string;
  moduleColor: string;
  motionIntensity: QrDotMatrixAnimationOptions["motionIntensity"];
  positionCenterColor: string;
  positionRingColor: string;
  respectReducedMotion: boolean;
  useExternalSvg: boolean;
};

function coerceNumber(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function resolveMotionColors(animation: QrDotMatrixAnimationOptions) {
  if (animation.colorPreset === "theme") {
    return {
      base: animation.customColorBase,
      mid: animation.customColorMid,
      peak: animation.customColorPeak,
    };
  }

  const [base, mid, peak] = MOTION_COLOR_SWATCHES[animation.colorPreset];

  return { base, mid, peak };
}

export function toQrcodeReactProps(state: QrStudioState) {
  const logoImage = getAssetValue(state.logo);
  const qrSize = clampQrSize(state.width);
  const logoSize = Math.max(
    1,
    Math.round(qrSize * coerceNumber(state.imageOptions.imageSize, 0, 1, 0.1)),
  );

  return {
    bgColor: state.backgroundOptions.transparent
      ? "#ffffff00"
      : state.backgroundOptions.color,
    fgColor: state.dataModulesSettings.color,
    imageSettings: logoImage
      ? {
          excavate: state.imageOptions.hideBackgroundDots,
          height: logoSize,
          src: logoImage,
          width: logoSize,
        }
      : undefined,
    level: state.qrOptions.errorCorrectionLevel,
    marginSize: Math.max(0, Math.floor(coerceNumber(state.margin, 0, 80, 12))),
    size: qrSize,
    value: state.data.trim() || "https://example.com",
  };
}

export function renderQrcodeReactSvg(state: QrStudioState) {
  return renderToStaticMarkup(createElement(QRCodeSVG, toQrcodeReactProps(state)));
}

export function adaptQrcodeReactSvgForBitjson(state: QrStudioState) {
  const externalSvg = renderQrcodeReactSvg(state);

  return adaptExternalQRCodeSVG(externalSvg, {
    moduleColor: state.dataModulesSettings.color,
    positionCenterColor: state.finderPatternInnerSettings.color,
    positionRingColor: state.finderPatternOuterSettings.color,
    squares: false,
  });
}

export function toBitjsonElementConfig(
  state: QrStudioState,
  options: { canvasSvgMarkup?: string | null } = {},
): BitjsonQrElementConfig {
  const animation = state.dotMatrixAnimation;
  const motionColors = resolveMotionColors(animation);
  const canvasSvgMarkup = options.canvasSvgMarkup?.trim();
  const adapted = canvasSvgMarkup
    ? annotateCanvasSvgForBitjson(sanitizeDraftingQrArtworkMarkup(canvasSvgMarkup), state)
    : adaptQrcodeReactSvgForBitjson(state);
  const logoSrc = getAssetValue(state.logo);

  return {
    animationPreset: resolveBitjsonMotionPreset(animation),
    animationSpeed: animation.speed / DEFAULT_DOT_MATRIX_ANIMATION.speed,
    autoAnimate: resolveBitjsonAutoAnimatePreset(animation),
    autoAnimateInterval: animation.autoAnimateInterval,
    contents: state.data.trim() || "https://example.com",
    dotMatrixColorBase: motionColors.base,
    dotMatrixColorMid: motionColors.mid,
    dotMatrixColorPeak: motionColors.peak,
    dotMatrixOpacityBase: animation.opacityBase,
    dotMatrixOpacityMid: animation.opacityMid,
    dotMatrixOpacityPeak: animation.opacityPeak,
    externalSvg: adapted?.svg ?? "",
    hoverColorMode: animation.hoverColorMode,
    hoverEffect: animation.hoverEffect,
    logoSrc,
    moduleColor: state.dataModulesSettings.color,
    motionIntensity: animation.motionIntensity,
    positionCenterColor: state.finderPatternInnerSettings.color,
    positionRingColor: state.finderPatternOuterSettings.color,
    respectReducedMotion: animation.respectReducedMotion,
    useExternalSvg: Boolean(adapted?.svg),
  };
}

export function shouldUseBitjsonMotionPreview(state: QrStudioState) {
  return state.dotMatrixAnimation.enabled && state.dotMatrixAnimation.animated;
}
