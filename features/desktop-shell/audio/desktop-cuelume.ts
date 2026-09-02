import { play, setEnabled, setVolume, type SoundName } from "cuelume"

export const DESKTOP_SOUNDS_STORAGE_KEY = "qrafty:desktop-sounds"
export const DEFAULT_DESKTOP_SOUND_VOLUME = 0.65

export const DESKTOP_SOUND_PRESS = "press" satisfies SoundName
export const DESKTOP_SOUND_RELEASE = "release" satisfies SoundName
export const DESKTOP_SOUND_TOGGLE = "toggle" satisfies SoundName

/** Pointer down + pointer up — default for buttons and icon controls. */
export const CUELUME_BUTTON = {
  "data-cuelume-press": DESKTOP_SOUND_PRESS,
  "data-cuelume-release": DESKTOP_SOUND_RELEASE,
} as const

/** Click — tabs, switches, segmented controls, and pick-one tiles. */
export const CUELUME_TOGGLE = {
  "data-cuelume-toggle": DESKTOP_SOUND_TOGGLE,
} as const

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function prefersReducedMotion(): boolean {
  if (!isBrowser()) {
    return false
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function readDesktopSoundsEnabled(): boolean {
  if (!isBrowser()) {
    return true
  }

  try {
    const stored = window.localStorage.getItem(DESKTOP_SOUNDS_STORAGE_KEY)
    if (stored === "false") {
      return false
    }
    if (stored === "true") {
      return true
    }
  } catch {
    // Ignore private-mode storage failures.
  }

  return true
}

export function persistDesktopSoundsEnabled(enabled: boolean) {
  if (!isBrowser()) {
    return
  }

  try {
    window.localStorage.setItem(DESKTOP_SOUNDS_STORAGE_KEY, enabled ? "true" : "false")
  } catch {
    // Ignore private-mode storage failures.
  }
}

export function applyDesktopSoundPreferences() {
  const enabled = readDesktopSoundsEnabled() && !prefersReducedMotion()
  setEnabled(enabled)
  setVolume(DEFAULT_DESKTOP_SOUND_VOLUME)
}

export function setDesktopSoundsEnabled(enabled: boolean) {
  persistDesktopSoundsEnabled(enabled)
  applyDesktopSoundPreferences()
}

export function playDesktopSound(name: SoundName, options?: { volume?: number }) {
  if (!readDesktopSoundsEnabled() || prefersReducedMotion()) {
    return
  }

  play(name, options)
}

/** Imperative press cue for slider scrub steps and other non-button feedback. */
export function playDesktopPressSound() {
  playDesktopSound(DESKTOP_SOUND_PRESS, { volume: 0.45 })
}

export type DesktopCuelumeKind = "button" | "toggle" | "none"

export function desktopCuelumeAttrs(kind: DesktopCuelumeKind = "button") {
  if (kind === "toggle") {
    return CUELUME_TOGGLE
  }

  if (kind === "none") {
    return {}
  }

  return CUELUME_BUTTON
}
