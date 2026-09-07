"use client"

import { useReducedMotion } from "motion/react"

import {
  CONTENT_BENTO_TILES,
  type ContentBentoTile,
} from "@/components/bento/content-bento-cards"
import { ContentTypeGridIcon } from "@/features/qr-code/content/ContentTypeGridIcon"

import "./content-bento.css"

function ContentTile({ tile }: { tile: ContentBentoTile }) {
  return (
    <div className="content-bento-tile">
      <div className="content-bento-icon" style={{ color: tile.color }}>
        <ContentTypeGridIcon className="content-bento-type-icon" type={tile.id} />
      </div>
      <span className="content-bento-label">{tile.label}</span>
    </div>
  )
}

function MarqueeColumn({
  animate,
  tiles,
}: {
  animate: boolean
  tiles: ContentBentoTile[]
}) {
  const loop = [...tiles, ...tiles]

  return (
    <div
      className={
        animate
          ? "content-bento-column content-bento-column-up"
          : "content-bento-column content-bento-column-static"
      }
    >
      {loop.map((tile, index) => (
        <ContentTile key={`${tile.id}-${index}`} tile={tile} />
      ))}
    </div>
  )
}

export function ContentBento() {
  const reducedMotion = useReducedMotion()
  const animate = !reducedMotion

  return (
    <article className="content-bento-card">
      <h2 className="content-bento-title">Encode anything</h2>

      <div
        aria-label="Scrolling QR content type previews"
        className="content-bento-stage"
      >
        <MarqueeColumn animate={animate} tiles={CONTENT_BENTO_TILES} />
      </div>
    </article>
  )
}
