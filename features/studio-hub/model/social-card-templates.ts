import { type QrStudioState } from "@/features/qr-code/model/state"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCardShadowState } from "@/features/workspace/model/card-state"
import {
  createDefaultDraftingLayers,
  createDraftingImageLayer,
  createDraftingShapeLayer,
  createDraftingTextLayer,
  getDraftingQrLayerId,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import { getCanvasSizeFromTemplate, getSizeTemplate } from "@/features/workspace/model/size-templates"
import type { SceneCompositionState } from "@/features/workspace/model/scene-templates"
import { buildTemplateDocumentSeed } from "@/features/studio-hub/model/bootstrap-document"
import {
  AMSTERDAM_HERO_ART,
  STUDIO_FOLDER_ART,
} from "@/features/studio-hub/model/social-card-art"
import type { DraftingCornerRadiiState } from "@/features/workspace/model/corner-radius"
import { createUniformCornerRadii } from "@/features/workspace/model/corner-radius"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"

const MINT_SCENE = {
  angle: 150,
  kind: "gradient" as const,
  stops: [
    { color: "#d4f2e4", offset: 0 },
    { color: "#b8e8d4", offset: 1 },
  ],
}

type CardPoint = { x: number; y: number }

function cardPoint(cardWidth: number, cardHeight: number, x: number, y: number): CardPoint {
  return {
    x: -cardWidth / 2 + x,
    y: -cardHeight / 2 + y,
  }
}

function centeredRect(
  canvasWidth: number,
  canvasHeight: number,
  width: number,
  height: number,
): CardPoint & { height: number; width: number } {
  return {
    height,
    width,
    ...cardPoint(canvasWidth, canvasHeight, (canvasWidth - width) / 2, (canvasHeight - height) / 2),
  }
}

function fixedCardState(
  base: DraftingCardState,
  options: {
    bottomSpace?: number
    cornerRadius: number
    fill: string
    padding?: number
    sizePresetId: string
    border?: DraftingCardState["border"]
    shadow?: Partial<DraftingCardState["shadow"]>
  },
): DraftingCardState {
  const sizeTemplate = getSizeTemplate(options.sizePresetId)
  const canvasSize = getCanvasSizeFromTemplate(
    sizeTemplate ?? { width: 1080, height: 1080 },
  )

  return {
    ...base,
    bottomSpace: options.bottomSpace ?? 0,
    cornerRadius: options.cornerRadius,
    enabled: true,
    fill: options.fill,
    height: canvasSize.height,
    lockAspectRatio: true,
    padding: options.padding ?? 0,
    sizeMode: "fixed",
    sizePresetId: options.sizePresetId,
    width: canvasSize.width,
    shadow: {
      ...base.shadow,
      visible: false,
      opacity: 0,
      ...(options.shadow ?? {}),
    },
    ...(options.border ? { border: options.border } : {}),
  }
}

function buildLayerStack(
  nodeId: string,
  qrState: QrStudioState,
  cardState: DraftingCardState,
  layers: DraftingCanvasLayer[],
  qr?: { height: number; width: number; x: number; y: number },
): DraftingCanvasLayer[] {
  const defaults = createDefaultDraftingLayers(nodeId, qrState, cardState)
  const cardLayer = defaults[0]!
  const stack = [cardLayer, ...layers]

  if (qr) {
    stack.push({
      ...defaults[1]!,
      height: qr.height,
      id: getDraftingQrLayerId(nodeId),
      width: qr.width,
      x: qr.x,
      y: qr.y,
      zIndex: 30,
    })
  }

  return stack.sort((left, right) => left.zIndex - right.zIndex)
}

function shapeLayer(
  nodeId: string,
  id: string,
  options: {
    cornerRadius?: number
    cornerRadii?: DraftingCornerRadiiState
    fill: string
    height: number
    opacity?: number
    shapeId?: "ellipse" | "heart" | "rect" | "rounded-square"
    shadow?: Partial<DraftingCardShadowState>
    width: number
    x: number
    y: number
    zIndex: number
  },
): DraftingCanvasLayer {
  const shadow: DraftingCardShadowState = {
    blur: options.shadow?.blur ?? 0,
    color: options.shadow?.color ?? "#111827",
    inset: false,
    kind: "drop",
    offsetX: options.shadow?.offsetX ?? 0,
    offsetY: options.shadow?.offsetY ?? 0,
    opacity: options.shadow?.opacity ?? 0,
    spread: options.shadow?.spread ?? 0,
    visible: options.shadow?.visible ?? false,
  }
  const cornerRadius = options.cornerRadius ?? 0

  return createDraftingShapeLayer(nodeId, options.shapeId ?? "rect", {
    cornerRadius,
    cornerRadii: options.cornerRadii ?? createUniformCornerRadii(cornerRadius),
    fill: options.fill,
    fillMode: "solid",
    height: options.height,
    id: `${nodeId}:${id}`,
    isLocked: true,
    opacity: options.opacity ?? 1,
    shadow,
    shadows: [],
    width: options.width,
    x: options.x,
    y: options.y,
    zIndex: options.zIndex,
  })
}

function imageLayer(
  nodeId: string,
  id: string,
  options: {
    cornerRadius?: number
    height: number
    src: string
    width: number
    x: number
    y: number
    zIndex: number
  },
): DraftingCanvasLayer {
  return createDraftingImageLayer(nodeId, {
    cornerRadius: options.cornerRadius ?? 0,
    height: options.height,
    id: `${nodeId}:${id}`,
    imageFit: "cover",
    imageSource: "url",
    imageValue: options.src,
    isLocked: true,
    width: options.width,
    x: options.x,
    y: options.y,
    zIndex: options.zIndex,
  })
}

function textLayer(
  nodeId: string,
  id: string,
  options: {
    fill: string
    fontFamily?: string
    fontSize: number
    fontWeight?: "bold" | "normal" | number
    height: number
    letterSpacing?: number
    opacity?: number
    text: string
    textAlign?: "center" | "left" | "right"
    width: number
    x: number
    y: number
    zIndex: number
  },
): DraftingCanvasLayer {
  return createDraftingTextLayer(nodeId, {
    fill: options.fill,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    fontWeight: options.fontWeight,
    height: options.height,
    id: `${nodeId}:${id}`,
    isLocked: true,
    letterSpacing: options.letterSpacing,
    opacity: options.opacity ?? 1,
    text: options.text,
    textAlign: options.textAlign ?? "left",
    width: options.width,
    x: options.x,
    y: options.y,
    zIndex: options.zIndex,
  })
}

function baseSocialQr(base: QrStudioState, color: string, size = 280): QrStudioState {
  return {
    ...base,
    backgroundOptions: { color: "#ffffff", round: 10, transparent: false },
    dataModulesSettings: { type: "rounded", color, roundSize: true },
    finderPatternInnerSettings: { type: "circle", color },
    finderPatternOuterSettings: { type: "rounded-lg", color },
    height: size,
    width: size,
  }
}

/** Paris travel card — mint scene, stacked white cards, QR hero, footer CTA */
function buildMintCtaDocument(): DraftingWorkspaceDocumentV1 {
  const sizePresetId = "ratio-4-5"
  const { width, height } = getCanvasSizeFromTemplate(getSizeTemplate(sizePresetId)!)
  const cardWidth = 660
  const cardHeight = 760
  const stackOffset = 20
  const cardLeft = (width - cardWidth) / 2
  const cardTop = Math.round(height * 0.12)
  const footerY = cardTop + cardHeight + 56
  const footerPad = 80
  const qrSize = 520

  return buildTemplateDocumentSeed({
    inputType: "link",
    data: "https://example.com/trip",
    contentValues: { url: "https://example.com/trip" },
    card: (base) =>
      fixedCardState(base, {
        cornerRadius: 0,
        fill: MINT_SCENE.stops[0].color,
        sizePresetId,
      }),
    qr: (base) => baseSocialQr(base, "#1a2e1f", qrSize),
    sceneComposition: { background: MINT_SCENE },
    layers: ({ nodeId, qrState, cardState }) =>
      buildLayerStack(
        nodeId,
        qrState,
        cardState,
        [
          textLayer(nodeId, "watermark", {
            fill: "#9fd4bc",
            fontFamily: "Bricolage Grotesque",
            fontSize: 220,
            fontWeight: 700,
            height: 240,
            letterSpacing: 2,
            opacity: 0.45,
            text: "Paris",
            textAlign: "center",
            width,
            ...cardPoint(width, height, 0, height * 0.58),
            zIndex: 1,
          }),
          shapeLayer(nodeId, "stack-back", {
            cornerRadius: 36,
            fill: "#ffffff",
            height: cardHeight,
            width: cardWidth,
            ...cardPoint(width, height, cardLeft, cardTop - stackOffset),
            zIndex: 2,
          }),
          shapeLayer(nodeId, "stack-front", {
            cornerRadius: 36,
            fill: "#ffffff",
            height: cardHeight,
            shadow: {
              blur: 40,
              color: "#0f172a",
              offsetY: 18,
              opacity: 10,
              visible: true,
            },
            width: cardWidth,
            ...cardPoint(width, height, cardLeft, cardTop),
            zIndex: 3,
          }),
          textLayer(nodeId, "cta-label", {
            fill: "#ffffff",
            fontFamily: "Manrope",
            fontSize: 28,
            fontWeight: 500,
            height: 40,
            text: "Book a trip to paris",
            width: cardWidth - 180,
            ...cardPoint(width, height, footerPad, footerY),
            zIndex: 4,
          }),
          shapeLayer(nodeId, "cta-dot", {
            cornerRadius: 999,
            fill: "#1a1a1a",
            height: 52,
            width: 52,
            ...cardPoint(width, height, width / 2 - 26, footerY - 6),
            zIndex: 5,
          }),
          textLayer(nodeId, "cta-arrow", {
            fill: "#ffffff",
            fontFamily: "Manrope",
            fontSize: 32,
            fontWeight: 400,
            height: 40,
            text: "→",
            textAlign: "right",
            width: 48,
            ...cardPoint(width, height, width - footerPad - 48, footerY),
            zIndex: 6,
          }),
        ],
        {
          height: qrSize,
          width: qrSize,
          ...cardPoint(
            width,
            height,
            cardLeft + (cardWidth - qrSize) / 2,
            cardTop + (cardHeight - qrSize) / 2,
          ),
        },
      ),
  })
}

function buildStudioIndexDocument(): DraftingWorkspaceDocumentV1 {
  const sizePresetId = "ratio-1-1"
  const { width, height } = getCanvasSizeFromTemplate(getSizeTemplate(sizePresetId)!)
  const shell = centeredRect(width, height, 920, 920)
  const qrSize = 168

  return buildTemplateDocumentSeed({
    inputType: "link",
    data: "https://example.com/projects",
    contentValues: { url: "https://example.com/projects" },
    card: (base) =>
      fixedCardState(base, {
        cornerRadius: 0,
        fill: "#f0f0f2",
        sizePresetId,
      }),
    qr: (base) => ({
      ...baseSocialQr(base, "#111111", qrSize),
      backgroundOptions: { color: "#ffffff", round: 6, transparent: false },
    }),
    sceneComposition: {
      background: {
        angle: 135,
        kind: "gradient",
        stops: [
          { color: "#f4f4f5", offset: 0 },
          { color: "#e4e4e7", offset: 1 },
        ],
      },
    },
    layers: ({ nodeId, qrState, cardState }) => {
      const shellLeft = (width - shell.width) / 2
      const shellTop = (height - shell.height) / 2

      return buildLayerStack(
        nodeId,
        qrState,
        cardState,
        [
          shapeLayer(nodeId, "shell-border", {
            cornerRadius: 40,
            fill: "#000000",
            height: shell.height,
            width: shell.width,
            x: shell.x,
            y: shell.y,
            zIndex: 2,
          }),
          shapeLayer(nodeId, "shell-face", {
            cornerRadius: 34,
            fill: "#111111",
            height: shell.height - 12,
            width: shell.width - 12,
            ...cardPoint(width, height, shellLeft + 6, shellTop + 6),
            zIndex: 3,
          }),
          imageLayer(nodeId, "header-art", {
            cornerRadius: 28,
            height: 400,
            src: STUDIO_FOLDER_ART,
            width: shell.width - 48,
            ...cardPoint(width, height, shellLeft + 24, shellTop + 24),
            zIndex: 4,
          }),
          shapeLayer(nodeId, "folder-body", {
            cornerRadius: 28,
            fill: "#161616",
            height: 468,
            width: shell.width - 48,
            ...cardPoint(width, height, shellLeft + 24, shellTop + 428),
            zIndex: 5,
          }),
          shapeLayer(nodeId, "folder-tab", {
            cornerRadius: 20,
            fill: "#161616",
            height: 64,
            width: shell.width * 0.48,
            ...cardPoint(width, height, shellLeft + 24, shellTop + 372),
            zIndex: 6,
          }),
          textLayer(nodeId, "folder-title", {
            fill: "#ffffff",
            fontFamily: "Manrope",
            fontSize: 30,
            fontWeight: 700,
            height: 40,
            letterSpacing: 1.4,
            text: "CLIENT-PROJECTS",
            width: shell.width - 96,
            ...cardPoint(width, height, shellLeft + 40, shellTop + 388),
            zIndex: 10,
          }),
          textLayer(nodeId, "folder-subtitle", {
            fill: "#a1a1aa",
            fontFamily: "Manrope",
            fontSize: 17,
            fontWeight: 600,
            height: 28,
            letterSpacing: 2.2,
            text: "BRAND, WEB, PRODUCT",
            width: shell.width - 96,
            ...cardPoint(width, height, shellLeft + 40, shellTop + 430),
            zIndex: 11,
          }),
          textLayer(nodeId, "folder-index", {
            fill: "#ffffff",
            fontFamily: "Manrope",
            fontSize: 108,
            fontWeight: 700,
            height: 120,
            text: "001",
            width: 240,
            ...cardPoint(width, height, shellLeft + 32, shellTop + 720),
            zIndex: 12,
          }),
          textLayer(nodeId, "folder-count", {
            fill: "#a1a1aa",
            fontFamily: "Manrope",
            fontSize: 20,
            fontWeight: 600,
            height: 32,
            letterSpacing: 1.6,
            text: "3957 FILES",
            textAlign: "right",
            width: 220,
            ...cardPoint(width, height, shellLeft + shell.width - 252, shellTop + 812),
            zIndex: 13,
          }),
        ],
        {
          height: qrSize,
          width: qrSize,
          ...cardPoint(width, height, shellLeft + shell.width - qrSize - 56, shellTop + 56),
        },
      )
    },
  })
}

function buildEditorialLinkDocument(): DraftingWorkspaceDocumentV1 {
  const sizePresetId = "ratio-4-5"
  const { width, height } = getCanvasSizeFromTemplate(getSizeTemplate(sizePresetId)!)
  const shell = centeredRect(width, height, 880, height - 120)
  const innerPad = 28
  const heroHeight = 580
  const heroWidth = shell.width - innerPad * 2
  const shellLeft = (width - shell.width) / 2
  const shellTop = (height - shell.height) / 2
  const heroOrigin = cardPoint(width, height, shellLeft + innerPad, shellTop + innerPad)
  const qrSize = 140

  return buildTemplateDocumentSeed({
    inputType: "link",
    data: "https://example.com/amsterdam",
    contentValues: { url: "https://example.com/amsterdam" },
    card: (base) =>
      fixedCardState(base, {
        cornerRadius: 0,
        fill: "#fff8ef",
        sizePresetId,
      }),
    qr: (base) => baseSocialQr(base, "#111827", qrSize),
    sceneComposition: {
      background: {
        angle: 145,
        kind: "gradient",
        stops: [
          { color: "#fff8ef", offset: 0 },
          { color: "#fde6d2", offset: 1 },
        ],
      },
    },
    layers: ({ nodeId, qrState, cardState }) =>
      buildLayerStack(
        nodeId,
        qrState,
        cardState,
        [
          shapeLayer(nodeId, "shell", {
            cornerRadius: 8,
            fill: "#ffffff",
            height: shell.height,
            shadow: {
              blur: 32,
              color: "#9a3412",
              offsetY: 16,
              opacity: 12,
              visible: true,
            },
            width: shell.width,
            x: shell.x,
            y: shell.y,
            zIndex: 2,
          }),
          imageLayer(nodeId, "hero", {
            cornerRadius: 4,
            height: heroHeight,
            src: AMSTERDAM_HERO_ART,
            width: heroWidth,
            x: heroOrigin.x,
            y: heroOrigin.y,
            zIndex: 3,
          }),
          shapeLayer(nodeId, "heart", {
            cornerRadius: 0,
            fill: "none",
            height: 52,
            opacity: 0.9,
            shapeId: "heart",
            width: 52,
            ...cardPoint(width, height, shellLeft + shell.width - innerPad - 68, shellTop + innerPad + 20),
            zIndex: 4,
          }),
          textLayer(nodeId, "trip-title", {
            fill: "#111827",
            fontFamily: "Manrope",
            fontSize: 36,
            fontWeight: 800,
            height: 48,
            letterSpacing: 1.2,
            text: "TRIP TO AMSTERDAM",
            width: heroWidth,
            ...cardPoint(width, height, shellLeft + innerPad, shellTop + innerPad + heroHeight + 28),
            zIndex: 11,
          }),
          textLayer(nodeId, "trip-meta", {
            fill: "#6b7280",
            fontFamily: "Manrope",
            fontSize: 22,
            fontWeight: 600,
            height: 32,
            text: "5D 6N • ★ 4.61",
            width: heroWidth,
            ...cardPoint(width, height, shellLeft + innerPad, shellTop + innerPad + heroHeight + 84),
            zIndex: 12,
          }),
          shapeLayer(nodeId, "book-button", {
            cornerRadius: 4,
            fill: "#111827",
            height: 68,
            width: 200,
            ...cardPoint(width, height, shellLeft + innerPad, shellTop + shell.height - innerPad - 68),
            zIndex: 13,
          }),
          textLayer(nodeId, "book-label", {
            fill: "#ffffff",
            fontFamily: "Manrope",
            fontSize: 24,
            fontWeight: 700,
            height: 36,
            text: "Book now",
            textAlign: "center",
            width: 200,
            ...cardPoint(width, height, shellLeft + innerPad, shellTop + shell.height - innerPad - 54),
            zIndex: 14,
          }),
          textLayer(nodeId, "price", {
            fill: "#111827",
            fontFamily: "Manrope",
            fontSize: 48,
            fontWeight: 800,
            height: 56,
            text: "$500",
            textAlign: "right",
            width: 160,
            ...cardPoint(width, height, shellLeft + shell.width - innerPad - 160, shellTop + shell.height - innerPad - 62),
            zIndex: 15,
          }),
          textLayer(nodeId, "price-meta", {
            fill: "#9ca3af",
            fontFamily: "Manrope",
            fontSize: 18,
            fontWeight: 600,
            height: 28,
            text: "per adult",
            textAlign: "right",
            width: 160,
            ...cardPoint(width, height, shellLeft + shell.width - innerPad - 160, shellTop + shell.height - innerPad - 28),
            zIndex: 16,
          }),
        ],
        {
          height: qrSize,
          width: qrSize,
          ...cardPoint(
            width,
            height,
            shellLeft + shell.width - innerPad - qrSize - 20,
            shellTop + innerPad + 20,
          ),
        },
      ),
  })
}

export const SOCIAL_CARD_TEMPLATE_BUILDERS: Record<
  string,
  () => DraftingWorkspaceDocumentV1
> = {
  "social-mint-cta": buildMintCtaDocument,
  "social-studio-index": buildStudioIndexDocument,
  "social-editorial-link": buildEditorialLinkDocument,
}

export function buildSocialCardTemplateDocument(
  templateId: keyof typeof SOCIAL_CARD_TEMPLATE_BUILDERS,
): DraftingWorkspaceDocumentV1 {
  const builder = SOCIAL_CARD_TEMPLATE_BUILDERS[templateId]
  return builder()
}

export function socialCardThumbnail(accent: string, background: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="${background}" width="400" height="400"/><rect x="48" y="40" width="304" height="320" rx="40" fill="#fff" filter="drop-shadow(0 12px 24px rgba(13,148,136,0.15))"/><rect x="68" y="60" width="264" height="196" rx="20" fill="${accent}"/><rect x="68" y="272" width="264" height="52" rx="26" fill="#1a1a1a"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function getSocialCardSceneComposition(
  templateId: keyof typeof SOCIAL_CARD_TEMPLATE_BUILDERS,
): SceneCompositionState | undefined {
  const document = buildSocialCardTemplateDocument(templateId)
  const nodeId = document.activeQrNodeId
  return document.sceneCompositionByNodeId[nodeId]
}
