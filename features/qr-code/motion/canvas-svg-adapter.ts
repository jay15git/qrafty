import { adaptExternalQRCodeSVG } from "@new-qr/qr-internal/bitjson-vendor";

import { annotateCanvasSvgForBitjsonMotion } from "@/features/qr-code/rendering/svg-extension";
import type { QrStudioState } from "@/features/qr-code/model/state";

export function annotateCanvasSvgForBitjson(markup: string, state: QrStudioState) {
  if (!markup.trim()) {
    return undefined;
  }

  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return undefined;
  }

  const document = new DOMParser().parseFromString(markup, "image/svg+xml");

  if (document.querySelector("parsererror")) {
    return undefined;
  }

  const svg = document.documentElement as unknown as SVGElement;

  if (svg.tagName.toLowerCase() !== "svg") {
    return undefined;
  }

  if (annotateCanvasSvgForBitjsonMotion(svg, state) === null) {
    return undefined;
  }

  const serialized = new XMLSerializer().serializeToString(svg);

  return adaptExternalQRCodeSVG(serialized, {
    moduleColor: state.dataModulesSettings.color,
    positionCenterColor: state.finderPatternInnerSettings.color,
    positionRingColor: state.finderPatternOuterSettings.color,
    squares: false,
  });
}
