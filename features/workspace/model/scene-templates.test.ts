import { describe, expect, it } from "vitest"

import { SCENE_LAYOUT_PRESETS } from "@/features/workspace/model/scene-templates"

describe("desktop scene settings", () => {
  it("includes layout presets", () => {
    expect(SCENE_LAYOUT_PRESETS.length).toBeGreaterThanOrEqual(8)
    expect(SCENE_LAYOUT_PRESETS[0]?.id).toBe("flat")
  })
})
