"use client"

import { ShapeMorph } from "@/components/bento/shape-morph"

import "./shapes-bento.css"

export function ShapesBento() {
  return (
    <article className="shapes-bento-card">
      <h2 className="shapes-bento-title">Cut a shape</h2>

      <div aria-hidden="true" className="shapes-bento-stage">
        <ShapeMorph size={132} speed={1.1} />
      </div>
    </article>
  )
}
