"use client"

import { createElement, createRef } from "react"
import { createRoot, type Root } from "react-dom/client"
import { isPaperShaderElement, type PaperShaderElement } from "@paper-design/shaders"
import { buildPaperShaderRenderProps } from "@new-qr/qr/shaders"
import { shaderRequiresImage } from "@new-qr/qr/shaders"
import { hasPaperShaderWebGlSupport } from "@new-qr/qr-internal/scene"

import type { DraftingCardPaperShaderState } from "@/features/workspace/model/card-state"
import { getPaperShaderDefinition } from "@/features/workspace/rendering/paper-shaders"
import { getPaperShaderRenderOptions } from "@/features/workspace/rendering/paper-shader-export"

export type ShaderFrameCaptureOptions = {
  frameMs: number
  imageValue?: string
  layoutHeight: number
  layoutWidth: number
  shader: DraftingCardPaperShaderState
}

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

const SHADER_MOUNT_WAIT_FRAMES = 120
const SHADER_CANVAS_WAIT_FRAMES = 120

function getExistingWebGlContext(canvas: HTMLCanvasElement) {
  return canvas.getContext("webgl2") ?? canvas.getContext("webgl")
}

function readWebGlPixels(canvas: HTMLCanvasElement) {
  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error("Shader frame capture failed. The WebGL canvas has no drawable pixels.")
  }

  const webgl = getExistingWebGlContext(canvas)

  if (!webgl) {
    throw new Error("Shader frame capture failed. The WebGL context is unavailable.")
  }

  webgl.bindFramebuffer(webgl.FRAMEBUFFER, null)
  const pixels = new Uint8Array(canvas.width * canvas.height * 4)
  webgl.readPixels(0, 0, canvas.width, canvas.height, webgl.RGBA, webgl.UNSIGNED_BYTE, pixels)

  return pixels
}

function copyWebGlCanvasToImageBitmap(canvas: HTMLCanvasElement) {
  const pixels = readWebGlPixels(canvas)
  const hasVisiblePixel = pixels.some((value, index) => index % 4 === 3 && value > 0)

  if (!hasVisiblePixel) {
    throw new Error("Shader frame capture failed. The captured frame is fully transparent.")
  }

  const { width, height } = canvas
  const flipped = new Uint8ClampedArray(width * height * 4)
  const rowBytes = width * 4

  for (let y = 0; y < height; y += 1) {
    const sourceStart = (height - 1 - y) * rowBytes
    flipped.set(pixels.subarray(sourceStart, sourceStart + rowBytes), y * rowBytes)
  }

  return createImageBitmap(new ImageData(flipped, width, height))
}

export class ShaderFrameRenderer {
  private container: HTMLDivElement | null = null
  private root: Root | null = null
  private shaderHostRef = createRef<PaperShaderElement>()
  private frameMs = 0
  private layoutWidth = 1
  private layoutHeight = 1
  private shader: DraftingCardPaperShaderState | null = null
  private imageValue?: string
  private mounted = false

  async mount(options: ShaderFrameCaptureOptions) {
    if (!hasPaperShaderWebGlSupport()) {
      throw new Error("WebGL is unavailable. Shader export cannot run in this browser.")
    }

    this.shader = options.shader
    this.frameMs = options.frameMs
    this.layoutWidth = Math.max(1, options.layoutWidth)
    this.layoutHeight = Math.max(1, options.layoutHeight)
    this.imageValue = options.imageValue

    if (!this.container) {
      this.container = document.createElement("div")
      this.container.style.cssText =
        "position:fixed;left:0;top:0;overflow:hidden;pointer-events:none;z-index:-1;opacity:0.01;"
      document.body.appendChild(this.container)
      this.root = createRoot(this.container)
    }

    this.updateHostSize()

    if (!this.mounted) {
      this.render()
      const shaderMount = await this.waitForShaderMount()
      await this.waitForDrawableCanvas(shaderMount.canvasElement)
      shaderMount.setSpeed(0)
      shaderMount.setFrame(this.frameMs)
      await this.waitForDrawableCanvas(shaderMount.canvasElement)
      this.mounted = true
      return
    }

    await this.setFrameMs(this.frameMs)
  }

  async setFrameMs(frameMs: number) {
    this.frameMs = frameMs
    const shaderMount = await this.waitForShaderMount()
    shaderMount.setSpeed(0)
    shaderMount.setFrame(frameMs)
    await this.waitForDrawableCanvas(shaderMount.canvasElement)
  }

  async captureBitmap() {
    const shaderMount = await this.waitForShaderMount()
    return copyWebGlCanvasToImageBitmap(shaderMount.canvasElement)
  }

  async captureDataUrl(mimeType = "image/png", quality = 0.92) {
    const bitmap = await this.captureBitmap()
    const canvas = document.createElement("canvas")
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext("2d")

    if (!context) {
      bitmap.close()
      throw new Error("Shader frame capture failed. The WebGL buffer may be unreadable.")
    }

    context.drawImage(bitmap, 0, 0)
    bitmap.close()
    const dataUrl = canvas.toDataURL(mimeType, quality)

    if (!dataUrl || dataUrl === "data:,") {
      throw new Error("Shader frame capture failed. The WebGL buffer may be unreadable.")
    }

    return dataUrl
  }

  async captureAtFrameMs(frameMs: number) {
    await this.setFrameMs(frameMs)
    return this.captureDataUrl()
  }

  dispose() {
    this.root?.unmount()
    this.root = null
    this.container?.remove()
    this.container = null
    this.shader = null
    this.shaderHostRef = createRef<PaperShaderElement>()
    this.mounted = false
  }

  private updateHostSize() {
    if (!this.container) {
      return
    }

    this.container.style.width = `${this.layoutWidth}px`
    this.container.style.height = `${this.layoutHeight}px`
  }

  private getShaderMount() {
    const host = this.shaderHostRef.current
    if (host?.paperShaderMount) {
      return host.paperShaderMount
    }

    if (!this.container) {
      return null
    }

    for (const element of this.container.querySelectorAll("div")) {
      if (isPaperShaderElement(element) && element.paperShaderMount) {
        return element.paperShaderMount
      }
    }

    return null
  }

  private async waitForShaderMount() {
    for (let attempt = 0; attempt < SHADER_MOUNT_WAIT_FRAMES; attempt += 1) {
      const shaderMount = this.getShaderMount()
      if (shaderMount) {
        return shaderMount
      }

      await waitForAnimationFrame()
    }

    throw new Error("Shader canvas is unavailable for export.")
  }

  private isCanvasDrawable(canvas: HTMLCanvasElement) {
    if (canvas.width <= 0 || canvas.height <= 0) {
      return false
    }

    const isBrowserPlaceholder = canvas.width === 300 && canvas.height === 150
    const expectsPlaceholder = this.layoutWidth === 300 && this.layoutHeight === 150

    if (isBrowserPlaceholder && !expectsPlaceholder) {
      return false
    }

    return true
  }

  private async waitForDrawableCanvas(canvas: HTMLCanvasElement) {
    for (let attempt = 0; attempt < SHADER_CANVAS_WAIT_FRAMES; attempt += 1) {
      if (this.isCanvasDrawable(canvas)) {
        return
      }

      await waitForAnimationFrame()
    }

    throw new Error("Shader canvas did not reach a drawable size for export.")
  }

  private render() {
    if (!this.root || !this.shader || !this.container) {
      return
    }

    const definition = getPaperShaderDefinition(this.shader.shaderId)
    const ShaderComponent = definition.component
    const renderOptions = getPaperShaderRenderOptions(this.shader.shaderId)
    const shaderProps = buildPaperShaderRenderProps(
      {
        shaderId: this.shader.shaderId,
        params: this.shader.params,
        frame: this.frameMs,
        speed: 0,
        paused: true,
        image:
          shaderRequiresImage(this.shader.shaderId) && this.imageValue
            ? { value: this.imageValue }
            : this.shader.image.value
              ? { value: this.shader.image.value }
              : undefined,
        renderOptions,
        worldWidth: this.layoutWidth,
        worldHeight: this.layoutHeight,
      },
      { quality: "export", frameMs: this.frameMs, seek: true },
    )

    this.updateHostSize()

    this.root.render(
      createElement(
        "div",
        {
          style: {
            height: this.layoutHeight,
            width: this.layoutWidth,
          },
        },
        createElement(ShaderComponent, {
          ...shaderProps,
          ref: this.shaderHostRef,
          "aria-hidden": true,
          "data-shader-canvas-host": true,
          style: {
            height: "100%",
            width: "100%",
          },
        }),
      ),
    )
  }
}

export async function captureShaderSnapshot(
  options: ShaderFrameCaptureOptions,
): Promise<string> {
  const renderer = new ShaderFrameRenderer()
  try {
    await renderer.mount(options)
    return renderer.captureDataUrl()
  } finally {
    renderer.dispose()
  }
}
