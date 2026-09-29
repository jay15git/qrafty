import type { DashboardQrNodePayload } from "@/features/qr/rendering/compose-scene";
import {
  buildQrExtension,
  createAlignedCornerGradientExtension,
  getQrRenderedDimensions,
} from "@/features/qr/rendering/svg-extension";
import { parseSvgIrMarkup, serializeSvgElement } from "@/features/qr/rendering/svg-element";
import { clampQrSize, type QraftyState } from "@/features/qr/model/state";
import { alignReactQrSvgToModuleGrid } from "@/features/canvas/rendering/qr-artwork";

export function createDashboardSurfaceQrState(state: QraftyState): QraftyState {
  return {
    ...state,
    type: "svg",
  };
}

export function stripXmlDeclaration(markup: string) {
  return markup
    .replace(/<\?xml[\s\S]*?\?>\s*/i, "")
    .replace(/<!doctype[\s\S]*?>\s*/i, "")
    .trim();
}

export function applyQraftyQrSvgMarkupExtensions(markup: string, state: QraftyState) {
  const extension = buildQrExtension(state);
  const cornerExtension = createAlignedCornerGradientExtension(state);
  let result = markup;

  if (extension || cornerExtension) {
    const svg = parseSvgIrMarkup(markup);
    const options = {
      height: clampQrSize(state.height),
      width: clampQrSize(state.width),
    };

    extension?.(svg, options);
    cornerExtension?.(svg, options);
    result = serializeSvgElement(svg);
  }

  const renderedDimensions = getQrRenderedDimensions(state);

  return alignReactQrSvgToModuleGrid(result, renderedDimensions.width, renderedDimensions.height);
}

export function buildDashboardQrNodePayloadFromBaseMarkup(
  markup: string,
  state: QraftyState,
): DashboardQrNodePayload {
  const dashboardState = createDashboardSurfaceQrState(state);

  return {
    markup: applyQraftyQrSvgMarkupExtensions(markup, dashboardState),
    naturalHeight: getQrRenderedDimensions(dashboardState).height,
    naturalWidth: getQrRenderedDimensions(dashboardState).width,
  };
}
