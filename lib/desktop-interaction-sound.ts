import type { PlayFunction } from "@/lib/sound-types"

export type DesktopSoundZone = "panel" | "toolbar" | "slider"

const DESKTOP_SOUNDS_ENABLED_KEY = "desktop-sounds-enabled"

const ZONE_OPTIONS: Record<
  DesktopSoundZone,
  { volume: number; playbackRate?: number; minIntervalMs?: number }
> = {
  panel: { volume: 0.35 },
  toolbar: { volume: 0.5 },
  slider: { volume: 0.4 },
}

const zonePlayers = new Map<DesktopSoundZone, PlayFunction>()

const TOOLBAR_ZONE_SELECTOR = [
  '[data-slot="desktop-document-toolbar"]',
  '[data-slot="desktop-utility-toolbar"]',
  '[data-slot="desktop-dynamic-island"]',
  '[data-slot="desktop-compose-toolbar"]',
  '[data-slot="drafting-layer-floating-toolbar"]',
  '[data-slot="desktop-insert-menu-popover"]',
  '[data-slot="desktop-zoom-popover"]',
  '[data-slot="desktop-keyboard-shortcuts-popover"]',
].join(",")

const lastPlayedAt = new Map<DesktopSoundZone, number>()

export function registerDesktopZonePlayer(zone: DesktopSoundZone, play: PlayFunction): void {
  zonePlayers.set(zone, play)
}

export function unregisterDesktopZonePlayer(zone: DesktopSoundZone): void {
  zonePlayers.delete(zone)
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function areDesktopSoundsEnabled(): boolean {
  if (typeof window === "undefined") return false
  if (prefersReducedMotion()) return false
  return window.localStorage.getItem(DESKTOP_SOUNDS_ENABLED_KEY) !== "false"
}

function setDesktopSoundsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DESKTOP_SOUNDS_ENABLED_KEY, enabled ? "true" : "false")
}

export function playDesktopSound(zone: DesktopSoundZone): void {
  if (typeof window === "undefined") return
  if (!areDesktopSoundsEnabled()) return

  const options = ZONE_OPTIONS[zone]
  const now = Date.now()
  const lastPlayed = lastPlayedAt.get(zone) ?? 0
  if (options.minIntervalMs && now - lastPlayed < options.minIntervalMs) {
    return
  }

  const play = zonePlayers.get(zone)
  if (!play) return

  lastPlayedAt.set(zone, now)

  play({
    volume: options.volume,
    playbackRate: options.playbackRate,
  })
}

function isInteractiveClickTarget(target: Element): boolean {
  const interactive = target.closest(
    'button:not([disabled]), [role="button"]:not([aria-disabled="true"]), [role="menuitem"], [role="radio"], [role="switch"], [role="tab"], input[type="checkbox"]:not([disabled]), label[for], a[href]',
  )
  if (!interactive) return false
  if (interactive instanceof HTMLButtonElement && interactive.disabled) return false
  if (interactive.getAttribute("aria-disabled") === "true") return false
  if (interactive.closest('[data-slot="elastic-slider"]')) return false
  return true
}

export function resolveDesktopSoundZone(target: Element): DesktopSoundZone | null {
  if (typeof document === "undefined") return null
  if (!document.querySelector('[data-slot="desktop-workspace"]')) return null
  if (!isInteractiveClickTarget(target)) return null

  if (target.closest('[data-slot="drafting-layer-context-menu"]')) {
    return "panel"
  }

  if (target.closest(TOOLBAR_ZONE_SELECTOR)) {
    return "toolbar"
  }

  if (
    target.closest('[data-slot="desktop-workspace"]') &&
    target.closest('[data-slot="desktop-left-toolbar-shell"]')
  ) {
    return "panel"
  }

  return null
}

export function handleDesktopSoundPointerDown(event: PointerEvent): void {
  if (event.button !== 0) return
  const target = event.target
  if (!(target instanceof Element)) return

  const zone = resolveDesktopSoundZone(target)
  if (!zone) return

  playDesktopSound(zone)
}
