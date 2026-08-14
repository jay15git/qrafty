import { describe, expect, it } from "vitest"

import { emitSvg } from "./emit-svg"
import { preprocessSvg } from "./preprocess-svg"
import type { SceneIr } from "./types"

const sampleIr: SceneIr = {
  bounds: { minX: 0, minY: 0, width: 100, height: 100 },
  defs: "",
  body: '<rect x="10" y="10" width="20" height="20" fill="#111" />',
  domLayers: [],
  shaders: [],
  fonts: [],
  componentName: "QrCard",
}

describe("scene svg emit", () => {
  it("emits svg from scene ir", () => {
    const svg = emitSvg(sampleIr)
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('<rect x="10" y="10"')
  })

  it("flattens nested svg elements without a viewBox", () => {
    const nested = `<svg viewBox="0 0 100 100"><g><svg x="10" y="10" width="20" height="20"><rect width="10" height="10"/></svg></g></svg>`
    const flattened = preprocessSvg(nested)

    expect(flattened).not.toMatch(/<svg[\s\S]*<svg/)
    expect(flattened).toContain("<g")
  })

  it("preserves nested svg elements that declare a viewBox", () => {
    const nested = `<svg viewBox="0 0 100 100"><g><svg x="10" y="10" width="20" height="20" viewBox="0 0 10 10"><rect width="10" height="10"/></svg></g></svg>`
    const flattened = preprocessSvg(nested)

    expect(flattened).toMatch(/<svg[\s\S]*<svg/)
    expect(flattened).not.toContain("scale(")
  })

  it("prefixes quoted paint-server references used by qr svg extensions", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dot-gradient-definition"></linearGradient></defs><path fill="url('#dot-gradient-definition')" d="M0 0"/></svg>`

    const result = preprocessSvg(svg, { idPrefix: "node-1" })

    expect(result).toContain('id="node-1-dot-gradient-definition"')
    expect(result).toContain(`fill="url('#node-1-dot-gradient-definition')"`)
  })
})
