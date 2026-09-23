// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  prepareStandaloneSvgMarkup,
  rasterizeSvgMarkupToCanvas,
} from "@/features/qr/rendering/svg-raster";

const originalCreateObjectUrl = URL.createObjectURL;
const originalRevokeObjectUrl = URL.revokeObjectURL;
const originalImage = globalThis.Image;

describe("svg raster helpers", () => {
  let canvasContext: {
    clearRect: ReturnType<typeof vi.fn>;
    drawImage: ReturnType<typeof vi.fn>;
    fillRect: ReturnType<typeof vi.fn>;
    fillStyle: string;
    imageSmoothingEnabled: boolean;
  };

  beforeEach(() => {
    canvasContext = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "",
      imageSmoothingEnabled: true,
    };

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        return {
          getContext: vi.fn(() => canvasContext),
          height: 0,
          width: 0,
        } as unknown as HTMLCanvasElement;
      }

      return document.createElementNS("http://www.w3.org/1999/xhtml", tagName);
    });

    URL.createObjectURL = vi.fn(() => "blob:mock-svg");
    URL.revokeObjectURL = vi.fn();

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = "";

      constructor() {
        queueMicrotask(() => {
          this.onload?.();
        });
      }
    }

    globalThis.Image = MockImage as unknown as typeof Image;
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    globalThis.Image = originalImage;
    vi.restoreAllMocks();
  });

  it("injects svg xmlns when missing", () => {
    const prepared = prepareStandaloneSvgMarkup(
      '<svg width="100" height="100"><rect width="10" height="10" /></svg>',
    );

    expect(prepared).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("preserves existing svg xmlns", () => {
    const prepared = prepareStandaloneSvgMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="10" height="10" /></svg>',
    );

    expect(prepared.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g)).toHaveLength(1);
  });

  it("injects xlink xmlns when markup uses xlink:href", () => {
    const prepared = prepareStandaloneSvgMarkup(
      '<svg width="100" height="100"><image xlink:href="#logo" /></svg>',
    );

    expect(prepared).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(prepared).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
  });

  it("disables image smoothing when rasterizing svg markup", async () => {
    await rasterizeSvgMarkupToCanvas(
      '<svg width="100" height="100"><rect width="10" height="10" /></svg>',
      512,
      512,
    );

    expect(canvasContext.imageSmoothingEnabled).toBe(false);
    expect(canvasContext.drawImage).toHaveBeenCalled();
  });

  it("fills background color before drawing svg", async () => {
    await rasterizeSvgMarkupToCanvas(
      '<svg width="100" height="100"><rect width="10" height="10" /></svg>',
      512,
      512,
      { backgroundColor: "#ffffff" },
    );

    expect(canvasContext.fillStyle).toBe("#ffffff");
    expect(canvasContext.fillRect).toHaveBeenCalledWith(0, 0, 512, 512);
  });
});
