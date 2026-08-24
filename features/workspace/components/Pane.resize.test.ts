import { describe, expect, it } from "vitest"

import {
  resizeDraftingLayer,
  type ResizeDirection,
} from "@/features/workspace/components/pane-layer-geometry"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

// Base QR layer: 200x200 at (100, 100). Opposite edges sit at 300/300.
// QR layers are always re-squared: width === height after every resize.
function buildQrLayer(): DraftingCanvasLayer {
  return {
    blur: 0,
    height: 200,
    id: "qr-test",
    isVisible: true,
    kind: "qr",
    name: "QR code",
    nodeId: "node-1",
    opacity: 1,
    rotation: 0,
    tiltX: 0,
    tiltY: 0,
    shadow: { blur: 0, color: "#000000", offsetX: 0, offsetY: 0, opacity: 0 },
    width: 200,
    x: 100,
    y: 100,
    zIndex: 1,
  }
}

function resize(
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number,
): Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y"> {
  return resizeDraftingLayer(buildQrLayer(), direction, deltaX, deltaY)
}

describe("qr layer resize — edge handles anchor the opposite edge", () => {
  it("east handle: right edge moves out, top-left corner fixed at (100, 100)", () => {
    // dy must be 0 on an axis handle; size grows by 50 and re-centers vertically.
    expect(resize("e", 50, 0)).toEqual({ height: 250, width: 250, x: 100, y: 75 })
  })

  it("west handle: left edge moves out, right edge fixed at x=300", () => {
    expect(resize("w", -50, 0)).toEqual({ height: 250, width: 250, x: 50, y: 75 })
  })

  it("south handle: bottom edge moves out, top-left fixed at (100, 100)", () => {
    expect(resize("s", 0, 50)).toEqual({ height: 250, width: 250, x: 75, y: 100 })
  })

  it("north handle: top edge moves out, bottom edge fixed at y=300", () => {
    expect(resize("n", 0, -50)).toEqual({ height: 250, width: 250, x: 75, y: 50 })
  })
})

describe("qr layer resize — corner handles anchor the opposite corner", () => {
  it("south-east: bottom-right corner out, top-left fixed at (100, 100)", () => {
    expect(resize("se", 50, 50)).toEqual({ height: 250, width: 250, x: 100, y: 100 })
  })

  it("north-west: top-left corner out, bottom-right fixed at (300, 300)", () => {
    // NW handle dragged outward (up-left in screen): dx < 0, dy < 0.
    expect(resize("nw", -50, -50)).toEqual({ height: 250, width: 250, x: 50, y: 50 })
  })

  it("north-east: top-right corner out, bottom-left fixed at (100, 300)", () => {
    // NE handle dragged outward (up-right in screen): dx > 0, dy < 0.
    expect(resize("ne", 50, -50)).toEqual({ height: 250, width: 250, x: 100, y: 50 })
  })

  it("south-west: bottom-left corner out, top-right fixed at (300, 100)", () => {
    // SW handle dragged outward (down-left in screen): dx < 0, dy > 0.
    expect(resize("sw", -50, 50)).toEqual({ height: 250, width: 250, x: 50, y: 100 })
  })
})

describe("qr layer resize — minimum-size clamp", () => {
  it("floors size at 24px while keeping the opposite edge anchored", () => {
    // Drag NW handle inward by 10_000: size clamps to 24, bottom-right edge
    // of the original layer (300, 300) must still hold.
    expect(resize("nw", 10_000, 10_000)).toEqual({ height: 24, width: 24, x: 276, y: 276 })
  })

  it("uses the dominant axis magnitude on diagonal drags", () => {
    // se with dx=30, dy=80: vertical dominates, so size grows by 80.
    expect(resize("se", 30, 80)).toEqual({ height: 280, width: 280, x: 100, y: 100 })
  })
})
