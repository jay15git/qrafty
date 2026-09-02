"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { AnimatedQr } from "@qrafty/qr/animated"
import { PaperShaderLayer } from "@qrafty/qr/shaders"

import { QrStyleOptionPreview } from "@/features/qr-code/components/QrStyleOptionPreview"
import { createDefaultDraftingCardPaperShader } from "@/features/workspace/model/card-state"
import { getQrBackgroundShapeDefinition } from "@/features/qr-code/styles/background-shapes"
import { DOT_STYLE_OPTIONS } from "@/features/qr-code/styles/style-options"
import type { QraftyDataModulesStyle } from "@/features/qr-code/model/state"
import { cn } from "@/lib/utils"

import {
  LANDING_QR_VALUE,
  QraftyQr,
  QraftyShapedQr,
  renderLandingQrSvg,
  useBrandLogoSrc,
} from "@/components/landing/landing-qrafty-qr"

import "./landing-feature-cards.css"

const MODULE_CYCLE = DOT_STYLE_OPTIONS.filter((option) =>
  ["square", "rounded", "leaf", "circle", "heart", "circuit-board"].includes(
    option.value,
  ),
)

const SHAPE_CYCLE = [
  { id: "atom" as const, fill: "#f4a7c3" },
  { id: "flower" as const, fill: "#f2c6de" },
  { id: "ghost" as const, fill: "#c4b5fd" },
  { id: "heart" as const, fill: "#fb7185" },
]

const SHADER_CYCLE = [
  { id: "mesh-gradient", label: "Mesh" },
  { id: "voronoi", label: "Voronoi" },
  { id: "god-rays", label: "God rays" },
] as const

const ILLUSTRATION_SPARK =
  "/illustrations/scribbles-doodles/spark-sparks-sparkle-stars-30.svg"
const ILLUSTRATION_HEART =
  "/illustrations/scribbles-doodles/pulse-heart-rate.svg"

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  return reduced
}

function useCycleIndex(length: number, ms: number, paused: boolean) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (paused || length < 2) return
    const id = window.setInterval(
      () => setIndex((current) => (current + 1) % length),
      ms,
    )
    return () => window.clearInterval(id)
  }, [length, ms, paused])

  return [index, setIndex] as const
}

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, inView] as const
}

export function LandingFeatureCards() {
  return (
    <section className="lfc" aria-labelledby="lfc-heading">
      <div className="lfc-intro">
        <h2 id="lfc-heading" className="lfc-heading">
          The studio
        </h2>
        <p className="lfc-lede">
          Same QR, six moves. Style it, cut a shape, drop it on a scene, dress
          the canvas, make it move, take the file.
        </p>
      </div>

      <div className="lfc-strip" tabIndex={0} aria-label="Studio feature cards">
        <StyleCard />
        <ShapeCard />
        <SceneCard />
        <DressCard />
        <MotionCard />
        <TakeCard />
      </div>
    </section>
  )
}

function CardShell({
  children,
  desc,
  name,
  tone,
}: {
  children: ReactNode
  desc: string
  name: string
  tone: string
}) {
  return (
    <article className="lfc-card" data-tone={tone}>
      <div className="lfc-copy">
        <h3 className="lfc-name">{name}</h3>
        <p className="lfc-desc">{desc}</p>
      </div>
      <div className="lfc-stage" aria-hidden="true">
        {children}
      </div>
    </article>
  )
}

function StyleCard() {
  const reduced = usePrefersReducedMotion()
  const [hover, setHover] = useState(false)
  const [index, setIndex] = useCycleIndex(
    MODULE_CYCLE.length,
    2200,
    reduced || hover,
  )
  const module = MODULE_CYCLE[index]?.value ?? "rounded"

  return (
    <CardShell
      name="Style the code"
      desc="Modules, eyes, frames, logo. Solid, gradient, or image fill."
      tone="lilac"
    >
      <div
        className="lfc-style-stage"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="lfc-qr-plate">
          <QraftyQr module={module as QraftyDataModulesStyle} size={200} />
        </div>
        <div className="lfc-chip-row" role="list">
          {MODULE_CYCLE.map((option, optionIndex) => (
            <button
              key={option.value}
              aria-label={option.label}
              aria-pressed={optionIndex === index}
              className={cn(
                "lfc-style-chip",
                optionIndex === index && "lfc-style-chip-on",
              )}
              type="button"
              onClick={() => setIndex(optionIndex)}
            >
              <QrStyleOptionPreview
                previewKind="dots"
                value={option.value}
              />
            </button>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

function ShapeCard() {
  const reduced = usePrefersReducedMotion()
  const [hover, setHover] = useState(false)
  const [index, setIndex] = useCycleIndex(
    SHAPE_CYCLE.length,
    2400,
    reduced || hover,
  )
  const current = SHAPE_CYCLE[index] ?? SHAPE_CYCLE[0]

  return (
    <CardShell
      name="Cut a shape"
      desc="Sixty die-cuts around the code. Padding and fill are yours."
      tone="blush"
    >
      <div
        className="lfc-shape-stage"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <QraftyShapedQr
          className="lfc-shape-hero"
          fill={current.fill}
          padding={18}
          shapeId={current.id}
          size={180}
        />
        <div className="lfc-chip-row" role="list">
          {SHAPE_CYCLE.map((shape, shapeIndex) => {
            const definition = getQrBackgroundShapeDefinition(shape.id)
            if (!definition) return null

            return (
              <button
                key={shape.id}
                aria-label={definition.label}
                aria-pressed={shapeIndex === index}
                className={cn(
                  "lfc-shape-chip",
                  shapeIndex === index && "lfc-shape-chip-on",
                )}
                type="button"
                onClick={() => setIndex(shapeIndex)}
              >
                <svg
                  aria-hidden="true"
                  viewBox={`0 0 ${definition.viewBox.width} ${definition.viewBox.height}`}
                >
                  <path d={definition.path} />
                </svg>
              </button>
            )
          })}
        </div>
      </div>
    </CardShell>
  )
}

function SceneCard() {
  const reduced = usePrefersReducedMotion()
  const [ref, inView] = useInView()
  const [hover, setHover] = useState(false)
  const [index, setIndex] = useCycleIndex(
    SHADER_CYCLE.length,
    3200,
    reduced || hover || !inView,
  )
  const shader = SHADER_CYCLE[index] ?? SHADER_CYCLE[0]
  const paperShader = useMemo(() => {
    const next = createDefaultDraftingCardPaperShader(shader.id)
    return { ...next, paused: reduced || !inView }
  }, [inView, reduced, shader.id])

  return (
    <CardShell
      name="Live background"
      desc="Twenty-nine GPU shaders, a photo, or flat color."
      tone="peach"
    >
      <div
        ref={ref}
        className="lfc-scene-stage"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="lfc-scene-well">
          <PaperShaderLayer
            className="lfc-scene-shader"
            fallbackColor="#f4c9a8"
            layoutHeight={320}
            layoutWidth={360}
            paperShader={paperShader}
          />
          <QraftyShapedQr
            className="lfc-scene-qr"
            fill="#fff7f2"
            padding={20}
            shapeId="atom"
            size={156}
          />
        </div>
        <div className="lfc-chip-row" role="list">
          {SHADER_CYCLE.map((item, itemIndex) => (
            <button
              key={item.id}
              aria-pressed={itemIndex === index}
              className={cn(
                "lfc-text-chip",
                itemIndex === index && "lfc-text-chip-on",
              )}
              type="button"
              onClick={() => setIndex(itemIndex)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </CardShell>
  )
}

function DressCard() {
  return (
    <CardShell
      name="Dress it"
      desc="Text, shapes, emoji, illustrations. A card, not a generator."
      tone="sage"
    >
      <div className="lfc-dress-stage">
        <div className="lfc-dress-board">
          <span className="lfc-dress-headline">OPEN</span>
          <QraftyShapedQr
            className="lfc-dress-qr"
            fill="#d8e4c8"
            padding={18}
            shapeId="atom"
            size={140}
          />
          <img
            alt=""
            className="lfc-dress-spark"
            draggable={false}
            src={ILLUSTRATION_SPARK}
          />
          <img
            alt=""
            className="lfc-dress-heart"
            draggable={false}
            src={ILLUSTRATION_HEART}
          />
        </div>
      </div>
    </CardShell>
  )
}

function MotionCard() {
  const logoSrc = useBrandLogoSrc()
  const reduced = usePrefersReducedMotion()
  const [ref, inView] = useInView()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const svgMarkup = useMemo(
    () => (mounted ? renderLandingQrSvg(logoSrc, { size: 220 }) : ""),
    [logoSrc, mounted],
  )

  return (
    <CardShell
      name="Motion"
      desc="Twenty presets. The code itself animates."
      tone="ink"
    >
      <div ref={ref} className="lfc-motion-stage">
        <div className="lfc-motion-plate">
          {mounted && svgMarkup && inView && !reduced ? (
            <AnimatedQr
              className="lfc-motion-qr"
              contents={LANDING_QR_VALUE}
              dotMatrixColorPeak="#f0abfc"
              externalSvg={svgMarkup}
              height={220}
              preset="neon-drift"
              respectReducedMotion
              width={220}
            />
          ) : mounted ? (
            <QraftyQr size={220} />
          ) : null}
        </div>
        <span className="lfc-text-chip lfc-text-chip-on">Neon Drift</span>
      </div>
    </CardShell>
  )
}

function TakeCard() {
  return (
    <CardShell
      name="Take it"
      desc="Photo and video of the design you made. PNG, JPEG, WebP, MP4, WebM."
      tone="sand"
    >
      <div className="lfc-take-stage">
        <div className="lfc-take-art">
          <QraftyShapedQr
            fill="#f4a7c3"
            padding={18}
            shapeId="atom"
            size={150}
          />
        </div>
        <div className="lfc-take-files">
          <span className="lfc-file" data-kind="photo">
            PNG · 4×
          </span>
          <span className="lfc-file" data-kind="video">
            MP4 · 4K
          </span>
        </div>
        <Link className="lfc-cta" href="/design">
          Open studio
        </Link>
      </div>
    </CardShell>
  )
}
