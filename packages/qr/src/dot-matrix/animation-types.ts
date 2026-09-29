import type { QRCodeEntity } from "./animation-utils";

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
export type DotMatrixAnimationSampleInput = Omit<DotMatrixAnimationFrame, "targets">;

export type QRCodeAnimation = (
  targets: Element,
  modulePositionX: number,
  modulePositionY: number,
  count: number,
  entityType: QRCodeEntity,
  settings?: QRCodeAnimationSettings,
) => DotMatrixAnimationFrame;

export interface QRCodeAnimationSettings {
  animationSpeed?: number;
  dotMatrixColorMode?: "dual";
  dotMatrixOpacityBase?: number;
  dotMatrixOpacityMid?: number;
  dotMatrixOpacityPeak?: number;
  dotMatrixColorBase?: string;
  dotMatrixColorMid?: string;
  dotMatrixColorPeak?: string;
  preserveModuleFills?: boolean;
}

export const PRESERVE_MODULE_FILL = "__qr-preserve-module-fill__";

export function isPreserveModuleFill(fill: string | undefined | null) {
  return fill === PRESERVE_MODULE_FILL;
}

export enum AnimationPreset {
  ChevronSweep = "ChevronSweep",
  DiamondExpand = "DiamondExpand",
  FluxColumns = "FluxColumns",
  HeartExpand = "HeartExpand",
  NeonDrift = "NeonDrift",
  RadialExpand = "RadialExpand",
  StarExpand = "StarExpand",
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
