import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { SettingsEffectsSection } from "@/features/desktop-shell/inspector/settings-effects"
import { createDefaultDraftingShadowLayer } from "@/features/workspace/model/effects"

describe("SettingsEffectsSection", () => {
  it("renders add-effect control and existing shadow rows", () => {
    const shadow = createDefaultDraftingShadowLayer({
      blur: 8,
      opacity: 40,
      visible: true,
    })
    const markup = renderToStaticMarkup(
      <SettingsEffectsSection
        layerFilters={[]}
        shadows={[shadow]}
        onPatch={vi.fn()}
      />,
    )

    expect(markup).toContain('data-slot="desktopnew-effects-section"')
    expect(markup).toContain("Add effect")
    expect(markup).toContain('data-effect-kind="drop-shadow"')
  })
})
