"use client"

import { useReducedMotion } from "motion/react"

import { BACKGROUND_BENTO_CARDS } from "@/components/bento/background-bento-cards"
import DiagonalMarqueeCarousel from "@/components/ui/DiagonalMarqueeCarousel"

import "./backgrounds-bento.css"

export function BackgroundsBento() {
  const reducedMotion = useReducedMotion()
  const animate = !reducedMotion

  return (
    <article className="backgrounds-bento-card">
      <h2 className="backgrounds-bento-title">Live background</h2>

      <div
        aria-label="Diagonal scrolling background previews"
        className="backgrounds-bento-stage"
      >
        <DiagonalMarqueeCarousel
          animate={animate}
          angle={-25}
          baseSpeed={560}
          cardClassName="h-[52px] w-[74px] cursor-default rounded-[11px] shadow-[0_4px_12px_rgb(32_29_29/0.14)]"
          cards={BACKGROUND_BENTO_CARDS}
          className="backgrounds-bento-marquee absolute inset-0 h-full max-h-none w-full max-w-none"
          dimCards={false}
          fadeClassName="backgrounds-bento-fade"
          itemClassName="pr-1.5"
          rowCount={3}
          rowGapClassName="gap-1.5"
          rowRepeat={1}
        />
      </div>
    </article>
  )
}
