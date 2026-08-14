import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

describe("theme contract", () => {
  it("defines the premium dashboard font and token system", () => {
    const layoutSource = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8")
    const globalsSource = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8")

    expect(layoutSource).toContain("Bricolage_Grotesque")
    expect(layoutSource).toContain("Manrope")
    expect(globalsSource).toContain("--font-heading: var(--font-display);")
    expect(globalsSource).toContain("--space-md: 1rem;")
    expect(globalsSource).not.toContain("264.376")
  })

  it("uses neutral sitewide theme tokens without warm drafting palette", () => {
    const globalsSource = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8")
    const workspaceTokensSource = readFileSync(
      resolve(process.cwd(), "features/workspace/workspace-tokens.css"),
      "utf8",
    )

    expect(globalsSource).not.toContain("--drafting-")
    expect(globalsSource).not.toContain("oklch(0.62 0.11 66)")
    expect(globalsSource).toContain("--primary: oklch(0.18 0 0);")
    expect(workspaceTokensSource).toContain('[data-slot="desktop-workspace"]')
    expect(workspaceTokensSource).toContain("--ws-canvas-bg:")
    expect(workspaceTokensSource).toContain("--ws-ink:")
  })

  it("keeps workspace chrome on scoped monochrome utility tokens", () => {
    const checkedFiles = [
      "features/workspace/components/Canvas.tsx",
      "features/workspace/components/Pane.tsx",
      "features/workspace/components/InsertMenu.tsx",
    ]
    const disallowedColorTokens =
      /\b(?:amber|sky|red|rose|orange|yellow|pink|purple|violet|blue|cyan|teal|emerald|green|lime)-/

    for (const file of checkedFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8")

      expect(source, `${file} uses a non-monochrome utility token`).not.toMatch(
        disallowedColorTokens,
      )
      expect(source, `${file} should use workspace tokens`).toContain("--ws-")
      expect(source, `${file} should not use legacy drafting tokens`).not.toContain("--drafting-")
    }
  })
})
