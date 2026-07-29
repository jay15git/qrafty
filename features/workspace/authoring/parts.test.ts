import { describe, expect, it } from "vitest"

import type { Rect } from "@/features/workspace/authoring/frame"
import {
  centerTextRect,
  circleIconPart,
  hairlinePart,
  pillButtonPart,
  surfacePart,
  textPart,
} from "@/features/workspace/authoring/parts"
import { TYPE, getPalette } from "@/features/workspace/authoring/tokens"

const CONTEXT = { nodeId: "node-1", palette: getPalette("mint"), zIndex: 10 }
const RECT: Rect = { height: 200, width: 400, x: -200, y: -100 }

describe("authoring parts", () => {
  it("keeps legacy and modern corner fields in sync on surfaces", () => {
    const [surface] = surfacePart(CONTEXT, RECT, { radius: "lg", shadow: "soft" })

    expect(surface.cornerRadius).toBe(28)
    expect(surface.cornerRadii?.topLeft).toBe(28)
    expect(surface.shadows.length).toBeGreaterThan(0)
    expect(surface.shadow.visible).toBe(true)
  })

  it("gives every surface a visible fill", () => {
    const [surface] = surfacePart(CONTEXT, RECT)

    expect(surface.fillMode).toBe("solid")
    expect(surface.fill).toBe(CONTEXT.palette.surface)
  })

  it("centers text optically inside a box", () => {
    const centered = centerTextRect(RECT, "body")
    const textHeight = TYPE.body.fontSize * TYPE.body.lineHeight
    const topGap = centered.y - RECT.y
    const bottomGap = RECT.y + RECT.height - (centered.y + textHeight)

    expect(centered.height).toBeCloseTo(textHeight, 5)
    expect(topGap).toBeCloseTo(bottomGap, 5)
  })

  it("returns a pill and a label centered within it", () => {
    const [pill, label] = pillButtonPart(CONTEXT, RECT, { label: "Reserve" })
    const textHeight = TYPE.body.fontSize * TYPE.body.lineHeight

    expect(pill.cornerRadius).toBe(512)
    expect(pill.fill).toBe(CONTEXT.palette.accent)
    expect(label.text).toBe("Reserve")
    expect(label.fill).toBe(CONTEXT.palette.onAccent)
    expect(label.textAlign).toBe("center")
    expect(label.y - RECT.y).toBeCloseTo(RECT.y + RECT.height - (label.y + textHeight), 5)
    expect(label.zIndex).toBeGreaterThan(pill.zIndex)
  })

  it("returns a circle with its glyph centered", () => {
    const square: Rect = { height: 80, width: 80, x: -40, y: -40 }
    const [circle, glyph] = circleIconPart(CONTEXT, square, { glyph: "→" })

    expect(circle.shapeId).toBe("ellipse")
    expect(glyph.textAlign).toBe("center")
    expect(glyph.x).toBe(square.x)
    expect(glyph.width).toBe(square.width)
    expect(glyph.zIndex).toBeGreaterThan(circle.zIndex)
  })

  it("uppercases caption text when asked", () => {
    const [caption] = textPart(CONTEXT, RECT, {
      step: "caption",
      text: "scan to pay",
      uppercase: true,
    })

    expect(caption.text).toBe("SCAN TO PAY")
    expect(caption.letterSpacing).toBe(TYPE.caption.letterSpacing)
  })

  it("draws a hairline as a thin filled rect", () => {
    const [line] = hairlinePart(CONTEXT, { height: 0, width: 300, x: -150, y: 0 })

    expect(line.height).toBeGreaterThan(0)
    expect(line.fillMode).toBe("solid")
  })
})
