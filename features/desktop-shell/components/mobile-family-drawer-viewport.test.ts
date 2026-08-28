import { describe, expect, it } from "vitest"

import {
  getMobileDrawerBottomOffsetPx,
  getMobileDrawerMaxHeightPx,
  getMobileKeyboardInsetPx,
  MOBILE_KEYBOARD_INSET_THRESHOLD_PX,
} from "@/features/desktop-shell/components/mobile-family-drawer-viewport"

describe("getMobileKeyboardInsetPx", () => {
  it("returns 0 without a visual viewport", () => {
    expect(getMobileKeyboardInsetPx(800, null)).toBe(0)
    expect(getMobileKeyboardInsetPx(800, undefined)).toBe(0)
  })

  it("returns 0 for URL-bar jitter below the threshold", () => {
    expect(
      getMobileKeyboardInsetPx(800, {
        height: 800 - (MOBILE_KEYBOARD_INSET_THRESHOLD_PX - 1),
        offsetTop: 0,
      }),
    ).toBe(0)
  })

  it("returns the overlap when a keyboard covers the layout viewport", () => {
    expect(
      getMobileKeyboardInsetPx(800, {
        height: 500,
        offsetTop: 0,
      }),
    ).toBe(300)
  })

  it("subtracts visualViewport.offsetTop so a scrolled iOS viewport does not double-count", () => {
    expect(
      getMobileKeyboardInsetPx(800, {
        height: 500,
        offsetTop: 40,
      }),
    ).toBe(260)
  })

  it("returns 0 when the layout viewport already shrank with the keyboard", () => {
    expect(
      getMobileKeyboardInsetPx(500, {
        height: 500,
        offsetTop: 0,
      }),
    ).toBe(0)
  })
})

describe("getMobileDrawerMaxHeightPx", () => {
  it("uses visual viewport height when present", () => {
    expect(getMobileDrawerMaxHeightPx(800, { height: 500 }, 0.5)).toBe(250)
  })

  it("falls back to innerHeight", () => {
    expect(getMobileDrawerMaxHeightPx(800, null, 0.5)).toBe(400)
  })
})

describe("getMobileDrawerBottomOffsetPx", () => {
  it("keeps the resting gap when the keyboard is closed", () => {
    expect(getMobileDrawerBottomOffsetPx(16, 0)).toBe(16)
  })

  it("replaces the resting gap with the keyboard overlap", () => {
    expect(getMobileDrawerBottomOffsetPx(16, 300)).toBe(300)
  })
})
