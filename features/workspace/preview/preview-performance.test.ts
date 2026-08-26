import { afterEach, describe, expect, it, vi } from "vitest"

import {
  markPreviewPerformance,
  measurePreviewPerformance,
  PREVIEW_PERF_MARKS,
} from "@/features/workspace/preview/preview-performance"

describe("preview performance marks", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("records drawer resize and qr markup build marks for phone profiling", () => {
    const mark = vi.fn()
    const measure = vi.fn()

    vi.stubGlobal("performance", {
      mark,
      measure,
    })

    markPreviewPerformance(PREVIEW_PERF_MARKS.drawerResizeBegin)
    markPreviewPerformance(PREVIEW_PERF_MARKS.drawerResizeEnd)
    measurePreviewPerformance(
      "drawer-resize",
      PREVIEW_PERF_MARKS.drawerResizeBegin,
      PREVIEW_PERF_MARKS.drawerResizeEnd,
    )

    markPreviewPerformance(PREVIEW_PERF_MARKS.qrMarkupBuildBegin)
    markPreviewPerformance(PREVIEW_PERF_MARKS.qrMarkupBuildEnd)
    measurePreviewPerformance(
      "qr-markup-build",
      PREVIEW_PERF_MARKS.qrMarkupBuildBegin,
      PREVIEW_PERF_MARKS.qrMarkupBuildEnd,
    )

    expect(mark).toHaveBeenCalledWith("qrafty-preview:drawer-resize-begin")
    expect(mark).toHaveBeenCalledWith("qrafty-preview:qr-markup-build-end")
    expect(measure).toHaveBeenCalledWith(
      "qrafty-preview:drawer-resize",
      "qrafty-preview:drawer-resize-begin",
      "qrafty-preview:drawer-resize-end",
    )
  })
})
