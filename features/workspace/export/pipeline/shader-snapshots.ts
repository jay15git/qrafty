import { shaderRequiresImage } from "@new-qr/qr/shaders"

import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  resolveShaderExportFrameMs,
  type ExportClockMode,
} from "@/features/workspace/export/pipeline/clock"
import { ShaderFrameRenderer } from "@/features/workspace/export/pipeline/shader-frames"

type ShaderCaptureTarget = {
  imageValue?: string
  key: string
  layoutHeight: number
  layoutWidth: number
  shader: DraftingCardState["paperShader"]
}

function resolveCardShaderState(cardState: DraftingCardState) {
  if (cardState.styleMode === "paper-shader") {
    return cardState.paperShader
  }

  if (cardState.styleMode === "image-filter") {
    return cardState.imageFilter
  }

  return null
}

function collectShaderCaptureTargets({
  cardLayer,
  cardState,
  layers,
}: {
  cardLayer: DraftingCanvasLayer | null
  cardState: DraftingCardState
  layers: DraftingCanvasLayer[]
}) {
  const targets: ShaderCaptureTarget[] = []
  const cardShader = resolveCardShaderState(cardState)

  if (cardShader && cardLayer) {
    targets.push({
      imageValue:
        shaderRequiresImage(cardShader.shaderId) && cardState.cardImage.value
          ? cardState.cardImage.value
          : cardShader.image.value,
      key: cardLayer.id,
      layoutHeight: cardLayer.height,
      layoutWidth: cardLayer.width,
      shader: cardShader,
    })
  }

  for (const layer of layers) {
    if (layer.kind !== "shader" || !layer.isVisible || !layer.paperShader) {
      continue
    }

    targets.push({
      imageValue:
        shaderRequiresImage(layer.paperShader.shaderId) && layer.paperShader.image.value
          ? layer.paperShader.image.value
          : undefined,
      key: layer.id,
      layoutHeight: layer.height,
      layoutWidth: layer.width,
      shader: layer.paperShader,
    })
  }

  return targets
}

async function captureShaderTarget(
  target: ShaderCaptureTarget,
  mode: ExportClockMode,
  videoTimeMs: number,
  renderer?: ShaderFrameRenderer,
) {
  const ownsRenderer = !renderer
  const activeRenderer = renderer ?? new ShaderFrameRenderer()
  const frameMs = resolveShaderExportFrameMs(target.shader, mode, videoTimeMs)

  try {
    if (ownsRenderer) {
      await activeRenderer.mount({
        frameMs,
        imageValue: target.imageValue,
        layoutHeight: target.layoutHeight,
        layoutWidth: target.layoutWidth,
        shader: target.shader,
      })
    }

    await activeRenderer.setFrameMs(frameMs)
    return activeRenderer.captureDataUrl()
  } finally {
    if (ownsRenderer) {
      activeRenderer.dispose()
    }
  }
}

/** Reuse offscreen shader mounts across video frames — no per-frame remount. */
export class WorkspaceShaderCaptureSession {
  private targets: ShaderCaptureTarget[] = []
  private renderers = new Map<string, ShaderFrameRenderer>()
  private cardLayerId: string | null = null

  async mount({
    cardLayer,
    cardState,
    layers,
    mode,
    videoTimeMs = 0,
  }: {
    cardLayer: DraftingCanvasLayer | null
    cardState: DraftingCardState
    layers: DraftingCanvasLayer[]
    mode: ExportClockMode
    videoTimeMs?: number
  }) {
    this.dispose()
    this.cardLayerId = cardLayer?.id ?? null
    this.targets = collectShaderCaptureTargets({ cardLayer, cardState, layers })

    await Promise.all(
      this.targets.map(async (target) => {
        const renderer = new ShaderFrameRenderer()
        const frameMs = resolveShaderExportFrameMs(target.shader, mode, videoTimeMs)

        await renderer.mount({
          frameMs,
          imageValue: target.imageValue,
          layoutHeight: target.layoutHeight,
          layoutWidth: target.layoutWidth,
          shader: target.shader,
        })

        this.renderers.set(target.key, renderer)
      }),
    )
  }

  async capture(mode: ExportClockMode, videoTimeMs = 0) {
    const snapshots: Record<string, string> = {}

    for (const target of this.targets) {
      const renderer = this.renderers.get(target.key)
      if (!renderer) {
        continue
      }

      const frameMs = resolveShaderExportFrameMs(target.shader, mode, videoTimeMs)
      await renderer.setFrameMs(frameMs)
      snapshots[target.key] = await renderer.captureDataUrl()

      if (target.shader.shaderId) {
        snapshots[target.shader.shaderId] = snapshots[target.key]
      }
    }

    if (this.cardLayerId && snapshots[this.cardLayerId]) {
      snapshots.card = snapshots[this.cardLayerId]
    }

    return snapshots
  }

  async captureBitmaps(mode: ExportClockMode, videoTimeMs = 0) {
    const bitmaps: Record<string, ImageBitmap> = {}

    for (const target of this.targets) {
      const renderer = this.renderers.get(target.key)
      if (!renderer) {
        continue
      }

      const frameMs = resolveShaderExportFrameMs(target.shader, mode, videoTimeMs)
      await renderer.setFrameMs(frameMs)
      const bitmap = await renderer.captureBitmap()
      bitmaps[target.key] = bitmap

      if (target.shader.shaderId) {
        bitmaps[target.shader.shaderId] = bitmap
      }
    }

    if (this.cardLayerId && bitmaps[this.cardLayerId]) {
      bitmaps.card = bitmaps[this.cardLayerId]
    }

    return bitmaps
  }

  dispose() {
    for (const renderer of this.renderers.values()) {
      renderer.dispose()
    }
    this.renderers.clear()
    this.targets = []
    this.cardLayerId = null
  }
}

export async function captureWorkspaceShaderSnapshots({
  cardLayer,
  cardState,
  layers,
  mode,
  session,
  videoTimeMs = 0,
}: {
  cardLayer: DraftingCanvasLayer | null
  cardState: DraftingCardState
  layers: DraftingCanvasLayer[]
  mode: ExportClockMode
  session?: WorkspaceShaderCaptureSession
  videoTimeMs?: number
}) {
  if (session) {
    return session.capture(mode, videoTimeMs)
  }

  const snapshots: Record<string, string> = {}
  const targets = collectShaderCaptureTargets({ cardLayer, cardState, layers })

  try {
    for (const target of targets) {
      snapshots[target.key] = await captureShaderTarget(target, mode, videoTimeMs)

      if (target.shader.shaderId) {
        snapshots[target.shader.shaderId] = snapshots[target.key]
      }
    }

    if (cardLayer && snapshots[cardLayer.id]) {
      snapshots.card = snapshots[cardLayer.id]
    }
  } catch (error) {
    throw error
  }

  return snapshots
}
