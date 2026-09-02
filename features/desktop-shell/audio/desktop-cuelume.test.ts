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
  applyDesktopSoundPreferences,
  CUELUME_BUTTON,
  CUELUME_TOGGLE,
  DESKTOP_SOUND_PRESS,
  DESKTOP_SOUND_RELEASE,
  DESKTOP_SOUND_TOGGLE,
  DESKTOP_SOUNDS_STORAGE_KEY,
  desktopCuelumeAttrs,
  persistDesktopSoundsEnabled,
  playDesktopPressSound,
  playDesktopSound,
  readDesktopSoundsEnabled,
} from "@/features/desktop-shell/audio/desktop-cuelume"

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

describe("desktop-cuelume preferences", () => {
  it("defaults sounds to enabled", () => {
    expect(readDesktopSoundsEnabled()).toBe(true)
  })

  it("persists and reads the mute preference", () => {
    persistDesktopSoundsEnabled(false)
    expect(localStorage.getItem(DESKTOP_SOUNDS_STORAGE_KEY)).toBe("false")
    expect(readDesktopSoundsEnabled()).toBe(false)
  })

  it("applies enabled state and volume to cuelume", () => {
    persistDesktopSoundsEnabled(false)
    applyDesktopSoundPreferences()

    expect(setEnabled).toHaveBeenCalledWith(false)
    expect(setVolume).toHaveBeenCalledWith(0.65)
  })

  it("disables sounds when reduced motion is preferred", () => {
    persistDesktopSoundsEnabled(true)
    stubMatchMedia(true)
    applyDesktopSoundPreferences()

    expect(setEnabled).toHaveBeenCalledWith(false)
  })

  it("skips playback when sounds are muted", () => {
    persistDesktopSoundsEnabled(false)
    playDesktopSound("success")

    expect(play).not.toHaveBeenCalled()
  })

  it("plays when sounds are enabled", () => {
    persistDesktopSoundsEnabled(true)
    playDesktopSound("success")

    expect(play).toHaveBeenCalledWith("success", undefined)
  })

  it("plays press sound for slider steps", () => {
    persistDesktopSoundsEnabled(true)
    playDesktopPressSound()

    expect(play).toHaveBeenCalledWith(DESKTOP_SOUND_PRESS, { volume: 0.45 })
  })
})

describe("desktopCuelumeAttrs", () => {
  it("maps button kind to press and release attrs", () => {
    expect(desktopCuelumeAttrs("button")).toEqual(CUELUME_BUTTON)
    expect(desktopCuelumeAttrs("button")).toEqual({
      "data-cuelume-press": DESKTOP_SOUND_PRESS,
      "data-cuelume-release": DESKTOP_SOUND_RELEASE,
    })
  })

  it("maps toggle kind to data-cuelume-toggle", () => {
    expect(desktopCuelumeAttrs("toggle")).toEqual(CUELUME_TOGGLE)
    expect(desktopCuelumeAttrs("toggle")).toEqual({
      "data-cuelume-toggle": DESKTOP_SOUND_TOGGLE,
    })
  })

  it("maps none kind to an empty object", () => {
    expect(desktopCuelumeAttrs("none")).toEqual({})
  })
})

describe("useDesktopCuelume bootstrap", () => {
  it("binds cuelume on provider mount", async () => {
    const { renderWithAsyncJsdomRoot } = await import("@/test-utils/jsdom-react-root")
    const { DesktopCuelumeProvider } = await import("@/features/desktop-shell/hooks/use-desktop-cuelume")

    await renderWithAsyncJsdomRoot(
      createElement(
        DesktopCuelumeProvider,
        null,
        createElement("div", { "data-slot": "desktop-workspace" }),
      ),
    )

    expect(bind).toHaveBeenCalledWith()
    expect(setEnabled).toHaveBeenCalled()
  })
})
