import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  getAccordionScrollAdjustment,
  getNextOpenItemId,
} from "@/components/vendor/unlumen-ui/motion-accordion.utils"
import { MotionAccordion } from "@/components/vendor/unlumen-ui/motion-accordion"

describe("MotionAccordion", () => {
  it("renders measured panels and an icon affordance for controlled state", () => {
    const markup = renderToStaticMarkup(
      <MotionAccordion
        items={[
          { id: "solid", title: "Solid", content: <div>Solid color</div> },
          { id: "gradient", title: "Gradient", content: <div>Dot gradient</div> },
        ]}
        openItemId="gradient"
        onOpenItemChange={() => {}}
      />,
    )

    expect(markup).toContain('data-slot="motion-accordion"')
    expect(markup).toContain("aria-expanded=\"false\"")
    expect(markup).toContain("aria-expanded=\"true\"")
    expect(markup.match(/data-slot="motion-accordion-panel"/g)?.length).toBe(2)
    expect(markup.match(/data-slot="motion-accordion-icon"/g)?.length).toBe(2)
    expect(markup).toContain("Dot gradient")
    expect(markup).toContain("Solid color")
    expect(markup).not.toContain('data-slot="motion-accordion-toggle"')
    expect(markup).toContain("M6.5 0v13M0 6.5h13")
  })

  it("renders a switch affordance for the settings variant", () => {
    const markup = renderToStaticMarkup(
      <MotionAccordion
        items={[
          { id: "solid", title: "Solid", content: <div>Solid color</div> },
          { id: "gradient", title: "Gradient", content: <div>Dot gradient</div> },
        ]}
        openItemId="solid"
        onOpenItemChange={() => {}}
        variant="settings"
      />,
    )

    expect(markup.match(/data-slot="motion-accordion-toggle"/g)?.length).toBe(2)
    expect(markup).not.toContain('data-slot="motion-accordion-icon"')
    expect(markup).toMatch(/data-slot="motion-accordion-toggle"[^>]*data-state="open"/)
  })

  it("keeps the current item open when collapse is disabled", () => {
    expect(getNextOpenItemId("palette", "palette", false)).toBe("palette")
    expect(getNextOpenItemId("palette", "solid", false)).toBe("solid")
  })

  it("allows closing the current item when collapse is enabled", () => {
    expect(getNextOpenItemId("gradient", "gradient", true)).toBeNull()
    expect(getNextOpenItemId("gradient", "solid", true)).toBe("solid")
  })

  it("computes additional scroll needed to fit the opening panel", () => {
    expect(
      getAccordionScrollAdjustment({
        containerBottom: 400,
        containerTop: 100,
        itemBottom: 360,
        itemTop: 180,
        padding: 24,
        targetContentHeight: 140,
        visiblePanelHeight: 20,
      }),
    ).toBe(104)
  })

  it("returns zero when the open item already fits in view", () => {
    expect(
      getAccordionScrollAdjustment({
        containerBottom: 500,
        containerTop: 100,
        itemBottom: 340,
        itemTop: 180,
        padding: 24,
        targetContentHeight: 80,
        visiblePanelHeight: 80,
      }),
    ).toBe(0)
  })
})
