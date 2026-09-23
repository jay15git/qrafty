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
  FadeInTopDown,
  FadeInCenterOut,
  MaterializeIn,
  SoftMaterialize,
  SubtlePulse,
  FinderPing,
  CenterBloom,
  CornerSweep,
  RadialRipple,
  OrbitReveal,
  DiamondGlint,
  SignalScan,
  ConfettiPop,
  SpiralBloom,
  BubbleCascade,
  KaleidoPulse,
  FireflyTwinkle,
  MagneticRipple,
  ParallaxTiles,
  ConstellationTrace,
  ApertureReveal,
  LensFocus,
  ReceiptPrint,
  FlipClock,
  WaveInterference,
  QuantumMaterialize,
  MagneticSnap,
  HoloFlicker,
  SignalGlitch,
  ShockwaveJolt,
  TideRise,
  GravityCollapse,
  NeonDrift,
  FluxColumns,
  RadialExpand,
  DiamondExpand,
  HeartExpand,
  StarExpand,
  ChevronSweep,
  RadialRippleIn,
} from "./animation-presets";

const ANIMATION_PRESET_MAP: Record<AnimationPreset, QRCodeAnimation> = {
  [AnimationPreset.FadeInTopDown]: FadeInTopDown,
  [AnimationPreset.FadeInCenterOut]: FadeInCenterOut,
  [AnimationPreset.RadialRipple]: RadialRipple,
  [AnimationPreset.RadialRippleIn]: RadialRippleIn,
  [AnimationPreset.MaterializeIn]: MaterializeIn,
  [AnimationPreset.SubtlePulse]: SubtlePulse,
  [AnimationPreset.FinderPing]: FinderPing,
  [AnimationPreset.SoftMaterialize]: SoftMaterialize,
  [AnimationPreset.CenterBloom]: CenterBloom,
  [AnimationPreset.CornerSweep]: CornerSweep,
  [AnimationPreset.OrbitReveal]: OrbitReveal,
  [AnimationPreset.DiamondGlint]: DiamondGlint,
  [AnimationPreset.SignalScan]: SignalScan,
  [AnimationPreset.ConfettiPop]: ConfettiPop,
  [AnimationPreset.SpiralBloom]: SpiralBloom,
  [AnimationPreset.BubbleCascade]: BubbleCascade,
  [AnimationPreset.KaleidoPulse]: KaleidoPulse,
  [AnimationPreset.FireflyTwinkle]: FireflyTwinkle,
  [AnimationPreset.MagneticRipple]: MagneticRipple,
  [AnimationPreset.ParallaxTiles]: ParallaxTiles,
  [AnimationPreset.ConstellationTrace]: ConstellationTrace,
  [AnimationPreset.ApertureReveal]: ApertureReveal,
  [AnimationPreset.LensFocus]: LensFocus,
  [AnimationPreset.ReceiptPrint]: ReceiptPrint,
  [AnimationPreset.FlipClock]: FlipClock,
  [AnimationPreset.WaveInterference]: WaveInterference,
  [AnimationPreset.QuantumMaterialize]: QuantumMaterialize,
  [AnimationPreset.MagneticSnap]: MagneticSnap,
  [AnimationPreset.HoloFlicker]: HoloFlicker,
  [AnimationPreset.SignalGlitch]: SignalGlitch,
  [AnimationPreset.ShockwaveJolt]: ShockwaveJolt,
  [AnimationPreset.TideRise]: TideRise,
  [AnimationPreset.GravityCollapse]: GravityCollapse,
  [AnimationPreset.NeonDrift]: NeonDrift,
  [AnimationPreset.FluxColumns]: FluxColumns,
  [AnimationPreset.EchoRing]: RadialExpand,
  [AnimationPreset.OriginWave]: RadialExpand,
  [AnimationPreset.CrossBloom]: RadialExpand,
  [AnimationPreset.RadialExpand]: RadialExpand,
  [AnimationPreset.FanRotate]: NeonDrift,
  [AnimationPreset.Tunnel]: NeonDrift,
  [AnimationPreset.Wave]: NeonDrift,
  [AnimationPreset.Scan]: NeonDrift,
  [AnimationPreset.DiamondExpand]: DiamondExpand,
  [AnimationPreset.HeartExpand]: HeartExpand,
  [AnimationPreset.StarExpand]: StarExpand,
  [AnimationPreset.ChevronSweep]: ChevronSweep,
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
