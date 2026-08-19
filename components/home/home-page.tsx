"use client"

import { useEffect, useMemo, useRef } from "react"

import Gravity, {
  MatterBody,
  type GravityRef,
} from "@/components/fancy/physics/gravity"
import {
  QR_BACKGROUND_SHAPES,
  type QrBackgroundShapeDefinition,
} from "@/features/qr-code/styles/background-shapes"
import { HomeHero } from "@/components/home/home-hero"

const LINE_Y = "46%"
const SHAPE_SIZE = 112

const SHAPE_IDS = ["flower", "rosette", "orb-flower", "gear-bloom"] as const

const SHAPE_ITEMS = [
  { x: "18%", angle: -4 },
  { x: "38%", angle: 4 },
  { x: "58%", angle: -4 },
  { x: "78%", angle: 4 },
] as const

const BODY_OPTIONS = { friction: 0.5, restitution: 0.2 } as const
const STAGGER_S = 0.12
const INTRO_MS = SHAPE_IDS.length * STAGGER_S * 1000 + 500
const FALL_MS = 2000
const HERO_DELAY_S = (INTRO_MS + FALL_MS) / 1000

function DesktopShape({
  shape,
  index,
}: {
  shape: QrBackgroundShapeDefinition
  index: number
}) {
  return (
    <div
      className="text-primary"
      style={{
        animation: "home-pill-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        animationDelay: `${index * STAGGER_S}s`,
        height: SHAPE_SIZE,
        width: SHAPE_SIZE,
      }}
    >
      <svg
        aria-hidden
        className="h-full w-full"
        viewBox={`0 0 ${shape.viewBox.width} ${shape.viewBox.height}`}
      >
        <path d={shape.path} fill="currentColor" />
      </svg>
    </div>
  )
}

export default function HomePage() {
  const gravityRef = useRef<GravityRef>(null)

  const shapes = useMemo(
    () =>
      SHAPE_IDS.map((id) =>
        QR_BACKGROUND_SHAPES.find((shape) => shape.id === id)
      ).filter((shape): shape is QrBackgroundShapeDefinition => Boolean(shape)),
    []
  )

  useEffect(() => {
    const startTimer = window.setTimeout(() => {
      gravityRef.current?.start()
    }, INTRO_MS)

    return () => window.clearTimeout(startTimer)
  }, [])

  return (
    <div className="relative h-dvh w-dvw bg-background">
      <HomeHero heroDelayS={HERO_DELAY_S} />
      <style>{`
        @keyframes home-pill-in {
          from {
            opacity: 0;
            transform: scale(0.7);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes home-hero-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <Gravity
        ref={gravityRef}
        autoStart={false}
        gravity={{ x: 0, y: 1 }}
        className="h-full w-full"
        resetOnResize={false}
      >
        {shapes.map((shape, index) => (
          <MatterBody
            key={shape.id}
            angle={SHAPE_ITEMS[index]?.angle ?? 0}
            matterBodyOptions={BODY_OPTIONS}
            x={SHAPE_ITEMS[index]?.x ?? "50%"}
            y={LINE_Y}
          >
            <DesktopShape index={index} shape={shape} />
          </MatterBody>
        ))}
      </Gravity>
    </div>
  )
}
