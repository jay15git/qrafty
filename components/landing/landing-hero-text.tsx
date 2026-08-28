"use client"

import { useEffect, useState } from "react"
import { SlotText } from "slot-text/react"

import {
  getHeroIndefiniteArticle,
  HERO_ROTATE_MS,
  HERO_ROTATING_WORDS,
  HERO_SLOT_TEXT_OPTIONS,
} from "@/components/home/hero-rotating-words"

import "slot-text/style.css"

export function LandingHeroText() {
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % HERO_ROTATING_WORDS.length)
    }, HERO_ROTATE_MS)

    return () => window.clearInterval(interval)
  }, [])

  const rotatingWord = HERO_ROTATING_WORDS[wordIndex]
  const article = getHeroIndefiniteArticle(rotatingWord)
  const heroPhrase = `${article} ${rotatingWord}`

  return (
    <div className="relative z-10 px-6 pb-20 pt-[12vh] text-center sm:pb-24">
      <style>{css}</style>

      <p className="lh-line">
        <span className="lh-support">
          <span>Sharing</span>
          <SlotText options={HERO_SLOT_TEXT_OPTIONS} text={heroPhrase} />
          <span>?</span>
        </span>
      </p>
      <h1 className="lh-brand">
        <span className="lh-support">make it</span>
        <span className="lh-qrafty">QRafty</span>
      </h1>
    </div>
  )
}

const css = `
@keyframes lh-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.lh-line {
  margin: 0;
  animation: lh-in 600ms ease-out 600ms both;
}
.lh-brand {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 0.28em;
  margin: 0.35em 0 0;
  animation: lh-in 600ms ease-out 900ms both;
}
.lh-support {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 0.28em;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.05;
  font-size: clamp(52px, 8.2vw, 132px);
  color: rgba(32, 29, 29, 0.88);
}
.lh-support .slot-text {
  display: inline-flex;
  align-items: baseline;
  vertical-align: baseline;
}
.lh-qrafty {
  font-family: var(--font-caveat), "Caveat", cursive;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1;
  font-size: clamp(64px, 10vw, 168px);
  color: #201d1d;
}

@media (prefers-reduced-motion: reduce) {
  .lh-line,
  .lh-brand { animation: none; opacity: 1; }
}

@media (max-width: 700px) {
  .lh-support { font-size: clamp(36px, 10vw, 64px); }
  .lh-qrafty { font-size: clamp(44px, 12vw, 80px); }
}
`
