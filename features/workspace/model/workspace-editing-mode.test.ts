// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import { getVisibleToolbarToolIds } from "@/features/workspace/model/workspace-editing-mode"

describe("workspace-editing-mode", () => {
  it("exposes all desktop toolbar tools", () => {
    expect(getVisibleToolbarToolIds()).toEqual(
      expect.arrayContaining(["text", "image", "layers", "layout", "background", "export"]),
    )
  })
})
