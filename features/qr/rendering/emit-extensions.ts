import type { QrSvgEmitExtensions, QrSvgEmitGradient } from "@qrafty/qr-internal/react-qr-code";
import { getActiveDotsPalette } from "@qrafty/qr-internal/core";

import {
  getQrBackgroundShapeContentFrame,
  getQrBackgroundShapeDefinition,
} from "@/features/qr/styles/background-shapes";
import {
  getCustomCornerDotShapeGeometry,
  isCustomCornerDotShape,
} from "@/features/qr/styles/custom-corner-dot-shapes";
import {
  clampQrSize,
  getAssetValue,
  type QraftyGradient,
  type QraftyState,
} from "@/features/qr/model/state";
import {
  coerceQrMarginCells,
  getBackgroundShapeTransform,
  getCellSpaceBackgroundMetrics,
  hasActiveBackgroundSurfaceOptions,
  normalizeBackgroundShapeOptions,
} from "./background-shape-layout";

function toEmitGradient(gradient: QraftyGradient): QrSvgEmitGradient {
  return {
    center: gradient.center,
    rotation: gradient.rotation,
    stops: gradient.colorStops.map((stop) => ({ color: stop.color, offset: stop.offset })),
    type: gradient.type,
  };
}

function resolveCellSpaceLayout(
  state: Pick<QraftyState, "backgroundShapeOptions" | "height" | "margin" | "width">,
  layout: {
    contentFrame?: ReturnType<typeof getQrBackgroundShapeContentFrame>;
    viewBox?: { height: number; width: number };
  },
) {
  return (numCells: number) => {
    const { metrics, shapeOptions } = getCellSpaceBackgroundMetrics(
      numCells,
      { height: clampQrSize(state.height), width: clampQrSize(state.width) },
      normalizeBackgroundShapeOptions(state.backgroundShapeOptions),
      {
        contentFrame: layout.contentFrame,
        marginCells: coerceQrMarginCells(state.margin),
        viewBox: layout.viewBox,
      },
    );

    return { metrics, shapeOptions };
  };
}

function backgroundFill(state: Pick<QraftyState, "backgroundGradient" | "backgroundOptions">) {
  return {
    color: state.backgroundOptions.color,
    gradient: state.backgroundGradient.enabled
      ? toEmitGradient(state.backgroundGradient)
      : undefined,
  };
}

/**
 * Maps dashboard state to emit-time extension options. Mirrors the historical
 * `buildQrExtension` gating exactly: when it would return null this returns
 * undefined and `emitReactQrCodeMarkup` serializes in JSX mode.
 */
export function buildQrEmitExtensions(state: QraftyState): QrSvgEmitExtensions | undefined {
  const ext: QrSvgEmitExtensions = {
    height: clampQrSize(state.height),
    margin: state.margin,
    width: clampQrSize(state.width),
  };
  let active = false;

  if (isCustomCornerDotShape(state.finderPatternInnerSettings.type)) {
    const shape = state.finderPatternInnerSettings.type;
    ext.customCornerDot = {
      color: state.finderPatternInnerSettings.color,
      geometry: (x, y, size) => getCustomCornerDotShapeGeometry(shape, x, y, size),
    };
    active = true;
  }

  const backgroundImage = getAssetValue(state.backgroundImage);
  const backgroundShape = backgroundImage
    ? null
    : getQrBackgroundShapeDefinition(state.backgroundShapeId);

  if (backgroundImage) {
    ext.backgroundImage = { href: backgroundImage, round: state.backgroundOptions.round };
    active = true;
  }

  const unifiedModuleGradient =
    state.gradientLinkMode === "unified" &&
    state.dotsColorMode === "gradient" &&
    state.dataModulesGradient.enabled;
  const moduleFillImage = getAssetValue(state.moduleFillImage);
  const unifiedModuleImage = state.dotsColorMode === "image" && Boolean(moduleFillImage);

  if (state.dotsColorMode === "gradient" && !unifiedModuleGradient) {
    ext.dotsGradient = toEmitGradient(state.dataModulesGradient);
    active = true;
  }

  if (state.dotsColorMode === "palette" && getActiveDotsPalette(state.dotsPalette).length > 0) {
    ext.dotsPalette = { colors: state.dotsPalette, seedData: state.data };
    active = true;
  }

  if (unifiedModuleImage && moduleFillImage) {
    ext.unified = { href: moduleFillImage, kind: "image" };
    active = true;
  } else if (unifiedModuleGradient) {
    ext.unified = {
      gradient: {
        center:
          state.dataModulesGradient.type === "radial"
            ? state.dataModulesGradient.center
            : undefined,
        rotation: state.dataModulesGradient.rotation,
        stops: [
          {
            color: state.dataModulesGradient.colorStops[0]?.color ?? "#000000",
            offset: state.dataModulesGradient.colorStops[0]?.offset ?? 0,
          },
          {
            color: state.dataModulesGradient.colorStops[1]?.color ?? "#ffffff",
            offset: state.dataModulesGradient.colorStops[1]?.offset ?? 1,
          },
        ],
        type: state.dataModulesGradient.type,
      },
      kind: "gradient",
    };
    active = true;
  } else {
    const cornerGradients: NonNullable<QrSvgEmitExtensions["cornerGradients"]> = {};

    if (state.finderPatternOuterGradient.enabled) {
      cornerGradients.outer = toEmitGradient(state.finderPatternOuterGradient);
    }

    if (state.finderPatternInnerGradient.enabled) {
      cornerGradients.inner = toEmitGradient(state.finderPatternInnerGradient);
    }

    if (cornerGradients.outer || cornerGradients.inner) {
      ext.cornerGradients = cornerGradients;
      active = true;
    }
  }

  if (backgroundShape) {
    const shape = backgroundShape;
    const resolve = resolveCellSpaceLayout(state, {
      contentFrame: getQrBackgroundShapeContentFrame(shape),
      viewBox: shape.viewBox,
    });
    ext.backgroundShape = {
      fill: backgroundFill(state),
      path: shape.path,
      resolve: (numCells) => {
        const { metrics, shapeOptions } = resolve(numCells);
        return {
          metrics,
          shapeOptions,
          transform: getBackgroundShapeTransform(shape, metrics.backingRegion, shapeOptions),
        };
      },
      viewBoxHeight: shape.viewBox.height,
      viewBoxWidth: shape.viewBox.width,
    };
    active = true;
  } else if (
    !backgroundImage &&
    (!state.backgroundOptions.transparent ||
      state.backgroundGradient.enabled ||
      hasActiveBackgroundSurfaceOptions(state.backgroundShapeOptions))
  ) {
    ext.backgroundSurface = {
      fill: backgroundFill(state),
      resolve: resolveCellSpaceLayout(state, {}),
      round: state.backgroundOptions.round,
    };
    active = true;
  }

  return active ? ext : undefined;
}
