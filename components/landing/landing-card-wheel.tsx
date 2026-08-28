"use client"

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
]

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
]

const N = 16
const SPACING = 360 / N

type Card = { label: string; img: string }
const CARDS: Card[] = Array.from({ length: N }, (_, i) => ({
  label: LABELS[i % LABELS.length],
  img: IMG[i % IMG.length],
}))

export function LandingCardWheel() {
  return (
    <div className="os-root">
      <style>{css}</style>

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

      <section className="os-about">
        <p>
          Zepa is an ever-growing open-source library of hero sections, WebGL
          effects, and motion components. Copy, paste, and ship
          production-ready UI in seconds — no config, no lock-in.
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
