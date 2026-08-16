"use client";

import { DotMatrixAnimatedSvg } from "@new-qr/qr/dot-matrix";
import { useMemo } from "react";

import {
  toDotMatrixQrConfig,
} from "@/features/qr-code/motion/dot-matrix-bridge";
import type { QrStudioState } from "@/features/qr-code/model/state";
import { cn } from "@/lib/utils";

export function DotMatrixAnimatedQr({
  canvasSvgMarkup,
  className,
  height,
  state,
  style,
  width,
}: {
  canvasSvgMarkup?: string | null;
  className?: string;
  height: number;
  state: QrStudioState;
  style?: React.CSSProperties;
  width: number;
}) {
  const config = useMemo(
    () => toDotMatrixQrConfig(state, { canvasSvgMarkup }),
    [canvasSvgMarkup, state],
  );

  if (!config.useExternalSvg) {
    return null;
  }

  return (
    <DotMatrixAnimatedSvg
      className={cn("max-h-none max-w-none", className)}
      height={height}
      preset={config.animationPreset}
      respectReducedMotion={config.respectReducedMotion}
      settings={{
        animationSpeed: config.animationSpeed,
        dotMatrixColorBase: config.dotMatrixColorBase,
        dotMatrixColorMid: config.dotMatrixColorMid,
        dotMatrixColorPeak: config.dotMatrixColorPeak,
        dotMatrixOpacityBase: config.dotMatrixOpacityBase,
        dotMatrixOpacityMid: config.dotMatrixOpacityMid,
        dotMatrixOpacityPeak: config.dotMatrixOpacityPeak,
        preserveModuleFills: config.preserveModuleFills,
      }}
      style={style}
      svgMarkup={config.externalSvg}
      width={width}
    />
  );
}
