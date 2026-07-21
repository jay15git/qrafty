import { describe, expect, it } from "vitest"

import {
  buildQrExtension,
  createAlignedCornerGradientExtension,
  createDotMatrixAnimationExtension,
  getFinderCornerRegions,
  getQrExtensionKey,
  getQrSvgNumCells,
} from "./svg-extension"
import {
  createDefaultQrStudioState,
  setDotMatrixAnimationOptions,
  type QrDotMatrixAnimationPatch,
  QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS,
} from "@/features/qr-code/model/state"

type StubElement = {
  tagName: string
  attributes: Record<string, string>
  children: StubElement[]
  cloneNode: (deep?: boolean) => StubElement
  ownerDocument: {
    createElementNS: (_namespace: string, tagName: string) => StubElement
  }
  appendChild: (child: StubElement) => StubElement
  getAttribute: (name: string) => string | null
  insertBefore: (child: StubElement, referenceNode: StubElement | null) => StubElement
  querySelector: (selector: string) => StubElement | null
  querySelectorAll: (selector: string) => StubElement[]
  removeAttribute: (name: string) => void
  remove: () => void
  setAttribute: (name: string, value: string) => void
  setAttributeNS: (_namespace: string, name: string, value: string) => void
  textContent?: string | null
}

type DotMatrixSvgFixtureOptions = {
  cols?: number
  height?: number
  rows?: number
  width?: number
}

function createStubElement(tagName: string): StubElement {
  const element: StubElement = {
    tagName,
    attributes: {},
    children: [],
    cloneNode(deep = false) {
      const clone = createStubElement(element.tagName)
      clone.attributes = { ...element.attributes }
      clone.textContent = element.textContent ?? null

      if (deep) {
        for (const child of element.children) {
          clone.appendChild(child.cloneNode(true))
        }
      }

      return clone
    },
    ownerDocument: {
      createElementNS: (_namespace, nextTagName) => createStubElement(nextTagName),
    },
    appendChild(child) {
      child.remove()
      ;(child as StubElement & { parentNode?: StubElement }).parentNode = element
      element.children.push(child)
      return child
    },
    getAttribute(name) {
      return element.attributes[name] ?? null
    },
    insertBefore(child, referenceNode) {
      child.remove()
      ;(child as StubElement & { parentNode?: StubElement }).parentNode = element

      if (!referenceNode) {
        element.children.push(child)
        return child
      }

      const referenceIndex = element.children.indexOf(referenceNode)

      if (referenceIndex === -1) {
        element.children.push(child)
        return child
      }

      element.children.splice(referenceIndex, 0, child)
      return child
    },
    querySelector(selector) {
      return element.querySelectorAll(selector)[0] ?? null
    },
    querySelectorAll(selector) {
      const matches = (node: StubElement) => {
        if (selector === "rect") {
          return node.tagName === "rect"
        }

        if (selector === "path") {
          return node.tagName === "path"
        }

        if (selector === "clipPath") {
          return node.tagName === "clipPath"
        }

        if (
          [
            "feComposite",
            "feFlood",
            "feGaussianBlur",
            "feOffset",
          ].includes(selector)
        ) {
          return node.tagName === selector
        }

        if (selector === '[data-qr-layer="background-image"]') {
          return node.attributes["data-qr-layer"] === "background-image"
        }

        if (selector === '[data-qr-layer="background-image-clip"]') {
          return node.attributes["data-qr-layer"] === "background-image-clip"
        }

        if (selector === '[data-qr-layer="background-shape"]') {
          return node.attributes["data-qr-layer"] === "background-shape"
        }

        if (selector === '[data-qr-layer="background-shape-gradient"]') {
          return node.attributes["data-qr-layer"] === "background-shape-gradient"
        }

        if (selector === '[data-qr-layer="background-shape-blur"]') {
          return node.attributes["data-qr-layer"] === "background-shape-blur"
        }

        if (selector === '[data-qr-layer="background-shape-blur-filter"]') {
          return node.attributes["data-qr-layer"] === "background-shape-blur-filter"
        }

        if (selector === '[data-qr-layer="qr-content"]') {
          return node.attributes["data-qr-layer"] === "qr-content"
        }

        if (selector === '[data-qr-layer="background-surface-blur"]') {
          return node.attributes["data-qr-layer"] === "background-surface-blur"
        }

        if (selector === '[data-qr-layer="background-surface-blur-filter"]') {
          return node.attributes["data-qr-layer"] === "background-surface-blur-filter"
        }

        if (selector === '[data-qr-layer="dot-matrix-animation"]') {
          return node.attributes["data-qr-layer"] === "dot-matrix-animation"
        }

        if (selector === '[data-qr-layer="dot-palette"]') {
          return node.attributes["data-qr-layer"] === "dot-palette"
        }

        if (selector === '[data-qr-layer="dot-palette-fill"]') {
          return node.attributes["data-qr-layer"] === "dot-palette-fill"
        }

        if (selector === '[data-qr-layer="dot-palette-color"]') {
          return node.attributes["data-qr-layer"] === "dot-palette-color"
        }

        if (selector === '[data-qr-layer="dot-gradient"]') {
          return node.attributes["data-qr-layer"] === "dot-gradient"
        }

        if (selector === '[data-qr-layer="dot-gradient-fill"]') {
          return node.attributes["data-qr-layer"] === "dot-gradient-fill"
        }

        if (selector === '[data-qr-layer="dot-gradient-definition"]') {
          return node.attributes["data-qr-layer"] === "dot-gradient-definition"
        }

        return false
      }

      const walk = (node: StubElement): StubElement[] => {
        const nestedMatches = node.children.flatMap(walk)
        return matches(node) ? [node, ...nestedMatches] : nestedMatches
      }

      return walk(element)
    },
    remove() {
      const parentNode = (element as StubElement & { parentNode?: StubElement }).parentNode

      if (!parentNode) {
        return
      }

      parentNode.children = parentNode.children.filter((child) => child !== element)
      delete (element as StubElement & { parentNode?: StubElement }).parentNode
    },
    removeAttribute(name) {
      delete element.attributes[name]
    },
    setAttribute(name, value) {
      element.attributes[name] = value
    },
    setAttributeNS(_namespace, name, value) {
      element.attributes[name] = value
    },
  }

  return element
}

function createDotMatrixSvgFixture({
  cols = 5,
  height = 120,
  rows = 5,
  width = 120,
}: DotMatrixSvgFixtureOptions = {}) {
  const svg = createStubElement("svg")
  const defs = createStubElement("defs")
  const dotClipPath = createStubElement("clipPath")
  dotClipPath.setAttribute("id", "clip-path-dot-color-0")

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const dot = createStubElement("rect")
      dot.setAttribute("x", String(10 + col * 5))
      dot.setAttribute("y", String(10 + row * 5))
      dot.setAttribute("width", "5")
      dot.setAttribute("height", "5")
      dotClipPath.appendChild(dot)
    }
  }

  defs.appendChild(dotClipPath)
  svg.appendChild(defs)

  const dotLayer = createStubElement("rect")
  dotLayer.setAttribute("clip-path", "url('#clip-path-dot-color-0')")
  dotLayer.setAttribute("fill", "#111827")
  svg.appendChild(dotLayer)

  return { dotLayer, height, svg, width }
}

function getPaletteLayerAnchors(_svg: StubElement, colorLayers: StubElement[]) {
  const anchorsByColor = new Map<string, string[]>()

  for (const layer of colorLayers) {
    const color = layer.getAttribute("fill") ?? layer.children[0]?.getAttribute("fill") ?? ""
    const anchors = Array.from(layer.children)
      .map((shape) => {
        if (shape.tagName === "path") {
          const match = /M\s*([+-]?(?:\d+\.?\d*|\.\d+))[\s,]+([+-]?(?:\d+\.?\d*|\.\d+))/.exec(
            shape.getAttribute("d") ?? "",
          )
          return match ? `${Math.floor(Number(match[1]))},${Math.floor(Number(match[2]))}` : null
        }

        const x = shape.getAttribute("x")
        const y = shape.getAttribute("y")

        return x && y ? `${x},${y}` : null
      })
      .filter((anchor): anchor is string => anchor !== null)

    const existing = anchorsByColor.get(color) ?? []
    anchorsByColor.set(color, [...existing, ...anchors])
  }

  return anchorsByColor
}

function renderDotMatrixTracks(
  loader: NonNullable<ReturnType<typeof createDefaultQrStudioState>["dotMatrixAnimation"]["loader"]>,
  pattern: ReturnType<typeof createDefaultQrStudioState>["dotMatrixAnimation"]["pattern"] = "full",
  patch: QrDotMatrixAnimationPatch = {},
) {
  const state = setDotMatrixAnimationOptions(createDefaultQrStudioState(), {
    ...patch,
    enabled: true,
    loader,
    pattern,
    speed: patch.speed ?? 3,
  })
  const extension = createDotMatrixAnimationExtension(state, "preview")
  expect(extension).toBeNull()
  return { animationLayer: null, tracks: [] as StubElement[] }
}

function getTrackDuration(track: StubElement) {
  return Number(track.getAttribute("data-qr-dot-duration-ms") ?? Number.NaN)
}

function getTrackForRegion(tracks: StubElement[], region: string) {
  return tracks.find((track) =>
    track.getAttribute("data-qr-dot-region")?.split(" ").includes(region),
  )
}

function appendGradientRectPair({
  defs,
  fillRectX,
  fillRectY,
  gradientId,
  svg,
  tagName = "linearGradient",
}: {
  defs: StubElement
  fillRectX: number
  fillRectY: number
  gradientId: string
  svg: StubElement
  tagName?: "linearGradient" | "radialGradient"
}) {
  const gradient = createStubElement(tagName)
  gradient.setAttribute("gradientUnits", "userSpaceOnUse")
  gradient.setAttribute("id", gradientId)
  gradient.setAttribute("x1", "999")
  gradient.setAttribute("y1", "999")
  gradient.setAttribute("x2", "-999")
  gradient.setAttribute("y2", "-999")
  defs.appendChild(gradient)

  const fillRect = createStubElement("rect")
  fillRect.setAttribute("fill", `url('#${gradientId}')`)
  fillRect.setAttribute("height", "21")
  fillRect.setAttribute("width", "21")
  fillRect.setAttribute("x", String(fillRectX))
  fillRect.setAttribute("y", String(fillRectY))
  svg.appendChild(fillRect)

  return { fillRect, gradient }
}

function getGradientRelativeCoordinates(
  gradient: StubElement,
  fillRect: StubElement,
) {
  const rectX = Number.parseFloat(fillRect.getAttribute("x") ?? "0")
  const rectY = Number.parseFloat(fillRect.getAttribute("y") ?? "0")

  return {
    x1: Number.parseFloat(gradient.getAttribute("x1") ?? "0") - rectX,
    x2: Number.parseFloat(gradient.getAttribute("x2") ?? "0") - rectX,
    y1: Number.parseFloat(gradient.getAttribute("y1") ?? "0") - rectY,
    y2: Number.parseFloat(gradient.getAttribute("y2") ?? "0") - rectY,
  }
}

describe("qr rendering helpers", () => {
  it("derives three localized outer finder regions from qr geometry", () => {
    expect(getFinderCornerRegions(12, 57, "outer")).toEqual([
      { height: 7, width: 7, x: 12, y: 12 },
      { height: 7, width: 7, x: 38, y: 12 },
      { height: 7, width: 7, x: 12, y: 38 },
    ])
  })

  it("derives three localized inner finder regions from qr geometry", () => {
    expect(getFinderCornerRegions(12, 57, "inner")).toEqual([
      { height: 4.5, width: 4.5, x: 13.25, y: 13.25 },
      { height: 4.5, width: 4.5, x: 39.25, y: 13.25 },
      { height: 4.5, width: 4.5, x: 13.25, y: 39.25 },
    ])
  })

  it("reads qr num cells from rendered svg view boxes", () => {
    const svg = createStubElement("svg")
    svg.setAttribute("viewBox", "0 0 57 57")

    expect(getQrSvgNumCells(svg as unknown as SVGElement)).toBe(57)
  })

  it("keeps logo-only changes on the upstream image path instead of the extension pipeline", () => {
    const defaultState = createDefaultQrStudioState()
    const stateWithLogo = createDefaultQrStudioState()
    stateWithLogo.logo = {
      source: "url",
      value: "https://example.com/logo.png",
    }

    expect(buildQrExtension(stateWithLogo)).toBeNull()
    expect(getQrExtensionKey(stateWithLogo)).not.toBe(getQrExtensionKey(defaultState))
  })

  it("builds unified module gradient extensions without touching logo assets", () => {
    const stateWithUnifiedLogo = createDefaultQrStudioState()
    stateWithUnifiedLogo.dotsColorMode = "gradient"
    stateWithUnifiedLogo.gradientLinkMode = "unified"
    stateWithUnifiedLogo.dataModulesGradient = {
      ...stateWithUnifiedLogo.dataModulesGradient,
      enabled: true,
    }
    stateWithUnifiedLogo.logo = {
      source: "url",
      value: "https://example.com/logo.png",
    }

    expect(buildQrExtension(stateWithUnifiedLogo)).toBeTypeOf("function")
  })

  it("does not create an alignment extension in unified gradient mode", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "gradient"
    state.gradientLinkMode = "unified"
    state.dataModulesGradient = {
      ...state.dataModulesGradient,
      enabled: true,
    }

    expect(createAlignedCornerGradientExtension(state)).toBeNull()
  })

  it("changes the extension key when a background image is active", () => {
    const defaultState = createDefaultQrStudioState()
    const stateWithBackgroundImage = createDefaultQrStudioState()
    stateWithBackgroundImage.backgroundImage = {
      source: "upload",
      value: "blob:https://new-qr-studio.local/background.png",
    }

    expect(getQrExtensionKey(stateWithBackgroundImage)).not.toBe(
      getQrExtensionKey(defaultState),
    )
  })

  it("changes the extension key when a vector background shape is active", () => {
    const defaultState = createDefaultQrStudioState()
    const stateWithBackgroundShape = createDefaultQrStudioState()
    stateWithBackgroundShape.backgroundShapeId = "circle"

    expect(getQrExtensionKey(stateWithBackgroundShape)).not.toBe(
      getQrExtensionKey(defaultState),
    )
  })

  it("applies palette module colors as qr dot layers", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "palette"
    state.dotsPalette = ["#111111", "#eeeeee"]

    const extension = buildQrExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const { dotLayer, height, svg, width } = createDotMatrixSvgFixture({
      cols: 2,
      rows: 2,
    })

    extension(svg as unknown as SVGElement, {
      height,
      width,
    })

    const paletteLayer = svg.querySelector('[data-qr-layer="dot-palette"]')
    const colorLayers = svg.querySelectorAll('[data-qr-layer="dot-palette-fill"]')

    expect(svg.querySelector('[clip-path*="clip-path-dot-color-0"]')).toBeNull()
    expect(paletteLayer?.getAttribute("data-qr-palette-size")).toBe("2")
    expect(colorLayers).toHaveLength(2)
    expect(
      [...new Set(colorLayers.map((layer) => layer.getAttribute("fill") ?? layer.children[0]?.getAttribute("fill")))],
    ).toEqual(["#111111", "#eeeeee"])
    expect(colorLayers.every((layer) => layer.getAttribute("clip-path"))).toBe(false)
  })

  it("scatters palette colors without sorted bands or checkerboard repetition", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "palette"
    state.dotsPalette = ["#111111", "#222222", "#333333", "#444444"]

    const extension = buildQrExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const { height, svg, width } = createDotMatrixSvgFixture({
      cols: 4,
      rows: 4,
    })

    extension(svg as unknown as SVGElement, {
      height,
      width,
    })

    const colorLayers = svg.querySelectorAll('[data-qr-layer="dot-palette-fill"]')
    const anchorsByColor = getPaletteLayerAnchors(svg, colorLayers)
    const allAnchors = new Map(
      Array.from(anchorsByColor.entries()).flatMap(([color, anchors]) =>
        anchors.map((anchor) => [anchor, color] as const),
      ),
    )
    const firstRowColors = [0, 1, 2, 3].map((col) => allAnchors.get(`${10 + col * 5},10`))
    const rowMajorColors = Array.from({ length: 16 }, (_item, index) => {
      const row = Math.floor(index / 4)
      const col = index % 4
      return allAnchors.get(`${10 + col * 5},${10 + row * 5}`)
    })
    const rowMajorRuns = rowMajorColors.reduce<string[][]>((runs, color) => {
      const lastRun = runs[runs.length - 1]

      if (lastRun && lastRun[0] === color) {
        lastRun.push(color ?? "")
      } else {
        runs.push([color ?? ""])
      }

      return runs
    }, [])

    expect(colorLayers.map((layer) => layer.getAttribute("fill"))).toEqual([
      "#111111",
      "#222222",
      "#333333",
      "#444444",
    ])
    expect(rowMajorRuns.some((run) => run.length >= 4)).toBe(false)
    expect(firstRowColors).not.toEqual(["#111111", "#111111", "#111111", "#111111"])
    expect(firstRowColors).not.toEqual(["#111111", "#222222", "#333333", "#444444"])
    expect(firstRowColors).not.toEqual(["#111111", "#222222", "#111111", "#222222"])
  })

  it("keeps same-coordinate palette path fragments grouped together", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "palette"
    state.dotsPalette = ["#111111", "#222222", "#333333", "#444444"]

    const extension = buildQrExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const svg = createStubElement("svg")
    const pathLayer = createStubElement("path")
    pathLayer.setAttribute("data-testid", "data-modules")
    pathLayer.setAttribute(
      "d",
      "M10.25,10.25h1.5v0.5h-1.5Z M10,10.5a0.5,0.5 0 1,1 1,0a0.5,0.5 0 1,1 -1,0Z M15.25,10.25h1.5v0.5h-1.5Z M15,10.5a0.5,0.5 0 1,1 1,0a0.5,0.5 0 1,1 -1,0Z",
    )
    svg.appendChild(pathLayer)

    extension(svg as unknown as SVGElement, {
      height: 120,
      width: 120,
    })

    const colorLayers = svg.querySelectorAll('[data-qr-layer="dot-palette-fill"]')
    const anchorsByColor = getPaletteLayerAnchors(svg, colorLayers)
    const colorsForFirstCoordinate = Array.from(anchorsByColor.entries())
      .filter((entry) => entry[1].includes("10,10"))
      .map(([color]) => color)
    const colorsForSecondCoordinate = Array.from(anchorsByColor.entries())
      .filter((entry) => entry[1].includes("15,10"))
      .map(([color]) => color)

    expect(colorsForFirstCoordinate).toHaveLength(1)
    expect(colorsForSecondCoordinate).toHaveLength(1)
  })

  it("applies module gradients only to data modules", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "gradient"
    state.dataModulesGradient = {
      enabled: true,
      type: "linear",
      rotation: Math.PI / 2,
      colorStops: [
        { offset: 0, color: "#111111" },
        { offset: 1, color: "#eeeeee" },
      ],
    }

    const extension = buildQrExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const { dotLayer, height, svg, width } = createDotMatrixSvgFixture({
      cols: 2,
      rows: 2,
    })
    const cornerLayer = createStubElement("rect")
    cornerLayer.setAttribute("clip-path", "url('#clip-path-corners-square-color-0-0-0')")
    cornerLayer.setAttribute("fill", "#111827")
    svg.appendChild(cornerLayer)

    extension(svg as unknown as SVGElement, {
      height,
      width,
    })

    const gradientDefinition = svg.querySelector('[data-qr-layer="dot-gradient-definition"]')

    expect(dotLayer.getAttribute("opacity")).toBeNull()
    expect(cornerLayer.getAttribute("opacity")).toBeNull()
    expect(gradientDefinition).not.toBeNull()
    expect(dotLayer.getAttribute("fill")).toBe("url('#dot-gradient-definition')")
    expect(dotLayer.getAttribute("clip-path")).toContain("clip-path-dot-color-0")
    expect(dotLayer.getAttribute("data-qr-layer")).toBe("dot-gradient-fill")
    expect(gradientDefinition?.tagName).toBe("linearGradient")
    expect(gradientDefinition?.getAttribute("x1")).toBe("15")
    expect(gradientDefinition?.getAttribute("y1")).toBe("10")
    expect(gradientDefinition?.getAttribute("x2")).toBe("15")
    expect(gradientDefinition?.getAttribute("y2")).toBe("20")
    expect(svg.querySelector('[data-qr-layer="dot-gradient-clip"]')).toBeNull()
  })


  it("retires css dot matrix animation in favor of bitjson runtime preview", () => {
    const state = createDefaultQrStudioState()
    state.dotMatrixAnimation = {
      ...state.dotMatrixAnimation,
      enabled: true,
      animated: true,
      exportAnimatedSvg: true,
    }

    expect(createDotMatrixAnimationExtension(state, "preview")).toBeNull()
    expect(createDotMatrixAnimationExtension(state, "export")).toBeNull()
  })


  it("changes the extension key when corner gradients are enabled", () => {
    const defaultState = createDefaultQrStudioState()
    const stateWithCornerGradient = createDefaultQrStudioState()
    stateWithCornerGradient.finderPatternOuterGradient = {
      ...stateWithCornerGradient.finderPatternOuterGradient,
      enabled: true,
      rotation: Math.PI / 3,
      type: "linear",
    }

    expect(getQrExtensionKey(stateWithCornerGradient)).not.toBe(
      getQrExtensionKey(defaultState),
    )
  })

  it("adds a background image layer to the svg extension output", () => {
    const state = createDefaultQrStudioState()
    state.backgroundImage = {
      source: "upload",
      value: "blob:https://new-qr-studio.local/background.png",
    }

    const extension = buildQrExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const svg = createStubElement("svg")
    svg.appendChild(createStubElement("defs"))
    svg.appendChild(createStubElement("rect"))
    svg.appendChild(createStubElement("path"))

    extension(svg as unknown as SVGElement, {
      height: 100,
      width: 100,
    })

    const backgroundImage = svg.querySelector('[data-qr-layer="background-image"]')

    expect(backgroundImage).not.toBeNull()
    expect(backgroundImage?.getAttribute("href")).toBe(
      "blob:https://new-qr-studio.local/background.png",
    )
    expect(backgroundImage?.getAttribute("clip-path")).toBeNull()
    expect(svg.children[2]?.getAttribute("data-qr-layer")).toBe("background-image")
  })

  it("clips background images with the configured qr background radius", () => {
    const state = createDefaultQrStudioState()
    state.backgroundOptions.round = 0.5
    state.backgroundImage = {
      source: "upload",
      value: "blob:https://new-qr-studio.local/background.png",
    }

    const extension = buildQrExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const svg = createStubElement("svg")
    const defs = createStubElement("defs")
    svg.appendChild(defs)
    svg.appendChild(createStubElement("rect"))
    svg.appendChild(createStubElement("path"))

    extension(svg as unknown as SVGElement, {
      height: 120,
      width: 160,
    })

    const backgroundImage = svg.querySelector('[data-qr-layer="background-image"]')
    const clipPath = svg.querySelector('[data-qr-layer="background-image-clip"]')
    const clipRect = clipPath?.querySelector("rect")

    expect(backgroundImage?.getAttribute("clip-path")).toBe(
      "url('#clip-path-background-image')",
    )
    expect(clipPath?.getAttribute("id")).toBe("clip-path-background-image")
    expect(clipRect?.getAttribute("x")).toBe("20")
    expect(clipRect?.getAttribute("y")).toBe("0")
    expect(clipRect?.getAttribute("width")).toBe("120")
    expect(clipRect?.getAttribute("height")).toBe("120")
    expect(clipRect?.getAttribute("rx")).toBe("30")
  })

  it("adds a solid vector background shape fitted to the svg viewport", () => {
    const state = createDefaultQrStudioState()
    state.backgroundShapeId = "hexagon"
    state.backgroundOptions.color = "#d0bcff"

    const extension = buildQrExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const svg = createStubElement("svg")
    svg.appendChild(createStubElement("defs"))
    svg.appendChild(createStubElement("rect"))
    svg.appendChild(createStubElement("path"))

    extension(svg as unknown as SVGElement, {
      height: 320,
      width: 320,
    })

    const backgroundShape = svg.querySelector('[data-qr-layer="background-shape"]')

    expect(backgroundShape).not.toBeNull()
    expect(backgroundShape?.getAttribute("fill")).toBe("#d0bcff")
    expect(backgroundShape?.getAttribute("transform")).toBe(
      "translate(0 33) scale(1)",
    )
    expect(svg.children[1]?.getAttribute("data-qr-layer")).toBe("background-shape")
  })

  it("applies background shape tilt to the vector transform", () => {
    const state = createDefaultQrStudioState()
    state.backgroundShapeId = "hexagon"
    state.backgroundOptions.color = "#d0bcff"
    state.backgroundShapeOptions = {
      ...state.backgroundShapeOptions,
      tiltX: 20,
      tiltY: -15,
    }

    const extension = buildQrExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const svg = createStubElement("svg")
    svg.appendChild(createStubElement("defs"))
    svg.appendChild(createStubElement("rect"))
    svg.appendChild(createStubElement("path"))

    extension(svg as unknown as SVGElement, {
      height: 320,
      width: 320,
    })

    const backgroundShape = svg.querySelector('[data-qr-layer="background-shape"]')
    const transform = backgroundShape?.getAttribute("transform") ?? ""

    expect(transform).toContain("skewX")
    expect(transform).toContain("skewY")
    expect(transform).not.toBe("translate(0 33) scale(1)")
  })

  it("expands vector background shape bounds with padding and stroke", () => {
    const state = createDefaultQrStudioState()
    state.backgroundShapeId = "circle"
    state.backgroundOptions.color = "#d0bcff"
    state.backgroundShapeOptions = {
      edgeBlur: 8,
      paddingPx: 24,
      shadowColor: "#020617",
      shadowOffsetX: 12,
      shadowOffsetY: -10,
      shadowOpacity: 58,
      strokeColor: "#111827",
      strokeOpacity: 42,
      strokeWidth: 6,
      tiltX: 0,
      tiltY: 0,
    }

    const extension = buildQrExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const svg = createStubElement("svg")
    svg.appendChild(createStubElement("defs"))
    svg.appendChild(createStubElement("rect"))
    const qrPath = createStubElement("path")
    svg.appendChild(qrPath)

    extension(svg as unknown as SVGElement, {
      height: 320,
      width: 320,
    })

    const backgroundShape = svg.querySelector('[data-qr-layer="background-shape"]')
    const qrContent = svg.querySelector('[data-qr-layer="qr-content"]')

    expect(svg.getAttribute("width")).toBe("374")
    expect(svg.getAttribute("height")).toBe("374")
    expect(svg.getAttribute("viewBox")).toBe("0 0 374 374")
    expect(qrContent?.getAttribute("transform")).toBe("translate(27 27)")
    expect(qrContent?.children).toContain(qrPath)
    expect(backgroundShape?.getAttribute("transform")).toBe(
      "translate(3 3) scale(1.15)",
    )
    expect(backgroundShape?.getAttribute("stroke")).toBe("#111827")
    expect(backgroundShape?.getAttribute("stroke-width")).toBe("6")
    expect(backgroundShape?.getAttribute("stroke-opacity")).toBe("0.42")
    expect(svg.querySelector('[data-qr-layer="background-shape-blur"]')).toBeNull()
    expect(svg.children[1]?.getAttribute("data-qr-layer")).toBe("background-shape")
  })

  it("expands the default qr background surface with padding and stroke", () => {
    const state = createDefaultQrStudioState()
    state.backgroundOptions.color = "#f8fafc"
    state.backgroundOptions.round = 0.25
    state.backgroundShapeOptions = {
      edgeBlur: 10,
      paddingPx: 20,
      shadowColor: "#020617",
      shadowOffsetX: -14,
      shadowOffsetY: 18,
      shadowOpacity: 60,
      strokeColor: "#0f172a",
      strokeOpacity: 55,
      strokeWidth: 8,
      tiltX: 0,
      tiltY: 0,
    }

    const extension = buildQrExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const svg = createStubElement("svg")
    const defs = createStubElement("defs")
    const backgroundRect = createStubElement("rect")
    backgroundRect.setAttribute("clip-path", "url('#clip-path-background-color-2')")
    backgroundRect.setAttribute("fill", "#f8fafc")
    svg.appendChild(defs)
    svg.appendChild(backgroundRect)
    const qrPath = createStubElement("path")
    svg.appendChild(qrPath)

    extension(svg as unknown as SVGElement, {
      height: 320,
      width: 320,
    })

    const qrContent = svg.querySelector('[data-qr-layer="qr-content"]')

    expect(svg.getAttribute("width")).toBe("368")
    expect(svg.getAttribute("height")).toBe("368")
    expect(svg.getAttribute("viewBox")).toBe("0 0 368 368")
    expect(qrContent?.getAttribute("transform")).toBe("translate(24 24)")
    expect(qrContent?.children).toContain(qrPath)
    expect(backgroundRect.getAttribute("x")).toBe("4")
    expect(backgroundRect.getAttribute("y")).toBe("4")
    expect(backgroundRect.getAttribute("width")).toBe("360")
    expect(backgroundRect.getAttribute("height")).toBe("360")
    expect(backgroundRect.getAttribute("rx")).toBe("45")
    expect(backgroundRect.getAttribute("stroke")).toBe("#0f172a")
    expect(backgroundRect.getAttribute("stroke-width")).toBe("8")
    expect(backgroundRect.getAttribute("stroke-opacity")).toBe("0.55")
    expect(backgroundRect.getAttribute("clip-path")).toBeNull()
    expect(svg.querySelector('[data-qr-layer="background-surface-blur"]')).toBeNull()
    expect(svg.children[1]).toBe(backgroundRect)
  })

  it("keeps qr background geometry unchanged when legacy shadow fields differ", () => {
    const visibleShadowState = createDefaultQrStudioState()
    visibleShadowState.backgroundOptions.color = "#f8fafc"
    visibleShadowState.backgroundShapeOptions = {
      edgeBlur: 10,
      paddingPx: 20,
      shadowColor: "#020617",
      shadowOffsetX: -14,
      shadowOffsetY: 18,
      shadowOpacity: 60,
      strokeColor: "#0f172a",
      strokeOpacity: 55,
      strokeWidth: 8,
      tiltX: 0,
      tiltY: 0,
    }
    const hiddenShadowState = {
      ...visibleShadowState,
      backgroundShapeOptions: {
        ...visibleShadowState.backgroundShapeOptions,
        shadowOpacity: 0,
      },
    }

    const visibleSvg = createStubElement("svg")
    visibleSvg.appendChild(createStubElement("defs"))
    visibleSvg.appendChild(createStubElement("rect"))
    visibleSvg.appendChild(createStubElement("path"))
    const hiddenSvg = createStubElement("svg")
    hiddenSvg.appendChild(createStubElement("defs"))
    hiddenSvg.appendChild(createStubElement("rect"))
    hiddenSvg.appendChild(createStubElement("path"))

    buildQrExtension(visibleShadowState)?.(visibleSvg as unknown as SVGElement, {
      height: 320,
      width: 320,
    })
    buildQrExtension(hiddenShadowState)?.(hiddenSvg as unknown as SVGElement, {
      height: 320,
      width: 320,
    })

    expect(hiddenSvg.getAttribute("width")).toBe(visibleSvg.getAttribute("width"))
    expect(hiddenSvg.getAttribute("height")).toBe(visibleSvg.getAttribute("height"))
    expect(hiddenSvg.getAttribute("viewBox")).toBe(visibleSvg.getAttribute("viewBox"))
    expect(hiddenSvg.querySelector('[data-qr-layer="background-surface-blur"]')).toBeNull()
    expect(hiddenSvg.querySelector('[data-qr-layer="background-surface-blur-filter"]')).toBeNull()
  })

  it("fills vector background shapes with the active background gradient", () => {
    const state = createDefaultQrStudioState()
    state.backgroundShapeId = "circle"
    state.backgroundGradient = {
      enabled: true,
      type: "linear",
      rotation: Math.PI / 2,
      colorStops: [
        { offset: 0, color: "#111111" },
        { offset: 1, color: "#eeeeee" },
      ],
    }

    const extension = buildQrExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const svg = createStubElement("svg")
    const defs = createStubElement("defs")
    svg.appendChild(defs)
    svg.appendChild(createStubElement("rect"))
    svg.appendChild(createStubElement("path"))

    extension(svg as unknown as SVGElement, {
      height: 320,
      width: 320,
    })

    const backgroundShape = svg.querySelector('[data-qr-layer="background-shape"]')
    const gradient = svg.querySelector('[data-qr-layer="background-shape-gradient"]')

    expect(backgroundShape?.getAttribute("fill")).toBe("url('#background-shape-gradient')")
    expect(gradient?.tagName).toBe("linearGradient")
    expect(gradient?.getAttribute("x1")).toBe("160")
    expect(gradient?.getAttribute("y1")).toBe("0")
    expect(gradient?.getAttribute("x2")).toBe("160")
    expect(gradient?.getAttribute("y2")).toBe("320")
  })

  it("lets background images override vector background shapes", () => {
    const state = createDefaultQrStudioState()
    state.backgroundShapeId = "circle"
    state.backgroundImage = {
      source: "upload",
      value: "blob:https://new-qr-studio.local/background.png",
    }

    const extension = buildQrExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const svg = createStubElement("svg")
    svg.appendChild(createStubElement("defs"))
    svg.appendChild(createStubElement("rect"))
    svg.appendChild(createStubElement("path"))

    extension(svg as unknown as SVGElement, {
      height: 320,
      width: 320,
    })

    expect(svg.querySelector('[data-qr-layer="background-image"]')).not.toBeNull()
    expect(svg.querySelector('[data-qr-layer="background-shape"]')).toBeNull()
  })

  it("normalizes all corner-frame linear gradients to the same relative direction", () => {
    const state = createDefaultQrStudioState()
    state.finderPatternOuterGradient = {
      ...state.finderPatternOuterGradient,
      enabled: true,
      rotation: Math.PI / 4,
      type: "linear",
    }

    const extension = createAlignedCornerGradientExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const svg = createStubElement("svg")
    const defs = createStubElement("defs")
    svg.appendChild(defs)
    const topLeft = appendGradientRectPair({
      defs,
      fillRectX: 24,
      fillRectY: 24,
      gradientId: "corners-square-color-0-0-1",
      svg,
    })
    const topRight = appendGradientRectPair({
      defs,
      fillRectX: 180,
      fillRectY: 24,
      gradientId: "corners-square-color-1-0-1",
      svg,
    })
    const bottomLeft = appendGradientRectPair({
      defs,
      fillRectX: 24,
      fillRectY: 180,
      gradientId: "corners-square-color-0-1-1",
      svg,
    })

    extension(svg as unknown as SVGElement, {
      height: 240,
      width: 240,
    })

    const topLeftCoordinates = getGradientRelativeCoordinates(
      topLeft.gradient,
      topLeft.fillRect,
    )

    expect(
      getGradientRelativeCoordinates(topRight.gradient, topRight.fillRect),
    ).toEqual(topLeftCoordinates)
    expect(
      getGradientRelativeCoordinates(bottomLeft.gradient, bottomLeft.fillRect),
    ).toEqual(topLeftCoordinates)
  })

  it("normalizes all corner-dot linear gradients to the same relative direction", () => {
    const state = createDefaultQrStudioState()
    state.finderPatternInnerGradient = {
      ...state.finderPatternInnerGradient,
      enabled: true,
      rotation: Math.PI / 2,
      type: "linear",
    }

    const extension = createAlignedCornerGradientExtension(state)
    expect(extension).toBeTypeOf("function")

    if (!extension) {
      return
    }

    const svg = createStubElement("svg")
    const defs = createStubElement("defs")
    svg.appendChild(defs)
    const topLeft = appendGradientRectPair({
      defs,
      fillRectX: 40,
      fillRectY: 40,
      gradientId: "corners-dot-color-0-0-1",
      svg,
    })
    const topRight = appendGradientRectPair({
      defs,
      fillRectX: 196,
      fillRectY: 40,
      gradientId: "corners-dot-color-1-0-1",
      svg,
    })
    const bottomLeft = appendGradientRectPair({
      defs,
      fillRectX: 40,
      fillRectY: 196,
      gradientId: "corners-dot-color-0-1-1",
      svg,
    })

    extension(svg as unknown as SVGElement, {
      height: 280,
      width: 280,
    })

    const topLeftCoordinates = getGradientRelativeCoordinates(
      topLeft.gradient,
      topLeft.fillRect,
    )

    expect(
      getGradientRelativeCoordinates(topRight.gradient, topRight.fillRect),
    ).toEqual(topLeftCoordinates)
    expect(
      getGradientRelativeCoordinates(bottomLeft.gradient, bottomLeft.fillRect),
    ).toEqual(topLeftCoordinates)
  })

  it("does not create an alignment extension for radial corner gradients", () => {
    const state = createDefaultQrStudioState()
    state.finderPatternOuterGradient = {
      ...state.finderPatternOuterGradient,
      enabled: true,
      type: "radial",
    }

    expect(createAlignedCornerGradientExtension(state)).toBeNull()
  })
})
