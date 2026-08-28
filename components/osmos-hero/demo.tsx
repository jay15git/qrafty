"use client";

import { useEffect, useState } from "react";
import { SlotText } from "slot-text/react";

import {
  getHeroIndefiniteArticle,
  HERO_ROTATE_MS,
  HERO_ROTATING_WORDS,
  HERO_SLOT_TEXT_OPTIONS,
} from "@/components/home/hero-rotating-words";

import "slot-text/style.css";

/* ─────────────────────────────────────────────
   osmos-hero — curved infinite card wheel hero
   Pure CSS animation — no rAF / setState / refs
   ───────────────────────────────────────────── */

const IMG = [
  "https://res.cloudinary.com/dakrfj1oh/image/upload/v1781973295/09_b5kt8t.png",
  "https://res.cloudinary.com/dakrfj1oh/image/upload/v1781973294/06_p0lonf.png",
  "https://res.cloudinary.com/dakrfj1oh/image/upload/v1781973295/08_bu1urh.png",
  "https://res.cloudinary.com/dakrfj1oh/image/upload/v1781973294/03_sceom4.png",
  "https://res.cloudinary.com/dakrfj1oh/image/upload/v1781973294/02_efyml3.png",
  "https://res.cloudinary.com/dakrfj1oh/image/upload/v1781973294/05_ccn9so.png",
  "https://res.cloudinary.com/dakrfj1oh/image/upload/v1781973294/01_wvqrxz.png",
  "https://res.cloudinary.com/dakrfj1oh/image/upload/v1781876069/5_bgrt7d.jpg",
  "https://res.cloudinary.com/dakrfj1oh/image/upload/v1781876068/2_jogaln.jpg",
];

const LABELS = [
  "WebGL Hero Sections",
  "Smooth Scroll Layouts",
  "3D Card Carousels",
  "Cursor Trail Effects",
  "Animated Typography",
  "Bento Grid Systems",
  "Navbar Components",
  "Motion Hover Effects",
  "Copy-Paste Registry",
];

/* 16 cards × 22.5° = perfect 360° wheel that loops seamlessly */
const N = 16;
const SPACING = 360 / N;

type Card = { label: string; img: string };
const CARDS: Card[] = Array.from({ length: N }, (_, i) => ({
  label: LABELS[i % LABELS.length],
  img: IMG[i % IMG.length],
}));

export default function OsmosHero() {
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
    <div className="os-root">
      <style>{css}</style>
      <div className="os-vline" />

      {/* top bar */}
      <div className="os-topbar">
        <img
          src="https://res.cloudinary.com/dakrfj1oh/image/upload/v1783958234/zepa22_vuauko.png"
          alt="Zepa"
          className="os-logo"
        />
        <span className="os-tag">Open Source · MIT</span>
      </div>

      {/* hero */}
      <div className="os-hero">
        <p className="os-hero-line">
          <span className="os-hero-support">
            <span>Sharing</span>
            <SlotText options={HERO_SLOT_TEXT_OPTIONS} text={heroPhrase} />
            <span>?</span>
          </span>
        </p>
        <h1 className="os-hero-brand">
          <span className="os-hero-support">make it</span>
          <span className="os-hero-qrafty">QRafty</span>
        </h1>
      </div>

      {/* curved card wheel — spins forever via pure CSS */}
      <div className="os-wheel">
        <div className="os-spin">
          {CARDS.map((c, i) => (
            <div
              key={i}
              className="os-card"
              style={{
                transform: `rotate(${i * SPACING}deg) translateY(calc(var(--R) * -1))`,
              }}
            >
              <div className="os-card-inner">
                <img src={c.img} alt="" draggable={false} />
                <span>{c.label}</span>
              </div>
            </div>
          ))}
          {CARDS.map((_, i) => (
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

      {/* scroll-reveal about section */}
      <section className="os-about">
        <p>
          Zepa is an ever-growing open-source library of hero sections,
          WebGL effects, and motion components. Copy, paste, and ship
          production-ready UI in seconds — no config, no lock-in.
        </p>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Scoped styles — NO html/body overrides.
   All rules prefixed .os-* to avoid collisions.
   height:158vh allows scroll to the about section.
   overflow-x:hidden only — Y scroll is intentional.
   ───────────────────────────────────────────── */
const css = `
.os-root {
  position: relative;
  width: 100%;
  height: 158vh;
  overflow: hidden;
  background: transparent;
  font-family: var(--font-manrope), system-ui, Arial, sans-serif;
  color: rgb(32, 29, 29);
  -webkit-font-smoothing: antialiased;
  user-select: none;
}

/* centre rule */
.os-vline {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(32, 29, 29, 0.07);
  pointer-events: none;
}

/* top bar */
.os-topbar {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 40px;
  z-index: 100;
  pointer-events: none;
}
/* white logo inverted for light bg */
.os-logo { height: 40px; width: auto; object-fit: contain; }
.os-tag {
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(32, 29, 29, 0.35);
}

/* hero */
.os-hero {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  padding-top: 17vh;
  text-align: center;
  pointer-events: none;
  select-none: none;
}
.os-hero-line {
  margin: 0;
  animation: os-fade-up 600ms ease-out 600ms both;
}
.os-hero-brand {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 0.28em;
  margin: 0.35em 0 0;
  animation: os-fade-up 600ms ease-out 900ms both;
}
.os-hero-support {
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
.os-hero-support .slot-text {
  display: inline-flex;
  align-items: baseline;
  vertical-align: baseline;
}
.os-hero-qrafty {
  font-family: var(--font-caveat), "Caveat", cursive;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1;
  font-size: clamp(64px, 10vw, 168px);
  color: #201d1d;
}
@keyframes os-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* wheel container — wheel centre sits below the viewport;
   only the top arc of cards is visible (the visual trick) */
.os-wheel {
  position: absolute;
  left: 50%;
  --R: max(780px, 64vw);
  --cw: clamp(230px, 19vw, 330px);
  top: calc(62vh + var(--R));
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
  to   { transform: rotate(-360deg); }
}

/* card */
.os-card {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--cw);
  margin-left: calc(var(--cw) / -2);
  transform-origin: 50% 0;
}
.os-card-inner {
  background: #131212;
  border-radius: 16px;
  padding: 10px 10px 0;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.16);
}
.os-card-inner img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}
.os-card-inner span {
  display: block;
  color: #efeeec;
  font-size: 13px;
  letter-spacing: 0.01em;
  padding: 9px 4px 11px;
}

/* tick marks between cards */
.os-tick {
  position: absolute;
  left: 0;
  top: 0;
  width: 44px;
  margin-left: -22px;
  transform-origin: 50% 0;
  border-top: 1px dashed rgba(32, 29, 29, 0.28);
}

/* about section — revealed on scroll */
.os-about {
  position: absolute;
  left: 50%;
  top: 118vh;
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

/* accessibility */
@media (prefers-reduced-motion: reduce) {
  .os-spin { animation: none; }
  .os-hero-line,
  .os-hero-brand { animation: none; opacity: 1; }
}

/* mobile */
@media (max-width: 700px) {
  .os-hero-support { font-size: clamp(36px, 10vw, 64px); }
  .os-hero-qrafty { font-size: clamp(44px, 12vw, 80px); }
  .os-topbar { padding: 20px 24px; }
}
`;

export const __demoId = "9c634bdfdb65"
