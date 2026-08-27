/**
 * @vitest-environment jsdom
 */
import { createElement, useState } from "react"
import { act } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  resetPersistedElementScrollForTests,
  resolveScrollPersistKey,
  usePersistedElementScroll,
} from "@/lib/persisted-element-scroll"
import { renderWithJsdomRoot } from "@/test-utils/jsdom-react-root"

type ScrollSize = {
  clientWidth: number
  clientHeight: number
  scrollWidth: number
  scrollHeight: number
}

function mockWritableScroll(element: HTMLElement, size: ScrollSize) {
  let left = 0
  let top = 0

  Object.defineProperties(element, {
    clientWidth: { configurable: true, get: () => size.clientWidth },
    clientHeight: { configurable: true, get: () => size.clientHeight },
    scrollWidth: { configurable: true, get: () => size.scrollWidth },
    scrollHeight: { configurable: true, get: () => size.scrollHeight },
    scrollLeft: {
      configurable: true,
      get: () => left,
      set: (value: number) => {
        const max = Math.max(0, size.scrollWidth - size.clientWidth)
        left = Math.min(Math.max(0, Number(value)), max)
      },
    },
    scrollTop: {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        const max = Math.max(0, size.scrollHeight - size.clientHeight)
        top = Math.min(Math.max(0, Number(value)), max)
      },
    },
  })
}

function PersistProbe({
  persistKey,
  size,
}: {
  persistKey: string
  size: ScrollSize
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  usePersistedElementScroll(node, persistKey)

  return createElement("div", {
    "data-persist-probe": true,
    ref: (element: HTMLDivElement | null) => {
      if (element) {
        mockWritableScroll(element, size)
      }
      setNode(element)
    },
  })
}

const overflowing: ScrollSize = {
  clientWidth: 200,
  clientHeight: 80,
  scrollWidth: 800,
  scrollHeight: 80,
}

const collapsed: ScrollSize = {
  clientWidth: 200,
  clientHeight: 80,
  scrollWidth: 200,
  scrollHeight: 80,
}

afterEach(() => {
  resetPersistedElementScrollForTests()
  vi.unstubAllGlobals()
})

describe("resolveScrollPersistKey", () => {
  it("prefixes persistKey with the settings scope", () => {
    expect(
      resolveScrollPersistKey({
        persistKey: "qr-background-shapes",
        scope: "settings:Shape",
        reactId: ":r1:",
      }),
    ).toBe("settings:Shape:qr-background-shapes")
  })

  it("prefixes data-slot with the nearest scope", () => {
    expect(
      resolveScrollPersistKey({
        dataSlot: "desktop-shape-preset-shelf-scroll-area",
        scope: "settings:Shape",
        reactId: ":r1:",
      }),
    ).toBe("settings:Shape:desktop-shape-preset-shelf-scroll-area")
  })
})

describe("usePersistedElementScroll", () => {
  it("restores scroll after remount with the same key", () => {
    const { container, rerender } = renderWithJsdomRoot(
      createElement(PersistProbe, { persistKey: "shape-row", size: overflowing }),
    )

    const first = container.querySelector("[data-persist-probe]") as HTMLDivElement
    first.scrollLeft = 240
    act(() => {
      first.dispatchEvent(new Event("scroll"))
    })

    rerender(createElement("div"))
    rerender(createElement(PersistProbe, { persistKey: "shape-row", size: overflowing }))

    const second = container.querySelector("[data-persist-probe]") as HTMLDivElement
    expect(second.scrollLeft).toBe(240)
  })

  it("does not overwrite a stored offset when overflow collapses on unmount", () => {
    const { container, rerender } = renderWithJsdomRoot(
      createElement(PersistProbe, { persistKey: "drawer-row", size: overflowing }),
    )

    const first = container.querySelector("[data-persist-probe]") as HTMLDivElement
    first.scrollLeft = 240
    act(() => {
      first.dispatchEvent(new Event("scroll"))
    })

    rerender(createElement(PersistProbe, { persistKey: "drawer-row", size: collapsed }))
    const collapsedNode = container.querySelector("[data-persist-probe]") as HTMLDivElement
    act(() => {
      collapsedNode.dispatchEvent(new Event("scroll"))
    })

    rerender(createElement("div"))
    rerender(createElement(PersistProbe, { persistKey: "drawer-row", size: overflowing }))

    const restored = container.querySelector("[data-persist-probe]") as HTMLDivElement
    expect(restored.scrollLeft).toBe(240)
  })

  it("restores after layout grows enough to overflow", () => {
    const observers: Array<() => void> = []
    vi.stubGlobal(
      "ResizeObserver",
      class {
        callback: () => void
        constructor(callback: () => void) {
          this.callback = callback
          observers.push(callback)
        }
        observe() {}
        disconnect() {
          const index = observers.indexOf(this.callback)
          if (index >= 0) {
            observers.splice(index, 1)
          }
        }
      },
    )

    const { container, rerender } = renderWithJsdomRoot(
      createElement(PersistProbe, { persistKey: "late-row", size: overflowing }),
    )

    const first = container.querySelector("[data-persist-probe]") as HTMLDivElement
    first.scrollLeft = 240
    act(() => {
      first.dispatchEvent(new Event("scroll"))
    })

    rerender(createElement("div"))
    rerender(createElement(PersistProbe, { persistKey: "late-row", size: collapsed }))

    const pending = container.querySelector("[data-persist-probe]") as HTMLDivElement
    expect(pending.scrollLeft).toBe(0)

    rerender(createElement(PersistProbe, { persistKey: "late-row", size: overflowing }))
    act(() => {
      for (const callback of [...observers]) {
        callback()
      }
    })

    const restored = container.querySelector("[data-persist-probe]") as HTMLDivElement
    expect(restored.scrollLeft).toBe(240)
  })
})
