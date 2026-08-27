/**
 * @vitest-environment jsdom
 */
import { createElement, useState } from "react"
import { act } from "react"
import { afterEach, describe, expect, it } from "vitest"

import {
  resetPersistedElementScrollForTests,
  resolveScrollPersistKey,
  usePersistedElementScroll,
} from "@/lib/persisted-element-scroll"
import { renderWithJsdomRoot } from "@/test-utils/jsdom-react-root"

function mockWritableScroll(element: HTMLElement) {
  let left = 0
  let top = 0

  Object.defineProperties(element, {
    clientWidth: { configurable: true, get: () => 200 },
    clientHeight: { configurable: true, get: () => 80 },
    scrollWidth: { configurable: true, get: () => 800 },
    scrollHeight: { configurable: true, get: () => 80 },
    scrollLeft: {
      configurable: true,
      get: () => left,
      set: (value: number) => {
        left = Number(value)
      },
    },
    scrollTop: {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        top = Number(value)
      },
    },
  })
}

function PersistProbe({ persistKey }: { persistKey: string }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  usePersistedElementScroll(node, persistKey)

  return createElement("div", {
    "data-persist-probe": true,
    ref: (element: HTMLDivElement | null) => {
      if (element) {
        mockWritableScroll(element)
      }
      setNode(element)
    },
  })
}

afterEach(() => {
  resetPersistedElementScrollForTests()
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

  it("uses data-slot before a generated react id", () => {
    expect(
      resolveScrollPersistKey({
        dataSlot: "desktop-shape-preset-shelf-scroll-area",
        scope: "settings:Shape",
        reactId: ":r1:",
      }),
    ).toBe("desktop-shape-preset-shelf-scroll-area")
  })
})

describe("usePersistedElementScroll", () => {
  it("restores scroll after remount with the same key", () => {
    const { container, rerender } = renderWithJsdomRoot(
      createElement(PersistProbe, { persistKey: "shape-row" }),
    )

    const first = container.querySelector("[data-persist-probe]") as HTMLDivElement
    first.scrollLeft = 240
    act(() => {
      first.dispatchEvent(new Event("scroll"))
    })

    rerender(createElement("div"))
    rerender(createElement(PersistProbe, { persistKey: "shape-row" }))

    const second = container.querySelector("[data-persist-probe]") as HTMLDivElement
    expect(second.scrollLeft).toBe(240)
  })
})
