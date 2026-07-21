// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import {
  buildDashboardQrNodePayload,
  renderDashboardQrSvgMarkup,
} from "@/features/qr-code/rendering/qr-svg"
import {
  createDefaultQrStudioState,
  setSquareQrSize,
} from "@/features/qr-code/model/state"
import { buildLayeredDomParts } from "@/features/workspace/export/layered-dom-parts"
import { createDefaultDraftingLayers } from "@/features/workspace/model/layers"
import { DEFAULT_DRAFTING_CARD_STATE } from "@/features/workspace/model/card-state"
import { createDraftingQrArtworkState } from "@/features/workspace/rendering/qr-artwork"

import { convertQrSvgToDom } from "./svg-to-dom-modules"
import { emitCss, emitHtml, emitLiveReact } from "./index"
import type { DomLayerNode, SceneIr } from "./types"

function collectModuleNodes(nodes: DomLayerNode[]): DomLayerNode[] {
  return nodes.flatMap((node) => [
    ...(node.kind === "module" ? [node] : []),
    ...collectModuleNodes(node.children ?? []),
  ])
}

describe("convertQrSvgToDom", () => {
  it("converts rect elements to positioned module div styles", () => {
    const modules = convertQrSvgToDom(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="20" width="8" height="8" fill="#111111" /></svg>',
      { width: 100, height: 100 },
    )

    expect(modules).toHaveLength(1)
    expect(modules[0].kind).toBe("module")
    expect(modules[0].style).toMatchObject({
      left: 10,
      top: 20,
      width: 8,
      height: 8,
      backgroundColor: "#111111",
    })
  })

  it("converts path elements to clip-path module div styles", () => {
    const modules = convertQrSvgToDom(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M12 12h6v6h-6z" fill="#222222" /></svg>',
      { width: 100, height: 100 },
    )

    expect(modules).toHaveLength(1)
    expect(modules[0].style.clipPath).toContain("path('M12 12h6v6h-6z')")
    expect(modules[0].style.backgroundColor).toBe("#222222")
  })

  it("applies svg path transform attributes to css module transforms", () => {
    const modules = convertQrSvgToDom(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M0 0h10v10H0z" fill="#222222" transform="translate(20 30) scale(2)" /></svg>',
      { width: 100, height: 100 },
    )

    expect(modules).toHaveLength(1)
    expect(modules[0].kind).toBe("group")
    expect(modules[0].style.transform).toBe("translate(20px, 30px) scale(2)")
    expect(modules[0].children?.[0]?.style.transform).toBeUndefined()
    expect(modules[0].children?.[0]?.style.width).toBe(10)
    expect(modules[0].children?.[0]?.style.height).toBe(10)
  })

  it("converts compound finder ring paths to clip-path module div styles", () => {
    const ringPath =
      "M 12 14.5v 2a 2.5 2.5, 0, 0, 0, 2.5 2.5h 2a 2.5 2.5, 0, 0, 0, 2.5 -2.5v -2a 2.5 2.5, 0, 0, 0, -2.5 -2.5h -2a 2.5 2.5, 0, 0, 0, -2.5 2.5M 14.5 13h 2a 1.5 1.5, 0, 0, 1, 1.5 1.5v 2a 1.5 1.5, 0, 0, 1, -1.5 1.5h -2a 1.5 1.5, 0, 0, 1, -1.5 -1.5v -2a 1.5 1.5, 0, 0, 1, 1.5 -1.5"

    const modules = convertQrSvgToDom(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 57 57"><path d="${ringPath}" fill="#111827" data-testid="finder-patterns-outer" /></svg>`,
      { width: 57, height: 57 },
    )

    expect(modules).toHaveLength(1)
    expect(modules[0].svgInner).toBeUndefined()
    expect(modules[0].style.clipPath).toContain("path(nonzero,")
    expect(modules[0].style.clipPath).toContain("M 14.5 13")
    expect(modules[0].style.backgroundColor).toBe("#111827")
  })

  it("converts circle elements to rounded module div styles", () => {
    const modules = convertQrSvgToDom(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="30" r="5" fill="#333333" /></svg>',
      { width: 100, height: 100 },
    )

    expect(modules).toHaveLength(1)
    expect(modules[0].style).toMatchObject({
      left: 15,
      top: 25,
      width: 10,
      height: 10,
      borderRadius: "50%",
      backgroundColor: "#333333",
    })
  })

  it("resolves linearGradient fills to css backgrounds", () => {
    const modules = convertQrSvgToDom(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#101010" />
            <stop offset="100%" stop-color="#fafafa" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#grad)" />
      </svg>`,
      { width: 100, height: 100 },
    )

    expect(modules).toHaveLength(1)
    expect(String(modules[0].style.background)).toContain("linear-gradient")
    expect(String(modules[0].style.background)).toContain("#101010")
    expect(String(modules[0].style.background)).toContain("#fafafa")
  })

  it("skips invisible overlay nodes", () => {
    const modules = convertQrSvgToDom(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="10" height="10" fill="#000" opacity="0" /><rect x="5" y="5" width="10" height="10" fill="#fff" /></svg>',
      { width: 100, height: 100 },
    )

    expect(modules).toHaveLength(1)
    expect(modules[0].style.backgroundColor).toBe("#fff")
  })

  it("renders finder inner circles as centered css clip-path modules", async () => {
    const state = createDefaultQrStudioState()
    state.finderPatternInnerSettings.type = "circle"
    const payload = await buildDashboardQrNodePayload(state)
    const modules = collectModuleNodes(
      convertQrSvgToDom(payload.markup, { width: 57, height: 57 }),
    )
    const finderInners = modules.filter((node) => node.id.includes("finder-inner"))

    expect(finderInners).toHaveLength(3)
    expect(finderInners.every((node) => node.svgInner === undefined)).toBe(true)
    expect(
      finderInners.every((node) =>
        String(node.style.clipPath).includes("circle(1.5px at 1.5px 1.5px)"),
      ),
    ).toBe(true)
    expect(finderInners.every((node) => node.style.backgroundColor === "#111827")).toBe(true)
  })

  it("preserves diamond finder inner rotation from inline svg style", () => {
    const modules = convertQrSvgToDom(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 57 57"><rect x="14.22474487139159" y="14.22474487139159" width="2.4494897427831783" height="2.4494897427831783" fill="#111827" style="transform:rotate(45deg);transform-origin:center;transform-box:fill-box" data-testid="finder-patterns-inner" /></svg>`,
      { width: 57, height: 57 },
    )

    expect(modules).toHaveLength(1)
    expect(modules[0].style.transform).toBe("rotate(45deg)")
    expect(modules[0].style.transformOrigin).toBe("50% 50%")
    expect(modules[0].style.backgroundColor).toBe("#111827")
  })

  it("preserves rotated finder inner path transforms per corner", async () => {
    const state = createDefaultQrStudioState()
    state.finderPatternInnerSettings.type = "inpoint"
    const markup = renderDashboardQrSvgMarkup(state)
    const modules = collectModuleNodes(convertQrSvgToDom(markup, { width: 57, height: 57 }))
    const finderInners = modules.filter((node) => node.id.includes("finder-inner"))

    expect(finderInners).toHaveLength(3)
    expect(finderInners[0]?.style.transform).toBeUndefined()
    expect(finderInners[1]?.style.transform).toBe("rotate(90deg)")
    expect(finderInners[1]?.style.transformOrigin).toBe("50% 50%")
    expect(finderInners[2]?.style.transform).toBe("rotate(-90deg)")
  })

  it("converts lglab square qr svg into module children", async () => {
    const state = setSquareQrSize(createDefaultQrStudioState(), 128)
    const payload = await buildDashboardQrNodePayload(state)
    const modules = convertQrSvgToDom(payload.markup, { width: 128, height: 128, idPrefix: "qr" })

    expect(modules.length).toBeGreaterThan(3)
    expect(modules.every((node) => node.kind === "module" || node.kind === "group")).toBe(true)
  })

  it("converts palette-colored lglab svg modules", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "palette"
    state.dotsPalette = ["#04879c", "#0c3c78", "#f30a49"]

    const markup = renderDashboardQrSvgMarkup(state)
    const modules = collectModuleNodes(
      convertQrSvgToDom(markup, { width: state.width, height: state.height }),
    )

    const colors = new Set(
      modules.map((node) => node.style.backgroundColor).filter(Boolean),
    )

    expect(colors.has("#04879c")).toBe(true)
    expect(colors.has("#0c3c78")).toBe(true)
    expect(colors.has("#f30a49")).toBe(true)
  })

  it("converts gradient-colored lglab svg modules", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "gradient"
    state.dataModulesGradient = {
      enabled: true,
      type: "linear",
      rotation: Math.PI / 2,
      colorStops: [
        { offset: 0, color: "#101010" },
        { offset: 1, color: "#fafafa" },
      ],
    }

    const markup = renderDashboardQrSvgMarkup(state)
    const modules = collectModuleNodes(
      convertQrSvgToDom(markup, { width: state.width, height: state.height }),
    )
    const gradientModules = modules.filter((node) =>
      String(node.style.background).includes("linear-gradient"),
    )

    expect(gradientModules.length).toBeGreaterThan(0)
  })
})

describe("qr dom export integration", () => {
  it("builds qr layer with inline svg background and foreground children for static qr", async () => {
    const state = createDefaultQrStudioState()
    const qrPayload = await buildDashboardQrNodePayload(createDraftingQrArtworkState(state))
    const layers = createDefaultDraftingLayers("node-1", state, DEFAULT_DRAFTING_CARD_STATE)
    const parts = await buildLayeredDomParts({
      cardState: DEFAULT_DRAFTING_CARD_STATE,
      layers,
      qrMarkup: qrPayload.markup,
      state,
    })

    const qrLayer = parts.domLayers.find((layer) => layer.kind === "qr")
    expect(qrLayer).toBeDefined()
    expect(qrLayer?.svgInner).toBeUndefined()
    expect(qrLayer?.children?.[0]?.svgInner).toContain('fill="#f8fafc"')
    expect(qrLayer?.children?.[1]?.qrProps).toBeDefined()
    expect(qrLayer?.children?.[1]?.qrProps?.value).toBeTruthy()
    expect(qrLayer?.children?.[1]?.svgInner).toBeUndefined()
  })

  it("keeps package qr props when dot matrix animation is enabled", async () => {
    const state = createDefaultQrStudioState()
    state.dotMatrixAnimation = {
      ...state.dotMatrixAnimation,
      enabled: true,
      animated: true,
      presetCategory: "standard",
      preset: "FadeInTopDown",
    }
    const qrPayload = await buildDashboardQrNodePayload(createDraftingQrArtworkState(state))
    const layers = createDefaultDraftingLayers("node-1", state, DEFAULT_DRAFTING_CARD_STATE)
    const parts = await buildLayeredDomParts({
      cardState: DEFAULT_DRAFTING_CARD_STATE,
      layers,
      qrMarkup: qrPayload.markup,
      state,
    })

    const qrLayer = parts.domLayers.find((layer) => layer.kind === "qr")
    expect(qrLayer?.children?.[1]?.qrProps).toBeDefined()
    expect(qrLayer?.svgInner).toBeUndefined()
  })
})

function buildQrSceneIr(domLayers: DomLayerNode[]): SceneIr {
  return {
    bounds: { minX: 0, minY: 0, width: 100, height: 100 },
    defs: "",
    body: "",
    domLayers,
    shaders: [],
    fonts: [],
    componentName: "QrCard",
  }
}

describe("qr export emitters with inline svg qr layers", () => {
  it("emits html qr layers with inline svg markup", async () => {
    const state = createDefaultQrStudioState()
    const qrPayload = await buildDashboardQrNodePayload(createDraftingQrArtworkState(state))
    const layers = createDefaultDraftingLayers("node-1", state, DEFAULT_DRAFTING_CARD_STATE)
    const parts = await buildLayeredDomParts({
      cardState: DEFAULT_DRAFTING_CARD_STATE,
      layers,
      qrMarkup: qrPayload.markup,
      state,
    })

    const html = emitHtml(buildQrSceneIr(parts.domLayers))
    expect(html).toContain('class="qr-layer qr-layer--qr')
    expect(html).toContain("<new-qr-code")
    expect(html).toContain('fill="#f8fafc"')
  })

  it("emits inline svg background modules for decorative qr shapes", async () => {
    const state = createDefaultQrStudioState()
    state.backgroundShapeId = "flower"
    const qrPayload = await buildDashboardQrNodePayload(createDraftingQrArtworkState(state))
    const layers = createDefaultDraftingLayers("node-1", state, DEFAULT_DRAFTING_CARD_STATE)
    const parts = await buildLayeredDomParts({
      cardState: DEFAULT_DRAFTING_CARD_STATE,
      layers,
      qrMarkup: qrPayload.markup,
      state,
    })

    const html = emitHtml(buildQrSceneIr(parts.domLayers))
    expect(html).toContain("<svg")
    expect(html).toContain("<path")
    expect(html).not.toContain("clip-path:shape(")
  })

  it("emits react qr layers with inline svg markup", async () => {
    const state = createDefaultQrStudioState()
    const qrPayload = await buildDashboardQrNodePayload(createDraftingQrArtworkState(state))
    const layers = createDefaultDraftingLayers("node-1", state, DEFAULT_DRAFTING_CARD_STATE)
    const parts = await buildLayeredDomParts({
      cardState: DEFAULT_DRAFTING_CARD_STATE,
      layers,
      qrMarkup: qrPayload.markup,
      state,
    })

    const react = emitLiveReact(buildQrSceneIr(parts.domLayers), {
      dialect: "tsx",
      componentName: "QrCard",
    })

    expect(react).toContain('import { NewQrCode } from "@new-qr/qr/react"')
    expect(react).toContain("<NewQrCode")
    expect(react).not.toContain('data-testid=\\"data-modules\\"')
  })

  it("emits qr layer rules with inline svg background modules", async () => {
    const state = createDefaultQrStudioState()
    const qrPayload = await buildDashboardQrNodePayload(createDraftingQrArtworkState(state))
    const layers = createDefaultDraftingLayers("node-1", state, DEFAULT_DRAFTING_CARD_STATE)
    const parts = await buildLayeredDomParts({
      cardState: DEFAULT_DRAFTING_CARD_STATE,
      layers,
      qrMarkup: qrPayload.markup,
      state,
    })

    const css = emitCss(buildQrSceneIr(parts.domLayers))
    expect(css).toContain(".qr-layer--qr-")
    expect(css).toContain('fill="#f8fafc"')
  })
})
