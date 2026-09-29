import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server.browser";

import { ReactQRCode, emitReactQrCodeMarkup } from "@qrafty/qr-internal/react-qr-code";

import { toReactQrCodeProps } from "@/features/qr/adapters/react-qr-adapter";
import { createDefaultQraftyState, type QraftyState } from "@/features/qr/model/state";

const renderReference = (state: QraftyState) =>
  renderToStaticMarkup(createElement(ReactQRCode, toReactQrCodeProps(state)));

const renderEmitter = (state: QraftyState) => emitReactQrCodeMarkup(toReactQrCodeProps(state));

const expectParity = (name: string, state: QraftyState) => {
  it(name, () => {
    expect(renderEmitter(state)).toBe(renderReference(state));
  });
};

const withState = (patch: Partial<QraftyState>): QraftyState => ({
  ...createDefaultQraftyState(),
  ...patch,
});

describe("emitReactQrCodeMarkup parity with renderToStaticMarkup", () => {
  expectParity("default state", createDefaultQraftyState());

  describe("data module styles", () => {
    for (const type of [
      "square",
      "square-sm",
      "pinched-square",
      "rounded",
      "leaf",
      "vertical-line",
      "horizontal-line",
      "circuit-board",
      "circle",
      "diamond",
      "star",
      "heart",
      "hashtag",
    ] as const) {
      expectParity(
        `dataModulesSettings.type=${type}`,
        withState({
          dataModulesSettings: {
            ...createDefaultQraftyState().dataModulesSettings,
            type,
          },
        }),
      );
    }

    expectParity(
      "moduleSize + lineWidth overrides",
      withState({
        dataModulesSettings: {
          ...createDefaultQraftyState().dataModulesSettings,
          type: "vertical-line",
          moduleSize: 0.85,
          lineWidth: 0.6,
        },
      }),
    );

    it("randomSize enabled", () => {
      const state = withState({
        dataModulesSettings: {
          ...createDefaultQraftyState().dataModulesSettings,
          type: "circle",
          roundSize: false,
        },
      });
      let seed = 42;
      const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
      const spy = vi.spyOn(Math, "random").mockImplementation(rand);
      const reference = renderReference(state);
      seed = 42;
      const emitted = renderEmitter(state);
      spy.mockRestore();
      expect(emitted).toBe(reference);
    });
  });

  describe("finder pattern styles", () => {
    for (const type of [
      "square",
      "rounded-sm",
      "rounded",
      "rounded-lg",
      "circle",
      "pinched-square",
      "inpoint-sm",
      "inpoint",
      "inpoint-lg",
      "outpoint-sm",
      "outpoint",
      "outpoint-lg",
      "leaf-sm",
      "leaf",
      "leaf-lg",
    ] as const) {
      expectParity(
        `finderPatternOuterSettings.type=${type}`,
        withState({
          finderPatternOuterSettings: {
            ...createDefaultQraftyState().finderPatternOuterSettings,
            type,
          },
        }),
      );
    }

    for (const type of [
      "square",
      "rounded-sm",
      "rounded",
      "rounded-lg",
      "circle",
      "diamond",
      "pinched-square",
      "star",
      "heart",
      "microchip",
      "hashtag",
      "inpoint-sm",
      "inpoint",
      "inpoint-lg",
      "outpoint-sm",
      "outpoint",
      "outpoint-lg",
      "leaf-sm",
      "leaf",
      "leaf-lg",
    ] as const) {
      expectParity(
        `finderPatternInnerSettings.type=${type}`,
        withState({
          finderPatternInnerSettings: {
            ...createDefaultQraftyState().finderPatternInnerSettings,
            type,
          },
        }),
      );
    }
  });

  describe("fills", () => {
    expectParity(
      "unified linear gradient",
      withState({
        gradientLinkMode: "unified",
        dotsColorMode: "gradient",
        dataModulesGradient: {
          enabled: true,
          type: "linear",
          rotation: 35,
          colorStops: [
            { offset: 0, color: "#ff0000" },
            { offset: 1, color: "#0000ff" },
          ],
        },
      }),
    );

    expectParity(
      "unified radial gradient",
      withState({
        gradientLinkMode: "unified",
        dotsColorMode: "gradient",
        dataModulesGradient: {
          enabled: true,
          type: "radial",
          rotation: 0,
          colorStops: [
            { offset: 0, color: "#123456" },
            { offset: 1, color: "#def012" },
          ],
        },
      }),
    );

    expectParity(
      "background linear gradient",
      withState({
        backgroundGradient: {
          enabled: true,
          type: "linear",
          rotation: 200,
          colorStops: [
            { offset: 0, color: "#f8fafc" },
            { offset: 1, color: "#dbeafe" },
          ],
        },
      }),
    );

    expectParity(
      "background radial gradient",
      withState({
        backgroundGradient: {
          enabled: true,
          type: "radial",
          rotation: 0,
          colorStops: [
            { offset: 0, color: "#ffffff" },
            { offset: 1, color: "#000000" },
          ],
        },
      }),
    );

    expectParity(
      "transparent background",
      withState({
        backgroundOptions: {
          color: "#f8fafc",
          round: 25,
          transparent: true,
        },
      }),
    );
  });

  describe("logo image", () => {
    expectParity(
      "ratio logo with excavation",
      withState({
        logo: {
          source: "url",
          value: "https://example.com/logo.png",
          presetId: undefined,
          presetColor: undefined,
        },
        imageOptions: {
          ...createDefaultQraftyState().imageOptions,
          hideBackgroundDots: true,
          margin: 8,
          imageSize: 0.5,
        },
      }),
    );

    expectParity(
      "pixel-sized custom-position logo with crossOrigin + opacity",
      withState({
        logo: {
          source: "url",
          value: "https://example.com/logo.png",
          presetId: undefined,
          presetColor: undefined,
        },
        imageOptions: {
          ...createDefaultQraftyState().imageOptions,
          sizeMode: "pixels",
          widthPx: 40,
          heightPx: 30,
          logoPositionMode: "custom",
          x: 10,
          y: 20,
          crossOrigin: "anonymous",
          opacity: 0.7,
        },
      }),
    );
  });

  describe("encoding + chrome", () => {
    expectParity(
      "valueSegments multi-part",
      withState({ valueSegments: ["https://a.test", "second part", ""] }),
    );

    for (const level of ["L", "M", "Q", "H"] as const) {
      expectParity(
        `errorCorrectionLevel=${level}`,
        withState({
          qrOptions: {
            ...createDefaultQraftyState().qrOptions,
            errorCorrectionLevel: level,
          },
        }),
      );
    }

    expectParity(
      "higher minVersion + boostLevel",
      withState({
        qrOptions: {
          ...createDefaultQraftyState().qrOptions,
          typeNumber: 10,
          boostLevel: false,
        },
      }),
    );

    expectParity("margin 0", withState({ margin: 0 }));
    expectParity("margin 40", withState({ margin: 40 }));
    expectParity("size clamped", withState({ width: 1200, height: 1200 }));

    expectParity(
      "aria label with escaping characters",
      withState({ ariaLabel: `QR <Code> & "Friends" 'test'` }),
    );

    expectParity("unicode data", withState({ data: "https://example.com/emoji-🚀" }));
  });
});
