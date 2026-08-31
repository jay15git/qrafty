// @vitest-environment jsdom
import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { LANDING_WHEEL_CARD_PRESETS } from "@/components/landing/landing-card-wheel-presets"
import { renderLandingWheelCardSvg } from "@/components/landing/landing-wheel-qr-render"

const OUT_DIR = path.join(process.cwd(), "public/landing/wheel")
const SHOULD_WRITE = process.env.GENERATE_LANDING_WHEEL_ASSETS === "1"

function writeLandingWheelAssets() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  for (const preset of LANDING_WHEEL_CARD_PRESETS) {
    const filePath = path.join(OUT_DIR, `${preset.id}.svg`)
    fs.writeFileSync(filePath, renderLandingWheelCardSvg(preset), "utf8")
  }
}

describe("landing wheel qr assets", () => {
  it("matches baked svg assets", () => {
    if (SHOULD_WRITE) {
      writeLandingWheelAssets()
    }

    for (const preset of LANDING_WHEEL_CARD_PRESETS) {
      const filePath = path.join(OUT_DIR, `${preset.id}.svg`)
      const expected = renderLandingWheelCardSvg(preset)

      expect(fs.existsSync(filePath), `missing wheel asset: ${preset.id}.svg`).toBe(
        true,
      )
      expect(fs.readFileSync(filePath, "utf8")).toBe(expected)
    }
  })
})
