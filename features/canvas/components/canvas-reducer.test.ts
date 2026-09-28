import { describe, expect, it } from "vitest";

import {
  applyQrDraftFieldPatch,
  qrStateToDraftBuffers,
  qrStateToDraftFields,
} from "@/features/canvas/canvas/qr-draft";
import {
  canvasReducer,
  createInitialCanvasSurfaceState,
  type CanvasSurfaceAction,
  type QrDraftWriteField,
} from "@/features/canvas/components/canvas-reducer";
import { createDefaultCanvasWorkspaceQrState } from "@/features/canvas/model/document";
import { createDefaultCanvasCardState } from "@/features/canvas/model/card-state";
import { getCanvasQrLayerId } from "@/features/canvas/model/layers/shared";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import type { QraftyState } from "@/features/qr/model/state";

const PRIMARY_QR_LAYER_ID = getCanvasQrLayerId(DASHBOARD_QR_NODE_ID);

function patch(field: QrDraftWriteField, value: unknown): CanvasSurfaceAction {
  return { type: "UPDATE_QR_DRAFT", field, value } as CanvasSurfaceAction;
}

describe("canvas surface reducer", () => {
  it("writes QR draft fields to the active layer state", () => {
    const initial = createInitialCanvasSurfaceState();
    const next = canvasReducer(initial, patch("selectedDotColor", "#123456"));

    expect(next.qrStateByLayerId[PRIMARY_QR_LAYER_ID].dataModulesSettings.color).toBe("#123456");
  });

  it("passes the derived field value to functional updaters", () => {
    const initial = createInitialCanvasSurfaceState();
    const next = canvasReducer(
      initial,
      patch("selectedQrMargin", (prev: number) => prev + 4),
    );

    expect(next.qrStateByLayerId[PRIMARY_QR_LAYER_ID].margin).toBe(
      createDefaultCanvasWorkspaceQrState().margin + 4,
    );
  });

  it("stores asset buffers without touching the QR document", () => {
    const initial = createInitialCanvasSurfaceState();
    const next = canvasReducer(
      initial,
      patch("selectedLogoRemoteUrl", "https://example.com/logo.png"),
    );

    expect(next.selectedLogoRemoteUrl).toBe("https://example.com/logo.png");
    expect(next.qrStateByLayerId[PRIMARY_QR_LAYER_ID]).toBe(
      initial.qrStateByLayerId[PRIMARY_QR_LAYER_ID],
    );
  });

  it("resolves the module fill asset from buffers when entering image mode", () => {
    let state = createInitialCanvasSurfaceState();
    state = canvasReducer(state, patch("selectedModuleFillImageSourceMode", "url"));
    state = canvasReducer(
      state,
      patch("selectedModuleFillRemoteUrl", "https://example.com/fill.png"),
    );
    state = canvasReducer(state, patch("selectedDotsColorMode", "image"));

    const qr = state.qrStateByLayerId[PRIMARY_QR_LAYER_ID];
    expect(qr.dotsColorMode).toBe("image");
    expect(qr.moduleFillImage).toEqual({
      presetColor: undefined,
      presetId: undefined,
      source: "url",
      value: "https://example.com/fill.png",
    });
  });

  it("activates a different QR layer with its own state and content type", () => {
    const otherLayerId = "qr-layer-secondary";
    const otherQr: QraftyState = {
      ...createDefaultCanvasWorkspaceQrState(),
      margin: 42,
      valueSegments: ["a", "b"],
    };

    let state = createInitialCanvasSurfaceState();
    state = canvasReducer(state, patch("selectedDotColor", "#ff0000"));
    state = canvasReducer(state, {
      type: "SET_ACTIVE_QR",
      qr: otherQr,
      layerId: otherLayerId,
      contentType: "sms",
    });

    expect(state.activeQrLayerId).toBe(otherLayerId);
    expect(state.selectedContentType).toBe("sms");
    expect(state.qrStateByLayerId[otherLayerId].margin).toBe(42);
    expect(state.qrStateByLayerId[PRIMARY_QR_LAYER_ID].dataModulesSettings.color).toBe("#ff0000");
    expect(state.selectedValueSegmentsText).toBe("a\nb");
    expect(state.contentTypeByLayerId[otherLayerId]).toBe("sms");
  });

  it("writes card edits through to the card state", () => {
    const initial = createInitialCanvasSurfaceState();
    const card = { ...createDefaultCanvasCardState(), fill: "#abcdef" };
    const next = canvasReducer(initial, patch("selectedCardState", card));

    expect(next.cardState.fill).toBe("#abcdef");
  });
});

describe("qr draft projection", () => {
  it("projects document fields from a QraftyState", () => {
    const qr: QraftyState = {
      ...createDefaultCanvasWorkspaceQrState(),
      margin: 24,
      dataModulesSettings: {
        ...createDefaultCanvasWorkspaceQrState().dataModulesSettings,
        type: "circle",
      },
      logo: { ...createDefaultCanvasWorkspaceQrState().logo, source: "preset", value: "github" },
    };
    const fields = qrStateToDraftFields(qr);

    expect(fields.selectedQrMargin).toBe(24);
    expect(fields.selectedDotType).toBe("circle");
    expect(fields.selectedLogoSourceMode).toBe("preset");
    expect(fields.selectedLogoSize).toBe(Math.round(qr.imageOptions.imageSize * 100));
  });

  it("round-trips patched fields back into the QR state", () => {
    const qr = createDefaultCanvasWorkspaceQrState();
    const buffers = qrStateToDraftBuffers(qr);

    const patched = applyQrDraftFieldPatch(
      qr,
      "selectedDotsPalette",
      ["#111111", "#222222"],
      buffers as never,
    );
    expect(patched.dotsPalette).toEqual(["#111111", "#222222"]);

    const logoPatched = applyQrDraftFieldPatch(qr, "selectedLogoSize", 50, buffers as never);
    expect(logoPatched.imageOptions.imageSize).toBe(0.5);
  });

  it("seeds logo buffers per asset source", () => {
    const urlQr: QraftyState = {
      ...createDefaultCanvasWorkspaceQrState(),
      logo: {
        ...createDefaultCanvasWorkspaceQrState().logo,
        source: "url",
        value: "https://example.com/a.png",
      },
    };
    const buffers = qrStateToDraftBuffers(urlQr);
    expect(buffers.selectedLogoAssetSourceMode).toBe("url");
    expect(buffers.selectedLogoRemoteUrl).toBe("https://example.com/a.png");
    expect(buffers.selectedLogoUploadValue).toBe("");
  });
});
