import { getAssetValue, type QraftyState } from "@/features/qr/model/state";
import { applyUnifiedQrGradientFill, applyUnifiedQrImageFill } from "@qrafty/qr-internal/core";
import { type QrSvgExtensionFunction } from "./types";
import { SVG_NS, removeLegacyDotGradientOverlay, isSvgElementLike } from "./svg-dom-utils";
import { getQrModuleClipLayers, getQrModulePathLayers } from "./dot-matrix-model";

export function createUnifiedImageExtension(
  state: Pick<QraftyState, "dotsColorMode" | "margin" | "moduleFillImage">,
): QrSvgExtensionFunction {
  return (svg) => {
    removeLegacyDotGradientOverlay(svg);

    const imageHref = getAssetValue(state.moduleFillImage);

    if (!imageHref) {
      return;
    }

    const { moduleClipShapes, modulePaintTargets } = collectModuleUnifiedFillTargets(svg);

    applyUnifiedQrImageFill(svg, {
      imageHref,
      imageId: "unified-image-definition",
      imageLayer: "unified-image-definition",
      margin: state.margin,
      moduleClipShapes,
      modulePaintTargets,
    });
  };
}

export function createUnifiedGradientExtension(
  state: Pick<QraftyState, "gradientLinkMode" | "dotsColorMode" | "dataModulesGradient" | "margin">,
): QrSvgExtensionFunction {
  return (svg) => {
    removeLegacyDotGradientOverlay(svg);

    const dotClipLayers = getQrModuleClipLayers(svg);
    const dotPathLayers = getQrModulePathLayers(svg);
    const modulePaintTargets: SVGElement[] = [
      ...dotClipLayers.map((layer) => layer.element),
      ...dotPathLayers.map((layer) => layer.element),
    ];

    if (modulePaintTargets.length === 0) {
      const dataModules = svg.querySelector('[data-testid="data-modules"]');

      if (isSvgElementLike(dataModules)) {
        modulePaintTargets.push(dataModules);
      }
    }

    applyUnifiedQrGradientFill(svg, {
      gradient: {
        type: state.dataModulesGradient.type,
        rotation: state.dataModulesGradient.rotation,
        center:
          state.dataModulesGradient.type === "radial"
            ? state.dataModulesGradient.center
            : undefined,
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
      },
      gradientId: "unified-gradient-definition",
      gradientLayer: "unified-gradient-definition",
      margin: state.margin,
      modulePaintTargets,
    });
  };
}

export function collectModuleUnifiedFillTargets(svg: SVGElement) {
  const dotClipLayers = getQrModuleClipLayers(svg);
  const dotPathLayers = getQrModulePathLayers(svg);
  const modulePaintTargets: SVGElement[] = [
    ...dotClipLayers.map((layer) => layer.element),
    ...dotPathLayers.map((layer) => layer.element),
  ];
  const moduleClipShapes = [
    ...dotClipLayers.flatMap((layer) => layer.shapes),
    ...dotPathLayers.flatMap((layer) => layer.shapes),
  ];

  const dataModulesNode = svg.querySelector('[data-testid="data-modules"]');
  const dataModules = isSvgElementLike(dataModulesNode) ? dataModulesNode : null;

  if (modulePaintTargets.length === 0 && dataModules) {
    modulePaintTargets.push(dataModules);
  }

  if (moduleClipShapes.length === 0 && dataModules) {
    const pathData = dataModules.getAttribute("d");
    const document = svg.ownerDocument;

    if (pathData && document) {
      const fallbackShape = document.createElementNS(SVG_NS, "path");
      fallbackShape.setAttribute("d", pathData);
      moduleClipShapes.push(fallbackShape);
    }
  }

  return { moduleClipShapes, modulePaintTargets };
}
