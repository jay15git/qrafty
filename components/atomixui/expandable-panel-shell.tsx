"use client"

import { AnimatePresence, m } from "motion/react"
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import useMeasure from "react-use-measure"

import { cn } from "@/lib/utils"

export const EXPANDABLE_PANEL_SPRING = { type: "spring" as const, stiffness: 340, damping: 28 }
const EXPANDABLE_PANEL_SLIDE_T = {
  duration: 0.24,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
}

const expandablePanelSlideVariants = {
  enter: (dir: number) => ({ x: dir * 32, opacity: 0, filter: "blur(4px)" }),
  center: { x: 0, opacity: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({ x: dir * -32, opacity: 0, filter: "blur(4px)" }),
}

export type ExpandablePanelShellLayout = "bottom-nav" | "left-rail"

export type ExpandablePanelShellProps = {
  activeKey: string | null
  className?: string
  collapsedHeight?: number
  collapsedWidth: number
  direction: number
  enablePanelSlide?: boolean
  expanded: boolean
  expandedWidth: number
  layout: ExpandablePanelShellLayout
  measureHeight?: boolean
  measureWidth?: number
  nav: ReactNode
  onShellAnimatingChange?: (animating: boolean) => void
  onWidthChange?: (width: number) => void
  panel: ReactNode | null
  panelMounted?: boolean
  shellClassName?: string
  shellStyle?: CSSProperties
  "data-slot"?: string
  "data-collapsed"?: string
  "data-toolbar-appearance"?: string
}

export function ExpandablePanelShell({
  activeKey,
  className,
  collapsedHeight,
  collapsedWidth,
  direction,
  enablePanelSlide = true,
  expanded,
  expandedWidth,
  layout,
  measureHeight = false,
  measureWidth,
  nav,
  onShellAnimatingChange,
  onWidthChange,
  panel,
  panelMounted,
  shellClassName,
  shellStyle,
  "data-slot": dataSlot,
  "data-collapsed": dataCollapsed,
  "data-toolbar-appearance": dataToolbarAppearance,
}: ExpandablePanelShellProps) {
  const [ghostRef, { height: measuredHeight }] = useMeasure({ debounce: 0 })
  const [isShellAnimating, setIsShellAnimating] = useState(false)
  const widthTargetRef = useRef(expanded ? expandedWidth : collapsedWidth)

  const shellWidth = expanded ? expandedWidth : collapsedWidth
  const shellHeight =
    layout === "bottom-nav" && collapsedHeight !== undefined
      ? expanded && measureHeight
        ? measuredHeight + collapsedHeight
        : collapsedHeight
      : undefined

  const panelFixedWidth = expandedWidth - collapsedWidth
  const showPanel = panelMounted ?? expanded
  const usePanelSlide = enablePanelSlide && !isShellAnimating
  const useExpandedInnerLayout = expanded || isShellAnimating
  const innerRowWidth = useExpandedInnerLayout ? expandedWidth : collapsedWidth
  const panelColumnWidth = useExpandedInnerLayout ? panelFixedWidth : 0

  const isFirstExpandedRenderRef = useRef(true)

  useLayoutEffect(() => {
    if (isFirstExpandedRenderRef.current) {
      isFirstExpandedRenderRef.current = false
      return
    }

    setIsShellAnimating(true)
  }, [expanded])

  useEffect(() => {
    onWidthChange?.(shellWidth)
  }, [onWidthChange, shellWidth])

  const panelBody = usePanelSlide ? (
    <AnimatePresence custom={direction} initial={false}>
      {showPanel && activeKey && panel ? (
        <m.div
          key={activeKey}
          custom={direction}
          variants={expandablePanelSlideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={EXPANDABLE_PANEL_SLIDE_T}
          className={layout === "bottom-nav" ? "absolute inset-x-0 top-0" : "h-full min-h-0"}
        >
          {panel}
        </m.div>
      ) : null}
    </AnimatePresence>
  ) : showPanel && activeKey && panel ? (
    <div
      className={layout === "bottom-nav" ? "absolute inset-x-0 top-0" : "h-full min-h-0"}
      data-panel-frozen="true"
    >
      {panel}
    </div>
  ) : null

  const panelSlot =
    layout === "bottom-nav" ? (
      <div
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ bottom: collapsedHeight }}
      >
        {panelBody}
      </div>
    ) : (
      <div
        className="h-full shrink-0 overflow-hidden"
        data-shell-animating={isShellAnimating ? "true" : "false"}
        style={{ width: panelColumnWidth }}
      >
        {panelBody}
      </div>
    )

  const navSlot =
    layout === "bottom-nav" ? (
      <div
        className="absolute inset-x-0 bottom-0 border-t border-zinc-100 bg-white p-2"
        style={{ height: collapsedHeight }}
      >
        {nav}
      </div>
    ) : (
      <div
        className={cn(
          "flex h-full min-h-0 shrink-0 flex-col",
          useExpandedInnerLayout ? "w-[4.5rem] max-md:w-[3.5rem]" : "w-full",
        )}
      >
        {nav}
      </div>
    )

  return (
    <>
      {expanded && measureHeight && panel ? (
        <div
          aria-hidden="true"
          className="pointer-events-none invisible fixed left-[-9999px] top-0"
          style={{ width: measureWidth ?? expandedWidth }}
        >
          <div ref={ghostRef}>{panel}</div>
        </div>
      ) : null}
      <m.div
        layout
        data-slot={dataSlot}
        data-collapsed={dataCollapsed}
        data-shell-animating={isShellAnimating ? "true" : "false"}
        data-toolbar-appearance={dataToolbarAppearance}
        className={cn("relative overflow-hidden", shellClassName, className)}
        style={{
          overflow: "hidden",
          width: shellWidth,
          ...(shellHeight !== undefined ? { height: shellHeight } : {}),
          ...shellStyle,
        }}
        transition={EXPANDABLE_PANEL_SPRING}
        onLayoutAnimationStart={() => {
          widthTargetRef.current = shellWidth
          setIsShellAnimating(true)
          onShellAnimatingChange?.(true)
        }}
        onLayoutAnimationComplete={() => {
          setIsShellAnimating(false)
          onShellAnimatingChange?.(false)
        }}
      >
        {layout === "bottom-nav" ? (
          <>
            {panelSlot}
            {navSlot}
          </>
        ) : (
          <div className="flex h-full min-h-0" style={{ width: innerRowWidth }}>
            {navSlot}
            {panelSlot}
          </div>
        )}
      </m.div>
    </>
  )
}
