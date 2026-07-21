import { describe, expect, it } from "vitest"

import { migrateSceneDocument } from "./migrate"
import { SCENE_DOCUMENT_VERSION, type SceneDocumentV1 } from "./scene-document"

const sampleScene: SceneDocumentV1 = {
  version: SCENE_DOCUMENT_VERSION,
  sceneId: "abc123",
  width: 800,
  height: 600,
  nodes: ["node-1"],
  activeNodeId: "node-1",
  layersByNodeId: {
    "node-1": [
      {
        id: "card-1",
        kind: "card",
        name: "Card",
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        rotation: 0,
        opacity: 1,
        zIndex: 0,
        isVisible: true,
      },
      {
        id: "qr-1",
        kind: "qr",
        name: "QR",
        x: 220,
        y: 160,
        width: 280,
        height: 280,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        isVisible: true,
      },
    ],
  },
  cardStateByNodeId: {
    "node-1": {
      styleMode: "paper-shader",
      fill: "#ffd80a",
      cornerRadius: 32,
      border: { color: "#111827", opacity: 100, width: 0 },
      paperShader: {
        shaderId: "dithering",
        params: { speed: 1, colorFront: "#00B2FF" },
        frame: 0,
        speed: 1,
        paused: false,
      },
    },
  },
  qrStateByNodeId: {
    "node-1": {
      contents: "https://example.com",
      externalSvg: "<svg></svg>",
      width: 280,
      height: 280,
      motion: {
        enabled: true,
        animated: true,
        preset: "SpiralBloom",
        hoverEffect: "RadialAura",
        hoverColorMode: "both",
        autoAnimate: "",
        autoAnimateInterval: 5000,
        speed: 1,
        motionIntensity: "premium",
        respectReducedMotion: true,
      },
    },
  },
  assets: {},
  fonts: [],
}

describe("scene-document", () => {
  it("migrates v1 scene documents", () => {
    expect(migrateSceneDocument(sampleScene)).toEqual(sampleScene)
  })

  it("rejects invalid documents", () => {
    expect(migrateSceneDocument({ version: 99 })).toBeNull()
    expect(migrateSceneDocument(null)).toBeNull()
  })
})
