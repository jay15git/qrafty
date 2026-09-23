import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("theme contract", () => {
  it("loads the premium display and body fonts", () => {
    const layoutSource = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(layoutSource).toContain("Bricolage_Grotesque");
    expect(layoutSource).toContain("Manrope");
  });

  it("keeps the sitewide theme neutral, with no warm drafting palette", () => {
    const globalsSource = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

    expect(globalsSource).not.toContain("--drafting-");
    expect(globalsSource).not.toContain("oklch(0.62 0.11 66)");
    // The neutral surface ramp is the sitewide theme; it is exposed to
    // Tailwind so `bg-surface-*` / `shadow-surface-*` resolve.
    expect(globalsSource).toContain("--color-surface-1: var(--surface-1);");
    expect(globalsSource).toContain("--color-surface-8: var(--surface-8);");
  });

  it("scopes the workspace canvas tokens to the desktop workspace", () => {
    const workspaceTokensSource = readFileSync(
      resolve(process.cwd(), "features/canvas/workspace-tokens.css"),
      "utf8",
    );

    expect(workspaceTokensSource).toContain('[data-slot="workspace"]');
    expect(workspaceTokensSource).toContain("--canvas-bg:");
    expect(workspaceTokensSource).toContain("--canvas-ink:");
  });

  it("keeps workspace chrome on scoped monochrome utility tokens", () => {
    const checkedFiles = [
      "features/canvas/components/Canvas.tsx",
      "features/canvas/components/Pane.tsx",
      "features/canvas/components/insert-menu/InsertMenuPopoverContent.tsx",
    ];
    const disallowedColorTokens =
      /\b(?:amber|sky|red|rose|orange|yellow|pink|purple|violet|blue|cyan|teal|emerald|green|lime)-/;

    for (const file of checkedFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");

      expect(source, `${file} uses a non-monochrome utility token`).not.toMatch(
        disallowedColorTokens,
      );
      expect(source, `${file} should not use legacy drafting tokens`).not.toContain("--drafting-");
    }
  });
});
