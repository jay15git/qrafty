import type { StudioGradient } from "@/features/qr-code/model/state"

export const DASHBOARD_COMPOSE_CANVAS_SIZE = 960
export const DASHBOARD_COMPOSE_CANVAS_HEIGHT = 640
export const DASHBOARD_DOCUMENT_DEFAULT_MARGIN = 72
export const DASHBOARD_QR_STAGE_FIT_RATIO = 0.74
export const DASHBOARD_IMAGE_STAGE_FIT_RATIO = 0.48
export const DASHBOARD_QR_NODE_ID = "dashboard-qr-node"
const DASHBOARD_QR_NODE_ID_PREFIX = `${DASHBOARD_QR_NODE_ID}-`

export type DashboardComposeBackgroundMode = "transparent" | "solid" | "gradient"

export type DashboardComposeBackground = {
  mode: DashboardComposeBackgroundMode
  color: string
  gradient: StudioGradient
}

export type DashboardDocumentPresetId = "letter" | "a4" | "square" | "social-post"

type DashboardDocumentPreset = {
  id: DashboardDocumentPresetId
  title: string
  width: number
  height: number
}

export type DashboardComposeDocument = {
  backgroundColor: string
  margin: number
  presetId: DashboardDocumentPresetId
  showGuides: boolean
}

export type DashboardComposeCamera = {
  zoom: number
  panX: number
  panY: number
}

export type DashboardComposeNodeBase = {
  id: string
  name: string
  naturalWidth: number
  naturalHeight: number
  x: number
  y: number
  scale: number
  rotation: number
  zIndex: number
  opacity: number
  blendMode: string
  isVisible: boolean
}

export type DashboardComposeSvgNode = DashboardComposeNodeBase & {
  kind: "svg"
  originalSvgMarkup: string
}

export type DashboardComposeImageNode = DashboardComposeNodeBase & {
  kind: "image"
  imageUrl: string
}

export type DashboardComposeNode = DashboardComposeSvgNode | DashboardComposeImageNode

export type DashboardComposeScene = {
  background: DashboardComposeBackground
  canvasSize: {
    width: number
    height: number
  }
  camera: DashboardComposeCamera
  document: DashboardComposeDocument
  nodes: DashboardComposeNode[]
}

export type DashboardQrNodePayload = {
  markup: string
  name?: string
  naturalWidth: number
  naturalHeight: number
}

export type DashboardComposeImageNodePayload = {
  id?: string
  imageUrl: string
  name?: string
  naturalWidth: number
  naturalHeight: number
}

const DEFAULT_CAMERA: DashboardComposeCamera = {
  zoom: 1,
  panX: 0,
  panY: 0,
}

const DEFAULT_BACKGROUND: DashboardComposeBackground = {
  mode: "transparent",
  color: "#ffffff",
  gradient: createDefaultDashboardComposeBackgroundGradient(),
}

const DASHBOARD_DOCUMENT_PRESETS: DashboardDocumentPreset[] = [
  {
    id: "letter",
    title: "Letter portrait",
    width: 816,
    height: 1056,
  },
  {
    id: "a4",
    title: "A4 portrait",
    width: 794,
    height: 1123,
  },
  {
    id: "square",
    title: "Square",
    width: 1080,
    height: 1080,
  },
  {
    id: "social-post",
    title: "Social post",
    width: 1080,
    height: 1350,
  },
] as const

const DEFAULT_DASHBOARD_DOCUMENT_PRESET_ID: DashboardDocumentPresetId = "letter"

const DEFAULT_DOCUMENT: DashboardComposeDocument = {
  backgroundColor: "#ffffff",
  margin: DASHBOARD_DOCUMENT_DEFAULT_MARGIN,
  presetId: DEFAULT_DASHBOARD_DOCUMENT_PRESET_ID,
  showGuides: true,
}

export function createDashboardComposeScene(): DashboardComposeScene {
  return {
    background: normalizeDashboardComposeBackground(DEFAULT_BACKGROUND),
    canvasSize: {
      width: DASHBOARD_COMPOSE_CANVAS_SIZE,
      height: DASHBOARD_COMPOSE_CANVAS_HEIGHT,
    },
    camera: { ...DEFAULT_CAMERA },
    document: normalizeDashboardComposeDocument(DEFAULT_DOCUMENT),
    nodes: [],
  }
}

export function createDashboardDocumentComposeScene(): DashboardComposeScene {
  const preset = getDashboardDocumentPreset(DEFAULT_DASHBOARD_DOCUMENT_PRESET_ID)

  return {
    ...createDashboardComposeScene(),
    canvasSize: {
      width: preset.width,
      height: preset.height,
    },
    document: normalizeDashboardComposeDocument({
      ...DEFAULT_DOCUMENT,
      presetId: preset.id,
    }),
  }
}

function getDashboardDocumentPreset(presetId: DashboardDocumentPresetId) {
  return (
    DASHBOARD_DOCUMENT_PRESETS.find((preset) => preset.id === presetId) ??
    DASHBOARD_DOCUMENT_PRESETS[0]
  )
}

export function updateDashboardComposeBackground(
  scene: DashboardComposeScene,
  patch: Partial<DashboardComposeBackground>,
) {
  return {
    ...scene,
    background: normalizeDashboardComposeBackground({
      ...scene.background,
      ...patch,
    }),
  }
}

export function applyDashboardDocumentPreset(
  scene: DashboardComposeScene,
  presetId: DashboardDocumentPresetId,
) {
  const preset = getDashboardDocumentPreset(presetId)
  const previousWidth = scene.canvasSize.width
  const previousHeight = scene.canvasSize.height
  const nextCanvasSize = {
    width: preset.width,
    height: preset.height,
  }
  const widthRatio = previousWidth > 0 ? preset.width / previousWidth : 1
  const heightRatio = previousHeight > 0 ? preset.height / previousHeight : 1

  return {
    ...scene,
    canvasSize: nextCanvasSize,
    document: normalizeDashboardComposeDocument({
      ...scene.document,
      presetId,
    }),
    nodes: scene.nodes.map((node) =>
      normalizeDashboardComposeNode({
        ...node,
        x: node.x * widthRatio,
        y: node.y * heightRatio,
      }),
    ),
  }
}

export function centerDashboardComposeNode(
  scene: DashboardComposeScene,
  nodeId = DASHBOARD_QR_NODE_ID,
) {
  const node = getDashboardComposeNode(scene, nodeId)

  if (!node) {
    return scene
  }

  const width = node.naturalWidth * node.scale
  const height = node.naturalHeight * node.scale

  return updateDashboardComposeNode(scene, node.id, {
    x: (scene.canvasSize.width - width) * 0.5,
    y: (scene.canvasSize.height - height) * 0.5,
  })
}

export function fitDashboardQrNodeToDocument(
  scene: DashboardComposeScene,
  nodeId = DASHBOARD_QR_NODE_ID,
) {
  const node = getDashboardComposeNode(scene, nodeId)

  if (!node || node.kind !== "svg") {
    return scene
  }

  const availableWidth = Math.max(1, scene.canvasSize.width - scene.document.margin * 2)
  const availableHeight = Math.max(1, scene.canvasSize.height - scene.document.margin * 2)
  const fitSize = Math.min(availableWidth, availableHeight)
  const nextSize = Math.max(1, Math.round(fitSize / node.scale))
  const renderedSize = nextSize * node.scale

  return updateDashboardComposeNode(scene, node.id, {
    naturalHeight: nextSize,
    naturalWidth: nextSize,
    x: (scene.canvasSize.width - renderedSize) * 0.5,
    y: (scene.canvasSize.height - renderedSize) * 0.5,
  })
}

export function updateDashboardComposeNode(
  scene: DashboardComposeScene,
  nodeId: string,
  patch: Partial<DashboardComposeNode>,
) {
  return {
    ...scene,
    nodes: scene.nodes.map((node) => {
      if (node.id !== nodeId) {
        return node
      }

      if (node.kind === "image") {
        return normalizeDashboardComposeNode({
          ...node,
          ...patch,
          kind: "image",
          imageUrl:
            "imageUrl" in patch && patch.imageUrl ? patch.imageUrl : node.imageUrl,
        })
      }

      return normalizeDashboardComposeNode({
        ...node,
        ...patch,
        kind: "svg",
        originalSvgMarkup:
          "originalSvgMarkup" in patch && patch.originalSvgMarkup
            ? patch.originalSvgMarkup
            : node.originalSvgMarkup,
      })
    }),
  }
}

export function addDashboardComposeImageNode(
  scene: DashboardComposeScene,
  payload: DashboardComposeImageNodePayload,
) {
  const fitScale = Math.min(
    1,
    (scene.canvasSize.width * DASHBOARD_IMAGE_STAGE_FIT_RATIO) / payload.naturalWidth,
    (scene.canvasSize.height * DASHBOARD_IMAGE_STAGE_FIT_RATIO) / payload.naturalHeight,
  )
  const scale = Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 1
  const width = payload.naturalWidth * scale
  const height = payload.naturalHeight * scale

  const imageNode = normalizeDashboardComposeNode({
    id: payload.id ?? `dashboard-image-node-${crypto.randomUUID()}`,
    kind: "image",
    imageUrl: payload.imageUrl,
    name: payload.name?.trim() || "Image",
    naturalWidth: payload.naturalWidth,
    naturalHeight: payload.naturalHeight,
    x: (scene.canvasSize.width - width) * 0.5,
    y: (scene.canvasSize.height - height) * 0.5,
    scale,
    rotation: 0,
    zIndex: getNextDashboardComposeZIndex(scene),
    opacity: 1,
    blendMode: "normal",
    isVisible: true,
  })

  return {
    ...scene,
    nodes: [...scene.nodes, imageNode],
  }
}

export function removeDashboardComposeNode(
  scene: DashboardComposeScene,
  nodeId: string,
) {
  if (isDashboardQrNodeId(nodeId) && getDashboardQrNodes(scene).length <= 1) {
    return scene
  }

  const nextNodes = scene.nodes.filter((node) => node.id !== nodeId)

  if (nextNodes.length === scene.nodes.length) {
    return scene
  }

  return {
    ...scene,
    nodes: nextNodes,
  }
}

export function reorderDashboardComposeNodes(
  scene: DashboardComposeScene,
  orderedNodeIds: string[],
) {
  if (scene.nodes.length <= 1) {
    return scene
  }

  const currentOrder = getDashboardComposeNodeIdsByStackOrder(scene.nodes)
  const currentOrderSet = new Set(currentOrder)
  const nextOrder = [
    ...new Set([
      ...orderedNodeIds.filter((nodeId) => currentOrderSet.has(nodeId)),
      ...currentOrder,
    ]),
  ]

  if (
    nextOrder.length === currentOrder.length &&
    nextOrder.every((nodeId, index) => nodeId === currentOrder[index])
  ) {
    return scene
  }

  const zIndexByNodeId = new Map(
    nextOrder.map((nodeId, index) => [nodeId, nextOrder.length - index]),
  )

  return {
    ...scene,
    nodes: scene.nodes.map((node) =>
      zIndexByNodeId.has(node.id)
        ? normalizeDashboardComposeNode({
            ...node,
            // Higher zIndex values paint above lower ones on the compose surface.
            zIndex: zIndexByNodeId.get(node.id) ?? node.zIndex,
          })
        : node,
    ),
  }
}

function getDashboardComposeNode(
  scene: DashboardComposeScene,
  nodeId = DASHBOARD_QR_NODE_ID,
) {
  return scene.nodes.find((node) => node.id === nodeId)
}

export function isDashboardQrNodeId(nodeId: string | null | undefined) {
  return (
    nodeId === DASHBOARD_QR_NODE_ID ||
    Boolean(nodeId?.startsWith(DASHBOARD_QR_NODE_ID_PREFIX))
  )
}

export function getDashboardQrNodes(scene: DashboardComposeScene) {
  return scene.nodes.filter(
    (node): node is DashboardComposeSvgNode =>
      node.kind === "svg" && isDashboardQrNodeId(node.id),
  )
}

export function upsertDashboardQrNode(
  scene: DashboardComposeScene,
  payload: DashboardQrNodePayload,
  nodeId = DASHBOARD_QR_NODE_ID,
) {
  const existingNode = getDashboardComposeNode(scene, nodeId)
  const otherNodes = scene.nodes.filter((node) => node.id !== nodeId)

  if (!existingNode || existingNode.kind !== "svg" || !hasFiniteTransform(existingNode)) {
    return {
      ...scene,
      nodes: [...otherNodes, createDashboardQrNode(scene, payload, nodeId)],
    }
  }

  const nextWidth = payload.naturalWidth * existingNode.scale
  const nextHeight = payload.naturalHeight * existingNode.scale
  const previousCenterX =
    existingNode.x + existingNode.naturalWidth * existingNode.scale * 0.5
  const previousCenterY =
    existingNode.y + existingNode.naturalHeight * existingNode.scale * 0.5

  return {
    ...scene,
    nodes: [
      ...otherNodes,
      normalizeDashboardComposeNode({
        ...existingNode,
        name: payload.name ?? existingNode.name,
        originalSvgMarkup: payload.markup,
        naturalWidth: payload.naturalWidth,
        naturalHeight: payload.naturalHeight,
        x: previousCenterX - nextWidth * 0.5,
        y: previousCenterY - nextHeight * 0.5,
      }),
    ],
  }
}

export function resetDashboardComposeCamera(scene: DashboardComposeScene) {
  return {
    ...scene,
    camera: { ...DEFAULT_CAMERA },
  }
}

export function resetDashboardQrNodeTransform(
  scene: DashboardComposeScene,
  nodeId = DASHBOARD_QR_NODE_ID,
) {
  const node = getDashboardComposeNode(scene, nodeId)

  if (!node || node.kind !== "svg") {
    return scene
  }

  return {
    ...scene,
    nodes: [
      ...scene.nodes.filter((existingNode) => existingNode.id !== node.id),
      normalizeDashboardComposeNode({
        ...createDashboardQrNode(scene, {
          markup: node.originalSvgMarkup,
          name: node.name,
          naturalHeight: node.naturalHeight,
          naturalWidth: node.naturalWidth,
        }, node.id),
        zIndex: node.zIndex,
      }),
    ],
  }
}

function createDashboardQrNode(
  scene: DashboardComposeScene,
  payload: DashboardQrNodePayload,
  nodeId = DASHBOARD_QR_NODE_ID,
): DashboardComposeSvgNode {
  const fitScale = Math.min(
    (scene.canvasSize.width * DASHBOARD_QR_STAGE_FIT_RATIO) / payload.naturalWidth,
    (scene.canvasSize.height * DASHBOARD_QR_STAGE_FIT_RATIO) / payload.naturalHeight,
  )
  const scale = Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 1
  const width = payload.naturalWidth * scale
  const height = payload.naturalHeight * scale

  return normalizeDashboardComposeNode({
    id: nodeId,
    kind: "svg",
    name: payload.name ?? "QR Code",
    originalSvgMarkup: payload.markup,
    naturalWidth: payload.naturalWidth,
    naturalHeight: payload.naturalHeight,
    x: (scene.canvasSize.width - width) * 0.5,
    y: (scene.canvasSize.height - height) * 0.5,
    scale,
    rotation: 0,
    zIndex: getNextDashboardComposeZIndex(scene),
    opacity: 1,
    blendMode: "normal",
    isVisible: true,
  }) as DashboardComposeSvgNode
}

function normalizeDashboardComposeNode(
  node: DashboardComposeNode,
): DashboardComposeNode {
  const normalizedSharedNode = {
    ...node,
    name: node.name?.trim() || "Untitled layer",
    naturalHeight: Math.max(1, node.naturalHeight),
    naturalWidth: Math.max(1, node.naturalWidth),
    opacity: clamp(node.opacity, 0, 1),
    rotation: normalizeRotation(node.rotation),
    scale: Number.isFinite(node.scale) && node.scale > 0 ? node.scale : 1,
    x: Number.isFinite(node.x) ? node.x : 0,
    y: Number.isFinite(node.y) ? node.y : 0,
    zIndex: Number.isFinite(node.zIndex) ? node.zIndex : 0,
    blendMode: node.blendMode || "normal",
    isVisible: node.isVisible ?? true,
  }

  if (node.kind === "image") {
    return {
      ...normalizedSharedNode,
      kind: "image",
      imageUrl: node.imageUrl,
    }
  }

  return {
    ...normalizedSharedNode,
    kind: "svg",
    originalSvgMarkup: node.originalSvgMarkup,
  }
}

function getDashboardComposeNodeIdsByStackOrder(nodes: DashboardComposeNode[]) {
  return [...nodes]
    .sort((left, right) => right.zIndex - left.zIndex)
    .map((node) => node.id)
}

function normalizeDashboardComposeBackground(
  background: DashboardComposeBackground,
): DashboardComposeBackground {
  const gradient = structuredClone(
    background.gradient ?? createDefaultDashboardComposeBackgroundGradient(),
  )

  return {
    ...background,
    color: background.color || "#ffffff",
    gradient: {
      ...gradient,
      enabled: background.mode === "gradient",
    },
    mode: background.mode ?? "transparent",
  }
}

function normalizeDashboardComposeDocument(
  document: DashboardComposeDocument,
): DashboardComposeDocument {
  const preset = getDashboardDocumentPreset(
    document.presetId ?? DEFAULT_DASHBOARD_DOCUMENT_PRESET_ID,
  )

  return {
    backgroundColor: document.backgroundColor || DEFAULT_DOCUMENT.backgroundColor,
    margin: clamp(document.margin, 0, Math.min(preset.width, preset.height) * 0.45),
    presetId: preset.id,
    showGuides: document.showGuides ?? DEFAULT_DOCUMENT.showGuides,
  }
}

function createDefaultDashboardComposeBackgroundGradient(): StudioGradient {
  return {
    enabled: false,
    type: "linear",
    rotation: 0,
    colorStops: [
      { offset: 0, color: "#f8fafc" },
      { offset: 1, color: "#dbeafe" },
    ],
  }
}

function getNextDashboardComposeZIndex(scene: DashboardComposeScene) {
  const maxZIndex = scene.nodes.reduce(
    (currentMax, node) => Math.max(currentMax, node.zIndex),
    0,
  )

  return maxZIndex + 1
}

function hasFiniteTransform(node: DashboardComposeNode) {
  return (
    Number.isFinite(node.scale) &&
    node.scale > 0 &&
    Number.isFinite(node.rotation) &&
    Number.isFinite(node.x) &&
    Number.isFinite(node.y)
  )
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(max, Math.max(min, value))
}

function normalizeRotation(rotation: number) {
  if (!Number.isFinite(rotation)) {
    return 0
  }

  const normalized = rotation % 360

  return normalized < 0 ? normalized + 360 : normalized
}
