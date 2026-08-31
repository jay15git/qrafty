import { describe, expect, it } from "vitest"

import { qraftyPropsToReactQrProps } from "./map-props"

describe("qraftyPropsToReactQrProps", () => {
  it("maps flat portable props to upstream ReactQRCode props", () => {
    const result = qraftyPropsToReactQrProps({
      value: "https://example.com",
      size: 256,
      margin: 8,
      module: "rounded",
      foreground: "#111827",
      background: "#ffffff",
    })

    expect(result.value).toBe("https://example.com")
    expect(result.size).toBe(256)
    expect(result.marginSize).toBe(8)
    expect(result.level).toBe("Q")
    expect(result.minVersion).toBe(1)
    expect(result.boostLevel).toBe(true)
    expect(result.dataModulesSettings).toEqual({
      color: "#111827",
      randomSize: false,
      style: "rounded",
    })
  })

  it("passes through upstream encoding and module tuning props", () => {
    const result = qraftyPropsToReactQrProps({
      value: ["https://a.com", "extra"],
      level: "H",
      minVersion: 5,
      boostLevel: false,
      ariaLabel: "Scan me",
      module: "circuit-board",
      moduleSize: 0.9,
      moduleLineWidth: 0.75,
      foreground: "#000000",
    })

    expect(result.value).toEqual(["https://a.com", "extra"])
    expect(result.level).toBe("H")
    expect(result.minVersion).toBe(5)
    expect(result.boostLevel).toBe(false)
    expect(result.svgProps?.["aria-label"]).toBe("Scan me")
    expect(result.dataModulesSettings).toMatchObject({
      lineWidth: 0.75,
      size: 0.9,
      style: "circuit-board",
    })
  })

  it("maps logo ratio and pixel sizing to imageSettings", () => {
    const ratioResult = qraftyPropsToReactQrProps({
      value: "x",
      size: 200,
      logo: {
        excavate: false,
        size: 0.25,
        src: "/logo.png",
      },
    })

    expect(ratioResult.imageSettings).toEqual({
      crossOrigin: "anonymous",
      excavate: false,
      height: 50,
      src: "/logo.png",
      width: 50,
    })

    const pixelResult = qraftyPropsToReactQrProps({
      value: "x",
      logo: {
        crossOrigin: "use-credentials",
        height: 32,
        opacity: 0.8,
        src: "/logo.png",
        width: 40,
        x: 10,
        y: 12,
      },
    })

    expect(pixelResult.imageSettings).toEqual({
      crossOrigin: "use-credentials",
      excavate: true,
      height: 32,
      opacity: 0.8,
      src: "/logo.png",
      width: 40,
      x: 10,
      y: 12,
    })
  })

  it("maps backgroundGradient to upstream background gradient settings", () => {
    const result = qraftyPropsToReactQrProps({
      value: "x",
      background: "#ffffff",
      backgroundGradient: {
        rotation: 90,
        stops: [
          { color: "#ff0000", offset: 0 },
          { color: "#0000ff", offset: 1 },
        ],
        type: "linear",
      },
    })

    expect(result.background).toEqual({
      rotation: 90,
      stops: [
        { color: "#ff0000", offset: "0" },
        { color: "#0000ff", offset: "1" },
      ],
      type: "linear",
    })
  })

  it("keeps legacy dots module alias as circle with random sizing", () => {
    const result = qraftyPropsToReactQrProps({
      value: "x",
      module: "dots" as never,
    })

    expect(result.dataModulesSettings?.style).toBe("circle")
    expect(result.dataModulesSettings?.randomSize).toBe(true)
  })

  it("maps unified gradientMode to upstream gradient prop", () => {
    const result = qraftyPropsToReactQrProps({
      value: "x",
      colorMode: "gradient",
      gradient: {
        rotation: 0,
        stops: [
          { color: "#111111", offset: 0 },
          { color: "#999999", offset: 1 },
        ],
        type: "linear",
      },
      gradientMode: "unified",
      foreground: "#111111",
    })

    expect(result.gradient).toMatchObject({ type: "linear" })
    expect(result.dataModulesSettings?.color).toBeUndefined()
  })
})
