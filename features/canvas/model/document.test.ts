import { describe, expect, it } from "vitest";

import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import { getCanvasQrLayerId, getQrCanvasLayers } from "@/features/canvas/model/layers/shared";
import {
  cloneCanvasWorkspaceDocument,
  createDefaultCanvasWorkspaceDocument,
  serializeCanvasWorkspaceDocument,
} from "@/features/canvas/model/document";
import { parseCanvasWorkspaceDocument } from "@/features/canvas/model/document/parse";

describe("canvas workspace document", () => {
  it("flattens legacy multi-pane documents into qr layers on one canvas", () => {
    const document = createDefaultCanvasWorkspaceDocument();
    document.qrOrder = [DASHBOARD_QR_NODE_ID, "qr-code-extra"];
    document.activeQrNodeId = "qr-code-extra";
    document.qrStateByNodeId["qr-code-extra"] = {
      ...cloneCanvasWorkspaceDocument(document).qrStateByNodeId[DASHBOARD_QR_NODE_ID]!,
      data: "https://example.com/extra",
    };
    document.cardStateByNodeId["qr-code-extra"] =
      cloneCanvasWorkspaceDocument(document).cardStateByNodeId[DASHBOARD_QR_NODE_ID]!;
    document.layerStateByNodeId["qr-code-extra"] =
      cloneCanvasWorkspaceDocument(document).layerStateByNodeId[DASHBOARD_QR_NODE_ID]?.map(
        (layer) => ({
          ...layer,
          id: layer.kind === "card" ? "qr-code-extra:card" : "qr-code-extra:qr",
          nodeId: "qr-code-extra",
        }),
      ) ?? [];
    document.selectedContentType = "wifi";
    document.contentTypeByNodeId = {
      [DASHBOARD_QR_NODE_ID]: "auto",
      "qr-code-extra": "wifi",
    };
    document.contentValuesByType = {
      wifi: {
        encryption: "WPA",
        hidden: true,
        password: "secret",
        ssid: "Studio",
      },
    };

    const parsed = parseCanvasWorkspaceDocument(serializeCanvasWorkspaceDocument(document));
    const layers = parsed.layerStateByNodeId[DASHBOARD_QR_NODE_ID] ?? [];

    expect(parsed.qrOrder).toEqual([DASHBOARD_QR_NODE_ID]);
    expect(parsed.activeQrNodeId).toBe(DASHBOARD_QR_NODE_ID);
    expect(getQrCanvasLayers(layers)).toHaveLength(2);
    expect(
      Object.values(parsed.qrStateByLayerId).some(
        (state) => state.data === "https://example.com/extra",
      ),
    ).toBe(true);
    expect(parsed.contentTypeByLayerId[getCanvasQrLayerId(DASHBOARD_QR_NODE_ID)]).toBe("auto");
  });

  it("migrates missing layer state into independent card and qr layers", () => {
    const document = createDefaultCanvasWorkspaceDocument();
    const serialized = JSON.parse(serializeCanvasWorkspaceDocument(document));
    delete serialized.layerStateByNodeId;

    const parsed = parseCanvasWorkspaceDocument(serialized);
    const layers = parsed.layerStateByNodeId[DASHBOARD_QR_NODE_ID] ?? [];

    expect(layers.map((layer) => layer.kind)).toEqual(["card", "qr"]);
    expect(layers[0]).toMatchObject({
      id: `${DASHBOARD_QR_NODE_ID}:card`,
      isVisible: true,
      name: "Card",
      zIndex: 0,
    });
    expect(layers[1]).toMatchObject({
      height: 240,
      id: `${DASHBOARD_QR_NODE_ID}:qr`,
      name: "QR code",
      width: 240,
      zIndex: 1,
    });
  });

  it("falls back to defaults for invalid documents", () => {
    expect(parseCanvasWorkspaceDocument(null)).toMatchObject({
      activeQrNodeId: DASHBOARD_QR_NODE_ID,
      version: 1,
    });
    expect(parseCanvasWorkspaceDocument({ version: 999, qrOrder: [] })).toMatchObject({
      activeQrNodeId: DASHBOARD_QR_NODE_ID,
      version: 1,
    });
  });

  it("creates one default pane when saved state is missing pane data", () => {
    const parsed = parseCanvasWorkspaceDocument({
      activeQrNodeId: "missing-pane",
      cardStateByNodeId: {},
      contentTypeByNodeId: {},
      contentValuesByType: {},
      qrOrder: [],
      qrStateByNodeId: {},
      selectedContentType: "auto",
      version: 1,
    });

    expect(parsed.qrOrder).toEqual([DASHBOARD_QR_NODE_ID]);
    expect(parsed.activeQrNodeId).toBe(DASHBOARD_QR_NODE_ID);
    expect(parsed.qrStateByNodeId[DASHBOARD_QR_NODE_ID]?.data).toBe("https://qrafty.local/launch");
    expect(parsed.cardStateByNodeId[DASHBOARD_QR_NODE_ID]?.enabled).toBe(true);
  });

  it("migrates legacy background shape percent growth to pixel padding", () => {
    const document = createDefaultCanvasWorkspaceDocument();
    document.qrStateByNodeId[DASHBOARD_QR_NODE_ID]!.backgroundShapeOptions = {
      edgeBlur: 4,
      sizePercent: 125,
      strokeColor: "#111827",
      strokeOpacity: 70,
      strokeWidth: 8,
    } as unknown as (typeof document.qrStateByNodeId)[typeof DASHBOARD_QR_NODE_ID]["backgroundShapeOptions"];

    const parsed = parseCanvasWorkspaceDocument(serializeCanvasWorkspaceDocument(document));

    expect(parsed.qrStateByNodeId[DASHBOARD_QR_NODE_ID]?.backgroundShapeOptions).toEqual({
      edgeBlur: 4,
      paddingPx: 30,
      shadowColor: "#111827",
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 72,
      strokeColor: "#111827",
      strokeOpacity: 70,
      strokeWidth: 8,
      tiltX: 0,
      tiltY: 0,
    });
  });

  it("keeps legacy edge blur as shadow blur and defaults missing shadow fields", () => {
    const document = createDefaultCanvasWorkspaceDocument();
    document.qrStateByNodeId[DASHBOARD_QR_NODE_ID]!.backgroundShapeOptions = {
      edgeBlur: 12,
      paddingPx: 8,
      strokeColor: "#111827",
      strokeOpacity: 100,
      strokeWidth: 0,
    } as unknown as (typeof document.qrStateByNodeId)[typeof DASHBOARD_QR_NODE_ID]["backgroundShapeOptions"];

    const parsed = parseCanvasWorkspaceDocument(serializeCanvasWorkspaceDocument(document));

    expect(parsed.qrStateByNodeId[DASHBOARD_QR_NODE_ID]?.backgroundShapeOptions).toEqual({
      edgeBlur: 12,
      paddingPx: 8,
      shadowColor: "#111827",
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 72,
      strokeColor: "#111827",
      strokeOpacity: 100,
      strokeWidth: 0,
      tiltX: 0,
      tiltY: 0,
    });
  });

  it("drops legacy background shape percent shrinkage during migration", () => {
    const document = createDefaultCanvasWorkspaceDocument();
    document.qrStateByNodeId[DASHBOARD_QR_NODE_ID]!.backgroundShapeOptions = {
      edgeBlur: 0,
      sizePercent: 80,
      strokeColor: "#111827",
      strokeOpacity: 100,
      strokeWidth: 0,
    } as unknown as (typeof document.qrStateByNodeId)[typeof DASHBOARD_QR_NODE_ID]["backgroundShapeOptions"];

    const parsed = parseCanvasWorkspaceDocument(serializeCanvasWorkspaceDocument(document));

    expect(parsed.qrStateByNodeId[DASHBOARD_QR_NODE_ID]?.backgroundShapeOptions.paddingPx).toBe(0);
  });

  it("round-trips background shape tilt through document serialization", () => {
    const document = createDefaultCanvasWorkspaceDocument();
    document.qrStateByNodeId[DASHBOARD_QR_NODE_ID]!.backgroundShapeOptions = {
      ...document.qrStateByNodeId[DASHBOARD_QR_NODE_ID]!.backgroundShapeOptions,
      tiltX: 18,
      tiltY: -24,
    };

    const parsed = parseCanvasWorkspaceDocument(serializeCanvasWorkspaceDocument(document));

    expect(parsed.qrStateByNodeId[DASHBOARD_QR_NODE_ID]?.backgroundShapeOptions).toMatchObject({
      tiltX: 18,
      tiltY: -24,
    });
  });

  it("defaults card size mode to fixed 4:3 for unknown documents", () => {
    const parsed = parseCanvasWorkspaceDocument({ version: 999, qrOrder: [] });

    expect(parsed.cardStateByNodeId[DASHBOARD_QR_NODE_ID]).toMatchObject({
      height: 810,
      lockAspectRatio: true,
      sizeMode: "fixed",
      sizePresetId: "ratio-4-3",
      styleMode: "paper-shader",
      width: 1080,
    });
  });
});
