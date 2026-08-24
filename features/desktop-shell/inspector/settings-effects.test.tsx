import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { SettingsEffectsSection } from "@/features/desktop-shell/inspector/settings-effects"
import { createDefaultDraftingShadowLayer } from "@/features/workspace/model/effects"
import { LAYER_EFFECT_KINDS } from "@/features/workspace/model/layer-effects"

describe("SettingsEffectsSection", () => {
  it("renders a static slider row for every effect kind", () => {
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
    expect(markup).not.toContain("Add effect")
    for (const kind of LAYER_EFFECT_KINDS) {
      expect(markup).toContain(`data-effect-kind="${kind}"`)
    }
  })
})
