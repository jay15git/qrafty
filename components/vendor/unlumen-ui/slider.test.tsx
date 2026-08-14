import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { Slider } from "@/components/vendor/unlumen-ui/slider"

describe("Unlumen slider", () => {
  it("renders square slider geometry for the shared track, fill, and thumb by default", () => {
    const markup = renderToStaticMarkup(
      <Slider
        label="Logo size"
        min={0}
        max={100}
        step={10}
        value={40}
        onChange={vi.fn()}
      />,
    )

    expect(markup).toContain("rounded-[4px]")
    expect(markup).toContain("rounded-[2px]")
    expect(markup).toContain("border-black/10")
    expect(markup).toContain("dark:bg-card")
    expect(markup).toContain("dark:border-border")
    expect(markup).toContain("Logo size:")
  })

  it("uses drafting tokens for the drafting appearance", () => {
    const markup = renderToStaticMarkup(
      <Slider
        appearance="drafting"
        label="Outer margin"
        min={0}
        max={80}
        step={1}
        value={24}
        onChange={vi.fn()}
      />,
    )

    expect(markup).toContain("text-[var(--ws-ink-muted)]")
    expect(markup).toContain("bg-[var(--ws-control-bg)]")
    expect(markup).toContain("border-[var(--ws-line)]")
    expect(markup).toContain("Outer margin:")
    expect(markup).not.toContain("text-muted-foreground")
    expect(markup).not.toContain("bg-neutral-")
    expect(markup).not.toContain("dark:bg-neutral-")
    expect(markup).not.toContain("border-black/10")
    expect(markup).not.toContain("bg-white")
  })
})
