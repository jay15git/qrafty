"use client"

import { useEffect, useState } from "react"
import { chromatic } from "slot-text"
import { SlotText } from "slot-text/react"

import "slot-text/style.css"

const ROTATING_WORDS = ["link", "mail", "text", "phone", "sms", "map", "event"] as const
const ROTATE_MS = 2200

const SLOT_TEXT_OPTIONS = {
  direction: "up" as const,
  duration: 480,
  bounce: 0,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  color: chromatic({ from: 190 }),
  skipUnchanged: false,
}

type HomeHeroProps = {
  heroDelayS: number
}

export function HomeHero({ heroDelayS }: HomeHeroProps) {
  const [wordIndex, setWordIndex] = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsActive(true), heroDelayS * 1000)
    return () => window.clearTimeout(timer)
  }, [heroDelayS])

  useEffect(() => {
    if (!isActive) return

    const interval = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % ROTATING_WORDS.length)
    }, ROTATE_MS)

    return () => window.clearInterval(interval)
  }, [isActive])

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center opacity-0"
      style={{
        animation: "home-hero-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        animationDelay: `${heroDelayS}s`,
      }}
    >
      <div className="space-y-2">
        <p className="font-heading text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl">
          <span className="inline-flex flex-wrap items-baseline justify-center gap-x-[0.28em]">
            <span>Sharing a</span>
            <SlotText
              options={SLOT_TEXT_OPTIONS}
              text={ROTATING_WORDS[wordIndex]}
            />
            <span>?</span>
          </span>
        </p>
        <h1 className="font-heading text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl">
          make it QRafty
        </h1>
      </div>
    </div>
  )
}
