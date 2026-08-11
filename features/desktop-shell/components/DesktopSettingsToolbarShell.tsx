"use client"

import { motion } from "motion/react"
import { useCallback, useEffect, useState, type ReactNode } from "react"

import { EXPANDABLE_PANEL_SPRING } from "@/components/atomixui/expandable-panel-shell"
import {
  DesktopSettingsPanelMotionFrozenProvider,
} from "@/features/desktop-shell/components/desktop-settings-panel-motion-frozen-context"

import "./desktop-settings-toolbar-motion.css"

/** Expanded column leaves enough room to keep the canvas legible on compact desktops. */
const DESKTOP_SHELL_EXPANDED_WIDTH_RATIO = 0.28
const DESKTOP_SHELL_EXPANDED_WIDTH_MIN_PX = 300
const DESKTOP_SHELL_EXPANDED_WIDTH_MAX_PX = 380
const DESKTOP_SHELL_EXPANDED_WIDTH_FALLBACK_PX = 340

function getExpandedSidebarWidthPx(): number {
  if (typeof window === "undefined") {
    return DESKTOP_SHELL_EXPANDED_WIDTH_FALLBACK_PX
  }

  return Math.round(
    Math.min(
      DESKTOP_SHELL_EXPANDED_WIDTH_MAX_PX,
      Math.max(DESKTOP_SHELL_EXPANDED_WIDTH_MIN_PX, window.innerWidth * DESKTOP_SHELL_EXPANDED_WIDTH_RATIO),
    ),
  )
}

/**
 * One width drives the white settings column AND the grey canvas left inset.
 * Must be set on desktop-workspace / :root — canvas is not under the toolbar overlay,
 * so setting the var only on toolbar-root leaves the grey full-bleed (settings look like a transparent overlay).
 */
function syncSidebarColumnWidth(width: number) {
  const value = `${Math.max(0, width)}px`
  const targets: Array<HTMLElement | null> = [
    document.documentElement,
    document.querySelector<HTMLElement>('[data-slot="desktop-workspace"]'),
    document.querySelector<HTMLElement>('[data-slot="desktop-floating-toolbar-root"]'),
  ]

  for (const target of targets) {
    target?.style.setProperty("--desktop-settings-toolbar-width", value)
  }
}

export function DesktopSettingsToolbarShell({
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
  const [expandedWidth, setExpandedWidth] = useState(DESKTOP_SHELL_EXPANDED_WIDTH_FALLBACK_PX)
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
      <DesktopSettingsPanelMotionFrozenProvider frozen={isShellAnimating}>
        {inspector}
      </DesktopSettingsPanelMotionFrozenProvider>
    ) : null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[25]"
      data-slot="desktop-settings-toolbar-anchor"
      onMouseEnter={handleShellMouseEnter}
      onMouseLeave={handleShellMouseLeave}
    >
      {/*
        White column clip: width tracks viewport for responsive sidebar.
        Same width updates --desktop-settings-toolbar-width so grey canvas left inset
        grows in lockstep — white expands, grey minimizes. No overlay on the canvas.
      */}
      <motion.div
        className="pointer-events-auto absolute inset-y-0 left-0 z-[25] overflow-hidden bg-transparent text-[var(--desktop-glass-fg)]"
        data-hovered={isHovered ? "true" : "false"}
        data-shell-animating={isShellAnimating ? "true" : "false"}
        data-slot="desktop-left-toolbar-shell"
        data-toolbar-appearance="desktop-settings"
        initial={false}
        animate={{ width: expandedWidth }}
        transition={widthTransitionEnabled ? EXPANDABLE_PANEL_SPRING : { duration: 0 }}
        onAnimationStart={() => handleShellAnimatingChange(true)}
        onAnimationComplete={() => handleShellAnimatingChange(false)}
        onUpdate={(latest) => {
          if (typeof latest.width === "number") {
            syncSidebarColumnWidth(latest.width)
          }
        }}
      >
        <div
          className="h-full min-h-0 min-w-0 overflow-hidden"
          style={{ width: expandedWidth }}
        >
          <div className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-hidden">
            {panelContent}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
