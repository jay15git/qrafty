/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest"
import { createElement } from "react"
import { createRoot } from "react-dom/client"
import { act } from "react"

import { ScrollEdgeCue } from "@/lib/scroll-fade"

describe("ScrollEdgeCue", () => {
  it("renders a CSS fallback gradient class for mobile browsers without color-mix", async () => {
    const container = document.createElement("div")
    container.style.setProperty("--scroll-edge-fade-color", "#07080a")
    const root = createRoot(container)

    await act(async () => {
      root.render(
        createElement(ScrollEdgeCue, {
          edge: "right",
          mode: "absolute",
          visible: true,
          chevron: false,
        }),
      )
    })

    const gradient = container.querySelector(".scroll-edge-cue-gradient")
    expect(gradient).not.toBeNull()
    expect(getComputedStyle(gradient as Element).getPropertyValue("--scroll-edge-cue-direction").trim()).toBe(
      "to right",
    )

    await act(async () => {
      root.unmount()
    })
  })
})
