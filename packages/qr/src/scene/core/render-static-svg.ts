import type { SceneCardState, SceneDocumentV1, SceneLayer, SceneQrState } from "../schema"

export type SceneRenderProfile = "live" | "static" | "snapshot"

export function getActiveSceneNode(scene: SceneDocumentV1) {
  const nodeId = scene.activeNodeId || scene.nodes[0]

  if (!nodeId) {
    return null
  }

  return {
    nodeId,
    layers: scene.layersByNodeId[nodeId] ?? [],
    card: scene.cardStateByNodeId[nodeId],
    qr: scene.qrStateByNodeId[nodeId],
    decorSvg: scene.decorSvgByNodeId?.[nodeId],
  }
}

export function findQrLayer(layers: SceneLayer[]) {
  return layers.find((layer) => layer.kind === "qr" && layer.isVisible) ?? null
}

export function findCardLayer(layers: SceneLayer[]) {
  return layers.find((layer) => layer.kind === "card" && layer.isVisible) ?? null
}

export function usesPaperShader(card?: SceneCardState) {
  return card?.styleMode === "paper-shader" && Boolean(card.paperShader)
}

export function usesAnimatedQr(qr?: SceneQrState) {
  return Boolean(qr?.motion.enabled && qr.motion.animated)
}

export function buildSceneDependencyManifest(scene: SceneDocumentV1) {
  const node = getActiveSceneNode(scene)
  const paperShaders = usesPaperShader(node?.card)
  const animatedQr = usesAnimatedQr(node?.qr)

  const dependencies: Record<string, string> = {
    "@new-qr/qr": "0.1.0",
  }

  if (paperShaders) {
    dependencies["@paper-design/shaders"] = "0.0.76"
    dependencies["@paper-design/shaders-react"] = "0.0.76"
  }

  return {
    dependencies,
    features: {
      paperShaders,
      animatedQr,
      staticFallback: true,
    },
  }
}

export function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

export function buildStaticDecorSvg(
  scene: SceneDocumentV1,
  options: { shaderSnapshotUrl?: string } = {},
) {
  const node = getActiveSceneNode(scene)

  if (!node) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}"></svg>`
  }

  if (node.decorSvg) {
    return node.decorSvg
  }

  const card = findCardLayer(node.layers)
  const shaderImage = options.shaderSnapshotUrl
    ? `<image href="${escapeXml(options.shaderSnapshotUrl)}" x="0" y="0" width="${scene.width}" height="${scene.height}" preserveAspectRatio="xMidYMid slice" />`
    : ""

  const cardRect = card
    ? `<rect x="${card.x}" y="${card.y}" width="${card.width}" height="${card.height}" rx="${node.card?.cornerRadius ?? 0}" fill="${escapeXml(node.card?.fill ?? "#ffffff")}" />`
    : ""

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}">${shaderImage}${cardRect}</svg>`
}
