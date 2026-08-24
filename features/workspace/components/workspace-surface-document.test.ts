import { describe, expect, it } from "vitest"

import { createDefaultQrStudioState } from "@/features/qr-code/model/state"
import {
  mergeLiveQrStateByLayerId,
  resolveActiveQrLayerIdFromLayers,
} from "@/features/workspace/components/workspace-surface-document"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

function createQrLayer(id: string): DraftingCanvasLayer {
  return {
    blur: 0,
    height: 200,
    id,
    isLocked: false,
    isVisible: true,
    kind: "qr",
    layerFilters: [],
    name: "QR code",
    nodeId: id.replace(/:qr$/, ""),
    opacity: 1,
    outline: { color: "#000000", width: 0 },
    rotation: 0,
    tiltX: 0,
    tiltY: 0,
    shadow: { blur: 0, color: "#000000", offsetX: 0, offsetY: 0, opacity: 0 },
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
      ...createDefaultQrStudioState(),
      dataModulesSettings: {
        ...createDefaultQrStudioState().dataModulesSettings,
        type: "circle" as const,
      },
    }
    const liveState = {
      ...createDefaultQrStudioState(),
      dataModulesSettings: {
        ...createDefaultQrStudioState().dataModulesSettings,
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
      draftingStudioState: liveState,
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
