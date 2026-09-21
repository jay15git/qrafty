// @vitest-environment jsdom

import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { QR_BACKGROUND_SHAPES } from "@/features/qr-code/styles/background-shapes"
import { renderDashboardQrSvgMarkup } from "@/features/qr-code/rendering/qr-svg"
import {
  createDefaultQraftyState,
  type QraftyState,
  clampQrSize,
} from "@/features/qr-code/model/state"

const OUT_DIR = path.join(process.cwd(), ".render/qr-shapes")
const SHOULD_WRITE = process.env.GENERATE_QR_SHAPE_PREVIEWS === "1"
const TILE = 200
const LABEL_HEIGHT = 22
const COLS = 8
const DENSE_DATA =
  "https://qrafty.example.com/cards/summer-collection-2026?utm_source=qr&utm_medium=print&utm_campaign=launch&variant=dense-payload-for-version-growth"

function buildTileState(shapeId: QraftyState["backgroundShapeId"], data: string) {
  const state = { ...createDefaultQraftyState(), width: clampQrSize(320), height: clampQrSize(320) }
  state.backgroundShapeId = shapeId
  state.backgroundOptions.color = "#e2e8f0"
  state.data = data
  state.backgroundShapeOptions = {
    ...state.backgroundShapeOptions,
    paddingPx: 0,
  }

  return state
}

function toNestedTile(markup: string, x: number, y: number) {
  const nested = markup
    .replace(/<svg\b([^>]*?)\swidth="[^"]*"/i, "<svg$1")
    .replace(/<svg\b([^>]*?)\sheight="[^"]*"/i, "<svg$1")

  return `<g transform="translate(${x} ${y})"><svg x="0" y="0" width="${TILE}" height="${TILE}" viewBox="${nested.match(/viewBox="([^"]*)"/)?.[1] ?? "0 0 1 1"}" preserveAspectRatio="xMidYMid meet">${nested.replace(/<svg[^>]*>/i, "").replace(/<\/svg>\s*$/i, "")}</svg></g>`
}

function buildContactSheet() {
  const rowsPerData = Math.ceil(QR_BACKGROUND_SHAPES.length / COLS)
  const rows = rowsPerData * 2
  const width = COLS * TILE
  const height = rows * (TILE + LABEL_HEIGHT) + LABEL_HEIGHT * 2
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    `<text x="12" y="18" font-family="monospace" font-size="13" fill="#0f172a">default content</text>`,
    `<text x="12" y="${rowsPerData * (TILE + LABEL_HEIGHT) + LABEL_HEIGHT + 14}" font-family="monospace" font-size="13" fill="#0f172a">dense content</text>`,
  ]

  QR_BACKGROUND_SHAPES.forEach((shape, index) => {
    const col = index % COLS
    const row = Math.floor(index / COLS)
    const x = col * TILE
    const defaultY = row * (TILE + LABEL_HEIGHT) + LABEL_HEIGHT
    const denseY = (rowsPerData + row) * (TILE + LABEL_HEIGHT) + LABEL_HEIGHT * 2
    const labelX = x + 8

    parts.push(
      `<text x="${labelX}" y="${defaultY - 4}" font-family="monospace" font-size="10" fill="#475569">${shape.id}</text>`,
      toNestedTile(
        renderDashboardQrSvgMarkup(buildTileState(shape.id, "https://qrafty.app")),
        x,
        defaultY,
      ),
      `<text x="${labelX}" y="${denseY - 4}" font-family="monospace" font-size="10" fill="#475569">${shape.id}</text>`,
      toNestedTile(
        renderDashboardQrSvgMarkup(buildTileState(shape.id, DENSE_DATA)),
        x,
        denseY,
      ),
    )
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join("")}</svg>`
}

describe("qr background shape previews", () => {
  it("writes a contact sheet for every shape at default and dense content", () => {
    if (!SHOULD_WRITE) {
      expect(true).toBe(true)
      return
    }

    fs.mkdirSync(OUT_DIR, { recursive: true })
    fs.writeFileSync(path.join(OUT_DIR, "index.svg"), buildContactSheet(), "utf8")

    expect(fs.existsSync(path.join(OUT_DIR, "index.svg"))).toBe(true)
  })
})
