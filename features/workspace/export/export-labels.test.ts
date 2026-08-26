import { describe, expect, it } from "vitest"

import {
  formatScaledExportSummary,
  resolveActiveExportDimensions,
} from "@/features/workspace/export/export-labels"
import { clampExportScale } from "@/features/workspace/export/export-scale"
import { resolveScaledExportDimensions } from "@/features/workspace/export/pipeline/bounds"

describe("export labels", () => {
  it("resolves scaled export dimensions from artboard size", () => {
    expect(
      resolveActiveExportDimensions({
        artboardHeight: 1920,
        artboardWidth: 1080,
        exportScale: 2,
      }),
    ).toEqual({ width: 2160, height: 3840 })
  })

  it("formats scaled export summaries", () => {
    expect(formatScaledExportSummary(2, 1080, 1920)).toBe("2x — 2160 × 3840 px")
  })
})

describe("export scale", () => {
  it("clamps export scale to supported multipliers", () => {
    expect(clampExportScale(0)).toBe(1)
    expect(clampExportScale(3.6)).toBe(4)
    expect(clampExportScale(9)).toBe(4)
  })

  it("clamps oversized scaled exports to the max dimension", () => {
    expect(resolveScaledExportDimensions(1080, 1920, 4)).toEqual({
      width: 2304,
      height: 4096,
    })
  })
})
