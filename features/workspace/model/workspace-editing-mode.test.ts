// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  getVisibleToolbarToolIds,
  readWorkspaceEditingMode,
  WORKSPACE_EDITING_MODE_STORAGE_KEY,
  writeWorkspaceEditingMode,
} from "@/features/workspace/model/workspace-editing-mode"

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()

  return {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

describe("workspace-editing-mode", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMemoryStorage(),
    })
  })

  afterEach(() => {
    window.localStorage.removeItem(WORKSPACE_EDITING_MODE_STORAGE_KEY)
  })

  it("defaults to free editing when storage is empty", () => {
    expect(readWorkspaceEditingMode()).toBe("free")
  })

  it("round-trips editing mode through localStorage", () => {
    writeWorkspaceEditingMode("template")
    expect(readWorkspaceEditingMode()).toBe("template")
    expect(window.localStorage.getItem(WORKSPACE_EDITING_MODE_STORAGE_KEY)).toBe("template")

    writeWorkspaceEditingMode("free")
    expect(readWorkspaceEditingMode()).toBe("free")
  })

  it("hides composition tools in template mode", () => {
    expect(getVisibleToolbarToolIds("free")).toEqual(
      expect.arrayContaining(["text", "image", "layers"]),
    )
    expect(getVisibleToolbarToolIds("template")).not.toContain("text")
    expect(getVisibleToolbarToolIds("template")).not.toContain("image")
    expect(getVisibleToolbarToolIds("template")).not.toContain("layers")
    expect(getVisibleToolbarToolIds("template")).toContain("templates")
    expect(getVisibleToolbarToolIds("template")).toContain("content")
    expect(getVisibleToolbarToolIds("template")).toContain("background")
  })
})
