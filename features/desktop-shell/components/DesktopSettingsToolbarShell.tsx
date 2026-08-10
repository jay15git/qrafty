"use client"

import { motion } from "motion/react"
import { useCallback, useEffect, useState, type ReactNode } from "react"

import { EXPANDABLE_PANEL_SPRING } from "@/components/atomixui/expandable-panel-shell"
import {
  TabsSubtleIconRail,
  TabsSubtleIconRailItem,
  TabsSubtleIconRailSeparator,
} from "@/components/ui/tabs-subtle-icon-rail"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import {
  DesktopSettingsPanelMotionFrozenProvider,
} from "@/features/desktop-shell/components/desktop-settings-panel-motion-frozen-context"
import {
  type DesktopInspectorModel,
  type DesktopToolbarToolId,
} from "@/features/desktop-shell/components/FloatingToolbar"
import { cn } from "@/lib/utils"

import "./desktop-settings-toolbar-motion.css"

/** Expanded column leaves enough room to keep the canvas legible on compact desktops. */
const DESKTOP_SHELL_EXPANDED_WIDTH_RATIO = 0.28
const DESKTOP_SHELL_EXPANDED_WIDTH_MIN_PX = 300
const DESKTOP_SHELL_EXPANDED_WIDTH_MAX_PX = 380
const DESKTOP_SHELL_EXPANDED_WIDTH_FALLBACK_PX = 340
const DESKTOP_TOOLBAR_RAIL_WIDTH_CLASS = "w-[4.5rem] max-md:w-[3.5rem]"

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
  model,
  showInspector,
}: {
  hovered?: boolean
  inspector: ReactNode
  model: DesktopInspectorModel
  showInspector: boolean
}) {
  const { actualActiveTool, onActiveToolChange, visibleToolbarTools } = model
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

  const handleToolSelect = (index: number) => {
    const toolId = visibleToolbarTools[index]?.id as DesktopToolbarToolId | undefined
    if (!toolId) {
      return
    }

    onActiveToolChange(toolId)
  }

  const nav = (
    <TabsSubtleIconRail
      aria-label="Desktop tools"
      data-slot="desktop-floating-toolbar"
      className="relative h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto px-1.5 pb-1.5 text-[var(--desktop-toolbar-fg)] max-md:px-1 max-md:pb-1"
      selectedIndex={
        actualActiveTool
          ? visibleToolbarTools.findIndex((tool) => tool.id === actualActiveTool)
          : -1
      }
      onSelect={handleToolSelect}
      selectedPillClassName="rounded-full bg-[var(--desktop-toolbar-pill-selected)]"
      hoverPillClassName="rounded-full bg-[var(--desktop-toolbar-pill-hover)]"
    >
      <div
        className="flex w-full flex-col items-center"
        data-slot="desktop-toolbar-tools"
      >
        {visibleToolbarTools.map((tool, index) => {
          const previousGroup = visibleToolbarTools[index - 1]?.group
          const startsGroup = index > 0 && tool.group !== previousGroup

          return (
            <div key={tool.id} className="contents">
              {startsGroup ? <TabsSubtleIconRailSeparator /> : null}
              <DesktopTooltip content={tool.title} side="right" sideOffset={10}>
                <TabsSubtleIconRailItem
                  aria-label={`Open ${tool.title}`}
                  data-desktop-tool-button="true"
                  data-tool-id={tool.id}
                  index={index}
                >
                  {tool.renderIcon()}
                </TabsSubtleIconRailItem>
              </DesktopTooltip>
            </div>
          )
        })}
      </div>
    </TabsSubtleIconRail>
  )

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
          className="flex h-full min-h-0 min-w-0 overflow-hidden"
          style={{ width: expandedWidth }}
        >
          <div className={cn("flex h-full min-h-0 shrink-0 flex-col", DESKTOP_TOOLBAR_RAIL_WIDTH_CLASS)}>
            {nav}
          </div>
          <div className="h-full min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-hidden">
            {panelContent}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
