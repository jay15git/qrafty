import { play, setEnabled, setVolume, type SoundName } from "cuelume"

export const DESKTOP_SOUNDS_STORAGE_KEY = "qrafty:desktop-sounds"
export const DEFAULT_DESKTOP_SOUND_VOLUME = 0.65

export const DESKTOP_SOUND_PRESS = "press" satisfies SoundName
export const DESKTOP_SOUND_RELEASE = "release" satisfies SoundName

export const CUELUME_PRESS = {
  "data-cuelume-press": DESKTOP_SOUND_PRESS,
} as const

export const CUELUME_RELEASE = {
  "data-cuelume-release": DESKTOP_SOUND_RELEASE,
} as const

export const CUELUME_NAV = CUELUME_RELEASE
export const CUELUME_ACCORDION = CUELUME_RELEASE
export const CUELUME_CHROME = CUELUME_RELEASE
export const CUELUME_TOGGLE = CUELUME_PRESS
export const CUELUME_ROW = CUELUME_PRESS
export const CUELUME_COLOR = CUELUME_PRESS
export const CUELUME_OPTION = CUELUME_PRESS

const DESKTOP_SOUND_SCOPE_SELECTORS = [
  '[data-slot="desktop-workspace"]',
  '[data-slot="desktop-floating-toolbar-root"]',
  '[data-slot^="desktop-"]',
  ".desktopnew-root",
  ".desktopnew-fill-popover",
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

export function playDesktopPressSound() {
  playDesktopSound(DESKTOP_SOUND_PRESS, { volume: 0.45 })
}

function isAlreadyTagged(button: HTMLButtonElement): boolean {
  return (
    button.hasAttribute("data-cuelume-press") ||
    button.hasAttribute("data-cuelume-release") ||
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

function applyPress(button: HTMLButtonElement) {
  button.removeAttribute("data-cuelume-hover")
  button.removeAttribute("data-cuelume-release")
  button.removeAttribute("data-cuelume-toggle")
  button.setAttribute("data-cuelume-press", DESKTOP_SOUND_PRESS)
}

function applyRelease(button: HTMLButtonElement) {
  button.removeAttribute("data-cuelume-hover")
  button.removeAttribute("data-cuelume-press")
  button.removeAttribute("data-cuelume-toggle")
  button.setAttribute("data-cuelume-release", DESKTOP_SOUND_RELEASE)
}

function isAccordionHeader(button: HTMLButtonElement): boolean {
  return (
    button.hasAttribute("aria-expanded") &&
    button.hasAttribute("aria-controls") &&
    Boolean(button.closest(".dn-settings-accordion"))
  )
}

function isOptionTile(button: HTMLButtonElement): boolean {
  return (
    button.classList.contains("dn-option-tile") ||
    button.classList.contains("dn-preset-item") ||
    button.classList.contains("dn-preview-tile")
  )
}

function isChromeToolbarButton(button: HTMLButtonElement): boolean {
  return Boolean(
    button.closest(
      [
        '[data-slot="desktop-dynamic-island"]',
        '[data-slot="desktop-utility-toolbar"]',
        '[data-slot="desktop-compose-toolbar"]',
        '[data-slot="drafting-layer-floating-toolbar"]',
        '[data-slot="mobile-layer-toolbar"]',
      ].join(","),
    ),
  )
}

function isReleaseTierButton(button: HTMLButtonElement): boolean {
  return isAccordionHeader(button) || isChromeToolbarButton(button)
}

function enhanceDesktopSoundButton(button: HTMLButtonElement) {
  if (shouldSkipButton(button)) {
    return
  }

  if (isOptionTile(button)) {
    applyPress(button)
    return
  }

  if (isReleaseTierButton(button)) {
    applyRelease(button)
    return
  }

  applyPress(button)
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
