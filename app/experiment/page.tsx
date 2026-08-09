import type { CSSProperties } from "react"

import {
  getQrBackgroundShapeDefinition,
  type QrBackgroundShapeId,
} from "@/features/qr-code/styles/background-shapes"

const experimentTheme: CSSProperties & Record<`--${string}`, string> = {
  "--shadow-soft": "0 18px 40px -18px oklch(0.4 0.04 165 / 0.35)",
  "--shadow-card":
    "0 1px 2px oklch(0.2 0 0 / 0.04), 0 10px 28px -14px oklch(0.25 0.03 260 / 0.14)",
  "--shadow-lift": "0 22px 48px -22px oklch(0.4 0.08 250 / 0.4)",
  "--soft-field": "oklch(0.88 0.055 160)",
  "--soft-ink": "oklch(0.28 0.06 160)",
  "--meta-field": "oklch(0.9 0.05 55)",
  "--meta-ink": "oklch(0.38 0.12 35)",
  "--line": "oklch(0.88 0.01 260)",
  "--muted": "oklch(0.52 0.02 260)",
  "--split-sky": "oklch(0.74 0.11 245)",
  "--split-navy": "oklch(0.32 0.07 250)",
  "--split-outer": "oklch(0.93 0.025 275)",
  "--flap-wash-a": "oklch(0.72 0.17 42)",
  "--flap-wash-b": "oklch(0.9 0.07 65)",
  "--flap-dark": "oklch(0.22 0.02 50)",
  "--flap-ink": "oklch(0.88 0.09 55)",
  "--flap-border": "oklch(0.14 0.01 50)",
  "--shadow-hairline": "0 1px 1px oklch(0.2 0 0 / 0.03), 0 8px 24px -16px oklch(0.2 0 0 / 0.18)",
  "--shadow-drop": "drop-shadow(0 14px 26px oklch(0.2 0 0 / 0.14))",
  "--arch-field": "oklch(0.91 0.032 162)",
  "--arch-ink": "oklch(0.33 0.05 165)",
  "--seal-fill": "oklch(0.27 0.022 45)",
  "--seal-ink": "oklch(0.94 0.022 85)",
  "--octa-field": "oklch(0.92 0.028 240)",
  "--octa-ink": "oklch(0.34 0.055 250)",
  "--tag-fill": "oklch(0.3 0.042 255)",
  "--tag-ink": "oklch(0.93 0.02 250)",
}

export default function ExperimentPage() {
  return (
    <main
      className="min-h-dvh bg-[oklch(0.975_0.01_95)] px-5 py-12 text-[oklch(0.24_0.014_252)] sm:px-8 lg:px-12"
      style={experimentTheme}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 max-w-xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-[oklch(0.5_0.025_252)] uppercase">
            QR card studies
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Scan, styled eight ways.
          </h1>
        </header>

        <section className="mb-16" aria-labelledby="original-studies">
          <h2
            id="original-studies"
            className="mb-6 text-xs font-semibold tracking-[0.14em] text-[oklch(0.5_0.025_252)] uppercase"
          >
            Originals
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:justify-between">
          <SoftQrCard />
          <MetaQrCard />
          <SplitQrCard />
          <FlapQrCard />
          </div>
        </section>

        <section aria-labelledby="shape-studies">
          <div className="mb-10 flex items-end justify-between gap-6 border-t border-[oklch(0.86_0.01_95)] pt-6">
            <div>
              <h2
                id="shape-studies"
                className="text-xs font-semibold tracking-[0.14em] text-[oklch(0.5_0.025_252)] uppercase"
              >
                Shape studies
              </h2>
              <p className="mt-2 text-sm text-[oklch(0.48_0.02_252)]">
                One silhouette from the shape catalogue per card, nothing else.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-10 lg:justify-between">
            <ArchQrCard />
            <SealQrCard />
            <OctagonQrCard />
            <TagQrCard />
          </div>
        </section>
      </div>
    </main>
  )
}

function QrMark({
  seed = 7,
  ink = "currentColor",
  className = "",
}: {
  seed?: number
  ink?: string
  className?: string
}) {
  const size = 21
  const cells: boolean[] = []
  let s = seed
  const rand = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inFinder =
        (x < 7 && y < 7) ||
        (x >= size - 7 && y < 7) ||
        (x < 7 && y >= size - 7)

      if (inFinder) {
        const fx = x < 7 ? x : x >= size - 7 ? x - (size - 7) : x
        const fy = y < 7 ? y : y - (size - 7)
        const onBorder = fx === 0 || fx === 6 || fy === 0 || fy === 6
        const inCore = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4
        cells.push(onBorder || inCore)
      } else if (x === 6 || y === 6) {
        cells.push((x + y) % 2 === 0)
      } else {
        cells.push(rand() > 0.46)
      }
    }
  }

  return (
    <div
      className={`grid aspect-square w-full ${className}`}
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 0 }}
      role="img"
      aria-label="QR code"
    >
      {cells.map((on, index) => (
        <span key={index} style={{ background: on ? ink : "transparent" }} />
      ))}
    </div>
  )
}

function SoftQrCard() {
  return (
    <article className="w-full max-w-[260px] shrink-0 rounded-[32px] bg-white p-3 shadow-[var(--shadow-soft)]">
      <div
        className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[24px] p-7"
        style={{ background: "var(--soft-field)" }}
      >
        <QrMark seed={11} ink="var(--soft-ink)" className="w-[88%]" />
      </div>

      <a
        href="#scan-pay"
        className="mt-3 flex h-11 items-center justify-between rounded-full px-4 text-[0.875rem] font-medium text-[var(--soft-field)] transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
        style={{ background: "var(--soft-ink)" }}
      >
        <span>Scan to pay</span>
        <span aria-hidden>→</span>
      </a>
    </article>
  )
}

function MetaQrCard() {
  return (
    <article className="w-full max-w-[280px] shrink-0 overflow-hidden rounded-[12px] border border-[var(--line)] bg-white shadow-[var(--shadow-card)]">
      <div
        className="relative m-3 mb-0 flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[10px] p-8"
        style={{ background: "var(--meta-field)" }}
      >
        <QrMark seed={23} ink="var(--meta-ink)" className="w-[86%]" />
        <button
          type="button"
          aria-label="Save"
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full shadow-sm backdrop-blur-sm"
          style={{
            background: "oklch(1 0 0 / 0.55)",
            color: "var(--meta-ink)",
          }}
        >
          <HeartIcon />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4 pt-4">
        <div>
          <h2
            className="text-[0.9rem] font-bold tracking-[0.02em] uppercase"
            style={{ color: "var(--meta-ink)" }}
          >
            Table menu
          </h2>
          <p className="mt-1 text-[0.8125rem] text-[var(--muted)]">
            Cafe Lumen · Floor 2
          </p>
        </div>
        <div className="flex items-end justify-between gap-3">
          <a
            href="#menu"
            className="inline-flex h-10 items-center rounded-[3px] px-4 text-[0.875rem] font-medium text-[var(--meta-field)] transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--meta-ink)" }}
          >
            Open link
          </a>
          <p
            className="text-[0.7rem] tracking-wide uppercase"
            style={{
              fontFamily: "var(--font-geist-mono)",
              color: "var(--meta-ink)",
              opacity: 0.55,
            }}
          >
            QR · 04
          </p>
        </div>
      </div>
    </article>
  )
}

function SplitQrCard() {
  return (
    <div className="relative w-full max-w-[280px] shrink-0">
      <div
        className="absolute inset-y-0 right-0 w-[72%] rounded-[40px]"
        style={{ background: "var(--split-outer)" }}
      />

      <div className="relative flex items-stretch">
        <article className="relative z-10 flex w-[78%] flex-col overflow-hidden rounded-[40px] shadow-[var(--shadow-lift)]">
          <div
            className="flex flex-1 items-center justify-center px-6 pb-5 pt-7"
            style={{ background: "var(--split-sky)" }}
          >
            <QrMark seed={41} ink="var(--split-navy)" className="w-full" />
          </div>

          <div
            className="flex flex-col gap-2 px-6 pb-6 pt-5"
            style={{ background: "var(--split-navy)" }}
          >
            <h2 className="text-balance text-[1.1rem] font-bold leading-snug tracking-tight text-[var(--split-sky)]">
              Join the waitlist
            </h2>
            <p
              className="text-[0.85rem] font-medium"
              style={{ color: "oklch(0.72 0.06 245)" }}
            >
              Scan to sign up
            </p>
          </div>
        </article>

        <aside
          className="relative z-0 flex w-[22%] flex-col items-center justify-between py-8 pl-1"
          aria-hidden
        >
          <div className="flex flex-col items-center gap-3">
            <span className="size-9 rounded-full bg-[var(--split-navy)]" />
            <span className="size-9 rounded-full bg-[oklch(0.72_0.08_50)]" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="size-9 rounded-full bg-[var(--split-sky)] shadow-sm" />
            <span className="size-9 rounded-full bg-white shadow-sm" />
          </div>
        </aside>
      </div>
    </div>
  )
}

function FlapQrCard() {
  return (
    <article
      className="relative aspect-square w-full max-w-[260px] shrink-0 overflow-hidden rounded-[28px] border-[5px] shadow-[var(--shadow-card)]"
      style={{ borderColor: "var(--flap-border)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 70% at 20% 35%, var(--flap-wash-a) 0%, transparent 55%),
            radial-gradient(ellipse 70% 60% at 75% 20%, var(--flap-wash-b) 0%, transparent 50%),
            linear-gradient(150deg, oklch(0.8 0.12 40), oklch(0.93 0.04 80))
          `,
        }}
        aria-hidden
      />
      <div aria-hidden className="absolute inset-0 backdrop-blur-[28px]" />

      <div className="absolute inset-x-0 bottom-0 h-[70%]">
        <svg
          aria-hidden
          className="absolute inset-0 size-full"
          viewBox="0 0 260 180"
          preserveAspectRatio="none"
        >
          <path
            d="M0 0 H108 C138 0 142 36 172 36 H260 V180 H0 Z"
            style={{ fill: "var(--flap-dark)" }}
          />
        </svg>

        <div className="relative z-10 flex h-full flex-col px-5 pb-5 pt-5">
          <div className="mb-3">
            <h2
              className="text-[0.75rem] font-bold tracking-[0.04em] uppercase"
              style={{ color: "var(--flap-ink)" }}
            >
              Client portal
            </h2>
            <p
              className="mt-0.5 text-[0.55rem] font-medium tracking-[0.08em] uppercase"
              style={{ color: "oklch(0.65 0.04 55)" }}
            >
              Scan to open
            </p>
          </div>

          <div className="mx-auto flex w-[78%] flex-1 items-center">
            <QrMark seed={57} ink="var(--flap-ink)" />
          </div>
        </div>
      </div>
    </article>
  )
}

function CatalogueShape({
  shape,
  fill,
  className = "",
  style,
}: {
  shape: Exclude<QrBackgroundShapeId, "none">
  fill: string
  className?: string
  style?: CSSProperties
}) {
  const definition = getQrBackgroundShapeDefinition(shape)
  if (!definition) return null

  return (
    <svg
      aria-hidden
      className={className}
      viewBox={`0 0 ${definition.viewBox.width} ${definition.viewBox.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={style}
    >
      <path d={definition.path} fill={fill} />
    </svg>
  )
}

function ArchQrCard() {
  return (
    <article className="w-full max-w-[240px] shrink-0 rounded-[6px] border border-[oklch(0.9_0.008_95)] bg-white p-4 shadow-[var(--shadow-hairline)]">
      <div className="relative aspect-square">
        <CatalogueShape
          shape="arch"
          fill="var(--arch-field)"
          className="absolute inset-0 size-full"
        />
        <div className="absolute inset-x-[24%] top-[26%]">
          <QrMark seed={71} ink="var(--arch-ink)" />
        </div>
      </div>

      <p
        className="mt-5 mb-1 text-center text-[0.6rem] font-medium tracking-[0.22em] uppercase"
        style={{ color: "var(--arch-ink)" }}
      >
        Scan to pay
      </p>
    </article>
  )
}

function SealQrCard() {
  return (
    <article className="relative w-full max-w-[240px] shrink-0">
      <div className="relative aspect-[296/316]">
        <CatalogueShape
          shape="scallop-seal"
          fill="var(--seal-fill)"
          className="absolute inset-0 size-full"
          style={{ filter: "var(--shadow-drop)" }}
        />
        <div className="absolute inset-x-[30%] top-[21%]">
          <QrMark seed={83} ink="var(--seal-ink)" />
        </div>
        <p
          className="absolute inset-x-0 top-[70%] text-center text-[0.6rem] font-medium tracking-[0.22em] uppercase"
          style={{ color: "var(--seal-ink)" }}
        >
          Members
        </p>
      </div>
    </article>
  )
}

function OctagonQrCard() {
  return (
    <article className="w-full max-w-[240px] shrink-0 rounded-[6px] border border-[oklch(0.9_0.008_95)] bg-white p-4 shadow-[var(--shadow-hairline)]">
      <div className="relative aspect-square">
        <CatalogueShape
          shape="octagon-flat"
          fill="var(--octa-field)"
          className="absolute inset-0 size-full"
        />
        <div className="absolute inset-[22%]">
          <QrMark seed={97} ink="var(--octa-ink)" />
        </div>
      </div>

      <p
        className="mt-5 mb-1 text-center text-[0.6rem] font-medium tracking-[0.22em] uppercase"
        style={{ color: "var(--octa-ink)" }}
      >
        Table 04
      </p>
    </article>
  )
}

function TagQrCard() {
  return (
    <article className="relative w-full max-w-[240px] shrink-0">
      <div className="relative aspect-square">
        <CatalogueShape
          shape="tag"
          fill="var(--tag-fill)"
          className="absolute inset-0 size-full"
          style={{ filter: "var(--shadow-drop)" }}
        />
        <div className="absolute inset-x-[31%] top-[16%]">
          <QrMark seed={109} ink="var(--tag-ink)" />
        </div>
        <p
          className="absolute inset-x-0 top-[61%] text-center text-[0.6rem] font-medium tracking-[0.22em] uppercase"
          style={{ color: "var(--tag-ink)", opacity: 0.7 }}
        >
          Find us
        </p>
      </div>
    </article>
  )
}

function HeartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19.5 12.57 12 20l-7.5-7.43A4.75 4.75 0 0 1 12 5.76a4.75 4.75 0 0 1 7.5 6.81Z" />
    </svg>
  )
}
