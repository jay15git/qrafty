import { describe, expect, it } from "vitest"

import {
  getInspectorSectionTab,
  resetInspectorChromeStateForTests,
  setInspectorSectionTab,
} from "@/features/desktop-shell/inspector/inspector-chrome-state"

describe("inspector chrome state", () => {
  it("remembers section tabs across reads", () => {
    resetInspectorChromeStateForTests()
    expect(getInspectorSectionTab("qr-style", "Module")).toBe("Module")

    setInspectorSectionTab("qr-style", "Logo")
    expect(getInspectorSectionTab("qr-style", "Module")).toBe("Logo")
  })
})
