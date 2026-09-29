import { emitReactQrCodeMarkup } from "@qrafty/qr-internal/react-qr-code";

import { toReactQrCodeProps } from "@/features/qr/adapters/react-qr-adapter";
import type { QraftyState } from "@/features/qr/model/state";
import {
  getQrEncodeCacheKey,
  readCachedQrEncodeMarkup,
  writeCachedQrEncodeMarkup,
} from "@/features/qr/rendering/qr-encode-cache";
import {
  applyQraftyQrSvgMarkupExtensions,
  stripXmlDeclaration,
} from "@/features/qr/rendering/qr-svg-markup";
import {
  createCanvasQrArtworkState,
  sanitizeCanvasQrArtworkMarkup,
} from "@/features/canvas/rendering/qr-artwork";

function renderReactQrBaseMarkupCached(state: QraftyState) {
  const cacheKey = getQrEncodeCacheKey(state);
  const cached = readCachedQrEncodeMarkup(cacheKey);

  if (cached) {
    return cached;
  }

  const markup = stripXmlDeclaration(emitReactQrCodeMarkup(toReactQrCodeProps(state)));
  writeCachedQrEncodeMarkup(cacheKey, markup);

  return markup;
}

export function buildCanvasQraftyMarkup(state: QraftyState) {
  const artworkState = createCanvasQrArtworkState(state);
  const baseMarkup = renderReactQrBaseMarkupCached(artworkState);

  return sanitizeCanvasQrArtworkMarkup(applyQraftyQrSvgMarkupExtensions(baseMarkup, artworkState));
}
