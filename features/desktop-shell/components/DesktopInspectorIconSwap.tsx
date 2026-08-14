"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

import { useDesktopSettingsPanelMotionFrozen } from "@/features/desktop-shell/components/desktop-settings-panel-motion-frozen-context"
import { cn } from "@/lib/utils"

const DESKTOP_INSPECTOR_ICON_SWAP_SPRING = {
  type: "spring" as const,
  duration: 0.3,
  bounce: 0,
}

export function DesktopInspectorIconSwap({
  activeKey,
  className,
  icons,
  slotClassName,
}: {
  activeKey: string
  className?: string
  icons: Record<string, ReactNode>
  slotClassName?: string
}) {
  const reduceMotion = useReducedMotion()
  const motionFrozen = useDesktopSettingsPanelMotionFrozen()
  const skipMotion = Boolean(reduceMotion) || motionFrozen

  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={activeKey}
          className={cn("absolute inset-0 flex items-center justify-center", slotClassName)}
          initial={
            skipMotion
              ? false
              : { opacity: 0, scale: 0.25, filter: "blur(4px)" }
          }
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={
            skipMotion
              ? undefined
              : { opacity: 0, scale: 0.25, filter: "blur(4px)" }
          }
          transition={skipMotion ? { duration: 0 } : DESKTOP_INSPECTOR_ICON_SWAP_SPRING}
        >
          {icons[activeKey]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
