import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
    theme: "light",
  }),
}))

import { ModeToggle } from "@/components/mode-toggle"

describe("ModeToggle", () => {
  it("renders a labeled light-dark switch with icon affordances", () => {
    const markup = renderToStaticMarkup(<ModeToggle />)

    expect(markup).toContain('data-slot="mode-toggle"')
    expect(markup).toContain("Appearance")
    expect(markup).toContain('data-slot="mode-toggle-light-icon"')
    expect(markup).toContain('data-slot="mode-toggle-dark-icon"')
    expect(markup).toContain("Toggle dark mode")
    expect(markup).toContain('role="switch"')
  })

  it("renders only the switch for drafting appearance", () => {
    const markup = renderToStaticMarkup(<ModeToggle appearance="drafting" />)

    expect(markup).not.toContain('data-slot="mode-toggle"')
    expect(markup).not.toContain("Appearance")
    expect(markup).not.toContain('data-slot="mode-toggle-light-icon"')
    expect(markup).not.toContain('data-slot="mode-toggle-dark-icon"')
    expect(markup).toContain("Toggle dark mode")
    expect(markup).toContain('role="switch"')
  })
})
