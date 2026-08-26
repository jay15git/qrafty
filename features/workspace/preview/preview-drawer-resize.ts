import {
  markPreviewPerformance,
  measurePreviewPerformance,
  PREVIEW_PERF_MARKS,
} from "@/features/workspace/preview/preview-performance"

type PreviewDrawerResizeListener = () => void

const RESIZE_FALLBACK_MS = 320

let isResizing = false
let resizeFallbackTimer: ReturnType<typeof setTimeout> | null = null
const resizeListeners = new Set<PreviewDrawerResizeListener>()
const resizeEndedListeners = new Set<PreviewDrawerResizeListener>()

function notifyResizeListeners() {
  for (const listener of resizeListeners) {
    listener()
  }
}

function notifyResizeEndedListeners() {
  for (const listener of resizeEndedListeners) {
    listener()
  }
}

function scheduleResizeFallback() {
  clearResizeFallbackTimer()
  resizeFallbackTimer = globalThis.setTimeout(() => {
    previewDrawerResize.endResize()
  }, RESIZE_FALLBACK_MS)
}

function clearResizeFallbackTimer() {
  if (resizeFallbackTimer !== null) {
    globalThis.clearTimeout(resizeFallbackTimer)
    resizeFallbackTimer = null
  }
}

export const previewDrawerResize = {
  beginResize() {
    if (isResizing) {
      scheduleResizeFallback()
      return
    }

    isResizing = true
    markPreviewPerformance(PREVIEW_PERF_MARKS.drawerResizeBegin)
    notifyResizeListeners()
    scheduleResizeFallback()
  },
  endResize() {
    if (!isResizing) {
      return
    }

    clearResizeFallbackTimer()
    isResizing = false
    markPreviewPerformance(PREVIEW_PERF_MARKS.drawerResizeEnd)
    measurePreviewPerformance(
      "drawer-resize",
      PREVIEW_PERF_MARKS.drawerResizeBegin,
      PREVIEW_PERF_MARKS.drawerResizeEnd,
    )
    notifyResizeListeners()
    notifyResizeEndedListeners()
  },
  getIsResizing() {
    return isResizing
  },
  subscribe(listener: PreviewDrawerResizeListener) {
    resizeListeners.add(listener)

    return () => {
      resizeListeners.delete(listener)
    }
  },
  subscribeOnEnded(listener: PreviewDrawerResizeListener) {
    resizeEndedListeners.add(listener)

    return () => {
      resizeEndedListeners.delete(listener)
    }
  },
}
