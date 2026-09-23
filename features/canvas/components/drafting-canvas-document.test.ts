import { describe, expect, it } from "vitest"

import { createDefaultQraftyState } from "@/features/qr/model/state"
import {
  mergeLiveQrStateByLayerId,
  resolveActiveQrLayerIdFromLayers,
} from "@/features/canvas/components/drafting-canvas-document"
import {
  DEFAULT_DRAFTING_LAYER_SHADOW,
  type DraftingCanvasLayer,
} from "@/features/canvas/model/layers/shared"
import { DEFAULT_DRAFTING_OUTLINE } from "@/features/canvas/model/effects"

function createQrLayer(id: string): DraftingCanvasLayer {
  return {
    blur: 0,
    height: 200,
    id,
    isVisible: true,
    kind: "qr",
    layerFilters: [],
    name: "QR code",
    nodeId: id.replace(/:qr$/, ""),
    opacity: 1,
    outline: { ...DEFAULT_DRAFTING_OUTLINE, color: "#000000" },
    rotation: 0,
    tiltX: 0,
    tiltY: 0,
    shadow: { ...DEFAULT_DRAFTING_LAYER_SHADOW, color: "#000000" },
    shadows: [],
    width: 200,
    x: 0,
    y: 0,
    zIndex: 1,
  }
}

describe("mergeLiveQrStateByLayerId", () => {
  it("applies live editor state to the rendered QR layer when activeQrLayerId is stale", () => {
    const staleLayerId = "dashboard-qr-node-880b8d02-eaad-4e45-93d0-4e037f693cee:qr"
    const staleActiveLayerId = "dashboard-qr-node:qr"
    const staleState = {
      ...createDefaultQraftyState(),
      dataModulesSettings: {
        ...createDefaultQraftyState().dataModulesSettings,
        type: "circle" as const,
      },
    }
    const liveState = {
      ...createDefaultQraftyState(),
      dataModulesSettings: {
        ...createDefaultQraftyState().dataModulesSettings,
        type: "pinched-square" as const,
      },
    }

    const merged = mergeLiveQrStateByLayerId({
      qrStateByLayerId: {
        [staleLayerId]: staleState,
        [staleActiveLayerId]: staleState,
      },
      activeQrLayerId: staleActiveLayerId,
      canvasLayers: [createQrLayer(staleLayerId)],
      draftingQraftyState: liveState,
    })

    expect(merged[staleActiveLayerId]?.dataModulesSettings.type).toBe("pinched-square")
    expect(merged[staleLayerId]?.dataModulesSettings.type).toBe("pinched-square")
  })
})

describe("resolveActiveQrLayerIdFromLayers", () => {
  it("prefers the QR layer that exists on the canvas", () => {
    const canvasLayerId = "dashboard-qr-node-880b8d02-eaad-4e45-93d0-4e037f693cee:qr"

    expect(
      resolveActiveQrLayerIdFromLayers("dashboard-qr-node:qr", [createQrLayer(canvasLayerId)]),
    ).toBe(canvasLayerId)
  })
})
