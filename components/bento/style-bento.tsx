"use client"

import { useReducedMotion } from "motion/react"

import {
  StylePreview,
  type StylePreviewKind,
} from "@/features/qr-code/components/StylePreview"

import "./style-bento.css"

type StyleTile = {
  id: string
  previewKind: StylePreviewKind
  value: string
  color: string
}

const TOP_ROW: StyleTile[] = [
  { id: "mod-rounded", previewKind: "dots", value: "rounded", color: "#34d399" },
  { id: "mod-heart", previewKind: "dots", value: "heart", color: "#fb7185" },
  {
    id: "frame-rounded-lg",
    previewKind: "corner-square",
    value: "rounded-lg",
    color: "#a78bfa",
  },
  { id: "mod-circle", previewKind: "dots", value: "circle", color: "#22d3ee" },
  { id: "eye-star", previewKind: "corner-dot", value: "star", color: "#fbbf24" },
  {
    id: "mod-circuit",
    previewKind: "dots",
    value: "circuit-board",
    color: "#60a5fa",
  },
  {
    id: "frame-inpoint",
    previewKind: "corner-square",
    value: "inpoint",
    color: "#fb923c",
  },
]

const BOTTOM_ROW: StyleTile[] = [
  {
    id: "eye-diamond",
    previewKind: "corner-dot",
    value: "diamond",
    color: "#22d3ee",
  },
  { id: "mod-leaf", previewKind: "dots", value: "leaf", color: "#34d399" },
  {
    id: "frame-outpoint",
    previewKind: "corner-square",
    value: "outpoint",
    color: "#fb7185",
  },
  { id: "eye-heart", previewKind: "corner-dot", value: "heart", color: "#f87171" },
  { id: "mod-diamond", previewKind: "dots", value: "diamond", color: "#a78bfa" },
  { id: "frame-leaf", previewKind: "corner-square", value: "leaf", color: "#fbbf24" },
  {
    id: "eye-rounded-lg",
    previewKind: "corner-dot",
    value: "rounded-lg",
    color: "#60a5fa",
  },
]

function StyleTilePreview({ tile }: { tile: StyleTile }) {
  return (
    <div className="style-bento-tile">
      <div className="style-bento-icon">
        <StylePreview
          color={tile.color}
          previewKind={tile.previewKind}
          value={tile.value}
        />
      </div>
    </div>
  )
}

function MarqueeRow({
  animate,
  direction,
  offset,
  tiles,
}: {
  animate: boolean
  direction: "forward" | "reverse"
  offset: number
  tiles: StyleTile[]
}) {

  return (
    <div
      className={
        animate
          ? `style-bento-row style-bento-row-${direction}`
          : "style-bento-row style-bento-row-static"
      }
      style={
        animate
          ? {
              animationDelay: `${offset}s`,
            }
          : undefined
      }
    >
      {tiles.map((tile) => (
        <StyleTilePreview key={tile.id} tile={tile} />
      ))}
      {tiles.map((tile) => (
        <StyleTilePreview key={`${tile.id}-loop`} tile={tile} />
      ))}
    </div>
  )
}

export function StyleBento() {
  const reducedMotion = useReducedMotion()
  const animate = !reducedMotion

  return (
    <article className="style-bento-card">
      <h2 className="style-bento-title">Style the code</h2>

      <div
        aria-label="Scrolling module, frame, and eye style previews"
        className="style-bento-stage"
      >
        <MarqueeRow
          animate={animate}
          direction="forward"
          offset={0}
          tiles={TOP_ROW}
        />
        <MarqueeRow
          animate={animate}
          direction="reverse"
          offset={-4}
          tiles={BOTTOM_ROW}
        />
      </div>
    </article>
  )
}
