export {
  remapOpacityToTriplet,
  SOURCE_BASE_OPACITY,
  SOURCE_MID_OPACITY,
  SOURCE_PEAK_OPACITY,
} from "./opacity-triplet";

export { QRCodeEntity } from "./animation-utils";

export {
  PRESERVE_MODULE_FILL,
  isPreserveModuleFill,
  AnimationPreset,
  dotMatrixAnimationPresets,
} from "./animation-types";
export type {
  DotMatrixAnimationFrame,
  DotMatrixShapeReveal,
  DotMatrixAnimationSampleInput,
  QRCodeAnimation,
  QRCodeAnimationSettings,
  DotMatrixSample,
} from "./animation-types";

export { keyframeOpacityAt, sampleDotMatrixAnimationFrame } from "./animation-keyframes";

export { resolveDotMatrixKeyframeOpacity } from "./animation-settings";

import { AnimationPreset, dotMatrixAnimationPresets } from "./animation-types";
import type { QRCodeAnimation } from "./animation-types";
import { wrapPreset } from "./animation-settings";
import {
  NeonDrift,
  FluxColumns,
  RadialExpand,
  DiamondExpand,
  HeartExpand,
  StarExpand,
  ChevronSweep,
} from "./animation-presets";

const ANIMATION_PRESET_MAP: Record<AnimationPreset, QRCodeAnimation> = {
  [AnimationPreset.ChevronSweep]: ChevronSweep,
  [AnimationPreset.DiamondExpand]: DiamondExpand,
  [AnimationPreset.FluxColumns]: FluxColumns,
  [AnimationPreset.HeartExpand]: HeartExpand,
  [AnimationPreset.NeonDrift]: NeonDrift,
  [AnimationPreset.RadialExpand]: RadialExpand,
  [AnimationPreset.StarExpand]: StarExpand,
};

const resolveAnimationPreset = (name: string) => {
  const animation = ANIMATION_PRESET_MAP[name as AnimationPreset];
  if (!animation) {
    throw new Error(`${name} is not a valid AnimationPreset.`);
  }
  return animation;
};

export const getAnimationPreset = (name: string) => {
  const presetName = name as AnimationPreset;
  return wrapPreset(
    resolveAnimationPreset(name),
    dotMatrixAnimationPresets.indexOf(presetName) > -1,
    presetName,
  );
};
