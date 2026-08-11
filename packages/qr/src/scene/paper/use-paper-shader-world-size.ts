"use client"

import { useMemo } from "react"

import { buildPaperShaderWorldSize, type PaperShaderWorldSize } from "../shaders/world-size"

/**
 * Prefer explicit document/layout bounds over measured CSS boxes.
 * Drafting canvas zoom changes contentRect; layer width/height stay correct.
 */
export function usePaperShaderWorldSize(
  layoutWidth?: number,
  layoutHeight?: number,
): PaperShaderWorldSize | null {
  return useMemo(
    () =>
      layoutWidth !== undefined && layoutHeight !== undefined
        ? buildPaperShaderWorldSize(layoutWidth, layoutHeight)
        : null,
    [layoutWidth, layoutHeight],
  )
}
