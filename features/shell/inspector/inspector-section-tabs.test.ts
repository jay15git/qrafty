import { describe, expect, it } from "vitest"

import {
  getInspectorSectionTab,
  resetInspectorSectionTabsForTests,
  setInspectorSectionTab,
} from "@/features/shell/inspector/inspector-section-tabs"

describe("inspector chrome state", () => {
  it("remembers section tabs across reads", () => {
    resetInspectorSectionTabsForTests()
    expect(getInspectorSectionTab("qr-style", "Module")).toBe("Module")

    setInspectorSectionTab("qr-style", "Logo")
    expect(getInspectorSectionTab("qr-style", "Module")).toBe("Logo")
  })
})
