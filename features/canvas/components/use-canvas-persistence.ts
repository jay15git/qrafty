import { useEffect, useMemo, useRef } from "react";

import { DEFAULT_DRAFTING_STUDIO_STATE } from "@/features/canvas/components/canvas.constants";
import { parseValueSegmentsText } from "@/features/canvas/components/canvas-operations";
import type {
  CanvasSurfaceSetters,
  CanvasSurfaceState,
} from "@/features/canvas/components/canvas-reducer";
import { resolveSelectedContentValues } from "@/features/canvas/components/canvas-resolvers";
import type { QrControlsApi } from "@/features/canvas/canvas/qr-controls";
import { clearCanvasQrMarkupCache } from "@/features/canvas/hooks/use-canvas-qr-markup";
import { cloneCanvasQrState } from "@/features/canvas/model/document";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import {
  buildStaticQrPayload,
  validateStaticQrContent,
} from "@/features/qr/content/static-payload";
import { getAssetValue, type QraftyState } from "@/features/qr/model/state";

/**
 * Live QR state derivation and per-layer persistence.
 *
 * `canvasQraftyState` folds every selected* control field into the `QraftyState`
 * the renderer and exporters consume; the persist helpers snapshot that live
 * state into `qrStateByLayerId`/`qrStateByNodeId` whenever the active layer
 * changes or a commit lands. Upload object URLs are revoked on replacement.
 */
export function useCanvasPersistence({
  qrControls,
  setters,
  state,
}: {
  qrControls: QrControlsApi;
  setters: CanvasSurfaceSetters;
  state: CanvasSurfaceState;
}) {
  const {
    activeQrLayerId,
    contentValuesByType,
    logoUploadObjectUrl,
    moduleFillUploadObjectUrl,
    qrStateByLayerId,
    selectedAriaLabel,
    selectedBackgroundAssetSourceMode,
    selectedBackgroundColor,
    selectedBackgroundColorMode,
    selectedBackgroundGradient,
    selectedBackgroundRemoteUrl,
    selectedBackgroundShapeId,
    selectedBackgroundShapeOptions,
    selectedBackgroundTransparent,
    selectedBoostLevel,
    selectedContentType,
    selectedCornerDotColor,
    selectedCornerDotColorMode,
    selectedCornerDotGradient,
    selectedCornerSquareColor,
    selectedCornerSquareColorMode,
    selectedCornerSquareGradient,
    selectedDotColor,
    selectedDotMatrixAnimation,
    selectedDotType,
    selectedDotsColorMode,
    selectedDotsGradient,
    selectedDotsPalette,
    selectedDotsPalettePreset,
    selectedGradientLinkMode,
    selectedHideBackgroundDots,
    selectedLogoColor,
    selectedLogoColorMode,
    selectedLogoCrossOrigin,
    selectedLogoGradient,
    selectedLogoHeightPx,
    selectedLogoLockAspect,
    selectedLogoMargin,
    selectedLogoOffsetX,
    selectedLogoOffsetY,
    selectedLogoOpacity,
    selectedLogoPositionMode,
    selectedLogoPresetId,
    selectedLogoPresetValue,
    selectedLogoRemoteUrl,
    selectedLogoSize,
    selectedLogoSizeMode,
    selectedLogoSourceMode,
    selectedLogoUploadValue,
    selectedLogoWidthPx,
    selectedModuleFillImageSourceMode,
    selectedModuleFillImageUrl,
    selectedModuleFillRemoteUrl,
    selectedModuleLineWidth,
    selectedModuleRoundSize,
    selectedModuleSize,
    selectedQrErrorCorrectionLevel,
    selectedQrFinderPatternInnerStyle,
    selectedQrFinderPatternOuterStyle,
    selectedQrMargin,
    selectedQrMode,
    selectedQrRadius,
    selectedQrSize,
    selectedQrTypeNumber,
    selectedRasterExportQualityPercent,
    selectedValueSegmentsText,
  } = state;
  const { setContentTypeByLayerId, setQrStateByLayerId, setQrStateByNodeId } = setters;

  const pendingQrPersistStateRef = useRef<QraftyState | null>(null);
  const selectedContentValues = resolveSelectedContentValues(
    contentValuesByType,
    selectedContentType,
  );
  const selectedContentValue = useMemo(
    () => buildStaticQrPayload(selectedContentType, selectedContentValues),
    [selectedContentType, selectedContentValues],
  );
  const selectedContentValidation = useMemo(
    () => validateStaticQrContent(selectedContentType, selectedContentValues),
    [selectedContentType, selectedContentValues],
  );
  const canvasQraftyState = useMemo<QraftyState>(
    () => ({
      ...DEFAULT_DRAFTING_STUDIO_STATE,
      data: selectedContentValue,
      type: DEFAULT_DRAFTING_STUDIO_STATE.type,
      width: selectedQrSize,
      height: selectedQrSize,
      margin: selectedQrMargin,
      rasterExportQualityPercent: selectedRasterExportQualityPercent,
      logo: {
        presetColor: selectedLogoColor,
        presetId: selectedLogoPresetId,
        source: selectedLogoSourceMode,
        value:
          selectedLogoSourceMode === "preset"
            ? selectedLogoPresetValue
            : selectedLogoSourceMode === "url"
              ? selectedLogoRemoteUrl
              : selectedLogoSourceMode === "upload"
                ? selectedLogoUploadValue
                : undefined,
      },
      backgroundImage: {
        presetColor: undefined,
        presetId: undefined,
        source: selectedBackgroundAssetSourceMode === "url" ? "url" : "none",
        value:
          selectedBackgroundAssetSourceMode === "url" ? selectedBackgroundRemoteUrl : undefined,
      },
      moduleFillImage: {
        presetColor: undefined,
        presetId: undefined,
        source:
          selectedDotsColorMode === "image"
            ? selectedModuleFillImageSourceMode === "url"
              ? "url"
              : "upload"
            : "none",
        value:
          selectedDotsColorMode === "image"
            ? selectedModuleFillImageSourceMode === "url"
              ? selectedModuleFillRemoteUrl
              : selectedModuleFillImageUrl
            : undefined,
      },
      backgroundShapeId: selectedBackgroundShapeId,
      backgroundShapeOptions: { ...selectedBackgroundShapeOptions },
      qrOptions: {
        ...DEFAULT_DRAFTING_STUDIO_STATE.qrOptions,
        typeNumber: selectedQrTypeNumber,
        errorCorrectionLevel: selectedQrErrorCorrectionLevel,
        boostLevel: selectedBoostLevel,
        mode: selectedQrMode,
      },
      imageOptions: {
        ...DEFAULT_DRAFTING_STUDIO_STATE.imageOptions,
        hideBackgroundDots: selectedHideBackgroundDots,
        imageSize: selectedLogoSize / 100,
        margin: selectedLogoMargin,
        crossOrigin: selectedLogoCrossOrigin,
        opacity: selectedLogoOpacity / 100,
        sizeMode: selectedLogoSizeMode,
        lockAspect: selectedLogoLockAspect,
        logoPositionMode: selectedLogoPositionMode,
        ...(selectedLogoWidthPx !== undefined ? { widthPx: selectedLogoWidthPx } : {}),
        ...(selectedLogoHeightPx !== undefined ? { heightPx: selectedLogoHeightPx } : {}),
        ...(selectedLogoPositionMode === "custom"
          ? { x: selectedLogoOffsetX, y: selectedLogoOffsetY }
          : {}),
      },
      dataModulesSettings: {
        ...DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings,
        type: selectedDotType,
        color: selectedDotColor,
        roundSize: selectedModuleRoundSize,
        ...(selectedModuleSize !== undefined ? { moduleSize: selectedModuleSize } : {}),
        ...(selectedModuleLineWidth !== undefined ? { lineWidth: selectedModuleLineWidth } : {}),
      },
      ariaLabel: selectedAriaLabel || undefined,
      valueSegments: parseValueSegmentsText(selectedValueSegmentsText),
      gradientLinkMode: selectedGradientLinkMode,
      dotsColorMode: selectedDotsColorMode,
      dotsPalette: [...selectedDotsPalette],
      dotMatrixAnimation: { ...selectedDotMatrixAnimation },
      finderPatternOuterSettings: {
        type: selectedQrFinderPatternOuterStyle,
        color: selectedCornerSquareColor,
      },
      finderPatternInnerSettings: {
        type: selectedQrFinderPatternInnerStyle,
        color: selectedCornerDotColor,
      },
      backgroundOptions: {
        color: selectedBackgroundColor,
        round: selectedQrRadius,
        transparent: selectedBackgroundTransparent,
      },
      logoGradient: {
        ...structuredClone(selectedLogoGradient),
        enabled: selectedLogoColorMode === "gradient",
      },
      dataModulesGradient: {
        ...structuredClone(selectedDotsGradient),
        enabled: selectedDotsColorMode === "gradient",
      },
      finderPatternOuterGradient: {
        ...structuredClone(selectedCornerSquareGradient),
        enabled: selectedCornerSquareColorMode === "gradient",
      },
      finderPatternInnerGradient: {
        ...structuredClone(selectedCornerDotGradient),
        enabled: selectedCornerDotColorMode === "gradient",
      },
      backgroundGradient: {
        ...structuredClone(selectedBackgroundGradient),
        enabled: selectedBackgroundColorMode === "gradient",
      },
    }),
    [
      selectedBackgroundAssetSourceMode,
      selectedBackgroundColor,
      selectedBackgroundColorMode,
      selectedBackgroundGradient,
      selectedBackgroundShapeId,
      selectedBackgroundShapeOptions,
      selectedBackgroundTransparent,
      selectedBackgroundRemoteUrl,
      selectedQrRadius,
      selectedContentValue,
      selectedCornerDotColor,
      selectedCornerDotColorMode,
      selectedCornerDotGradient,
      selectedQrFinderPatternInnerStyle,
      selectedCornerSquareColor,
      selectedCornerSquareColorMode,
      selectedCornerSquareGradient,
      selectedQrFinderPatternOuterStyle,
      selectedDotColor,
      selectedDotMatrixAnimation,
      selectedDotsColorMode,
      selectedDotsGradient,
      selectedDotsPalette,
      selectedDotsPalettePreset,
      selectedModuleFillImageUrl,
      selectedModuleFillImageSourceMode,
      selectedModuleFillRemoteUrl,
      selectedDotType,
      selectedQrErrorCorrectionLevel,
      selectedBoostLevel,
      selectedQrMode,
      selectedValueSegmentsText,
      selectedAriaLabel,
      selectedModuleRoundSize,
      selectedModuleSize,
      selectedModuleLineWidth,
      selectedGradientLinkMode,
      selectedLogoOpacity,
      selectedLogoSizeMode,
      selectedLogoWidthPx,
      selectedLogoHeightPx,
      selectedLogoLockAspect,
      selectedLogoPositionMode,
      selectedLogoOffsetX,
      selectedLogoOffsetY,
      selectedLogoCrossOrigin,
      selectedHideBackgroundDots,
      selectedLogoColor,
      selectedLogoColorMode,
      selectedLogoGradient,
      selectedLogoMargin,
      selectedLogoPresetId,
      selectedLogoPresetValue,
      selectedLogoRemoteUrl,
      selectedLogoUploadValue,
      selectedLogoSize,
      selectedLogoSourceMode,
      selectedRasterExportQualityPercent,
      selectedQrMargin,
      selectedQrSize,
      selectedQrTypeNumber,
    ],
  );

  function resolveLiveQrPersistState(): QraftyState {
    if (pendingQrPersistStateRef.current) {
      return pendingQrPersistStateRef.current;
    }

    const live = canvasQraftyState;
    const persisted = qrStateByLayerId[activeQrLayerId];
    if (!persisted) {
      return live;
    }

    const liveModuleFill = getAssetValue(live.moduleFillImage);
    const persistedModuleFill = getAssetValue(persisted.moduleFillImage);
    if (!persistedModuleFill) {
      return live;
    }

    const shouldPreferPersistedModuleFill =
      live.dotsColorMode === "image" && !liveModuleFill && Boolean(persistedModuleFill);

    if (!shouldPreferPersistedModuleFill) {
      return live;
    }

    return {
      ...live,
      dotsColorMode: "image",
      moduleFillImage: {
        ...live.moduleFillImage,
        ...persisted.moduleFillImage,
        source: persisted.moduleFillImage.source === "url" ? "url" : "upload",
        value: persistedModuleFill,
      },
    };
  }

  function persistActiveQrLayerState(nextState: QraftyState = resolveLiveQrPersistState()) {
    const cloned = cloneCanvasQrState(nextState);
    pendingQrPersistStateRef.current = cloned;
    setQrStateByLayerId((current) => ({
      ...current,
      [activeQrLayerId]: cloned,
    }));
    setContentTypeByLayerId((current) => ({
      ...current,
      [activeQrLayerId]: selectedContentType,
    }));
    setQrStateByNodeId({
      [DASHBOARD_QR_NODE_ID]: cloned,
    });
  }

  function commitActiveQraftyState(nextState: QraftyState) {
    const committed = resolveLiveQrPersistState();
    const merged: QraftyState = {
      ...committed,
      logo: nextState.logo,
      logoGradient: nextState.logoGradient,
      imageOptions: nextState.imageOptions,
    };

    qrControls.syncLogo(merged);
    qrControls.syncModuleFill(merged);
    persistActiveQrLayerState(merged);
    clearCanvasQrMarkupCache();
  }

  useEffect(() => {
    pendingQrPersistStateRef.current = null;
  });

  useEffect(() => {
    if (!logoUploadObjectUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(logoUploadObjectUrl);
    };
  }, [logoUploadObjectUrl]);

  useEffect(() => {
    if (!moduleFillUploadObjectUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(moduleFillUploadObjectUrl);
    };
  }, [moduleFillUploadObjectUrl]);

  return {
    canvasQraftyState,
    commitActiveQraftyState,
    persistActiveQrLayerState,
    resolveLiveQrPersistState,
    selectedContentValidation,
    selectedContentValue,
    selectedContentValues,
  };
}

export type CanvasPersistence = ReturnType<typeof useCanvasPersistence>;
