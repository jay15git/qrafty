"use client"

import { m, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const CARD_INDICES = [0, 1, 2] as const
const CENTER_INDEX = 1

export type InsertMenuFanPreviewItems = readonly [ReactNode, ReactNode, ReactNode]

type InsertMenuFanPreviewProps = {
  className?: string
  isHovered: boolean
  previews: InsertMenuFanPreviewItems
}

export function InsertMenuFanPreview({
  className,
  isHovered,
  previews,
}: InsertMenuFanPreviewProps) {
  const reduceMotion = useReducedMotion()
  const angle = 22
  const gap = 20
  const yOffset = 5
  const hoverIntensity = reduceMotion ? 0 : 1
  const active = isHovered && hoverIntensity > 0

  return (
    <div className={cn("relative flex h-full w-full items-end justify-center", className)}>
      {CARD_INDICES.map((index) => {
        const dist = index - CENTER_INDEX
        const targetRotate = active ? dist * angle : 0
        const targetX = active ? dist * gap : 0

        let targetY = 0
        if (active) {
          targetY = Math.abs(dist) === 1 ? yOffset : -yOffset
        }

        return (
          <m.div
            key={index}
            animate={{
              rotate: targetRotate,
              x: targetX,
              y: targetY,
              scale: active && dist === 0 ? 1.05 : 1,
              opacity: dist === 0 || active ? 1 : 0,
            }}
            className="dn-insert-menu-fan-card absolute bottom-0 left-1/2 -translate-x-1/2"
            style={{
              originX: 0.5,
              originY: 1,
              zIndex: 3 - Math.abs(dist),
            }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 20,
              mass: 0.8,
            }}
          >
            <span className="dn-insert-menu-fan-card-content">{previews[index]}</span>
          </m.div>
        )
      })}
    </div>
  )
}
