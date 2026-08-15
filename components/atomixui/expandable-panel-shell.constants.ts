import type { CSSProperties, ReactNode } from "react"

export const EXPANDABLE_PANEL_SPRING = { type: "spring" as const, stiffness: 340, damping: 28 }

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
