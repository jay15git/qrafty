"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import { type CanvasCardState } from "@/features/canvas/model/card-state";
import { cornerRadiiToCss } from "@/features/canvas/model/corner-radius";
import { type CanvasLayer } from "@/features/canvas/model/layers/shared";
import { LAYER_TOOLBAR_MIN_WIDTH_PX } from "@/features/canvas/components/canvas-layer-chrome.constants";
import {
  documentToChromeOffset,
  getChromeFrameRect,
  getChromeVisualScale,
  type ChromeSpace,
} from "@/features/canvas/components/canvas-layer-chrome-overlay";
import { type SnapGuides } from "@/features/canvas/components/canvas-layer-geometry";
import { getCanvasCardBorderStyle } from "@/features/canvas/rendering/layer-dom-styles";
import { cssFillToBackgroundStyle } from "@/features/canvas/model/css-fill-style";
import { type SceneCompositionState } from "@/features/canvas/model/scene-templates";
import { useTouchPrimary } from "@/lib/hooks/use-touch-primary";
import {
  getPreviewCameraStyle,
  getPreviewStageSize,
  scalePreviewCornerRadiiState,
} from "@/features/canvas/preview/preview-camera";
import { previewDrawerResize } from "@/features/canvas/preview/preview-drawer-resize";

/* Bencho-style crop morph: frame and document move on
   width/height with the same curve, never a scale. */
const RATIO_MORPH_MS = 520;
const RATIO_MORPH_FLAG_MS = RATIO_MORPH_MS + 120;

function hasTranslucentCardFill(fill: string) {
  const rgbaMatch = /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/i.exec(fill);
  if (rgbaMatch) {
    return Number(rgbaMatch[1]) < 0.98;
  }

  return fill.includes("rgba(") && !fill.includes(", 1)") && !fill.includes(",1)");
}

function buildContentTransformStyle(
  contentPan: { x: number; y: number } | undefined,
  interactionScale: number,
): CSSProperties | undefined {
  const translate =
    contentPan && (contentPan.x !== 0 || contentPan.y !== 0)
      ? `translate3d(${contentPan.x}px, ${contentPan.y}px, 0)`
      : null;
  const scale = interactionScale !== 1 ? `scale(${interactionScale})` : null;
  const transform = [translate, scale].filter(Boolean).join(" ");

  if (!transform) {
    return undefined;
  }

  return {
    transform,
    transformOrigin: "center center",
  };
}

function resolveVisibleLayerGroups(visibleLayers: CanvasLayer[], contentOnlyZoom: boolean) {
  const cardLayers = contentOnlyZoom ? visibleLayers.filter((layer) => layer.kind === "card") : [];
  const contentLayers = contentOnlyZoom
    ? visibleLayers.filter((layer) => layer.kind !== "card")
    : visibleLayers;

  return { cardLayers, contentLayers };
}

function buildChromeSpace(
  contentOnlyZoom: boolean,
  contentPan: { x: number; y: number } | undefined,
  interactionScale: number,
  viewFitScale: number,
): ChromeSpace {
  return {
    contentOnlyZoom,
    contentPanX: contentPan?.x ?? 0,
    contentPanY: contentPan?.y ?? 0,
    interactionScale,
    viewFitScale,
  };
}

function resolveSceneLayoutZoom(sceneComposition: SceneCompositionState) {
  return Number.isFinite(sceneComposition.layout.zoom) && sceneComposition.layout.zoom > 0
    ? sceneComposition.layout.zoom
    : 1;
}

function resolveSnapGuideClipBounds(visibleLayers: CanvasLayer[], chromeSpace: ChromeSpace) {
  const snapGuideClipLayer = visibleLayers.find((layer) => layer.kind === "card") ?? null;
  return snapGuideClipLayer ? getChromeFrameRect(snapGuideClipLayer, 0, chromeSpace) : null;
}

function resolveCardChrome(cardState: CanvasCardState) {
  const isPaperShaderMode = cardState.styleMode === "paper-shader";
  const isImageMode = cardState.styleMode === "image";
  const isImageFilterMode = cardState.styleMode === "image-filter";
  const cardImageStyle =
    (isImageMode || isImageFilterMode) && cardState.cardImage.value
      ? {
          backgroundImage: `url("${cardState.cardImage.value}")`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: cardState.cardImage.fit,
        }
      : undefined;
  const cardStyle: CSSProperties = {
    ...(isPaperShaderMode || isImageFilterMode || isImageMode
      ? { backgroundColor: "transparent" }
      : cssFillToBackgroundStyle(cardState.fill)),
    ...cardImageStyle,
    ...getCanvasCardBorderStyle(cardState),
    borderRadius: cornerRadiiToCss(cardState.cornerRadii),
    ...(hasTranslucentCardFill(cardState.fill) ? { backdropFilter: "blur(16px)" } : {}),
  };
  const imageFilterShader = {
    ...cardState.imageFilter,
    image: {
      ...cardState.imageFilter.image,
      source:
        cardState.cardImage.source === "none"
          ? cardState.imageFilter.image.source
          : cardState.cardImage.source,
      value: cardState.cardImage.value ?? cardState.imageFilter.image.value,
    },
  };

  return {
    cardImageStyle,
    cardStyle,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isPaperShaderMode,
  };
}

export type CanvasCardChromeInput = {
  canvasRef: RefObject<HTMLDivElement | null>;
  cardState: CanvasCardState;
  contentOnlyZoom: boolean;
  contentPan?: { x: number; y: number };
  interactionScale: number;
  sceneComposition: SceneCompositionState;
  selectedVisibleLayerIds: string[];
  snapGuides: SnapGuides;
  viewFitScale: number;
  visibleLayers: CanvasLayer[];
};

export function useCardChrome({
  canvasRef,
  cardState,
  contentOnlyZoom,
  contentPan,
  interactionScale,
  sceneComposition,
  selectedVisibleLayerIds,
  snapGuides,
  viewFitScale,
  visibleLayers,
}: CanvasCardChromeInput) {
  const preferLowPowerShaders = useTouchPrimary();
  const [hasError, setHasError] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);
  /* data-ratio-morph has to be on in the same commit that moves
    the card, or the first frame paints the new size before the
    transition exists. So the flag is set during render — the
    documented "adjust state when props change" pattern — and
    only the timeout that clears it lives in an effect. */
  const [ratioMorph, setRatioMorph] = useState({
    active: false,
    height: cardState.height,
    sizePresetId: cardState.sizePresetId,
    width: cardState.width,
  });
  const ratioMorphTimeoutRef = useRef<number | null>(null);
  const [toolbarWidth, setToolbarWidth] = useState(LAYER_TOOLBAR_MIN_WIDTH_PX);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(
    () => () => {
      if (ratioMorphTimeoutRef.current !== null) {
        window.clearTimeout(ratioMorphTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!ratioMorph.active) {
      return;
    }

    ratioMorphTimeoutRef.current = window.setTimeout(() => {
      ratioMorphTimeoutRef.current = null;
      setRatioMorph((current) => ({ ...current, active: false }));
    }, RATIO_MORPH_FLAG_MS);

    return () => {
      if (ratioMorphTimeoutRef.current !== null) {
        window.clearTimeout(ratioMorphTimeoutRef.current);
      }
    };
  }, [ratioMorph]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const updateCanvasHeight = () => {
      setCanvasHeight(canvas.getBoundingClientRect().height);
      setCanvasWidth(canvas.getBoundingClientRect().width);
    };

    updateCanvasHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateCanvasHeight);
      const unsubscribeDrawerResizeEnded = previewDrawerResize.subscribeOnEnded(updateCanvasHeight);

      return () => {
        window.removeEventListener("resize", updateCanvasHeight);
        unsubscribeDrawerResizeEnded();
      };
    }

    const observer = new ResizeObserver(updateCanvasHeight);
    observer.observe(canvas);
    const unsubscribeDrawerResizeEnded = previewDrawerResize.subscribeOnEnded(updateCanvasHeight);

    return () => {
      observer.disconnect();
      unsubscribeDrawerResizeEnded();
    };
  }, [canvasRef]);

  const { cardLayers, contentLayers } = resolveVisibleLayerGroups(visibleLayers, contentOnlyZoom);
  // Desktop compose zoom belongs to content layers. Keep card/background fixed.
  const artboardInteractionScale = contentOnlyZoom ? 1 : interactionScale;
  const artboardScale = viewFitScale * artboardInteractionScale;
  const previewStageSize = getPreviewStageSize(cardState.width, cardState.height, artboardScale);
  const previewCameraStyle = getPreviewCameraStyle(
    cardState.width,
    cardState.height,
    artboardScale,
  );
  const previewStageBorderRadius = cornerRadiiToCss(
    scalePreviewCornerRadiiState(cardState.cornerRadii, artboardScale),
  );
  const chromeSpace: ChromeSpace = buildChromeSpace(
    contentOnlyZoom,
    contentPan,
    interactionScale,
    viewFitScale,
  );
  const contentTransformStyle: CSSProperties | undefined = contentOnlyZoom
    ? buildContentTransformStyle(contentPan, interactionScale)
    : undefined;
  const chromeSnapGuides: SnapGuides = {
    horizontal: snapGuides.horizontal.map((y) => documentToChromeOffset(0, y, chromeSpace).y),
    vertical: snapGuides.vertical.map((x) => documentToChromeOffset(x, 0, chromeSpace).x),
  };
  const sceneLayoutZoom = resolveSceneLayoutZoom(sceneComposition);
  const qrOverlayScale = getChromeVisualScale(chromeSpace) * sceneLayoutZoom;
  const snapGuideClipBounds = resolveSnapGuideClipBounds(visibleLayers, chromeSpace);

  useLayoutEffect(() => {
    const toolbar = toolbarRef.current;

    if (!toolbar) {
      return;
    }

    const width = toolbar.getBoundingClientRect().width;

    if (Number.isFinite(width) && width > 0) {
      setToolbarWidth(width);
    }
  }, [selectedVisibleLayerIds, chromeSpace.interactionScale, chromeSpace.viewFitScale]);
  const {
    cardImageStyle,
    cardStyle,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isPaperShaderMode,
  } = resolveCardChrome(cardState);

  if (
    ratioMorph.width !== cardState.width ||
    ratioMorph.height !== cardState.height ||
    ratioMorph.sizePresetId !== cardState.sizePresetId
  ) {
    setRatioMorph({
      /* Auto mode re-derives the card from the QR on every
         content change — only fixed-mode size jumps morph. */
      active: cardState.sizeMode === "fixed",
      height: cardState.height,
      sizePresetId: cardState.sizePresetId,
      width: cardState.width,
    });
  }

  return {
    artboardScale,
    canvasHeight,
    canvasWidth,
    cardImageStyle,
    cardLayers,
    cardStyle,
    chromeSnapGuides,
    chromeSpace,
    contentLayers,
    contentTransformStyle,
    hasError,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isPaperShaderMode,
    preferLowPowerShaders,
    previewCameraStyle,
    previewStageBorderRadius,
    previewStageSize,
    qrOverlayScale,
    ratioMorph,
    setHasError,
    snapGuideClipBounds,
    toolbarRef,
    toolbarWidth,
  };
}
