import type { DashboardQrNodePayload } from "@/features/qr/rendering/compose-scene";
import { getQrRenderedDimensions } from "@/features/qr/rendering/background-shape-layout";
import type { QraftyState } from "@/features/qr/model/state";

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

export function buildDashboardQrNodePayloadFromMarkup(
  markup: string,
  state: QraftyState,
): DashboardQrNodePayload {
  const dashboardState = createDashboardSurfaceQrState(state);

  return {
    markup,
    naturalHeight: getQrRenderedDimensions(dashboardState).height,
    naturalWidth: getQrRenderedDimensions(dashboardState).width,
  };
}
