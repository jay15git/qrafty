import type { QrInputType } from "@/features/qr-code/content/input-options"
import type { QrStudioState } from "@/features/qr-code/model/state"
import { buildTemplateDocumentSeed } from "@/features/studio-hub/model/bootstrap-document"
import { createFrame, subFrame, type Rect } from "@/features/workspace/authoring/frame"
import {
  hairlinePart,
  pillButtonPart,
  shapeFieldPart,
  surfacePart,
  textPart,
  type PartContext,
} from "@/features/workspace/authoring/parts"
import { SPACE, TYPE, getPalette, type PaletteId } from "@/features/workspace/authoring/tokens"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"
import { type DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  getCanvasSizeFromTemplate,
  getSizeTemplate,
} from "@/features/workspace/model/size-templates"

export type TemplateArchetype = "label" | "seal" | "ticket"

export type TemplateRatio = "ratio-1-1" | "ratio-4-5"

export type TemplateSlots = {
  action?: string
  caption?: string
  meta?: string
  title?: string
}

export type TemplateDefinition = {
  archetype: TemplateArchetype
  data: string
  inputType?: QrInputType
  palette: PaletteId
  ratio: TemplateRatio
  slots: TemplateSlots
}

export type ArchetypeLayout = {
  layers: DraftingCanvasLayer[]
  qr: Rect
  qrInk?: string
}

export type ArchetypeContext = {
  canvas: { height: number; width: number }
  nodeId: string
  palette: ReturnType<typeof getPalette>
  slots: TemplateSlots
}

const TEXT_HEIGHT = {
  caption: TYPE.caption.fontSize * TYPE.caption.lineHeight,
  body: TYPE.body.fontSize * TYPE.body.lineHeight,
  title: TYPE.title.fontSize * TYPE.title.lineHeight,
} as const

const ACTION_HEIGHT = 96

/**
 * Ticket: one surface panel, QR as the hero above a caption/title/meta block,
 * optional full-width action pill at the foot. Strong vertical symmetry axis.
 */
function layoutTicket(context: ArchetypeContext): ArchetypeLayout {
  const { palette, slots } = context
  const frame = createFrame({
    height: context.canvas.height,
    padding: SPACE.xl,
    width: context.canvas.width,
  })
  const panel = frame.content
  const layers: DraftingCanvasLayer[] = []
  let zIndex = 10

  layers.push(
    ...surfacePart({ nodeId: context.nodeId, palette, zIndex }, panel, {
      radius: "lg",
      shadow: "soft",
    }),
  )
  zIndex += 2

  const inner = subFrame(panel, SPACE.lg).content
  const hasAction = Boolean(slots.action)
  const captionHeight = slots.caption ? TEXT_HEIGHT.caption + SPACE.md : 0
  const titleHeight = slots.title ? TEXT_HEIGHT.title + SPACE.xs : 0
  const metaHeight = slots.meta ? TEXT_HEIGHT.body + SPACE.md : 0
  const actionHeight = hasAction ? ACTION_HEIGHT + SPACE.lg : 0
  const qrSide = Math.min(
    inner.width,
    inner.height - captionHeight - titleHeight - metaHeight - actionHeight,
  )

  const qr: Rect = {
    height: qrSide,
    width: qrSide,
    x: inner.x + (inner.width - qrSide) / 2,
    y: inner.y,
  }

  let cursor = qr.y + qr.height

  if (slots.caption) {
    cursor += SPACE.md
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        { height: TEXT_HEIGHT.caption, width: inner.width, x: inner.x, y: cursor },
        { align: "center", step: "caption", text: slots.caption, tone: "muted", uppercase: true },
      ),
    )
    zIndex += 1
    cursor += TEXT_HEIGHT.caption
  }

  if (slots.title) {
    cursor += SPACE.xs
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        { height: TEXT_HEIGHT.title, width: inner.width, x: inner.x, y: cursor },
        { align: "center", step: "title", text: slots.title },
      ),
    )
    zIndex += 1
    cursor += TEXT_HEIGHT.title
  }

  if (slots.meta) {
    cursor += SPACE.xs
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        { height: TEXT_HEIGHT.body, width: inner.width, x: inner.x, y: cursor },
        { align: "center", step: "body", text: slots.meta, tone: "muted" },
      ),
    )
    zIndex += 1
  }

  if (slots.action) {
    layers.push(
      ...pillButtonPart(
        { nodeId: context.nodeId, palette, zIndex },
        {
          height: ACTION_HEIGHT,
          width: inner.width,
          x: inner.x,
          y: inner.y + inner.height - ACTION_HEIGHT,
        },
        { label: slots.action },
      ),
    )
    zIndex += 2
  }

  return { layers, qr }
}

/**
 * Label: no panel. QR hero on the raw background, a hairline rule, then a
 * left-aligned caption/title/meta block. Museum-label restraint.
 */
function layoutLabel(context: ArchetypeContext): ArchetypeLayout {
  const { palette, slots } = context

  if (slots.action) {
    throw new Error("label archetype does not support the action slot; use the ticket archetype")
  }

  const frame = createFrame({
    height: context.canvas.height,
    padding: SPACE.xl,
    width: context.canvas.width,
  })
  const inner = frame.content
  const layers: DraftingCanvasLayer[] = []
  let zIndex = 10

  const captionHeight = slots.caption ? TEXT_HEIGHT.caption + SPACE.sm : 0
  const titleHeight = slots.title ? TEXT_HEIGHT.title + SPACE.xs : 0
  const metaHeight = slots.meta ? TEXT_HEIGHT.body + SPACE.xs : 0
  const textBlockHeight = captionHeight + titleHeight + metaHeight
  const qrSide = Math.min(inner.width, inner.height - textBlockHeight - SPACE.lg * 2)

  const qr: Rect = {
    height: qrSide,
    width: qrSide,
    x: inner.x + (inner.width - qrSide) / 2,
    y: inner.y,
  }

  let cursor = qr.y + qr.height + SPACE.lg

  layers.push(
    ...hairlinePart(
      { nodeId: context.nodeId, palette, zIndex },
      { height: 2, width: inner.width, x: inner.x, y: cursor },
    ),
  )
  zIndex += 1
  cursor += SPACE.lg

  if (slots.caption) {
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        { height: TEXT_HEIGHT.caption, width: inner.width, x: inner.x, y: cursor },
        { step: "caption", text: slots.caption, tone: "muted", uppercase: true },
      ),
    )
    zIndex += 1
    cursor += TEXT_HEIGHT.caption + SPACE.sm
  }

  if (slots.title) {
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        { height: TEXT_HEIGHT.title, width: inner.width, x: inner.x, y: cursor },
        { step: "title", text: slots.title },
      ),
    )
    zIndex += 1
    cursor += TEXT_HEIGHT.title + SPACE.xs
  }

  if (slots.meta) {
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        { height: TEXT_HEIGHT.body, width: inner.width, x: inner.x, y: cursor },
        { step: "body", text: slots.meta, tone: "muted" },
      ),
    )
    zIndex += 1
  }

  return { layers, qr }
}

/**
 * Seal: the card is an object. One scallop-seal silhouette in accent, QR knocked
 * out inside it, one caption below the QR. Radially symmetric.
 */
function layoutSeal(context: ArchetypeContext): ArchetypeLayout {
  const { palette, slots } = context

  if (slots.action || slots.title || slots.meta) {
    throw new Error("seal archetype supports only the caption slot")
  }

  const frame = createFrame({
    height: context.canvas.height,
    padding: SPACE.lg,
    width: context.canvas.width,
  })
  const seal = frame.content
  const layers: DraftingCanvasLayer[] = []
  let zIndex = 10

  layers.push(
    ...shapeFieldPart({ nodeId: context.nodeId, palette, zIndex }, seal, {
      fill: palette.accent,
      shapeId: "scallop-seal",
    }),
  )
  zIndex += 1

  const qrSide = Math.round(seal.width * 0.44)
  const captionHeight = slots.caption ? TEXT_HEIGHT.caption : 0
  const stackHeight = qrSide + (slots.caption ? SPACE.md + captionHeight : 0)
  const stackTop = seal.y + (seal.height - stackHeight) / 2

  const qr: Rect = {
    height: qrSide,
    width: qrSide,
    x: seal.x + (seal.width - qrSide) / 2,
    y: stackTop,
  }

  if (slots.caption) {
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        {
          height: captionHeight,
          width: seal.width,
          x: seal.x,
          y: qr.y + qr.height + SPACE.md,
        },
        { align: "center", step: "caption", text: slots.caption, tone: "onAccent", uppercase: true },
      ),
    )
    zIndex += 1
  }

  return { layers, qr, qrInk: palette.onAccent }
}

function buildArchetype(context: ArchetypeContext, archetype: TemplateArchetype): ArchetypeLayout {
  switch (archetype) {
    case "label":
      return layoutLabel(context)
    case "seal":
      return layoutSeal(context)
    case "ticket":
      return layoutTicket(context)
    default: {
      const _exhaustive: never = archetype
      return _exhaustive
    }
  }
}

function authoringCardState(
  base: DraftingCardState,
  options: { fill: string; ratio: TemplateRatio },
): DraftingCardState {
  const size = getCanvasSizeFromTemplate(
    getSizeTemplate(options.ratio) ?? { height: 1080, width: 1080 },
  )

  return {
    ...base,
    bottomSpace: 0,
    cornerRadius: 0,
    enabled: true,
    fill: options.fill,
    height: size.height,
    lockAspectRatio: true,
    padding: 0,
    sizeMode: "fixed",
    sizePresetId: options.ratio,
    width: size.width,
    shadow: { ...base.shadow, opacity: 0, visible: false },
  }
}

function authoringQrState(base: QrStudioState, ink: string, side: number): QrStudioState {
  return {
    ...base,
    backgroundOptions: { color: "#ffffff", round: 0, transparent: true },
    dataModulesSettings: { type: "rounded", color: ink, roundSize: true },
    finderPatternInnerSettings: { type: "circle", color: ink },
    finderPatternOuterSettings: { type: "rounded-lg", color: ink },
    height: side,
    width: side,
  }
}

export function defineTemplate(
  definition: TemplateDefinition,
): () => DraftingWorkspaceDocumentV1 {
  return () => {
    const palette = getPalette(definition.palette)
    const canvas = getCanvasSizeFromTemplate(
      getSizeTemplate(definition.ratio) ?? { height: 1080, width: 1080 },
    )

    return buildTemplateDocumentSeed({
      data: definition.data,
      inputType: definition.inputType ?? "link",
      contentValues: { url: definition.data },
      card: (base) => authoringCardState(base, { fill: palette.bg, ratio: definition.ratio }),
      qr: (base) => {
        const probe = buildArchetype(
          { canvas, nodeId: "probe", palette, slots: definition.slots },
          definition.archetype,
        )

        return authoringQrState(base, probe.qrInk ?? palette.ink, Math.round(probe.qr.width))
      },
      layers: ({ defaultLayers, nodeId }) => {
        const layout = buildArchetype(
          { canvas, nodeId, palette, slots: definition.slots },
          definition.archetype,
        )
        const cardLayer = defaultLayers[0]!
        const qrLayer = defaultLayers[1]!

        return [
          cardLayer,
          ...layout.layers,
          {
            ...qrLayer,
            height: layout.qr.height,
            width: layout.qr.width,
            x: layout.qr.x,
            y: layout.qr.y,
            zIndex: 30,
          },
        ].sort((left, right) => left.zIndex - right.zIndex)
      },
    })
  }
}

export type { PartContext }
