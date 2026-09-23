import type { QRCodeEntity } from './animation-utils';

export type DotMatrixAnimationFrame = {
  targets: Element;
  from?: number;
  duration?: number;
  easing?: string;
  web?: {
    opacity?: unknown;
    opacityMultiplier?: unknown;
    fill?: unknown;
    scale?: unknown;
    x?: unknown;
    y?: unknown;
    rotate?: unknown;
    filter?: unknown;
    shapeReveal?: DotMatrixShapeReveal;
  };
};

export type DotMatrixShapeReveal = {
  edgeWidth?: number;
  maxMetric: number;
  metric: number;
};

/** Frame fields consumed by sampling; the animation target is not needed. */
export type DotMatrixAnimationSampleInput = Omit<
  DotMatrixAnimationFrame,
  'targets'
>;

export type QRCodeAnimation = (
  targets: Element,
  modulePositionX: number,
  modulePositionY: number,
  count: number,
  entityType: QRCodeEntity,
  settings?: QRCodeAnimationSettings
) => DotMatrixAnimationFrame;

export interface QRCodeAnimationSettings {
  animationSpeed?: number;
  dotMatrixColorMode?: 'dual';
  dotMatrixOpacityBase?: number;
  dotMatrixOpacityMid?: number;
  dotMatrixOpacityPeak?: number;
  dotMatrixColorBase?: string;
  dotMatrixColorMid?: string;
  dotMatrixColorPeak?: string;
  preserveModuleFills?: boolean;
}

export const PRESERVE_MODULE_FILL = '__qr-preserve-module-fill__';

export function isPreserveModuleFill(fill: string | undefined | null) {
  return fill === PRESERVE_MODULE_FILL;
}

export enum AnimationPreset {
  FadeInTopDown = 'FadeInTopDown',
  FadeInCenterOut = 'FadeInCenterOut',
  RadialRipple = 'RadialRipple',
  RadialRippleIn = 'RadialRippleIn',
  MaterializeIn = 'MaterializeIn',
  SubtlePulse = 'SubtlePulse',
  FinderPing = 'FinderPing',
  SoftMaterialize = 'SoftMaterialize',
  CenterBloom = 'CenterBloom',
  CornerSweep = 'CornerSweep',
  OrbitReveal = 'OrbitReveal',
  DiamondGlint = 'DiamondGlint',
  SignalScan = 'SignalScan',
  ConfettiPop = 'ConfettiPop',
  SpiralBloom = 'SpiralBloom',
  BubbleCascade = 'BubbleCascade',
  KaleidoPulse = 'KaleidoPulse',
  FireflyTwinkle = 'FireflyTwinkle',
  MagneticRipple = 'MagneticRipple',
  ParallaxTiles = 'ParallaxTiles',
  ConstellationTrace = 'ConstellationTrace',
  ApertureReveal = 'ApertureReveal',
  LensFocus = 'LensFocus',
  ReceiptPrint = 'ReceiptPrint',
  FlipClock = 'FlipClock',
  WaveInterference = 'WaveInterference',
  QuantumMaterialize = 'QuantumMaterialize',
  MagneticSnap = 'MagneticSnap',
  HoloFlicker = 'HoloFlicker',
  SignalGlitch = 'SignalGlitch',
  ShockwaveJolt = 'ShockwaveJolt',
  TideRise = 'TideRise',
  GravityCollapse = 'GravityCollapse',
  NeonDrift = 'NeonDrift',
  FluxColumns = 'FluxColumns',
  EchoRing = 'EchoRing',
  OriginWave = 'OriginWave',
  RadialExpand = 'RadialExpand',
  FanRotate = 'FanRotate',
  Tunnel = 'Tunnel',
  Wave = 'Wave',
  Scan = 'Scan',
  DiamondExpand = 'DiamondExpand',
  HeartExpand = 'HeartExpand',
  StarExpand = 'StarExpand',
  CrossBloom = 'CrossBloom',
  ChevronSweep = 'ChevronSweep',
}

export const dotMatrixAnimationPresets = [
  AnimationPreset.NeonDrift,
  AnimationPreset.RadialExpand,
  AnimationPreset.DiamondExpand,
  AnimationPreset.HeartExpand,
  AnimationPreset.StarExpand,
  AnimationPreset.ChevronSweep,
  AnimationPreset.FluxColumns,
];

export type DotMatrixSample = {
  opacity: number;
  fill?: string;
  opacityMultiplier?: number;
  scale?: number;
  x?: number;
  y?: number;
  rotate?: number;
};
