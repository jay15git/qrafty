import { emitReactQrCodeMarkup } from "@qrafty/qr-internal/react-qr-code";

import { toReactQrCodeProps } from "@/features/qr/adapters/react-qr-adapter";
import type { QraftyState } from "@/features/qr/model/state";
import {
  getQrEncodeCacheKey,
  readCachedQrEncodeMarkup,
  writeCachedQrEncodeMarkup,
} from "@/features/qr/rendering/qr-encode-cache";
import { stripXmlDeclaration } from "@/features/qr/rendering/qr-svg-markup";
import { buildQrEmitExtensions } from "@/features/qr/rendering/emit-extensions";
import {
  alignReactQrSvgToModuleGrid,
  createCanvasQrArtworkState,
  sanitizeCanvasQrArtworkMarkup,
} from "@/features/canvas/rendering/qr-artwork";

function renderReactQrMarkupCached(state: QraftyState) {
  const cacheKey = getQrEncodeCacheKey(state);
  const cached = readCachedQrEncodeMarkup(cacheKey);

  if (cached) {
    return cached;
  }

  const extensions = buildQrEmitExtensions(state);
  const markup = alignReactQrSvgToModuleGrid(
    stripXmlDeclaration(emitReactQrCodeMarkup(toReactQrCodeProps(state), extensions)),
    extensions?.width,
    extensions?.height,
  );
  writeCachedQrEncodeMarkup(cacheKey, markup);

  return markup;
}

export function buildCanvasQraftyMarkup(state: QraftyState) {
  const artworkState = createCanvasQrArtworkState(state);
  const markup = renderReactQrMarkupCached(artworkState);

  return sanitizeCanvasQrArtworkMarkup(markup);
}
