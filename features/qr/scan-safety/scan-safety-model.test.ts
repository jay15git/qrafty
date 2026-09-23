import { describe, expect, it } from "vitest";
import encodeQR from "qr";

import { createDefaultQraftyState, clampQrSize } from "@/features/qr/model/state";
import { getQraftyQrExpectedText, getQraftyQrModuleGrid } from "@/features/qr/scan-safety/qr-grid";
import decodeQR from "qr/decode.js";
import {
  getTransformedLayerBounds,
  resolveQrScanRegion,
} from "@/features/qr/scan-safety/scan-region";

const cardLayer = {
  height: 800,
  width: 800,
  x: -400,
  y: -400,
};

describe("scan-safety QR metadata", () => {
  it("returns the concatenated payload for segmented QR values", () => {
    const state = createDefaultQraftyState();
    state.data = "unused";
    state.valueSegments = [" https://qrafty.app ", " /docs "];

    expect(getQraftyQrExpectedText(state)).toBe("https://qrafty.app/docs");
  });

  it("exposes actual version and boosted error correction", () => {
    const state = {
      ...createDefaultQraftyState(),
      width: clampQrSize(320),
      height: clampQrSize(320),
    };
    state.data = "https://qrafty.app";
    state.valueSegments = [];
    state.qrOptions.errorCorrectionLevel = "L";
    state.qrOptions.boostLevel = true;
    state.qrOptions.typeNumber = 5;

    const grid = getQraftyQrModuleGrid(state);

    expect(grid?.version).toBe(5);
    expect(grid?.errorCorrectionLevel).toBe("H");
    expect(grid?.numCells).toBe(grid!.modules.length + grid!.margin * 2);
  });
});

function renderQrImage(text: string) {
  const modules = encodeQR(text, "raw");
  const margin = 4;
  const scale = 6;
  const size = (modules.length + margin * 2) * scale;
  const data = new Uint8ClampedArray(size * size * 4);

  data.fill(255);
  for (let row = 0; row < modules.length; row++) {
    for (let col = 0; col < modules[row]!.length; col++) {
      if (!modules[row]![col]) {
        continue;
      }

      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          const px = (row + margin) * scale + y;
          const py = (col + margin) * scale + x;
          const offset = (px * size + py) * 4;
          data[offset] = 0;
          data[offset + 1] = 0;
          data[offset + 2] = 0;
        }
      }
    }
  }

  return { data, height: size, width: size };
}

describe("qr decode", () => {
  it("decodes a rendered QR back to its payload", () => {
    expect(decodeQR(renderQrImage("https://qrafty.app"))).toBe("https://qrafty.app");
  });

  it("throws when no QR is present", () => {
    expect(() =>
      decodeQR({
        data: new Uint8ClampedArray(64 * 64 * 4).fill(255),
        height: 64,
        width: 64,
      }),
    ).toThrow();
  });
});

describe("scan region geometry", () => {
  it("expands the transformed QR bounds but clips to the card", () => {
    const qrLayer = {
      height: 200,
      rotation: 0,
      tiltX: 0,
      tiltY: 0,
      width: 200,
      x: 300,
      y: -100,
    };

    const region = resolveQrScanRegion(qrLayer, cardLayer);

    expect(region.minX).toBe(250);
    expect(region.minY).toBe(-150);
    expect(region.width).toBe(150);
    expect(region.height).toBe(300);
  });

  it("accounts for rotation when selecting the export crop", () => {
    const qrLayer = {
      height: 200,
      rotation: 45,
      tiltX: 0,
      tiltY: 0,
      width: 200,
      x: -100,
      y: -100,
    };

    const bounds = getTransformedLayerBounds(qrLayer);

    expect(bounds.width).toBeGreaterThan(270);
    expect(bounds.height).toBeGreaterThan(270);
  });
});
