import { play, setEnabled, setVolume, type SoundName } from "cuelume";

export const SOUNDS_STORAGE_KEY = "qrafty:sounds";
const DEFAULT_DESKTOP_SOUND_VOLUME = 0.65;

export const SOUND_PRESS = "press" satisfies SoundName;
export const SOUND_RELEASE = "release" satisfies SoundName;
export const SOUND_TOGGLE = "toggle" satisfies SoundName;

/** Pointer down + pointer up — default for buttons and icon controls. */
export const CUELUME_BUTTON = {
  "data-cuelume-press": SOUND_PRESS,
  "data-cuelume-release": SOUND_RELEASE,
} as const;

/** Click — tabs, switches, segmented controls, and pick-one tiles. */
export const CUELUME_TOGGLE = {
  "data-cuelume-toggle": SOUND_TOGGLE,
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function prefersReducedMotion(): boolean {
  if (!isBrowser()) {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function readSoundsEnabled(): boolean {
  if (!isBrowser()) {
    return true;
  }

  try {
    const stored = window.localStorage.getItem(SOUNDS_STORAGE_KEY);
    if (stored === "false") {
      return false;
    }
    if (stored === "true") {
      return true;
    }
  } catch {
    // Ignore private-mode storage failures.
  }

  return true;
}

export function persistSoundsEnabled(enabled: boolean) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(SOUNDS_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // Ignore private-mode storage failures.
  }
}

export function applySoundPreferences() {
  const enabled = readSoundsEnabled() && !prefersReducedMotion();
  setEnabled(enabled);
  setVolume(DEFAULT_DESKTOP_SOUND_VOLUME);
}

export function setSoundsEnabled(enabled: boolean) {
  persistSoundsEnabled(enabled);
  applySoundPreferences();
}

export function playSound(name: SoundName, options?: { volume?: number }) {
  if (!readSoundsEnabled() || prefersReducedMotion()) {
    return;
  }

  play(name, options);
}

/** Imperative press cue for slider scrub steps and other non-button feedback. */
export function playPressSound() {
  playSound(SOUND_PRESS, { volume: 0.45 });
}

export type CuelumeKind = "button" | "toggle" | "none";

export function cuelumeAttrs(kind: CuelumeKind = "button") {
  if (kind === "toggle") {
    return CUELUME_TOGGLE;
  }

  if (kind === "none") {
    return {};
  }

  return CUELUME_BUTTON;
}
