import { play, setEnabled, setVolume, type SoundName } from "cuelume"

export const DESKTOP_SOUNDS_STORAGE_KEY = "qrafty:desktop-sounds"
export const DEFAULT_DESKTOP_SOUND_VOLUME = 0.65

export const CUELUME_PRESS = {
  "data-cuelume-press": "",
  "data-cuelume-release": "",
} as const

export const CUELUME_TOGGLE = {
  "data-cuelume-toggle": "",
} as const

export const CUELUME_NAV = CUELUME_PRESS

export const CUELUME_ACCORDION = CUELUME_PRESS

const DESKTOP_SOUND_SCOPE_SELECTORS = [
  '[data-slot="desktop-workspace"]',
  '[data-slot="desktop-floating-toolbar-root"]',
  '[data-slot^="desktop-"]',
  ".desktopnew-root",
  '[data-slot="mobile-family-drawer-root"]',
  '[data-slot="mobile-layer-toolbar"]',
  '[data-slot="desktop-compose-toolbar"]',
  '[data-slot="drafting-layer-floating-toolbar"]',
  ".dn-insert-menu-popover",
] as const

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

function isAlreadyTagged(button: HTMLButtonElement): boolean {
  return (
    button.hasAttribute("data-cuelume-press") ||
    button.hasAttribute("data-cuelume-toggle")
  )
}

function shouldSkipButton(button: HTMLButtonElement): boolean {
  if (button.disabled || button.getAttribute("aria-disabled") === "true") {
    return true
  }

  if (button.closest("[data-cuelume-skip]")) {
    return true
  }

  return isAlreadyTagged(button)
}

function applyPressRelease(button: HTMLButtonElement) {
  button.setAttribute("data-cuelume-press", "")
  button.setAttribute("data-cuelume-release", "")
}

function applyToggle(button: HTMLButtonElement) {
  button.setAttribute("data-cuelume-toggle", "")
}

function isSegmentTab(button: HTMLButtonElement): boolean {
  return button.classList.contains("dn-segment-tab") || button.getAttribute("role") === "tab"
}

function isSwitch(button: HTMLButtonElement): boolean {
  return button.getAttribute("role") === "switch" || Boolean(button.closest('[role="switch"]'))
}

function enhanceDesktopSoundButton(button: HTMLButtonElement) {
  button.removeAttribute("data-cuelume-hover")

  if (shouldSkipButton(button)) {
    return
  }

  if (isSegmentTab(button) || isSwitch(button)) {
    applyToggle(button)
    return
  }

  applyPressRelease(button)
}

function collectDesktopSoundScopeRoots(root: ParentNode): HTMLElement[] {
  const roots = new Set<HTMLElement>()
  const queryRoot = root instanceof Document ? root : root.ownerDocument ?? document

  for (const selector of DESKTOP_SOUND_SCOPE_SELECTORS) {
    if (root instanceof HTMLElement && root.matches(selector)) {
      roots.add(root)
    }

    for (const match of queryRoot.querySelectorAll<HTMLElement>(selector)) {
      if (root instanceof Document || root.contains(match)) {
        roots.add(match)
      }
    }
  }

  return [...roots]
}

export function enhanceDesktopSoundTargets(root: ParentNode = document) {
  if (!isBrowser()) {
    return
  }

  const scopeRoots = collectDesktopSoundScopeRoots(root)
  if (scopeRoots.length === 0) {
    return
  }

  for (const scopeRoot of scopeRoots) {
    const buttons = scopeRoot.querySelectorAll<HTMLButtonElement>("button")
    for (const button of buttons) {
      enhanceDesktopSoundButton(button)
    }
  }
}
