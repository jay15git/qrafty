import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { SecondaryButton } from "@/components/ui/secondary-button"

describe("SecondaryButton", () => {
  it("uses drafting shadow tokens instead of hardcoded shadow values", () => {
    const markup = renderToStaticMarkup(<SecondaryButton>Download PNG</SecondaryButton>)

    expect(markup).toContain('data-slot="secondary-button"')
    expect(markup).toContain("shadow-[var(--ws-shadow-rest)]")
    expect(markup).toContain("hover:shadow-[var(--ws-shadow-hover)]")
    expect(markup).toContain("active:shadow-[var(--ws-shadow-active)]")
    expect(markup).toContain("dark:shadow-[var(--ws-button-shadow-rest)]")
    expect(markup).not.toContain("0_0_24px_3px_#00000030")
  })
})
