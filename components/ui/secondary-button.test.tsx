import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SecondaryButton } from "@/components/ui/secondary-button";

describe("SecondaryButton", () => {
  it("uses canvas shadow and state tokens instead of hardcoded values", () => {
    const markup = renderToStaticMarkup(<SecondaryButton>Download PNG</SecondaryButton>);

    expect(markup).toContain('data-slot="secondary-button"');
    expect(markup).toContain("shadow-[var(--canvas-shadow-rest)]");
    expect(markup).toContain("hover:shadow-[var(--canvas-shadow-hover)]");
    expect(markup).toContain("active:shadow-[var(--canvas-shadow-active)]");
    expect(markup).toContain("bg-(--secondary-button-bg)");
    expect(markup).toContain("data-[selected=true]:bg-(--secondary-button-bg-selected)");
    expect(markup).not.toContain("#000000");
    expect(markup).not.toContain("#FFFFFF");
    expect(markup).not.toContain("dark:");
  });
});
