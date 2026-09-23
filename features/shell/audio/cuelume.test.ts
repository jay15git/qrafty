// @vitest-environment jsdom

import { createElement } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("cuelume", () => ({
  bind: vi.fn(),
  play: vi.fn(),
  setEnabled: vi.fn(),
  setVolume: vi.fn(),
}))

import { bind, play, setEnabled, setVolume } from "cuelume"

import {
  applySoundPreferences,
  CUELUME_BUTTON,
  CUELUME_TOGGLE,
  SOUND_PRESS,
  SOUND_RELEASE,
  SOUND_TOGGLE,
  SOUNDS_STORAGE_KEY,
  cuelumeAttrs,
  persistSoundsEnabled,
  playPressSound,
  playSound,
  readSoundsEnabled,
} from "@/features/shell/audio/cuelume"

function stubMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" ? reducedMotion : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

function stubLocalStorage() {
  const storage = new Map<string, string>()

  vi.stubGlobal("localStorage", {
    clear: () => storage.clear(),
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
  })
}

beforeEach(() => {
  stubLocalStorage()
  vi.clearAllMocks()
  stubMatchMedia(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("cuelume preferences", () => {
  it("defaults sounds to enabled", () => {
    expect(readSoundsEnabled()).toBe(true)
  })

  it("persists and reads the mute preference", () => {
    persistSoundsEnabled(false)
    expect(localStorage.getItem(SOUNDS_STORAGE_KEY)).toBe("false")
    expect(readSoundsEnabled()).toBe(false)
  })

  it("applies enabled state and volume to cuelume", () => {
    persistSoundsEnabled(false)
    applySoundPreferences()

    expect(setEnabled).toHaveBeenCalledWith(false)
    expect(setVolume).toHaveBeenCalledWith(0.65)
  })

  it("disables sounds when reduced motion is preferred", () => {
    persistSoundsEnabled(true)
    stubMatchMedia(true)
    applySoundPreferences()

    expect(setEnabled).toHaveBeenCalledWith(false)
  })

  it("skips playback when sounds are muted", () => {
    persistSoundsEnabled(false)
    playSound("success")

    expect(play).not.toHaveBeenCalled()
  })

  it("plays when sounds are enabled", () => {
    persistSoundsEnabled(true)
    playSound("success")

    expect(play).toHaveBeenCalledWith("success", undefined)
  })

  it("plays press sound for slider steps", () => {
    persistSoundsEnabled(true)
    playPressSound()

    expect(play).toHaveBeenCalledWith(SOUND_PRESS, { volume: 0.45 })
  })
})

describe("cuelumeAttrs", () => {
  it("maps button kind to press and release attrs", () => {
    expect(cuelumeAttrs("button")).toEqual(CUELUME_BUTTON)
    expect(cuelumeAttrs("button")).toEqual({
      "data-cuelume-press": SOUND_PRESS,
      "data-cuelume-release": SOUND_RELEASE,
    })
  })

  it("maps toggle kind to data-cuelume-toggle", () => {
    expect(cuelumeAttrs("toggle")).toEqual(CUELUME_TOGGLE)
    expect(cuelumeAttrs("toggle")).toEqual({
      "data-cuelume-toggle": SOUND_TOGGLE,
    })
  })

  it("maps none kind to an empty object", () => {
    expect(cuelumeAttrs("none")).toEqual({})
  })
})

describe("useCuelume bootstrap", () => {
  it("binds cuelume on provider mount", async () => {
    const { renderWithAsyncJsdomRoot } = await import("@/test-utils/jsdom-react-root")
    const { CuelumeProvider } = await import("@/features/shell/hooks/use-cuelume")

    await renderWithAsyncJsdomRoot(
      createElement(
        CuelumeProvider,
        null,
        createElement("div", { "data-slot": "workspace" }),
      ),
    )

    expect(bind).toHaveBeenCalledWith()
    expect(setEnabled).toHaveBeenCalled()
  })
})
