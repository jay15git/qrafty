"use client";

import { adaptExternalQRCodeSVG } from "@qrafty/qr/dot-matrix";
import { QRCodeSVG } from "qrcode.react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server.browser";

import { adaptCanvasSvgMarkupForDotMatrixMotion } from "@/features/qr-code/motion/canvas-svg-adapter";
import {
  resolveMotionColors,
  resolveMotionOpacityAnchors,
} from "@/features/qr-code/motion/motion-color";
import {
  DEFAULT_DOT_MATRIX_ANIMATION,
  clampQrSize,
  getAssetValue,
  isScaleOnlyDotMatrixLoader,
  resolveDotMatrixMotionPreset,
  type QrDotMatrixAnimationOptions,
  type QraftyState,
} from "@/features/qr-code/model/state";
import { sanitizeDraftingQrArtworkMarkup } from "@/features/workspace/rendering/qr-artwork";

export type DotMatrixQrConfig = {
  animationPreset: string;
  animationSpeed: number;
  contents: string;
  dotMatrixColorBase: string;
  dotMatrixColorMid: string;
  dotMatrixColorPeak: string;
  dotMatrixOpacityBase: number;
  dotMatrixOpacityMid: number;
  dotMatrixOpacityPeak: number;
  externalSvg: string;
  logoSrc?: string;
  moduleColor: string;
  positionCenterColor: string;
  positionRingColor: string;
  respectReducedMotion: boolean;
  useExternalSvg: boolean;
  preserveModuleFills: boolean;
};

function coerceNumber(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}


export function toQrcodeReactProps(state: QraftyState) {
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

export function renderQrcodeReactSvg(state: QraftyState) {
  return renderToStaticMarkup(createElement(QRCodeSVG, toQrcodeReactProps(state)));
}

export function adaptQrcodeReactSvgForDotMatrix(state: QraftyState) {
  const externalSvg = renderQrcodeReactSvg(state);

  return adaptExternalQRCodeSVG(externalSvg, {
    moduleColor: state.dataModulesSettings.color,
    positionCenterColor: state.finderPatternInnerSettings.color,
    positionRingColor: state.finderPatternOuterSettings.color,
    squares: false,
  });
}


export function toDotMatrixQrConfig(
  state: QraftyState,
  options: { canvasSvgMarkup?: string | null } = {},
): DotMatrixQrConfig {
  const animation = state.dotMatrixAnimation;
  const qrModuleColor = state.dataModulesSettings.color;
  const motionColors = resolveMotionColors(animation, qrModuleColor);
  const motionOpacity = resolveMotionOpacityAnchors(animation, qrModuleColor);
  const scaleOnlyMotion = isScaleOnlyDotMatrixLoader(animation.loader);
  const canvasSvgMarkup = options.canvasSvgMarkup?.trim();
  const adapted = canvasSvgMarkup
    ? adaptCanvasSvgMarkupForDotMatrixMotion(sanitizeDraftingQrArtworkMarkup(canvasSvgMarkup), state)
    : adaptQrcodeReactSvgForDotMatrix(state);
  const logoSrc = getAssetValue(state.logo);

  return {
    animationPreset: resolveDotMatrixMotionPreset(animation),
    animationSpeed: animation.speed / DEFAULT_DOT_MATRIX_ANIMATION.speed,
    contents: state.data.trim() || "https://example.com",
    dotMatrixColorBase: motionColors.base,
    dotMatrixColorMid: scaleOnlyMotion ? motionColors.base : motionColors.accent,
    dotMatrixColorPeak: scaleOnlyMotion ? motionColors.base : motionColors.accent,
    dotMatrixOpacityBase: motionOpacity.base,
    dotMatrixOpacityMid: motionOpacity.base,
    dotMatrixOpacityPeak: scaleOnlyMotion ? motionOpacity.base : motionOpacity.peak,
    externalSvg: adapted?.svg ?? "",
    logoSrc,
    moduleColor: state.dataModulesSettings.color,
    positionCenterColor: state.finderPatternInnerSettings.color,
    positionRingColor: state.finderPatternOuterSettings.color,
    preserveModuleFills: state.dotsColorMode !== "solid",
    respectReducedMotion: animation.respectReducedMotion,
    useExternalSvg: Boolean(adapted?.svg),
  };
}

export function shouldUseDotMatrixMotionPreview(state: QraftyState) {
  return state.dotMatrixAnimation.enabled && state.dotMatrixAnimation.animated;
}
