import {
  buildSceneDependencyManifest,
  inlineSceneAssets,
} from "@new-qr/qr-internal/scene"
import { emitLiveReact } from "@new-qr/qr-internal/codegen"
import {
  SCENE_DOCUMENT_VERSION,
  type SceneCardState,
  type SceneDocumentV1,
  type SceneLayer,
  type SceneQrMotionState,
  type SceneQrState,
} from "@new-qr/qr-internal/scene"

import { buildDashboardQrNodePayload } from "@/features/qr-code/rendering/qr-svg"
import type { QrStudioState } from "@/features/qr-code/model/state"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { buildDraftingLayeredNodePayload } from "@/features/workspace/export/layered-export"
import {
  createDraftingQrArtworkState,
  sanitizeDraftingQrArtworkMarkup,
} from "@/features/workspace/rendering/qr-artwork"
import { buildSceneIrFromSceneDocument } from "@/features/qr-code/export/build-scene-ir"

function toSceneLayer(layer: DraftingCanvasLayer): SceneLayer {
  return {
    id: layer.id,
    kind: layer.kind,
    name: layer.name,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    rotation: layer.rotation,
    opacity: layer.opacity,
    zIndex: layer.zIndex,
    isVisible: layer.isVisible,
    blur: layer.blur,
    tiltX: layer.tiltX,
    tiltY: layer.tiltY,
    scaleX: layer.scaleX,
    scaleY: layer.scaleY,
    text: layer.text,
    fontFamily: layer.fontFamily,
    fontSize: layer.fontSize,
    fill: layer.fill,
    imageValue: layer.imageValue,
    imageFit: layer.imageFit,
    shapeId: layer.shapeId,
    paperShader: layer.paperShader
      ? {
          shaderId: layer.paperShader.shaderId,
          params: structuredClone(layer.paperShader.params),
          frame: layer.paperShader.frame,
          speed: layer.paperShader.speed,
          paused: layer.paperShader.paused,
          presetName: layer.paperShader.presetName,
          image: layer.paperShader.image ? { ...layer.paperShader.image } : undefined,
        }
      : undefined,
    children: layer.children?.map(toSceneLayer),
  }
}

function toSceneCardState(cardState: DraftingCardState): SceneCardState {
  return {
    styleMode: cardState.styleMode,
    fill: cardState.fill,
    cornerRadius: cardState.cornerRadius,
    border: { ...cardState.border },
    shadow: { ...cardState.shadow },
    paperShader: cardState.paperShader
      ? {
          shaderId: cardState.paperShader.shaderId,
          params: structuredClone(cardState.paperShader.params),
          frame: cardState.paperShader.frame,
          speed: cardState.paperShader.speed,
          paused: cardState.paperShader.paused,
          presetName: cardState.paperShader.presetName,
          image: cardState.paperShader.image
            ? { ...cardState.paperShader.image }
            : undefined,
        }
      : undefined,
    imageFilter: cardState.imageFilter
      ? {
          shaderId: cardState.imageFilter.shaderId,
          params: structuredClone(cardState.imageFilter.params),
          frame: cardState.imageFilter.frame,
          speed: cardState.imageFilter.speed,
          paused: cardState.imageFilter.paused,
          presetName: cardState.imageFilter.presetName,
          image: cardState.imageFilter.image
            ? { ...cardState.imageFilter.image }
            : undefined,
        }
      : undefined,
    patternId: cardState.patternId,
    cardImage: cardState.cardImage ? { ...cardState.cardImage } : undefined,
  }
}

function toSceneQrMotion(state: QrStudioState): SceneQrMotionState {
  const animation = state.dotMatrixAnimation

  return {
    enabled: animation.enabled,
    animated: animation.animated,
    preset: "",
    hoverEffect: "",
    hoverColorMode: "both",
    autoAnimate: "",
    autoAnimateInterval: 5000,
    speed: animation.speed,
    motionIntensity: "premium",
    respectReducedMotion: animation.respectReducedMotion,
    pressPreset: "",
  }
}

async function toSceneQrState(state: QrStudioState): Promise<SceneQrState> {
  const payload = await buildDashboardQrNodePayload(createDraftingQrArtworkState(state))

  return {
    contents: state.data.trim() || "https://example.com",
    externalSvg: sanitizeDraftingQrArtworkMarkup(payload.markup),
    width: state.width,
    height: state.height,
    motion: toSceneQrMotion(state),
  }
}

export async function buildSceneDocumentFromWorkspace({
  document,
  nodeId,
  sceneId,
  publishedVersion,
  sceneUrl,
}: {
  document: DraftingWorkspaceDocumentV1
  nodeId?: string
  sceneId?: string
  publishedVersion?: number
  sceneUrl?: string
}): Promise<SceneDocumentV1> {
  const activeNodeId = nodeId ?? document.activeQrNodeId
  const layers = document.layerStateByNodeId[activeNodeId] ?? []
  const cardState = document.cardStateByNodeId[activeNodeId]
  const qrState = document.qrStateByNodeId[activeNodeId]

  if (!cardState || !qrState) {
    throw new Error("Scene node is unavailable.")
  }

  const layeredPayload = await buildDraftingLayeredNodePayload({
    cardState,
    layers,
    name: "scene",
    nodeId: activeNodeId,
    state: qrState,
  })

  const scene: SceneDocumentV1 = {
    version: SCENE_DOCUMENT_VERSION,
    sceneId,
    publishedVersion,
    sceneUrl,
    width: layeredPayload.naturalWidth,
    height: layeredPayload.naturalHeight,
    nodes: [activeNodeId],
    activeNodeId,
    layersByNodeId: {
      [activeNodeId]: layers.map(toSceneLayer),
    },
    cardStateByNodeId: {
      [activeNodeId]: toSceneCardState(cardState),
    },
    qrStateByNodeId: {
      [activeNodeId]: await toSceneQrState(qrState),
    },
    decorSvgByNodeId: {
      [activeNodeId]: layeredPayload.originalSvgMarkup,
    },
    assets: {},
    fonts: [],
  }

  return inlineSceneAssets(scene)
}

export function serializeSceneDocument(scene: SceneDocumentV1) {
  return JSON.stringify(scene, null, 2)
}

export function downloadSceneDocument(scene: SceneDocumentV1, filename = "scene.json") {
  const blob = new Blob([serializeSceneDocument(scene)], {
    type: "application/json;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function buildSceneEmbedSnippet(scene: SceneDocumentV1, options: { locked?: boolean } = {}) {
  const manifest = buildSceneDependencyManifest(scene)
  const installCommand = `pnpm add ${Object.keys(manifest.dependencies).join(" ")}`
  const sceneRef = options.locked
    ? `sceneUrl="${scene.sceneUrl ?? "https://cdn.yourapp.com/scenes/abc123/v1/scene.json"}"`
    : scene.sceneId
      ? `sceneId="${scene.sceneId}"`
      : `scene={scene}`

  const reactCode = `/** Required:
 * ${installCommand}
 */
import { QrScene } from "@new-qr/qr/react"
${options.locked || !scene.sceneId ? "" : 'import scene from "./my-qr-card.scene.json"\n'}
export function MyQrCard() {
  return <QrScene ${sceneRef} mode="live" />
}`

  return {
    installCommand,
    reactCode,
    manifest,
  }
}

export function buildSceneReactLiveCode(scene: SceneDocumentV1) {
  const manifest = buildSceneDependencyManifest(scene)
  const installCommand = `pnpm add ${Object.keys(manifest.dependencies).join(" ")}`
  const ir = buildSceneIrFromSceneDocument(scene)
  const code = emitLiveReact(ir, { dialect: "tsx", componentName: "MyQrCard" })

  return `/** Required:
 * ${installCommand}
 */
${code}`
}
