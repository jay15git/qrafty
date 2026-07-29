import { describe, expect, it } from "vitest"

import { createFrame, subFrame } from "@/features/workspace/authoring/frame"

describe("createFrame", () => {
  it("centers the canvas on the origin", () => {
    const frame = createFrame({ height: 1350, width: 1080 })

    expect(frame.canvas).toEqual({ height: 1350, width: 1080, x: -540, y: -675 })
  })

  it("insets content by padding", () => {
    const frame = createFrame({ height: 1000, padding: 40, width: 800 })

    expect(frame.content).toEqual({ height: 920, width: 720, x: -360, y: -460 })
  })

  it("splits rows with fixed and auto tracks", () => {
    const frame = createFrame({ height: 1000, padding: 0, width: 800 })
    const [header, body] = frame.rows([200, "auto"], 24)

    expect(header).toEqual({ height: 200, width: 800, x: -400, y: -500 })
    expect(body).toEqual({ height: 776, width: 800, x: -400, y: -276 })
  })

  it("splits equal auto columns", () => {
    const frame = createFrame({ height: 400, padding: 0, width: 900 })
    const [left, middle, right] = frame.columns(["auto", "auto", "auto"], 0)

    expect(left.width).toBe(300)
    expect(middle.x).toBe(-150)
    expect(right.x).toBe(150)
  })

  it("centers a rect inside content", () => {
    const frame = createFrame({ height: 1000, padding: 50, width: 800 })

    expect(frame.center(400, 400)).toEqual({ height: 400, width: 400, x: -200, y: -200 })
  })

  it("nests via inset without leaving the parent", () => {
    const frame = createFrame({ height: 1000, padding: 40, width: 800 })
    const inner = frame.inset(20).content

    expect(inner.x).toBe(-340)
    expect(inner.width).toBe(680)
  })

  it("builds a frame from an arbitrary rect", () => {
    const frame = subFrame({ height: 300, width: 200, x: 100, y: -50 }, 10)

    expect(frame.content).toEqual({ height: 280, width: 180, x: 110, y: -40 })
  })
})
