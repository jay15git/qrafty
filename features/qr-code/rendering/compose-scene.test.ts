import { describe, expect, it } from "vitest"

import {
  addDashboardComposeImageNode,
  applyDashboardDocumentPreset,
  centerDashboardComposeNode,
  createDashboardComposeScene,
  createDashboardDocumentComposeScene,
  DASHBOARD_COMPOSE_CANVAS_SIZE,
  DASHBOARD_COMPOSE_CANVAS_HEIGHT,
  DASHBOARD_DOCUMENT_DEFAULT_MARGIN,
  DASHBOARD_IMAGE_STAGE_FIT_RATIO,
  DASHBOARD_QR_NODE_ID,
  DASHBOARD_QR_STAGE_FIT_RATIO,
  fitDashboardQrNodeToDocument,
  getDashboardQrNodes,
  isDashboardQrNodeId,
  removeDashboardComposeNode,
  reorderDashboardComposeNodes,
  resetDashboardComposeCamera,
  resetDashboardQrNodeTransform,
  upsertDashboardQrNode,
  updateDashboardComposeBackground,
  updateDashboardComposeNode,
} from "@/features/qr-code/rendering/compose-scene"

const QR_PAYLOAD = {
  markup:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><rect width="320" height="320" fill="#fff" /><path d="M20 20h40v40H20z" fill="#111" /></svg>',
  naturalHeight: 320,
  naturalWidth: 320,
}

describe("dashboard compose scene helpers", () => {
  it("creates a transparent landscape dashboard scene by default", () => {
    const scene = createDashboardComposeScene()

    expect(scene.canvasSize).toEqual({
      width: DASHBOARD_COMPOSE_CANVAS_SIZE,
      height: DASHBOARD_COMPOSE_CANVAS_HEIGHT,
    })
    expect(scene.background).toEqual({
      mode: "transparent",
      color: "#ffffff",
      gradient: {
        enabled: false,
        type: "linear",
        rotation: 0,
        colorStops: [
          { offset: 0, color: "#f8fafc" },
          { offset: 1, color: "#dbeafe" },
        ],
      },
    })
    expect(scene.camera).toEqual({
      panX: 0,
      panY: 0,
      zoom: 1,
    })
    expect(scene.document).toEqual({
      backgroundColor: "#ffffff",
      margin: DASHBOARD_DOCUMENT_DEFAULT_MARGIN,
      presetId: "letter",
      showGuides: true,
    })
    expect(scene.nodes).toEqual([])
  })

  it("creates a portrait document scene for the drafting workspace", () => {
    const scene = createDashboardDocumentComposeScene()

    expect(scene.canvasSize).toEqual({
      width: 816,
      height: 1056,
    })
    expect(scene.document.presetId).toBe("letter")
  })

  it("creates a centered svg-backed qr node at the dashboard fit size", () => {
    const scene = upsertDashboardQrNode(createDashboardComposeScene(), QR_PAYLOAD)

    expect(scene.nodes).toHaveLength(1)

    const node = scene.nodes[0]
    const expectedScale =
      Math.min(
        (DASHBOARD_COMPOSE_CANVAS_SIZE * DASHBOARD_QR_STAGE_FIT_RATIO) /
          QR_PAYLOAD.naturalWidth,
        (DASHBOARD_COMPOSE_CANVAS_HEIGHT * DASHBOARD_QR_STAGE_FIT_RATIO) /
          QR_PAYLOAD.naturalHeight,
      )
    const expectedXOffset =
      (DASHBOARD_COMPOSE_CANVAS_SIZE - QR_PAYLOAD.naturalWidth * expectedScale) / 2
    const expectedYOffset =
      (DASHBOARD_COMPOSE_CANVAS_HEIGHT - QR_PAYLOAD.naturalHeight * expectedScale) / 2

    expect(node.id).toBe(DASHBOARD_QR_NODE_ID)
    expect(node.kind).toBe("svg")
    expect(node.name).toBe("QR Code")
    expect(node.kind === "svg" ? node.originalSvgMarkup : "").toContain("<svg")
    expect(node.isVisible).toBe(true)
    expect(node.scale).toBeCloseTo(expectedScale)
    expect(node.x).toBeCloseTo(expectedXOffset)
    expect(node.y).toBeCloseTo(expectedYOffset)
  })

  it("creates a centered image node at a bounded fit size and inserts it on top", () => {
    const scene = addDashboardComposeImageNode(
      upsertDashboardQrNode(createDashboardComposeScene(), QR_PAYLOAD),
      {
        id: "image-node",
        imageUrl: "/photo.png",
        name: "Landscape",
        naturalHeight: 600,
        naturalWidth: 1200,
      },
    )

    const node = scene.nodes.find((currentNode) => currentNode.id === "image-node")
    const expectedScale = Math.min(
      1,
      (DASHBOARD_COMPOSE_CANVAS_SIZE * DASHBOARD_IMAGE_STAGE_FIT_RATIO) / 1200,
      (DASHBOARD_COMPOSE_CANVAS_HEIGHT * DASHBOARD_IMAGE_STAGE_FIT_RATIO) / 600,
    )

    expect(node).toMatchObject({
      id: "image-node",
      imageUrl: "/photo.png",
      kind: "image",
      name: "Landscape",
      zIndex: 2,
    })
    expect(node?.scale).toBeCloseTo(expectedScale)
    expect(node?.x).toBeCloseTo(
      (DASHBOARD_COMPOSE_CANVAS_SIZE - 1200 * expectedScale) / 2,
    )
    expect(node?.y).toBeCloseTo(
      (DASHBOARD_COMPOSE_CANVAS_HEIGHT - 600 * expectedScale) / 2,
    )
  })

  it("preserves the qr transform when new svg markup is applied", () => {
    const initialScene = upsertDashboardQrNode(
      createDashboardComposeScene(),
      QR_PAYLOAD,
    )
    const transformedNode = {
      ...initialScene.nodes[0],
      rotation: 24,
      scale: 1.84,
      x: 126,
      y: 148,
    }
    const transformedScene = {
      ...initialScene,
      nodes: [transformedNode],
    }
    const updatedPayload = {
      markup:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><circle cx="200" cy="200" r="160" fill="#111" /></svg>',
      naturalHeight: 400,
      naturalWidth: 400,
    }

    const nextScene = upsertDashboardQrNode(transformedScene, updatedPayload)
    const nextNode = nextScene.nodes[0]
    const previousCenterX =
      transformedNode.x +
      transformedNode.naturalWidth * transformedNode.scale * 0.5
    const previousCenterY =
      transformedNode.y +
      transformedNode.naturalHeight * transformedNode.scale * 0.5
    const nextCenterX = nextNode.x + nextNode.naturalWidth * nextNode.scale * 0.5
    const nextCenterY = nextNode.y + nextNode.naturalHeight * nextNode.scale * 0.5

    expect(nextNode.scale).toBe(transformedNode.scale)
    expect(nextNode.rotation).toBe(transformedNode.rotation)
    expect(nextNode.kind === "svg" ? nextNode.originalSvgMarkup : "").toContain("<circle")
    expect(nextCenterX).toBeCloseTo(previousCenterX)
    expect(nextCenterY).toBeCloseTo(previousCenterY)
  })

  it("preserves the visual center when the canonical qr size changes", () => {
    const initialScene = upsertDashboardQrNode(
      createDashboardComposeScene(),
      QR_PAYLOAD,
    )
    const resizedNode = {
      ...initialScene.nodes[0],
      naturalHeight: 480,
      naturalWidth: 480,
      rotation: 18,
      x: 125.6,
      y: 74.8,
    }
    const resizedScene = {
      ...initialScene,
      nodes: [resizedNode],
    }
    const updatedPayload = {
      ...QR_PAYLOAD,
      naturalHeight: 480,
      naturalWidth: 480,
    }

    const nextScene = upsertDashboardQrNode(resizedScene, updatedPayload)
    const nextNode = nextScene.nodes[0]

    expect(nextNode.rotation).toBe(18)
    expect(nextNode.scale).toBe(resizedNode.scale)
    expect(nextNode.naturalWidth).toBe(480)
    expect(nextNode.naturalHeight).toBe(480)
    expect(nextNode.x).toBeCloseTo(resizedNode.x)
    expect(nextNode.y).toBeCloseTo(resizedNode.y)
  })

  it("resets both the dashboard camera and qr transform to the centered defaults", () => {
    const seededScene = upsertDashboardQrNode(
      createDashboardComposeScene(),
      QR_PAYLOAD,
    )
    const adjustedScene = {
      ...seededScene,
      camera: {
        panX: 90,
        panY: -48,
        zoom: 2.2,
      },
      nodes: [
        {
          ...seededScene.nodes[0],
          rotation: 48,
          scale: 1.35,
          x: 212,
          y: 188,
        },
      ],
    }

    const cameraReset = resetDashboardComposeCamera(adjustedScene)
    const transformReset = resetDashboardQrNodeTransform(adjustedScene)
    const resetNode = transformReset.nodes[0]

    expect(cameraReset.camera).toEqual({
      panX: 0,
      panY: 0,
      zoom: 1,
    })
    expect(resetNode.rotation).toBe(0)
    expect(resetNode.x).toBeCloseTo(seededScene.nodes[0].x)
    expect(resetNode.y).toBeCloseTo(seededScene.nodes[0].y)
    expect(resetNode.scale).toBeCloseTo(seededScene.nodes[0].scale)
  })

  it("normalizes negative rotation updates into positive degrees", () => {
    const seededScene = upsertDashboardQrNode(createDashboardComposeScene(), QR_PAYLOAD)

    const rotatedScene = updateDashboardComposeNode(
      seededScene,
      DASHBOARD_QR_NODE_ID,
      { rotation: -90 },
    )

    expect(rotatedScene.nodes[0]?.rotation).toBe(270)
  })

  it("normalizes gradient canvas backgrounds and preserves node metadata updates", () => {
    const seededScene = upsertDashboardQrNode(createDashboardComposeScene(), QR_PAYLOAD)

    const backgroundScene = updateDashboardComposeBackground(seededScene, {
      mode: "gradient",
      gradient: {
        enabled: false,
        type: "radial",
        rotation: 0.5,
        colorStops: [
          { offset: 0.2, color: "#111827" },
          { offset: 0.8, color: "#60a5fa" },
        ],
      },
    })
    const updatedNodeScene = updateDashboardComposeNode(backgroundScene, DASHBOARD_QR_NODE_ID, {
      isVisible: false,
      name: "Poster QR",
    })

    expect(backgroundScene.background.mode).toBe("gradient")
    expect(backgroundScene.background.gradient.enabled).toBe(true)
    expect(backgroundScene.background.gradient.type).toBe("radial")
    expect(updatedNodeScene.nodes[0]).toMatchObject({
      isVisible: false,
      name: "Poster QR",
    })
  })

  it("applies document presets while preserving the normalized document metadata", () => {
    const scene = applyDashboardDocumentPreset(createDashboardDocumentComposeScene(), "square")

    expect(scene.canvasSize).toEqual({
      width: 1080,
      height: 1080,
    })
    expect(scene.document).toMatchObject({
      backgroundColor: "#ffffff",
      presetId: "square",
      showGuides: true,
    })
  })

  it("centers and fits the qr node to the document margin-safe area", () => {
    const seededScene = upsertDashboardQrNode(createDashboardDocumentComposeScene(), QR_PAYLOAD)
    const offsetScene = updateDashboardComposeNode(seededScene, DASHBOARD_QR_NODE_ID, {
      x: 12,
      y: 18,
    })

    const centeredScene = centerDashboardComposeNode(offsetScene)
    const centeredNode = centeredScene.nodes[0]
    const centeredWidth = centeredNode.naturalWidth * centeredNode.scale
    const centeredHeight = centeredNode.naturalHeight * centeredNode.scale

    expect(centeredNode.x).toBeCloseTo((centeredScene.canvasSize.width - centeredWidth) / 2)
    expect(centeredNode.y).toBeCloseTo((centeredScene.canvasSize.height - centeredHeight) / 2)

    const fittedScene = fitDashboardQrNodeToDocument(seededScene)
    const fittedNode = fittedScene.nodes[0]
    const fittedSize = fittedNode.naturalWidth * fittedNode.scale

    expect(fittedSize).toBeCloseTo(
      Math.min(
        fittedScene.canvasSize.width - fittedScene.document.margin * 2,
        fittedScene.canvasSize.height - fittedScene.document.margin * 2,
      ),
      0,
    )
    expect(fittedNode.x).toBeCloseTo((fittedScene.canvasSize.width - fittedSize) / 2)
    expect(fittedNode.y).toBeCloseTo((fittedScene.canvasSize.height - fittedSize) / 2)
  })

  it("removes only the targeted image node and never removes the QR node", () => {
    const seededScene = createLayeredScene()

    const removedImageScene = removeDashboardComposeNode(seededScene, "image-node")
    const removedQrScene = removeDashboardComposeNode(seededScene, DASHBOARD_QR_NODE_ID)

    expect(removedImageScene.nodes.some((node) => node.id === "image-node")).toBe(false)
    expect(removedImageScene.nodes.some((node) => node.id === DASHBOARD_QR_NODE_ID)).toBe(
      true,
    )
    expect(removedQrScene).toBe(seededScene)
  })

  it("preserves image nodes when the QR payload regenerates", () => {
    const seededScene = createLayeredScene()

    const regeneratedScene = upsertDashboardQrNode(seededScene, {
      markup:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><circle cx="200" cy="200" r="180" fill="#111" /></svg>',
      naturalHeight: 400,
      naturalWidth: 400,
    })

    expect(regeneratedScene.nodes).toHaveLength(2)
    expect(regeneratedScene.nodes.find((node) => node.id === "image-node")).toMatchObject({
      id: "image-node",
      kind: "image",
      imageUrl: "/landscape.png",
      name: "Landscape",
    })
    expect(
      regeneratedScene.nodes.find((node) => node.id === DASHBOARD_QR_NODE_ID)?.kind,
    ).toBe("svg")
  })

  it("supports independent qr nodes without rewriting the default qr", () => {
    const initialScene = upsertDashboardQrNode(createDashboardComposeScene(), QR_PAYLOAD)
    const secondPayload = {
      ...QR_PAYLOAD,
      markup:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><circle cx="160" cy="160" r="120" fill="#111" /></svg>',
      name: "QR Code 2",
    }
    const nextScene = upsertDashboardQrNode(
      initialScene,
      secondPayload,
      "dashboard-qr-node-copy",
    )

    expect(isDashboardQrNodeId("dashboard-qr-node-copy")).toBe(true)
    expect(getDashboardQrNodes(nextScene)).toHaveLength(2)
    expect(nextScene.nodes.find((node) => node.id === DASHBOARD_QR_NODE_ID)).toMatchObject({
      id: DASHBOARD_QR_NODE_ID,
      name: "QR Code",
      zIndex: 1,
    })
    expect(nextScene.nodes.find((node) => node.id === "dashboard-qr-node-copy")).toMatchObject({
      id: "dashboard-qr-node-copy",
      name: "QR Code 2",
      zIndex: 2,
    })
  })

  it("targets fit and reset operations to the requested qr node", () => {
    const twoQrScene = upsertDashboardQrNode(
      upsertDashboardQrNode(createDashboardDocumentComposeScene(), QR_PAYLOAD),
      {
        ...QR_PAYLOAD,
        name: "QR Code 2",
      },
      "dashboard-qr-node-copy",
    )
    const transformedScene = {
      ...twoQrScene,
      nodes: twoQrScene.nodes.map((node) =>
        node.id === "dashboard-qr-node-copy"
          ? {
              ...node,
              rotation: 18,
              scale: 0.5,
              x: 12,
              y: 18,
            }
          : node,
      ),
    }

    const fittedScene = fitDashboardQrNodeToDocument(
      transformedScene,
      "dashboard-qr-node-copy",
    )
    const defaultQr = fittedScene.nodes.find((node) => node.id === DASHBOARD_QR_NODE_ID)
    const fittedQr = fittedScene.nodes.find((node) => node.id === "dashboard-qr-node-copy")

    expect(defaultQr).toEqual(transformedScene.nodes.find((node) => node.id === DASHBOARD_QR_NODE_ID))
    expect(fittedQr?.x).not.toBe(12)

    const resetScene = resetDashboardQrNodeTransform(fittedScene, "dashboard-qr-node-copy")
    const resetQr = resetScene.nodes.find((node) => node.id === "dashboard-qr-node-copy")

    expect(resetQr?.rotation).toBe(0)
    expect(resetScene.nodes.find((node) => node.id === DASHBOARD_QR_NODE_ID)).toEqual(defaultQr)
  })

  it("allows deleting extra qr nodes but preserves the last remaining qr", () => {
    const twoQrScene = upsertDashboardQrNode(
      upsertDashboardQrNode(createDashboardComposeScene(), QR_PAYLOAD),
      {
        ...QR_PAYLOAD,
        name: "QR Code 2",
      },
      "dashboard-qr-node-copy",
    )

    const removedDefaultScene = removeDashboardComposeNode(twoQrScene, DASHBOARD_QR_NODE_ID)

    expect(getDashboardQrNodes(removedDefaultScene)).toHaveLength(1)
    expect(removedDefaultScene.nodes.some((node) => node.id === DASHBOARD_QR_NODE_ID)).toBe(false)
    expect(
      removeDashboardComposeNode(removedDefaultScene, "dashboard-qr-node-copy"),
    ).toBe(removedDefaultScene)
  })

  it("rewrites z-index values from a top-first layer order while preserving node metadata", () => {
    const seededScene = createLayeredScene()

    const reorderedScene = reorderDashboardComposeNodes(seededScene, [
      DASHBOARD_QR_NODE_ID,
      "image-node",
    ])

    expect(reorderedScene.nodes.find((node) => node.id === "image-node")).toMatchObject({
      id: "image-node",
      kind: "image",
      imageUrl: "/landscape.png",
      isVisible: true,
      name: "Landscape",
      opacity: 0.8,
      zIndex: 1,
    })
    expect(
      reorderedScene.nodes.find((node) => node.id === DASHBOARD_QR_NODE_ID)?.zIndex,
    ).toBe(2)
  })

  it("treats single-node reorders as a no-op", () => {
    const seededScene = upsertDashboardQrNode(createDashboardComposeScene(), QR_PAYLOAD)

    expect(
      reorderDashboardComposeNodes(seededScene, [DASHBOARD_QR_NODE_ID]),
    ).toBe(seededScene)
  })
})

function createLayeredScene() {
  const scene = addDashboardComposeImageNode(
    upsertDashboardQrNode(createDashboardComposeScene(), QR_PAYLOAD),
    {
      id: "image-node",
      imageUrl: "/landscape.png",
      name: "Landscape",
      naturalHeight: 600,
      naturalWidth: 1200,
    },
  )

  return {
    ...scene,
    nodes: scene.nodes.map((node) =>
      node.id === "image-node"
        ? {
            ...node,
            opacity: 0.8,
          }
        : node,
    ),
  }
}
