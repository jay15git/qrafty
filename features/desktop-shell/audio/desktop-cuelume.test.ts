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
  DESKTOP_SOUNDS_STORAGE_KEY,
  enhanceDesktopSoundTargets,
  persistDesktopSoundsEnabled,
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
  document.body.innerHTML = ""
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
})

describe("enhanceDesktopSoundTargets", () => {
  function mountScope(html: string) {
    document.body.innerHTML = html
    enhanceDesktopSoundTargets(document)
    return document.body
  }

  it("tags segment tabs as toggles", () => {
    const root = mountScope(`
      <div data-slot="desktop-workspace">
        <button class="dn-segment-tab" type="button">Photo</button>
      </div>
    `)

    const button = root.querySelector("button")
    expect(button?.getAttribute("data-cuelume-toggle")).toBe("")
    expect(button?.hasAttribute("data-cuelume-press")).toBe(false)
  })

  it("tags option tiles with press and release only", () => {
    const root = mountScope(`
      <div class="desktopnew-root">
        <button class="dn-option-tile" type="button">PNG</button>
      </div>
    `)

    const button = root.querySelector("button")
    expect(button?.getAttribute("data-cuelume-press")).toBe("")
    expect(button?.getAttribute("data-cuelume-release")).toBe("")
    expect(button?.hasAttribute("data-cuelume-hover")).toBe(false)
  })

  it("tags accordion headers with press and release only", () => {
    const root = mountScope(`
      <div data-slot="desktop-workspace">
        <div class="dn-settings-accordion">
          <button aria-expanded="false" type="button">Content</button>
        </div>
      </div>
    `)

    const button = root.querySelector("button")
    expect(button?.getAttribute("data-cuelume-press")).toBe("")
    expect(button?.getAttribute("data-cuelume-release")).toBe("")
    expect(button?.hasAttribute("data-cuelume-hover")).toBe(false)
  })

  it("tags dynamic island buttons with press and release only", () => {
    const root = mountScope(`
      <div data-slot="desktop-floating-toolbar-root">
        <div data-slot="desktop-dynamic-island">
          <button type="button">Undo</button>
        </div>
      </div>
    `)

    const button = root.querySelector("button")
    expect(button?.getAttribute("data-cuelume-press")).toBe("")
    expect(button?.getAttribute("data-cuelume-release")).toBe("")
    expect(button?.hasAttribute("data-cuelume-hover")).toBe(false)
  })

  it("strips legacy hover attrs during enhancement", () => {
    const root = mountScope(`
      <div data-slot="desktop-workspace">
        <button data-cuelume-hover="tick" type="button">Undo</button>
      </div>
    `)

    const button = root.querySelector("button")
    expect(button?.hasAttribute("data-cuelume-hover")).toBe(false)
    expect(button?.getAttribute("data-cuelume-press")).toBe("")
  })

  it("does not retag buttons that already have cuelume attrs", () => {
    const root = mountScope(`
      <div data-slot="desktop-workspace">
        <button data-cuelume-toggle="" type="button">Already tagged</button>
      </div>
    `)

    enhanceDesktopSoundTargets(document)
    const button = root.querySelector("button")
    expect(button?.getAttribute("data-cuelume-toggle")).toBe("")
    expect(button?.hasAttribute("data-cuelume-press")).toBe(false)
  })

  it("ignores buttons inside skipped subtrees", () => {
    const root = mountScope(`
      <div data-slot="desktop-workspace">
        <div data-cuelume-skip="">
          <button type="button">Skip me</button>
        </div>
      </div>
    `)

    const button = root.querySelector("button")
    expect(button?.hasAttribute("data-cuelume-press")).toBe(false)
  })
})

describe("useDesktopCuelume bootstrap", () => {
  it("binds cuelume on provider mount", async () => {
    const { renderWithAsyncJsdomRoot } = await import("@/test-utils/jsdom-react-root")
    const { DesktopCuelumeProvider } = await import("@/features/desktop-shell/hooks/use-desktop-cuelume")

    class MockMutationObserver {
      observe() {}
      disconnect() {}
    }

    Object.defineProperty(window, "MutationObserver", {
      configurable: true,
      writable: true,
      value: MockMutationObserver,
    })

    await renderWithAsyncJsdomRoot(
      createElement(
        DesktopCuelumeProvider,
        null,
        createElement("div", { "data-slot": "desktop-workspace" }),
      ),
    )

    expect(bind).toHaveBeenCalledWith(document)
    expect(setEnabled).toHaveBeenCalled()
  })
})
