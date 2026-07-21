"use client"

import {
  SidebarLeftIcon,
  SidebarRightIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import { ExpandablePanelShell } from "@/components/atomixui/expandable-panel-shell"
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
  DESKTOP_TOOLBAR_TOOLS,
  type DesktopInspectorModel,
  type DesktopToolbarToolId,
} from "@/features/desktop-shell/components/FloatingToolbar"

import "./desktop-settings-toolbar-motion.css"

export const DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY =
  "desktop-settings-toolbar-collapsed"

const DESKTOP_SHELL_COLLAPSED_WIDTH_PX = 72
const DESKTOP_SHELL_EXPANDED_WIDTH_PX = 380
/** Half collapsed rail width — pill at 72px, same corner curve when expanded */
const DESKTOP_SHELL_CORNER_RADIUS_PX = DESKTOP_SHELL_COLLAPSED_WIDTH_PX / 2
const DESKTOP_TOOLBAR_BRAND_PROXIMITY_INDEX = -1
const DESKTOP_TOOLBAR_BRAND_ICON_SIZE = 20

function readCollapsedFromSession(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  return window.sessionStorage.getItem(DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY) === "true"
}

function syncToolbarWidthVar(width: number) {
  const root = document.querySelector<HTMLElement>('[data-slot="desktop-floating-toolbar-root"]')
  root?.style.setProperty("--desktop-settings-toolbar-width", `${width}px`)
  root?.style.setProperty(
    "--desktop-settings-toolbar-corner-radius",
    `${DESKTOP_SHELL_CORNER_RADIUS_PX}px`,
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isShellAnimating, setIsShellAnimating] = useState(false)
  const [panelMounted, setPanelMounted] = useState(false)
  const isCollapsedRef = useRef(isCollapsed)
  const isHovered = hovered ?? internalHovered

  useEffect(() => {
    isCollapsedRef.current = isCollapsed
  }, [isCollapsed])

  useEffect(() => {
    const collapsed = readCollapsedFromSession()
    setIsCollapsed(collapsed)
    syncToolbarWidthVar(
      collapsed ? DESKTOP_SHELL_COLLAPSED_WIDTH_PX : DESKTOP_SHELL_EXPANDED_WIDTH_PX,
    )
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

  const isExpanded = !isCollapsed
  const activeKey = showInspector
    ? controller?.composeSidebarPanel
      ? `compose:${controller.composeSidebarPanel}`
      : controller?.selectedElementLayer
      ? `element:${controller.selectedElementLayer.id}`
      : actualActiveTool
    : null

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

  const brandIconSwapState = isHovered ? "b" : "a"
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

  const handleBrandClick = () => {
    if (!isHovered) {
      return
    }

    toggleCollapsed()
  }

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
        onClick={handleBrandClick}
      >
        <span
          aria-hidden="true"
          data-slot="tabs-subtle-icon-rail-icon"
          className="pointer-events-none grid size-11 max-md:size-10 place-items-center [&_svg]:pointer-events-none"
        >
          <span className="t-icon-swap" data-state={brandIconSwapState}>
            <span className="t-icon grid place-items-center" data-icon="a">
              <img
                alt=""
                className="size-10 rounded-full object-contain max-md:size-9"
                draggable={false}
                src="/brand/openai-toolbar-icon.png"
              />
            </span>
            <span className="t-icon grid place-items-center" data-icon="b">
              <span
                className="t-icon-swap t-icon-swap--sidebar"
                data-state={sidebarIconSwapState}
              >
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

  const panelContent = showInspector ? (
    <DesktopSettingsPanelMotionFrozenProvider frozen={isShellAnimating}>
      {inspector}
    </DesktopSettingsPanelMotionFrozenProvider>
  ) : null

  return (
    <div
      className="fixed bottom-5 left-5 top-5 z-[25] max-md:bottom-4 max-md:left-3 max-md:top-4"
      onMouseEnter={handleShellMouseEnter}
      onMouseLeave={handleShellMouseLeave}
    >
      <ExpandablePanelShell
        activeKey={activeKey}
        collapsedWidth={DESKTOP_SHELL_COLLAPSED_WIDTH_PX}
        data-collapsed={isCollapsed ? "true" : "false"}
        data-slot="desktop-left-toolbar-shell"
        data-toolbar-appearance="desktop-glass"
        direction={0}
        enablePanelSlide={false}
        expanded={isExpanded}
        expandedWidth={DESKTOP_SHELL_EXPANDED_WIDTH_PX}
        layout="left-rail"
        nav={nav}
        panel={panelContent}
        panelMounted={panelMounted}
        onShellAnimatingChange={handleShellAnimatingChange}
        onWidthChange={syncToolbarWidthVar}
        shellClassName="h-full border border-[var(--desktop-glass-panel-border)] bg-[var(--desktop-glass-bg)] text-[var(--desktop-glass-fg)] shadow-[var(--desktop-glass-panel-shadow)] backdrop-blur-2xl"
        shellStyle={{
          height: "100%",
          borderRadius: DESKTOP_SHELL_CORNER_RADIUS_PX,
        }}
      />
    </div>
  )
}
