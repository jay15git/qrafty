const MARK_PREFIX = "qrafty-preview:"

export function markPreviewPerformance(label: string) {
  if (typeof performance === "undefined" || typeof performance.mark !== "function") {
    return
  }

  performance.mark(`${MARK_PREFIX}${label}`)
}

export function measurePreviewPerformance(name: string, startLabel: string, endLabel: string) {
  if (typeof performance === "undefined" || typeof performance.measure !== "function") {
    return
  }

  try {
    performance.measure(`${MARK_PREFIX}${name}`, `${MARK_PREFIX}${startLabel}`, `${MARK_PREFIX}${endLabel}`)
  } catch {
    // Marks can be missing when the measured path never ran.
  }
}

export const PREVIEW_PERF_MARKS = {
  drawerResizeBegin: "drawer-resize-begin",
  drawerResizeEnd: "drawer-resize-end",
  qrMarkupBuildBegin: "qr-markup-build-begin",
  qrMarkupBuildEnd: "qr-markup-build-end",
} as const
