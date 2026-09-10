// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import {
  findModuleShaderFillImage,
  isUsableShaderSnapshot,
  MODULE_SHADER_FILL_IMAGE_ID,
  setModuleShaderFillImageHref,
  solidColorImageDataUrl,
  syncModuleShaderFillImage,
} from "@/features/qr-code/motion/module-shader-fill"

describe("module shader fill helpers", () => {
  it("finds the module shader image inside injected qr markup", () => {
    const container = document.createElement("div")
    container.innerHTML = `<svg viewBox="0 0 10 10"><image id="${MODULE_SHADER_FILL_IMAGE_ID}" href="#"/></svg>`

    expect(findModuleShaderFillImage(container)?.id).toBe(MODULE_SHADER_FILL_IMAGE_ID)
  })

  it("writes href values onto svg image nodes", () => {
    const container = document.createElement("div")
    container.innerHTML = `<svg viewBox="0 0 10 10"><image id="${MODULE_SHADER_FILL_IMAGE_ID}" href="#"/></svg>`
    const image = findModuleShaderFillImage(container)

    expect(image).not.toBeNull()
    setModuleShaderFillImageHref(image!, "data:image/png;base64,abc")

    expect(image?.getAttribute("href")).toBe("data:image/png;base64,abc")
  })

  it("builds solid color placeholder images", () => {
    expect(solidColorImageDataUrl("#ff00aa")).toContain("%23ff00aa")
  })

  it("rejects empty or trivial data urls", () => {
    expect(isUsableShaderSnapshot("")).toBe(false)
    expect(isUsableShaderSnapshot("data:image/png;base64,")).toBe(false)
  })

  it("accepts non-trivial data urls without a canvas probe", () => {
    expect(isUsableShaderSnapshot(`data:image/png;base64,${"a".repeat(400)}`)).toBe(true)
  })

  it("probes canvas alpha when a 2d context is available", () => {
    const canvas = document.createElement("canvas")
    canvas.width = 8
    canvas.height = 8
    const context = canvas.getContext("2d")

    if (!context) {
      expect(isUsableShaderSnapshot("", canvas)).toBe(false)
      return
    }

    context.clearRect(0, 0, 8, 8)
    const transparentUrl = canvas.toDataURL("image/png")
    expect(isUsableShaderSnapshot(transparentUrl, canvas)).toBe(false)

    context.fillStyle = "#3366ff"
    context.fillRect(0, 0, 8, 8)
    const opaqueUrl = canvas.toDataURL("image/png")
    expect(isUsableShaderSnapshot(opaqueUrl, canvas)).toBe(true)
  })

  it("keeps placeholder href when snapshot is unusable", () => {
    const container = document.createElement("div")
    const placeholder = solidColorImageDataUrl("#112233")
    container.innerHTML = `<svg viewBox="0 0 10 10"><image id="${MODULE_SHADER_FILL_IMAGE_ID}" href="${placeholder}"/></svg>`

    const synced = syncModuleShaderFillImage(container, "data:image/png;base64,")

    expect(synced).toBe(false)
    expect(findModuleShaderFillImage(container)?.getAttribute("href")).toBe(placeholder)
  })
})
