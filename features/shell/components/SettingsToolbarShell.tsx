"use client"

import { m } from "motion/react"
import { useCallback, useEffect, useState, type ReactNode } from "react"

import {
  SettingsPanelMotionFrozenProvider,
} from "@/features/shell/components/settings-panel-motion-frozen-context"

import "./settings-toolbar-motion.css"

const EXPANDABLE_PANEL_SPRING = { type: "spring" as const, stiffness: 340, damping: 28 }

/** Expanded column leaves enough room to keep the canvas legible on compact desktops. */
const SHELL_EXPANDED_WIDTH_RATIO = 0.28
const SHELL_EXPANDED_WIDTH_MIN_PX = 320
const SHELL_EXPANDED_WIDTH_MAX_PX = 400
const SHELL_EXPANDED_WIDTH_FALLBACK_PX = 360

function getExpandedSidebarWidthPx(): number {
  if (typeof window === "undefined") {
    return SHELL_EXPANDED_WIDTH_FALLBACK_PX
  }

  return Math.round(
    Math.min(
      SHELL_EXPANDED_WIDTH_MAX_PX,
      Math.max(SHELL_EXPANDED_WIDTH_MIN_PX, window.innerWidth * SHELL_EXPANDED_WIDTH_RATIO),
    ),
  )
}

/**
 * One width drives the white settings column AND the grey canvas left inset.
 * Must be set on workspace / :root — canvas is not under the toolbar overlay,
 * so setting the var only on toolbar-root leaves the grey full-bleed (settings look like a transparent overlay).
 */
function syncSidebarColumnWidth(width: number) {
  const value = `${Math.max(0, width)}px`
  const targets: Array<HTMLElement | null> = [
    document.documentElement,
    document.querySelector<HTMLElement>('[data-slot="workspace"]'),
    document.querySelector<HTMLElement>('[data-slot="floating-toolbar-root"]'),
  ]

  for (const target of targets) {
    target?.style.setProperty("--settings-toolbar-width", value)
  }
}

export function SettingsToolbarShell({
  hovered,
  inspector,
  showInspector,
}: {
  hovered?: boolean
  inspector: ReactNode
  showInspector: boolean
}) {
  const [internalHovered, setInternalHovered] = useState(false)
  const [isShellAnimating, setIsShellAnimating] = useState(false)
  const [expandedWidth, setExpandedWidth] = useState(SHELL_EXPANDED_WIDTH_FALLBACK_PX)
  const [widthTransitionEnabled, setWidthTransitionEnabled] = useState(false)
  const isHovered = hovered ?? internalHovered

  useEffect(() => {
    syncSidebarColumnWidth(expandedWidth)
  }, [expandedWidth])

  useEffect(() => {
    const updateExpandedWidth = () => {
      const next = getExpandedSidebarWidthPx()
      setExpandedWidth(next)
    }

    updateExpandedWidth()
    window.addEventListener("resize", updateExpandedWidth)
    const enableTransitionsFrame = window.requestAnimationFrame(() => {
      setWidthTransitionEnabled(true)
    })

    return () => {
      window.removeEventListener("resize", updateExpandedWidth)
      window.cancelAnimationFrame(enableTransitionsFrame)
    }
  }, [])

  const handleShellAnimatingChange = useCallback((animating: boolean) => {
    setIsShellAnimating(animating)
  }, [])

  const handleShellMouseEnter = useCallback(() => {
    if (hovered === undefined) {
      setInternalHovered(true)
    }
  }, [hovered])

  const handleShellMouseLeave = useCallback(() => {
    if (hovered === undefined) {
      setInternalHovered(false)
    }
  }, [hovered])

  const panelContent =
    showInspector ? (
      <SettingsPanelMotionFrozenProvider frozen={isShellAnimating}>
        {inspector}
      </SettingsPanelMotionFrozenProvider>
    ) : null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[25]"
      data-slot="settings-toolbar-anchor"
      onMouseEnter={handleShellMouseEnter}
      onMouseLeave={handleShellMouseLeave}
    >
      {/*
        White column clip: width tracks viewport for responsive sidebar.
        Same width updates --settings-toolbar-width so grey canvas left inset
        grows in lockstep — white expands, grey minimizes. No overlay on the canvas.
      */}
      <m.div
        className="pointer-events-auto absolute inset-y-0 left-0 z-[25] overflow-hidden bg-transparent text-[var(--glass-fg)]"
        data-hovered={isHovered ? "true" : "false"}
        data-shell-animating={isShellAnimating ? "true" : "false"}
        data-slot="left-toolbar-shell"
        data-toolbar-appearance="settings"
        initial={false}
        animate={{ width: expandedWidth }}
        transition={widthTransitionEnabled ? EXPANDABLE_PANEL_SPRING : { duration: 0 }}
        onAnimationStart={() => handleShellAnimatingChange(true)}
        onAnimationComplete={() => handleShellAnimatingChange(false)}
        onUpdate={(latest) => {
          // Keep the canvas left inset in lockstep with the animated width —
          // syncing only on commit leaves the grey inset one jump behind.
          const width = typeof latest.width === "number" ? latest.width : parseFloat(latest.width)
          if (Number.isFinite(width)) {
            syncSidebarColumnWidth(width)
          }
        }}
      >
        <div className="h-full min-h-0 w-full min-w-0 overflow-hidden">
          <div className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-hidden">
            {panelContent}
          </div>
        </div>
      </m.div>
    </div>
  )
}
