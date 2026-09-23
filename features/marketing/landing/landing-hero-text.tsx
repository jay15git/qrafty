"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SlotText } from "slot-text/react";

import ArrowFillButton from "@/features/marketing/effects/arrow-fill-button";
import {
  getHeroIndefiniteArticle,
  HERO_ROTATE_MS,
  HERO_ROTATING_WORDS,
  HERO_SLOT_TEXT_OPTIONS,
} from "@/features/marketing/home/hero-rotating-words";

const arrowFillButtonProps = {
  btnText: "Craft my QR",
  bgColor: "#ff0088",
  textColor: "#ffffff",
  fillBgColor: "#ffffff",
  fillTextColor: "#ff5f00",
  hoverFillBgColor: "#ffffff",
  hoverFillTextColor: "#ff0095",
  sweep: { palette: "berry", midpoint: 0.92 },
} as const;

import "slot-text/style.css";

export function LandingHeroText() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % HERO_ROTATING_WORDS.length);
    }, HERO_ROTATE_MS);

    return () => window.clearInterval(interval);
  }, []);

  const rotatingWord = HERO_ROTATING_WORDS[wordIndex];
  const article = getHeroIndefiniteArticle(rotatingWord);
  const heroPhrase = `${article} ${rotatingWord}`;

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
        <span className="lh-qrafty-mark" aria-label="QRafty">
          <Image
            src="/logo.png"
            alt=""
            width={168}
            height={168}
            className="lh-qrafty-logo"
            aria-hidden
            priority
          />
          <span className="lh-qrafty-text font-caveat">QRafty</span>
        </span>
      </h1>

      <div className="lh-cta">
        <ArrowFillButton href="/design" {...arrowFillButtonProps} className="lh-cta-btn" />
      </div>
    </div>
  );
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
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 0.28em;
  margin: 0.35em 0 0;
  animation: lh-in 600ms ease-out 900ms both;
}
.lh-cta {
  display: flex;
  justify-content: center;
  margin-top: clamp(1.5rem, 4vw, 2.5rem);
  animation: lh-in 600ms ease-out 1200ms both;
}
.lh-cta-btn {
  height: 2.75rem !important;
  padding-left: 1.25rem !important;
  padding-right: calc(var(--icon-circle) + var(--icon-right) + 0.65rem) !important;
  font-size: 0.9375rem !important;
  font-weight: 600;
  --icon-circle: 2rem;
  --icon-right: 0.35rem;
}
.lh-cta-btn svg {
  width: 1rem !important;
  height: 1rem !important;
}
.lh-cta-btn > div[aria-hidden="true"]:nth-of-type(2) {
  padding-left: 1.25rem !important;
  padding-right: calc(var(--icon-circle) + var(--icon-right) + 0.65rem) !important;
}
@media (min-width: 640px) {
  .lh-cta-btn {
    height: 3rem !important;
    padding-left: 1.5rem !important;
    font-size: 1rem !important;
    --icon-circle: 2.125rem;
  }
  .lh-cta-btn svg {
    width: 1.125rem !important;
    height: 1.125rem !important;
  }
  .lh-cta-btn > div[aria-hidden="true"]:nth-of-type(2) {
    padding-left: 1.5rem !important;
  }
}
.lh-support {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.28em;
  font-family: var(--font-kodchasan), "Kodchasan", sans-serif;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1;
  font-size: clamp(52px, 8.2vw, 132px);
  color: rgba(32, 29, 29, 0.88);
}
.lh-support .slot-text {
  display: inline-flex;
  align-items: center;
  vertical-align: baseline;
}
.lh-qrafty-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.1em;
  flex-shrink: 0;
  font-size: clamp(64px, 10vw, 168px);
  line-height: 1;
}
.lh-qrafty-text {
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1;
  color: #201d1d;
}
.lh-qrafty-logo {
  display: block;
  width: 1em;
  height: 1em;
  border-radius: 0.1em;
  object-fit: cover;
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .lh-line,
  .lh-brand,
  .lh-cta { animation: none; opacity: 1; }
}

@media (max-width: 700px) {
  .lh-support { font-size: clamp(36px, 10vw, 64px); }
  .lh-qrafty-mark { font-size: clamp(44px, 12vw, 80px); }
}
`;
