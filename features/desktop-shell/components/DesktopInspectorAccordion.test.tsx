// @vitest-environment jsdom

import { act, useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { DesktopInspectorAccordion } from "@/features/desktop-shell/components/DesktopInspectorAccordion"
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root"

const SECTIONS = [
  { id: "content", title: "Content", content: <p>Content controls</p> },
  { id: "patterns", title: "Patterns", content: <p>Pattern controls</p> },
  { id: "color", title: "Color", content: <p>Color controls</p> },
] as const

function TestInspector() {
  const [activeSectionId, setActiveSectionId] = useState<(typeof SECTIONS)[number]["id"]>("content")

  return (
    <DesktopInspectorAccordion
      activeSectionId={activeSectionId}
      onSectionChange={setActiveSectionId}
      sections={SECTIONS}
    />
  )
}

describe("DesktopInspectorAccordion", () => {
  it("renders registry order and keeps exactly one root section expanded", async () => {
    const surface = await renderWithAsyncJsdomRoot(<TestInspector />)
    const headers = Array.from(surface.container.querySelectorAll<HTMLButtonElement>("button"))

    expect(headers.map((header) => header.textContent?.trim())).toEqual(["Content", "Patterns", "Color"])
    expect(headers.filter((header) => header.getAttribute("aria-expanded") === "true")).toHaveLength(1)

    await act(async () => {
      headers[2].click()
    })

    expect(headers.map((header) => header.getAttribute("aria-expanded"))).toEqual(["false", "false", "true"])
    expect(surface.container.textContent).toContain("Color controls")
  })

  it("uses focusable native headers and exposes controlled regions", async () => {
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    })
    const surface = await renderWithAsyncJsdomRoot(<TestInspector />)
    const patternHeader = surface.container.querySelectorAll<HTMLButtonElement>("button")[1]

    patternHeader.focus()
    expect(document.activeElement).toBe(patternHeader)
    expect(patternHeader.getAttribute("aria-controls")).toBe("desktop-inspector-section-patterns")

    await act(async () => {
      patternHeader.click()
    })

    expect(patternHeader.getAttribute("aria-expanded")).toBe("true")
    expect(scrollIntoView).toHaveBeenCalled()
  })
})
