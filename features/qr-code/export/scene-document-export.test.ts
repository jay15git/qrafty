import { describe, expect, it, vi } from "vitest"

import { buildSceneEmbedSnippet } from "./scene-document-export"
import { SCENE_DOCUMENT_VERSION } from "@new-qr/qr-internal/scene"

vi.mock("@/features/workspace/export/layered-export", () => ({
  buildDraftingLayeredNodePayload: vi.fn(async () => ({
    id: "node-1",
    name: "scene",
    naturalWidth: 800,
    naturalHeight: 600,
    originalSvgMarkup: "<svg></svg>",
  })),
}))

vi.mock("@/features/qr-code/rendering/qr-svg", () => ({
  buildDashboardQrNodePayload: vi.fn(async () => ({
    markup: "<svg><rect /></svg>",
    naturalWidth: 280,
    naturalHeight: 280,
  })),
}))

describe("scene-document-export", () => {
  it("builds embed snippet with install command", () => {
    const snippet = buildSceneEmbedSnippet({
      version: SCENE_DOCUMENT_VERSION,
      sceneId: "abc123",
      width: 800,
      height: 600,
      nodes: ["node-1"],
      activeNodeId: "node-1",
      layersByNodeId: {
        "node-1": [
          {
            id: "qr-1",
            kind: "qr",
            name: "QR",
            x: 0,
            y: 0,
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
            params: {},
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
            hoverEffect: "",
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
    })

    expect(snippet.installCommand).toContain("pnpm add")
    expect(snippet.reactCode).toContain('sceneId="abc123"')
    expect(snippet.manifest.features.paperShaders).toBe(true)
  })
})
