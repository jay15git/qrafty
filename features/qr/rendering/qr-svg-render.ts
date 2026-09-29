import { emitReactQrCodeMarkup } from "@qrafty/qr-internal/react-qr-code";

import { toReactQrCodeProps } from "@/features/qr/adapters/react-qr-adapter";
import { type QraftyState } from "@/features/qr/model/state";
import {
  getQrEncodeCacheKey,
  readCachedQrEncodeMarkup,
  writeCachedQrEncodeMarkup,
} from "@/features/qr/rendering/qr-encode-cache";
import { alignReactQrSvgToModuleGrid } from "@/features/canvas/rendering/qr-artwork";
import { buildQrEmitExtensions } from "@/features/qr/rendering/emit-extensions";
import {
  buildDashboardQrNodePayloadFromMarkup,
  createDashboardSurfaceQrState,
  stripXmlDeclaration,
} from "@/features/qr/rendering/qr-svg-markup";

function renderReactQrMarkup(state: QraftyState) {
  const dashboardState = createDashboardSurfaceQrState(state);
  const cacheKey = getQrEncodeCacheKey(dashboardState);
  const cached = readCachedQrEncodeMarkup(cacheKey);

  if (cached) {
    return cached;
  }

  const extensions = buildQrEmitExtensions(dashboardState);
  const markup = alignReactQrSvgToModuleGrid(
    stripXmlDeclaration(emitReactQrCodeMarkup(toReactQrCodeProps(dashboardState), extensions)),
    extensions?.width,
    extensions?.height,
  );
  writeCachedQrEncodeMarkup(cacheKey, markup);

  return markup;
}

export async function buildDashboardQrNodePayload(state: QraftyState) {
  return buildDashboardQrNodePayloadFromMarkup(renderReactQrMarkup(state), state);
}

export function renderDashboardQrSvgMarkup(state: QraftyState) {
  return renderReactQrMarkup(state);
}
