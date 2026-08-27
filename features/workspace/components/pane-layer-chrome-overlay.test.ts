import { describe, expect, it } from "vitest"

import {
  documentToChromeOffset,
  documentToChromeSize,
  getChromeFrameRect,
  getChromeVisualScale,
  getFloatingToolbarChromePosition,
  type ChromeSpace,
} from "@/features/workspace/components/pane-layer-chrome-overlay"

const identitySpace: ChromeSpace = {
  contentOnlyZoom: false,
  contentPanX: 0,
  contentPanY: 0,
  interactionScale: 1,
  viewFitScale: 1,
}

describe("pane-layer-chrome-overlay", () => {
  it("uses fitted artboard scale times interaction zoom", () => {
    expect(
      getChromeVisualScale({ interactionScale: 2, viewFitScale: 0.5 }),
    ).toBe(1)
  })

  it("maps document points into unscaled overlay pixels", () => {
    const space: ChromeSpace = {
      ...identitySpace,
      viewFitScale: 0.5,
    }

    expect(documentToChromeOffset(100, -40, space)).toEqual({ x: 50, y: -20 })
    expect(documentToChromeSize(240, space)).toBe(120)
  })

  it("applies content pan only in content-only zoom", () => {
    const panned: ChromeSpace = {
      contentOnlyZoom: true,
      contentPanX: 20,
      contentPanY: -10,
      interactionScale: 2,
      viewFitScale: 0.5,
    }

    expect(documentToChromeOffset(100, 0, panned)).toEqual({ x: 110, y: -5 })
    expect(
      documentToChromeOffset(100, 0, { ...panned, contentOnlyZoom: false }),
    ).toEqual({ x: 100, y: 0 })
  })

  it("keeps frame padding in screen pixels while the box tracks the layer", () => {
    const frame = getChromeFrameRect(
      { height: 200, width: 240, x: -120, y: -80 },
      4,
      { ...identitySpace, viewFitScale: 0.5 },
    )

    expect(frame).toEqual({
      height: 108,
      width: 128,
      x: -64,
      y: -44,
    })
  })

  it("places the toolbar above the frame and flips below near the top edge", () => {
    const above = getFloatingToolbarChromePosition({
      bounds: { height: 80, width: 80, x: -40, y: 20 },
      canvasHeight: 400,
      canvasWidth: 400,
      gapPx: 8,
      gutterPx: 8,
      paddingPx: 4,
      rotateStemPx: 32,
      space: identitySpace,
      toolbarHeightPx: 48,
      toolbarWidthPx: 192,
    })

    expect(above).toEqual({ x: 0, y: -72 })

    const flipped = getFloatingToolbarChromePosition({
      bounds: { height: 80, width: 80, x: -40, y: -180 },
      canvasHeight: 400,
      canvasWidth: 400,
      gapPx: 8,
      gutterPx: 8,
      paddingPx: 4,
      rotateStemPx: 32,
      space: identitySpace,
      toolbarHeightPx: 48,
      toolbarWidthPx: 192,
    })

    expect(flipped.y).toBe(-88)
    expect(flipped.x).toBe(0)
  })

  it("clamps the toolbar horizontally to the visible canvas", () => {
    const position = getFloatingToolbarChromePosition({
      bounds: { height: 40, width: 40, x: 300, y: 0 },
      canvasHeight: 400,
      canvasWidth: 400,
      gapPx: 8,
      gutterPx: 8,
      paddingPx: 4,
      rotateStemPx: 32,
      space: identitySpace,
      toolbarHeightPx: 48,
      toolbarWidthPx: 192,
    })

    expect(position.x).toBe(96)
  })
})
