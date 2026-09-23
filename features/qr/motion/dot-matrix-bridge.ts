"use client";

import { adaptCanvasSvgMarkupForDotMatrixMotion } from "@/features/qr/motion/canvas-svg-adapter";

import { renderDashboardQrSvgMarkup } from "@/features/qr/rendering/qr-svg";
import {
  resolveMotionColors,
  resolveMotionOpacityAnchors,
} from "@/features/qr/motion/motion-color";
import {
  DEFAULT_DOT_MATRIX_ANIMATION,
  clampQrSize,
  getAssetValue,
  resolveDotMatrixMotionPreset,
  type QrDotMatrixAnimationOptions,
  type QraftyState,
} from "@/features/qr/model/state";
import {
  createDraftingQrArtworkState,
  sanitizeDraftingQrArtworkMarkup,
} from "@/features/canvas/rendering/qr-artwork";

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

function renderDotMatrixSourceSvg(state: QraftyState) {
  return renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state));
}

export function toDotMatrixQrConfig(
  state: QraftyState,
  options: { canvasSvgMarkup?: string | null } = {},
): DotMatrixQrConfig {
  const animation = state.dotMatrixAnimation;
  const qrModuleColor = state.dataModulesSettings.color;
  const motionColors = resolveMotionColors(animation, qrModuleColor);
  const motionOpacity = resolveMotionOpacityAnchors(animation, qrModuleColor);
  const canvasSvgMarkup = options.canvasSvgMarkup?.trim();
  const adapted = canvasSvgMarkup
    ? adaptCanvasSvgMarkupForDotMatrixMotion(
        sanitizeDraftingQrArtworkMarkup(canvasSvgMarkup),
        state,
      )
    : adaptCanvasSvgMarkupForDotMatrixMotion(renderDotMatrixSourceSvg(state), state);
  const logoSrc = getAssetValue(state.logo);

  return {
    animationPreset: resolveDotMatrixMotionPreset(animation),
    animationSpeed: animation.speed / DEFAULT_DOT_MATRIX_ANIMATION.speed,
    contents: state.data.trim() || "https://example.com",
    dotMatrixColorBase: motionColors.base,
    dotMatrixColorMid: motionColors.accent,
    dotMatrixColorPeak: motionColors.accent,
    dotMatrixOpacityBase: motionOpacity.base,
    dotMatrixOpacityMid: motionOpacity.base,
    dotMatrixOpacityPeak: motionOpacity.peak,
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
  return (
    state.dotMatrixAnimation.enabled &&
    state.dotMatrixAnimation.animated &&
    state.dotMatrixAnimation.presetCategory === "dotMatrix"
  );
}
