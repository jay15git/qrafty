"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"

import "./desktop-workspace-entrance.css"

const REVEAL_MS = 400

export type DesktopEntrancePhase = "loading" | "revealing" | "done"

type DesktopWorkspaceEntranceProps = {
  theme: DesktopThemeMode
  children: ReactNode
  onPhaseChange?: (phase: DesktopEntrancePhase) => void
}

function isWorkspaceContentReady(root: HTMLElement) {
  return (
    root.querySelector('[data-slot="drafting-surface"]') !== null &&
    root.querySelector('[data-slot="drafting-workspace-loading"]') === null
  )
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

    const beginReveal = () => {
      revealFrame = window.requestAnimationFrame(() => {
        updatePhase("revealing")
      })
    }

    if (isWorkspaceContentReady(root)) {
      beginReveal()
      return () => window.cancelAnimationFrame(revealFrame)
    }

    const observer = new MutationObserver(() => {
      if (!isWorkspaceContentReady(root)) {
        return
      }

      observer.disconnect()
      beginReveal()
    })

    observer.observe(root, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(revealFrame)
    }
  }, [updatePhase])

  useEffect(() => {
    if (phase !== "revealing") {
      return
    }

    const timer = window.setTimeout(() => {
      updatePhase("done")
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
      <div className="h-full min-h-0" data-slot="desktop-entrance-content">
        {children}
      </div>
      {phase !== "done" ? <div aria-hidden data-slot="desktop-entrance-veil" /> : null}
    </div>
  )
}
