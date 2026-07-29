import type { Rect } from "@/features/workspace/authoring/frame"
import {
  RADIUS,
  TYPE,
  toneColor,
  type Palette,
  type PaletteTone,
  type RadiusToken,
  type TypeToken,
} from "@/features/workspace/authoring/tokens"
import {
  createDraftingShapeLayer,
  createDraftingTextLayer,
  patchDraftingCanvasLayer,
  type DraftingCanvasLayer,
  type DraftingElementShapeId,
} from "@/features/workspace/model/layers"

export type PartContext = {
  nodeId: string
  palette: Palette
  zIndex: number
}

const SHADOW_PRESETS = {
  none: { blur: 0, offsetY: 0, opacity: 0, visible: false },
  soft: { blur: 32, offsetY: 12, opacity: 8, visible: true },
  lift: { blur: 48, offsetY: 22, opacity: 14, visible: true },
} as const

export type ShadowPreset = keyof typeof SHADOW_PRESETS

let partCounter = 0

function nextPartId(nodeId: string, name: string) {
  partCounter += 1
  return `${nodeId}:${name}-${partCounter}`
}

export function centerTextRect(rect: Rect, step: TypeToken): Rect {
  const height = TYPE[step].fontSize * TYPE[step].lineHeight

  return {
    height,
    width: rect.width,
    x: rect.x,
    y: rect.y + (rect.height - height) / 2,
  }
}

export function surfacePart(
  context: PartContext,
  rect: Rect,
  options: { fill?: string; radius?: RadiusToken; shadow?: ShadowPreset } = {},
): DraftingCanvasLayer[] {
  const radius = RADIUS[options.radius ?? "none"]
  const preset = SHADOW_PRESETS[options.shadow ?? "none"]

  const base = createDraftingShapeLayer(context.nodeId, "rect", {
    fill: options.fill ?? context.palette.surface,
    fillMode: "solid",
    height: rect.height,
    id: nextPartId(context.nodeId, "surface"),
    isLocked: true,
    name: "Surface",
    strokeWidth: 0,
    width: rect.width,
    x: rect.x,
    y: rect.y,
    zIndex: context.zIndex,
  })

  return [
    patchDraftingCanvasLayer(base, {
      cornerRadius: radius,
      shadow: {
        blur: preset.blur,
        color: context.palette.ink,
        inset: false,
        kind: "drop",
        offsetX: 0,
        offsetY: preset.offsetY,
        opacity: preset.opacity,
        spread: 0,
        visible: preset.visible,
      },
    }),
  ]
}

export function shapeFieldPart(
  context: PartContext,
  rect: Rect,
  options: { fill?: string; shapeId: DraftingElementShapeId },
): DraftingCanvasLayer[] {
  return [
    createDraftingShapeLayer(context.nodeId, options.shapeId, {
      fill: options.fill ?? context.palette.accent,
      fillMode: "solid",
      height: rect.height,
      id: nextPartId(context.nodeId, "shape-field"),
      isLocked: true,
      name: "Shape field",
      strokeWidth: 0,
      width: rect.width,
      x: rect.x,
      y: rect.y,
      zIndex: context.zIndex,
    }),
  ]
}

export function textPart(
  context: PartContext,
  rect: Rect,
  options: {
    align?: "center" | "left" | "right"
    step: TypeToken
    text: string
    tone?: PaletteTone
    uppercase?: boolean
  },
): DraftingCanvasLayer[] {
  const step = TYPE[options.step]

  return [
    createDraftingTextLayer(context.nodeId, {
      fill: toneColor(context.palette, options.tone ?? "ink"),
      fontSize: step.fontSize,
      fontWeight: step.fontWeight,
      height: rect.height,
      id: nextPartId(context.nodeId, "text"),
      isLocked: true,
      letterSpacing: step.letterSpacing,
      lineHeight: step.lineHeight,
      name: options.text.slice(0, 24) || "Text",
      text: options.uppercase ? options.text.toUpperCase() : options.text,
      textAlign: options.align ?? "left",
      width: rect.width,
      x: rect.x,
      y: rect.y,
      zIndex: context.zIndex,
    }),
  ]
}

export function pillButtonPart(
  context: PartContext,
  rect: Rect,
  options: { label: string },
): DraftingCanvasLayer[] {
  const labelRect = centerTextRect(rect, "body")

  return [
    ...surfacePart(context, rect, { fill: context.palette.accent, radius: "full" }),
    ...textPart({ ...context, zIndex: context.zIndex + 1 }, labelRect, {
      align: "center",
      step: "body",
      text: options.label,
      tone: "onAccent",
    }),
  ]
}

export function circleIconPart(
  context: PartContext,
  rect: Rect,
  options: { glyph: string },
): DraftingCanvasLayer[] {
  const glyphRect = centerTextRect(rect, "body")

  return [
    createDraftingShapeLayer(context.nodeId, "ellipse", {
      fill: context.palette.accent,
      fillMode: "solid",
      height: rect.height,
      id: nextPartId(context.nodeId, "circle-icon"),
      isLocked: true,
      name: "Icon circle",
      strokeWidth: 0,
      width: rect.width,
      x: rect.x,
      y: rect.y,
      zIndex: context.zIndex,
    }),
    ...textPart({ ...context, zIndex: context.zIndex + 1 }, glyphRect, {
      align: "center",
      step: "body",
      text: options.glyph,
      tone: "onAccent",
    }),
  ]
}

export function hairlinePart(
  context: PartContext,
  rect: Rect,
  options: { tone?: PaletteTone } = {},
): DraftingCanvasLayer[] {
  const base = createDraftingShapeLayer(context.nodeId, "rect", {
    fill: toneColor(context.palette, options.tone ?? "muted"),
    fillMode: "solid",
    height: 2,
    id: nextPartId(context.nodeId, "hairline"),
    isLocked: true,
    name: "Hairline",
    strokeWidth: 0,
    width: rect.width,
    x: rect.x,
    y: rect.y,
    zIndex: context.zIndex,
  })

  return [patchDraftingCanvasLayer(base, { cornerRadius: RADIUS.none })]
}
