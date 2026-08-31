"use client"

import { useEffect, useState } from "react"

import { LANDING_WHEEL_CARD_PRESETS } from "@/components/landing/landing-card-wheel-presets"
import { LandingWheelQr } from "@/components/landing/landing-wheel-qr"

const N = LANDING_WHEEL_CARD_PRESETS.length
const SPACING = 360 / N

export function LandingCardWheel() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="os-root">
      <style>{css}</style>

      <div className="os-wheel">
        <div className="os-spin">
          {LANDING_WHEEL_CARD_PRESETS.map((preset, i) => (
            <div
              key={preset.id}
              className="os-card"
              style={{
                transform: `rotate(${i * SPACING}deg) translateY(calc(var(--R) * -1))`,
              }}
            >
              <div className="os-card-inner">
                <LandingWheelQr mounted={mounted} preset={preset} />
              </div>
            </div>
          ))}
          {LANDING_WHEEL_CARD_PRESETS.map((_, i) => (
            <div
              key={`t${i}`}
              className="os-tick"
              style={{
                transform: `rotate(${i * SPACING + SPACING / 2}deg) translateY(calc(140px - var(--R)))`,
              }}
            />
          ))}
        </div>
      </div>

      <section className="os-about">
        <p>
          Style modules, eyes, gradients, palettes, and die-cut shapes on a
          live canvas — then export PNG, WebP, or video straight from the studio.
        </p>
      </section>
    </div>
  )
}

const css = `
.os-root {
  position: relative;
  width: 100%;
  height: 110vh;
  overflow: hidden;
  background: #efeeec;
  font-family: var(--font-manrope), system-ui, Arial, sans-serif;
  color: rgb(32, 29, 29);
  -webkit-font-smoothing: antialiased;
  user-select: none;
}

.os-wheel {
  position: absolute;
  left: 50%;
  --R: max(780px, 64vw);
  --cw: clamp(230px, 19vw, 330px);
  top: calc(12vh + var(--R));
  width: 0;
  height: 0;
}
.os-spin {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  animation: os-rotate 90s linear infinite;
  will-change: transform;
}
@keyframes os-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

.os-card {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--cw);
  margin-left: calc(var(--cw) / -2);
  transform-origin: 50% 0;
}
.os-card-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  background: transparent;
  padding: 0;
  box-shadow: none;
}
.os-wheel-qr-plain {
  width: 82%;
  aspect-ratio: 1;
}
.os-wheel-qr-plain [data-slot="qrafty-code"],
.os-wheel-qr-plain svg {
  display: block;
  width: 100%;
  height: 100%;
}
.os-wheel-shaped {
  position: relative;
  width: 86%;
  max-height: 100%;
}
.os-wheel-shaped-svg {
  display: block;
  width: 100%;
  height: auto;
}
.os-wheel-shaped-qr {
  position: absolute;
  display: grid;
  place-items: center;
}
.os-wheel-qr-markup {
  width: 100%;
  height: 100%;
}
.os-wheel-qr-markup [data-slot="qrafty-code"],
.os-wheel-qr-markup svg {
  display: block;
  width: 100%;
  height: 100%;
}

.os-tick {
  position: absolute;
  left: 0;
  top: 0;
  width: 44px;
  margin-left: -22px;
  transform-origin: 50% 0;
  border-top: 1px dashed rgba(32, 29, 29, 0.28);
}

.os-about {
  position: absolute;
  left: 50%;
  top: 68vh;
  transform: translateX(-50%);
  width: min(92vw, 1080px);
  text-align: center;
  z-index: 5;
}
.os-about p {
  margin: 0;
  font-weight: 500;
  font-size: clamp(30px, 3.3vw, 54px);
  line-height: 1.16;
  letter-spacing: -0.015em;
  color: #201d1d;
}

@media (prefers-reduced-motion: reduce) {
  .os-spin { animation: none; }
}
`
