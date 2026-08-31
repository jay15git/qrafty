import { adaptExternalQRCodeSVG } from "@qrafty/qr/dot-matrix";

import { annotateCanvasSvgForDotMatrixMotion as annotateSvgElementForDotMatrixMotion } from "@/features/qr-code/rendering/svg-extension";
import type { QraftyState } from "@/features/qr-code/model/state";

export function adaptCanvasSvgMarkupForDotMatrixMotion(markup: string, state: QraftyState) {
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

  if (annotateSvgElementForDotMatrixMotion(svg, state) === null) {
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
