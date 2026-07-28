"use client"

import {
  SidebarLeftIcon,
  SidebarRightIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion } from "motion/react"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import { EXPANDABLE_PANEL_SPRING } from "@/components/atomixui/expandable-panel-shell"
import {
  TabsSubtleIconRail,
  TabsSubtleIconRailAccessory,
  TabsSubtleIconRailItem,
  TabsSubtleIconRailSeparator,
} from "@/components/ui/tabs-subtle-icon-rail"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import { DESKTOP_INSPECTOR_FOCUS_CLASS } from "@/features/desktop-shell/components/InspectorControls"
import {
  DesktopSettingsPanelMotionFrozenProvider,
} from "@/features/desktop-shell/components/desktop-settings-panel-motion-frozen-context"
import {
  type DesktopInspectorModel,
  type DesktopToolbarToolId,
} from "@/features/desktop-shell/components/FloatingToolbar"
import { cn } from "@/lib/utils"

import "./desktop-settings-toolbar-motion.css"

export const DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY =
  "desktop-settings-toolbar-collapsed"

/** Collapsed: no white column — grey squircle is maximized. */
const DESKTOP_SHELL_COLLAPSED_WIDTH_PX = 0
/** Expanded white column ~32% so grey squircle stays dominant on the right. */
const DESKTOP_SHELL_EXPANDED_WIDTH_RATIO = 0.32
const DESKTOP_SHELL_EXPANDED_WIDTH_MIN_PX = 300
const DESKTOP_SHELL_EXPANDED_WIDTH_MAX_PX = 420
const DESKTOP_SHELL_EXPANDED_WIDTH_FALLBACK_PX = 360
const DESKTOP_TOOLBAR_BRAND_PROXIMITY_INDEX = -1
const DESKTOP_TOOLBAR_BRAND_ICON_SIZE = 20
const DESKTOP_SIDEBAR_TOGGLE_ICON_SIZE = 18
const DESKTOP_TOOLBAR_RAIL_WIDTH_CLASS = "w-[4.5rem] max-md:w-[3.5rem]"

function readCollapsedFromSession(): boolean {
  if (typeof window === "undefined") {
    return true
  }

  const stored = window.sessionStorage.getItem(DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY)
  if (stored === null) {
    return true
  }

  return stored === "true"
}

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

function DesktopSidebarToggleButton({
  className,
  collapsed,
  onClick,
}: {
  className?: string
  collapsed: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-expanded={!collapsed}
      aria-label={collapsed ? "Expand settings panel" : "Collapse settings panel"}
      className={cn(
        DESKTOP_INSPECTOR_FOCUS_CLASS,
        "grid size-10 shrink-0 cursor-pointer place-items-center rounded-[12px] border border-[var(--desktop-glass-border)] bg-[var(--desktop-glass-bg)] text-[var(--desktop-glass-fg)] shadow-[var(--desktop-glass-shadow)] backdrop-blur-2xl transition hover:bg-[var(--desktop-glass-button-hover-bg)] hover:text-[var(--desktop-glass-button-hover-fg)]",
        className,
      )}
      data-slot="desktop-sidebar-toggle"
      type="button"
      onClick={onClick}
    >
      <HugeiconsIcon
        icon={collapsed ? SidebarRightIcon : SidebarLeftIcon}
        size={DESKTOP_SIDEBAR_TOGGLE_ICON_SIZE}
        color="currentColor"
        strokeWidth={1.8}
      />
    </button>
  )
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
  const { actualActiveTool, controller, onActiveToolChange, visibleToolbarTools } = model
  const [internalHovered, setInternalHovered] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => readCollapsedFromSession())
  const [isShellAnimating, setIsShellAnimating] = useState(false)
  const [panelMounted, setPanelMounted] = useState(
    () => !readCollapsedFromSession() && showInspector,
  )
  const [expandedWidth, setExpandedWidth] = useState(() => getExpandedSidebarWidthPx())
  const isCollapsedRef = useRef(isCollapsed)
  const isHovered = hovered ?? internalHovered
  const columnWidth = isCollapsed ? DESKTOP_SHELL_COLLAPSED_WIDTH_PX : expandedWidth

  useEffect(() => {
    isCollapsedRef.current = isCollapsed
  }, [isCollapsed])

  useEffect(() => {
    syncSidebarColumnWidth(columnWidth)
  }, [columnWidth])

  useEffect(() => {
    const updateExpandedWidth = () => {
      const next = getExpandedSidebarWidthPx()
      setExpandedWidth(next)
    }

    updateExpandedWidth()
    window.addEventListener("resize", updateExpandedWidth)
    return () => window.removeEventListener("resize", updateExpandedWidth)
  }, [])

  useEffect(() => {
    const collapsed = readCollapsedFromSession()
    setIsCollapsed(collapsed)
    setPanelMounted(!collapsed && showInspector)
  }, [showInspector])

  useEffect(() => {
    if (!isCollapsed && showInspector && !isShellAnimating) {
      setPanelMounted(true)
    }
  }, [isCollapsed, isShellAnimating, showInspector])

  useEffect(() => {
    if (!controller?.composeSidebarPanel || !isCollapsed) {
      return
    }

    setIsCollapsed(false)
    window.sessionStorage.setItem(DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY, "false")
  }, [controller?.composeSidebarPanel, isCollapsed])

  const handleShellAnimatingChange = useCallback(
    (animating: boolean) => {
      setIsShellAnimating(animating)

      if (animating) {
        return
      }

      if (isCollapsedRef.current || !showInspector) {
        setPanelMounted(false)
        return
      }

      setPanelMounted(true)
    },
    [showInspector],
  )

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((previous) => {
      const next = !previous
      window.sessionStorage.setItem(
        DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY,
        String(next),
      )
      return next
    })
  }, [])

  const sidebarIconSwapState = isCollapsed ? "b" : "a"

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

    if (isCollapsed) {
      setIsCollapsed(false)
      window.sessionStorage.setItem(DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY, "false")
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
      <TabsSubtleIconRailAccessory
        index={DESKTOP_TOOLBAR_BRAND_PROXIMITY_INDEX}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Expand settings panel" : "Collapse settings panel"}
        className={DESKTOP_INSPECTOR_FOCUS_CLASS}
        data-slot="desktop-toolbar-brand"
        onClick={toggleCollapsed}
      >
        <span
          aria-hidden="true"
          data-slot="tabs-subtle-icon-rail-icon"
          className="pointer-events-none grid size-11 max-md:size-10 place-items-center [&_svg]:pointer-events-none"
        >
          <span className="t-icon-swap t-icon-swap--sidebar" data-state={sidebarIconSwapState}>
            <span className="t-icon grid place-items-center" data-icon="a">
              <HugeiconsIcon
                icon={SidebarLeftIcon}
                size={DESKTOP_TOOLBAR_BRAND_ICON_SIZE}
                color="currentColor"
                strokeWidth={1.8}
              />
            </span>
            <span className="t-icon grid place-items-center" data-icon="b">
              <HugeiconsIcon
                icon={SidebarRightIcon}
                size={DESKTOP_TOOLBAR_BRAND_ICON_SIZE}
                color="currentColor"
                strokeWidth={1.8}
              />
            </span>
          </span>
        </span>
      </TabsSubtleIconRailAccessory>
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
    showInspector && panelMounted ? (
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
      {isCollapsed ? (
        <div className="pointer-events-auto absolute left-[var(--desktop-settings-toolbar-chrome-gap)] top-[var(--desktop-settings-toolbar-chrome-gap)] z-[26]">
          <DesktopSidebarToggleButton collapsed onClick={toggleCollapsed} />
        </div>
      ) : null}

      {/*
        White column clip: width animates 0 → expanded.
        Same width updates --desktop-settings-toolbar-width so grey canvas left inset
        grows in lockstep — white expands, grey minimizes. No overlay on the canvas.
      */}
      <motion.div
        className={cn(
          "absolute inset-y-0 left-0 z-[25] overflow-hidden bg-transparent text-[var(--desktop-glass-fg)]",
          isCollapsed ? "pointer-events-none" : "pointer-events-auto",
        )}
        data-collapsed={isCollapsed ? "true" : "false"}
        data-hovered={isHovered ? "true" : "false"}
        data-shell-animating={isShellAnimating ? "true" : "false"}
        data-slot="desktop-left-toolbar-shell"
        data-toolbar-appearance="desktop-settings"
        initial={false}
        animate={{ width: columnWidth }}
        transition={EXPANDABLE_PANEL_SPRING}
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
