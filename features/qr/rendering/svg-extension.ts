import { getQrBackgroundShapeDefinition } from "@/features/qr/styles/background-shapes";
import { getAssetValue, type QraftyState } from "@/features/qr/model/state";
import { type QrSvgExtensionOptions, type QrSvgExtensionFunction } from "./svg-extension/types";
import { getActiveDotsPalette } from "./svg-extension/dot-matrix-palette";
import {
  createCustomCornerDotExtension,
  createDotsPaletteExtension,
  createDotsGradientExtension,
} from "./svg-extension/dots-extensions";
import { hasActiveBackgroundSurfaceOptions } from "./svg-extension/background-shape-layout";
import {
  createBackgroundShapeExtension,
  createBackgroundSurfaceExtension,
} from "./svg-extension/background-shape-paint";
import { createFinderPatternGradientExtension } from "./svg-extension/finder-corner-gradient";
import {
  createUnifiedImageExtension,
  createUnifiedGradientExtension,
} from "./svg-extension/unified-fill";
import { createBackgroundImageExtension } from "./svg-extension/background-image";

export function buildQrExtension(state: QraftyState) {
  const extensions: QrSvgExtensionFunction[] = [];
  const customCornerDotExtension = createCustomCornerDotExtension(state);

  if (customCornerDotExtension) {
    extensions.push(customCornerDotExtension);
  }

  const backgroundImage = getAssetValue(state.backgroundImage);
  const backgroundShape = backgroundImage
    ? null
    : getQrBackgroundShapeDefinition(state.backgroundShapeId);

  if (backgroundImage) {
    extensions.push(createBackgroundImageExtension(backgroundImage, state.backgroundOptions.round));
  }

  const unifiedModuleGradient =
    state.gradientLinkMode === "unified" &&
    state.dotsColorMode === "gradient" &&
    state.dataModulesGradient.enabled;

  const unifiedModuleImage =
    state.dotsColorMode === "image" && Boolean(getAssetValue(state.moduleFillImage));

  if (state.dotsColorMode === "gradient" && !unifiedModuleGradient) {
    extensions.push(createDotsGradientExtension(state));
  }

  if (state.dotsColorMode === "palette" && getActiveDotsPalette(state).length > 0) {
    extensions.push(createDotsPaletteExtension(state));
  }

  if (unifiedModuleImage) {
    extensions.push(createUnifiedImageExtension(state));
  } else if (unifiedModuleGradient) {
    extensions.push(createUnifiedGradientExtension(state));
  } else {
    if (state.finderPatternOuterGradient.enabled) {
      extensions.push(
        createFinderPatternGradientExtension(
          "finder-patterns-outer",
          state.finderPatternOuterGradient,
          state.margin,
          {
            gradientIdPrefix: "corners-square-color-",
            groupLayer: "corner-frame-gradient",
          },
        ),
      );
    }

    if (state.finderPatternInnerGradient.enabled) {
      extensions.push(
        createFinderPatternGradientExtension(
          "finder-patterns-inner",
          state.finderPatternInnerGradient,
          state.margin,
          {
            gradientIdPrefix: "corners-dot-color-",
            groupLayer: "corner-dot-gradient",
          },
        ),
      );
    }
  }

  if (backgroundShape) {
    extensions.push(createBackgroundShapeExtension(backgroundShape, state));
  } else if (
    !backgroundImage &&
    (!state.backgroundOptions.transparent ||
      state.backgroundGradient.enabled ||
      hasActiveBackgroundSurfaceOptions(state.backgroundShapeOptions))
  ) {
    extensions.push(createBackgroundSurfaceExtension(state));
  }

  if (extensions.length === 0) {
    return null;
  }

  return (svg: SVGElement, options: QrSvgExtensionOptions) => {
    for (const extension of extensions) {
      extension(svg, options);
    }
  };
}

// fallow-ignore-next-line unused-type
export type { QrSvgExtensionOptions, QrSvgExtensionFunction } from "./svg-extension/types";
export { annotateCanvasSvgForDotMatrixMotion } from "./svg-extension/dot-matrix-motion";
// fallow-ignore-next-line unused-type
export type { CanvasQrLayerLayout } from "./svg-extension/background-shape-layout";
export {
  getQrRenderedDimensions,
  getCanvasQrLayerLayout,
  getCanvasQrDomPlacementStyle,
  getCanvasQrBackgroundPathTransform,
  getQrSvgNumCells,
} from "./svg-extension/background-shape-layout";
export {
  getFinderCornerRegions,
  createAlignedCornerGradientExtension,
} from "./svg-extension/finder-corner-gradient";
