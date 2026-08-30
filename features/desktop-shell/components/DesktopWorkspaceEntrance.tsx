"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { previewDrawerResize } from "@/features/workspace/preview/preview-drawer-resize"

import "./desktop-workspace-entrance.css"

export const DESKTOP_ENTRANCE_COMPLETE_EVENT = "desktop-entrance-complete"
export const DESKTOP_ENTRANCE_PRE_REVEAL_EVENT = "desktop-entrance-pre-reveal"

const REVEAL_MS = 940
const MOBILE_INSET_QUERY = "(max-width: 767px)"

export type DesktopEntrancePhase = "loading" | "revealing" | "done"

type DesktopWorkspaceEntranceProps = {
  theme: DesktopThemeMode
  children: ReactNode
  onPhaseChange?: (phase: DesktopEntrancePhase) => void
}

function isMobileChromeInsetsReady() {
  if (typeof window.matchMedia !== "function") {
    return true
  }

  if (!window.matchMedia(MOBILE_INSET_QUERY).matches) {
    return true
  }

  if (document.querySelector('[data-slot="mobile-family-drawer-root"]') === null) {
    return true
  }

  const workspace = document.querySelector<HTMLElement>('[data-slot="desktop-workspace"]')
  const measuredDrawerHeight = workspace?.style.getPropertyValue("--desktop-mobile-drawer-height")

  return (
    Boolean(measuredDrawerHeight && measuredDrawerHeight !== "0px") &&
    !previewDrawerResize.getIsResizing()
  )
}

function getWorkspaceReadiness(root: HTMLElement) {
  const surfaceReady =
    root.querySelector('[data-slot="drafting-surface"]') !== null &&
    root.querySelector('[data-slot="drafting-workspace-loading"]') === null

  if (!surfaceReady) {
    return "surface-pending" as const
  }

  if (!isMobileChromeInsetsReady()) {
    return "insets-pending" as const
  }

  return "ready" as const
}

export function DesktopWorkspaceEntrance({
  theme,
  children,
  onPhaseChange,
}: DesktopWorkspaceEntranceProps) {
  const [phase, setPhase] = useState<DesktopEntrancePhase>("loading")
  const rootRef = useRef<HTMLDivElement>(null)

  const updatePhase = useCallback(
    (next: DesktopEntrancePhase) => {
      setPhase(next)
      onPhaseChange?.(next)
    },
    [onPhaseChange],
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) {
      return
    }

    let revealFrame = 0
    let pollFrame = 0
    let observer: MutationObserver | null = null

    const beginReveal = () => {
      window.dispatchEvent(new CustomEvent(DESKTOP_ENTRANCE_PRE_REVEAL_EVENT))
      revealFrame = window.requestAnimationFrame(() => {
        updatePhase("revealing")
      })
    }

    const tryReveal = () => {
      if (getWorkspaceReadiness(root) !== "ready") {
        return false
      }

      observer?.disconnect()
      window.cancelAnimationFrame(pollFrame)
      beginReveal()
      return true
    }

    const scheduleInsetPoll = () => {
      if (getWorkspaceReadiness(root) !== "insets-pending") {
        return
      }

      const poll = () => {
        if (tryReveal()) {
          return
        }

        if (getWorkspaceReadiness(root) === "insets-pending") {
          pollFrame = window.requestAnimationFrame(poll)
        }
      }

      pollFrame = window.requestAnimationFrame(poll)
    }

    if (tryReveal()) {
      return () => window.cancelAnimationFrame(revealFrame)
    }

    observer = new MutationObserver(() => {
      if (tryReveal()) {
        return
      }

      scheduleInsetPoll()
    })

    observer.observe(root, { childList: true, subtree: true })
    scheduleInsetPoll()

    return () => {
      observer?.disconnect()
      window.cancelAnimationFrame(revealFrame)
      window.cancelAnimationFrame(pollFrame)
    }
  }, [updatePhase])

  useEffect(() => {
    if (phase !== "revealing") {
      return
    }

    const timer = window.setTimeout(() => {
      updatePhase("done")
      window.dispatchEvent(new CustomEvent(DESKTOP_ENTRANCE_COMPLETE_EVENT))
    }, REVEAL_MS)

    return () => window.clearTimeout(timer)
  }, [phase, updatePhase])

  return (
    <div
      ref={rootRef}
      className="relative h-full min-h-0"
      data-desktop-entrance={phase}
      data-desktop-theme={theme}
      data-slot="desktop-entrance-root"
    >
      <div className="h-full min-h-0">{children}</div>
    </div>
  )
}
