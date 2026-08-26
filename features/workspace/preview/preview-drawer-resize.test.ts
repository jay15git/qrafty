import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { previewDrawerResize } from "@/features/workspace/preview/preview-drawer-resize"

describe("previewDrawerResize", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    previewDrawerResize.endResize()
    vi.useRealTimers()
  })

  it("marks resizing until endResize is called", () => {
    previewDrawerResize.beginResize()
    expect(previewDrawerResize.getIsResizing()).toBe(true)

    previewDrawerResize.endResize()
    expect(previewDrawerResize.getIsResizing()).toBe(false)
  })

  it("notifies ended listeners once when resize completes", () => {
    const onEnded = vi.fn()

    previewDrawerResize.subscribeOnEnded(onEnded)
    previewDrawerResize.beginResize()
    previewDrawerResize.endResize()

    expect(onEnded).toHaveBeenCalledTimes(1)
  })

  it("auto ends resize after the padding transition fallback window", () => {
    const onEnded = vi.fn()

    previewDrawerResize.subscribeOnEnded(onEnded)
    previewDrawerResize.beginResize()

    vi.advanceTimersByTime(320)

    expect(previewDrawerResize.getIsResizing()).toBe(false)
    expect(onEnded).toHaveBeenCalledTimes(1)
  })
})
