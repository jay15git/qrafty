// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import {
  runMotionFieldAnimation,
  sampleEchoFieldMix,
  shouldUseMotionFieldLayer,
} from "./motion-field"
import { AnimationPreset } from "./animations"

describe("motion field", () => {
  it("targets radial expand presets", () => {
    expect(shouldUseMotionFieldLayer(AnimationPreset.RadialExpand)).toBe(true)
    expect(shouldUseMotionFieldLayer(AnimationPreset.NeonDrift)).toBe(false)
    expect(shouldUseMotionFieldLayer(AnimationPreset.HeartExpand)).toBe(false)
    expect(shouldUseMotionFieldLayer(AnimationPreset.FanRotate)).toBe(false)
  })

  it("keeps neighboring radii close in accent mix", () => {
    const phase = 0.42
    const inner = sampleEchoFieldMix(0.34, phase)
    const outer = sampleEchoFieldMix(0.38, phase)

    expect(Math.abs(inner - outer)).toBeLessThan(0.35)
  })

  it("mounts a clipped gradient layer behind modules", () => {
    document.body.innerHTML = `
      <div id="qr-root">
        <svg viewBox="0 0 100 100">
          <rect class="module" data-column="0" data-row="0" x="10" y="10" width="8" height="8" fill="#111827"></rect>
          <rect class="module" data-column="1" data-row="0" x="20" y="10" width="8" height="8" fill="#111827"></rect>
        </svg>
      </div>
    `

    const root = document.getElementById("qr-root")!
    const handle = runMotionFieldAnimation(root, AnimationPreset.RadialExpand, {
      dotMatrixColorBase: "#111827",
      dotMatrixColorPeak: "#22d3ee",
      dotMatrixOpacityBase: 1,
      dotMatrixOpacityPeak: 1,
    })

    expect(handle).toBeDefined()
    expect(root.querySelector('[data-qr-layer="motion-field"]')).not.toBeNull()
    expect(root.querySelector("#qrafty-motion-field-gradient")).not.toBeNull()
    expect(root.querySelector(".module")?.style.fill).toBe("none")

    handle?.stop()

    expect(root.querySelector('[data-qr-layer="motion-field"]')).toBeNull()
    expect(root.querySelector(".module")?.getAttribute("fill")).toBe("#111827")
  })
})
