"use client";

import type { MutableRefObject } from "react";

import {
  applyAssetNoneSelection,
  applyAssetUploadValue,
  applyAssetUrlValue,
  applyLogoPresetColor,
} from "@/features/qr/model/actions";
import { findBrandIconById } from "@/features/qr/assets/brand-icons";
import { createBrandIconDataUrl } from "@/features/qr/assets/brand-icon-svg";
import { parseIconstackSelectionId } from "@/features/qr/assets/iconstack-api";
import { getDefaultStaticQrValues } from "@/features/qr/content/static-payload";
import { setDotMatrixAnimationOptions, type QraftyState } from "@/features/qr/model/state";
import { createUniformCornerRadii } from "@/features/canvas/model/corner-radius";
import {
  getCanvasCardLayerId,
  getCanvasQrLayerId,
  type CanvasLayer,
} from "@/features/canvas/model/layers/shared";
import { cloneCanvasLayer } from "@/features/canvas/model/layers/fallback";
import { patchCanvasLayer } from "@/features/canvas/model/layers/patch";
import {
  createDefaultCanvasLayers,
  fitQrSizeInCard,
  layoutCanvasCardInsetLayers,
} from "@/features/canvas/model/layers/card-qr";
import { createCanvasTextLayer } from "@/features/canvas/model/layers/factories";
import {
  createDefaultCanvasCardState,
  normalizeCanvasCardState,
  type CanvasCardState,
} from "@/features/canvas/model/card-state";
import { createDefaultCanvasWorkspaceQrState } from "@/features/canvas/model/document";
import type {
  AccessibilitySettings,
  EncodingSettings,
  ExportSettings,
  ImageSettings,
  LayersSettings,
  LogoSettings,
  LogoSettingsPatch,
  MotionSettings,
  PatternSettingsPatch,
  ShapeSettings,
  TextSettings,
} from "@/features/shell/model/toolbar-types";
import type { CornersSettings } from "@/features/shell/model/toolbar-types";
import type { UnifiedQrFillPatches } from "@/features/shell/settings/settings-bridge";
import {
  applyCornersSettingsPatchToQraftyState,
  applyLogoSettingsPatchToQraftyState,
  applyPatternSettingsPatchToQraftyState,
} from "@/features/canvas/components/workspace-qr-settings-patch";
import { buildAppearancePatch, type AppearancePatch } from "@/features/shell/model/appearance";
import {
  ensureMandatoryLayerRows,
  findCanvasLayerById,
  getCanvasDownloadTarget,
} from "@/features/canvas/components/canvas-operations";
import { replaceTrackedObjectUrl } from "@/features/canvas/components/canvas.constants";
import { clearCanvasQrMarkupCache } from "@/features/canvas/hooks/use-canvas-qr-markup";
import { clearQrEncodeMarkupCache } from "@/features/qr/rendering/qr-encode-cache";
import type {
  CanvasSurfaceSetters,
  CanvasSurfaceState,
} from "@/features/canvas/components/canvas-reducer";
import type { createQrControls } from "@/features/canvas/canvas/qr-controls";
import type { useQrLogoActions } from "@/features/canvas/canvas/use-qr-logo-actions";
import type { CanvasLayerMenuAction } from "@/features/canvas/components/Artboard";
import { DEFAULT_QR_INPUT_TYPE } from "@/features/qr/content/input-options";
import {
  DEFAULT_DRAFTING_STUDIO_STATE,
  type CanvasDownloadExtension,
} from "@/features/canvas/components/canvas.constants";

type SettingsState = Pick<
  CanvasSurfaceState,
  | "activeQrNodeId"
  | "layerStateByNodeId"
  | "selectedCardState"
  | "selectedLayerId"
  | "selectedLogoRemoteUrl"
  | "selectedModuleFillImageSourceMode"
  | "selectedModuleFillImageUrl"
>;

type SettingsSetters = Pick<
  CanvasSurfaceSetters,
  | "setContentValuesByType"
  | "setLayerStateByNodeId"
  | "setLogoUploadObjectUrl"
  | "setSelectedAriaLabel"
  | "setSelectedBackgroundColor"
  | "setSelectedBackgroundColorMode"
  | "setSelectedBackgroundGradient"
  | "setSelectedBackgroundShapeId"
  | "setSelectedBackgroundShapeOptions"
  | "setSelectedBackgroundTransparent"
  | "setSelectedBoostLevel"
  | "setSelectedCardState"
  | "setSelectedContentType"
  | "setSelectedCornerDotColor"
  | "setSelectedCornerDotColorMode"
  | "setSelectedCornerDotGradient"
  | "setSelectedCornerSquareColor"
  | "setSelectedCornerSquareColorMode"
  | "setSelectedCornerSquareGradient"
  | "setSelectedDotColor"
  | "setSelectedDotMatrixAnimation"
  | "setSelectedDotType"
  | "setSelectedDotsColorMode"
  | "setSelectedDotsGradient"
  | "setSelectedDotsPalette"
  | "setSelectedDotsPalettePreset"
  | "setSelectedDownloadExtension"
  | "setSelectedDownloadTarget"
  | "setSelectedExportMediaKind"
  | "setSelectedGradientLinkMode"
  | "setSelectedLogoColor"
  | "setSelectedLogoColorMode"
  | "setSelectedLogoGradient"
  | "setSelectedLogoSourceMode"
  | "setSelectedModuleFillImageSourceMode"
  | "setSelectedModuleFillImageUrl"
  | "setSelectedModuleFillRemoteUrl"
  | "setSelectedModuleLineWidth"
  | "setSelectedModuleRoundSize"
  | "setSelectedModuleSize"
  | "setSelectedPhotoLongEdge"
  | "setSelectedQrErrorCorrectionLevel"
  | "setSelectedQrFinderPatternInnerStyle"
  | "setSelectedQrFinderPatternOuterStyle"
  | "setSelectedQrSize"
  | "setSelectedQrTypeNumber"
  | "setSelectedValueSegmentsText"
  | "setSelectedVideoDurationSeconds"
  | "setSelectedVideoFormat"
  | "setSelectedVideoFrameRate"
  | "setSelectedVideoLongEdge"
>;

export function useSettingsActions({
  activeCanvasLayers,
  activeQrNodeId,
  appearanceTargetLayer,
  commitActiveQraftyState,
  canvasQraftyState,
  handleLayerChange,
  handleLayerSelect,
  layerStateByNodeId,
  logoActions,
  logoUploadObjectUrlRef,
  persistActiveQrLayerState,
  qrBackgroundVisible,
  qrControls,
  resolveLiveQrPersistState,
  selectedCardState,
  selectedLayerId,
  selectedLogoRemoteUrl,
  selectedModuleFillImageSourceMode,
  selectedModuleFillImageUrl,
  selectedTextLayer,
  selectSingleLayer,
  setContentValuesByType,
  setLayerStateByNodeId,
  setLogoUploadObjectUrl,
  setSelectedAriaLabel,
  setSelectedBackgroundColor,
  setSelectedBackgroundColorMode,
  setSelectedBackgroundGradient,
  setSelectedBackgroundShapeId,
  setSelectedBackgroundShapeOptions,
  setSelectedBackgroundTransparent,
  setSelectedBoostLevel,
  setSelectedCardState,
  setSelectedContentType,
  setSelectedCornerDotColor,
  setSelectedCornerDotColorMode,
  setSelectedCornerDotGradient,
  setSelectedCornerSquareColor,
  setSelectedCornerSquareColorMode,
  setSelectedCornerSquareGradient,
  setSelectedDotColor,
  setSelectedDotMatrixAnimation,
  setSelectedDotType,
  setSelectedDotsColorMode,
  setSelectedDotsGradient,
  setSelectedDotsPalette,
  setSelectedDotsPalettePreset,
  setSelectedDownloadExtension,
  setSelectedDownloadTarget,
  setSelectedExportMediaKind,
  setSelectedGradientLinkMode,
  setSelectedLogoColor,
  setSelectedLogoColorMode,
  setSelectedLogoGradient,
  setSelectedLogoSourceMode,
  setSelectedModuleFillImageSourceMode,
  setSelectedModuleFillImageUrl,
  setSelectedModuleFillRemoteUrl,
  setSelectedModuleLineWidth,
  setSelectedModuleRoundSize,
  setSelectedModuleSize,
  setSelectedPhotoLongEdge,
  setSelectedQrErrorCorrectionLevel,
  setSelectedQrFinderPatternInnerStyle,
  setSelectedQrFinderPatternOuterStyle,
  setSelectedQrSize,
  setSelectedQrTypeNumber,
  setSelectedValueSegmentsText,
  setSelectedVideoDurationSeconds,
  setSelectedVideoFormat,
  setSelectedVideoFrameRate,
  setSelectedVideoLongEdge,
}: SettingsState &
  SettingsSetters & {
    activeCanvasLayers: CanvasLayer[];
    appearanceTargetLayer: CanvasLayer | null;
    commitActiveQraftyState: (nextState: QraftyState) => void;
    canvasQraftyState: QraftyState;
    handleLayerChange: (boardId: string, layerId: string, patch: Partial<CanvasLayer>) => void;
    handleLayerSelect: (
      boardId: string,
      layerId: string | null,
      options?: { additive?: boolean; preserveActiveTool?: boolean },
    ) => void;
    logoActions: ReturnType<typeof useQrLogoActions>;
    logoUploadObjectUrlRef: MutableRefObject<string | null>;
    persistActiveQrLayerState: (nextState?: QraftyState) => void;
    qrBackgroundVisible: boolean;
    qrControls: ReturnType<typeof createQrControls>;
    resolveLiveQrPersistState: () => QraftyState;
    selectedTextLayer: CanvasLayer | null;
    selectSingleLayer: (layerId: string | null) => void;
  }) {
  function handleDesktopAppearancePatch(patch: AppearancePatch) {
    if (!appearanceTargetLayer) {
      return;
    }

    const result = buildAppearancePatch(appearanceTargetLayer, patch, {
      qrBackgroundShapeId:
        appearanceTargetLayer.kind === "qr" ? canvasQraftyState.backgroundShapeId : undefined,
      qrBackgroundShapeOptions:
        appearanceTargetLayer.kind === "qr" ? canvasQraftyState.backgroundShapeOptions : undefined,
      qrBackgroundSurfaceVisible:
        appearanceTargetLayer.kind === "qr" ? qrBackgroundVisible : undefined,
    });

    if (Object.keys(result.layerPatch).length > 0) {
      handleLayerChange(activeQrNodeId, appearanceTargetLayer.id, result.layerPatch);
    }

    if (result.qrBackgroundShapeOptions) {
      setSelectedBackgroundShapeOptions((current) => ({
        ...current,
        ...result.qrBackgroundShapeOptions,
      }));
    }

    if (
      appearanceTargetLayer.kind === "card" &&
      (result.cardBorder !== undefined ||
        result.cardCornerRadius !== undefined ||
        result.cardCornerRadii !== undefined ||
        result.cardShadow)
    ) {
      setSelectedCardState((current) => ({
        ...current,
        border: result.cardBorder ?? current.border,
        cornerRadius: result.cardCornerRadius ?? current.cornerRadius,
        cornerRadii: result.cardCornerRadii ?? current.cornerRadii,
        shadow: result.cardShadow
          ? {
              ...current.shadow,
              ...result.cardShadow,
            }
          : current.shadow,
      }));
    }
  }

  function resetDesktopContent() {
    setSelectedContentType(DEFAULT_QR_INPUT_TYPE);
    setContentValuesByType((current) => ({
      ...current,
      [DEFAULT_QR_INPUT_TYPE]: {
        ...getDefaultStaticQrValues(DEFAULT_QR_INPUT_TYPE),
        url: DEFAULT_DRAFTING_STUDIO_STATE.data,
      },
    }));
  }

  function applyDesktopPatternPatchToControls(patch: PatternSettingsPatch) {
    if (patch.qrDotType) setSelectedDotType(patch.qrDotType);
    if (patch.moduleRoundSize !== undefined) setSelectedModuleRoundSize(patch.moduleRoundSize);
    if (patch.moduleSize !== undefined) setSelectedModuleSize(patch.moduleSize);
    if (patch.moduleLineWidth !== undefined) setSelectedModuleLineWidth(patch.moduleLineWidth);
    if (patch.gradientLinkMode) setSelectedGradientLinkMode(patch.gradientLinkMode);
    if (patch.dotsColorMode) {
      setSelectedDotsColorMode(patch.dotsColorMode);
    }
    if (patch.dotsSolidColor) {
      setSelectedDotsColorMode("solid");
      setSelectedDotColor(patch.dotsSolidColor);
    }
    if (patch.dataModulesGradient) {
      setSelectedDotsColorMode("gradient");
      setSelectedDotsGradient({ ...patch.dataModulesGradient, enabled: true });
    }
    if (patch.dotsPalette) {
      setSelectedDotsColorMode("palette");
      setSelectedDotsPalette([...patch.dotsPalette]);
    }
    if (patch.dotsPalettePreset !== undefined) {
      setSelectedDotsColorMode("palette");
      setSelectedDotsPalettePreset(patch.dotsPalettePreset);
    }
    if (patch.moduleFillImageUrl !== undefined) {
      setSelectedDotsColorMode("image");
      const sourceMode = patch.moduleFillImageSourceMode ?? selectedModuleFillImageSourceMode;
      setSelectedModuleFillImageSourceMode(sourceMode);
      if (!patch.moduleFillImageUrl) {
        setSelectedModuleFillImageUrl("");
        setSelectedModuleFillRemoteUrl("");
      } else if (sourceMode === "url") {
        setSelectedModuleFillRemoteUrl(patch.moduleFillImageUrl);
        setSelectedModuleFillImageUrl("");
      } else {
        setSelectedModuleFillImageUrl(patch.moduleFillImageUrl);
        setSelectedModuleFillRemoteUrl("");
      }
    }
    if (patch.moduleFillImageSourceMode && patch.moduleFillImageUrl === undefined) {
      setSelectedDotsColorMode("image");
      setSelectedModuleFillImageSourceMode(patch.moduleFillImageSourceMode);
    }
  }

  function applyDesktopCornersPatchToControls(patch: Partial<CornersSettings>) {
    if (patch.cornerSquareType) setSelectedQrFinderPatternOuterStyle(patch.cornerSquareType);
    if (patch.cornerSquareColorMode) setSelectedCornerSquareColorMode(patch.cornerSquareColorMode);
    if (patch.cornerSquareSolidColor) {
      setSelectedCornerSquareColorMode("solid");
      setSelectedCornerSquareColor(patch.cornerSquareSolidColor);
    }
    if (patch.cornerSquareGradient) {
      setSelectedCornerSquareColorMode("gradient");
      setSelectedCornerSquareGradient({ ...patch.cornerSquareGradient, enabled: true });
    }
    if (patch.cornerDotType) setSelectedQrFinderPatternInnerStyle(patch.cornerDotType);
    if (patch.cornerDotColorMode) setSelectedCornerDotColorMode(patch.cornerDotColorMode);
    if (patch.cornerDotSolidColor) {
      setSelectedCornerDotColorMode("solid");
      setSelectedCornerDotColor(patch.cornerDotSolidColor);
    }
    if (patch.cornerDotGradient) {
      setSelectedCornerDotColorMode("gradient");
      setSelectedCornerDotGradient({ ...patch.cornerDotGradient, enabled: true });
    }
  }

  function applyDesktopUnifiedLogoPatchToControls(patch: Partial<LogoSettings>) {
    if (patch.colorMode) setSelectedLogoColorMode(patch.colorMode);
    if (patch.solidColor) {
      setSelectedLogoColorMode("solid");
      setSelectedLogoColor(patch.solidColor);
    }
    if (patch.gradient) {
      setSelectedLogoColorMode("gradient");
      setSelectedLogoGradient({ ...patch.gradient, enabled: true });
    }
  }

  function updateDesktopPatternSettings(patch: PatternSettingsPatch) {
    applyDesktopPatternPatchToControls(patch);
    const nextState = applyPatternSettingsPatchToQraftyState(resolveLiveQrPersistState(), patch);

    clearQrEncodeMarkupCache();
    clearCanvasQrMarkupCache();
    persistActiveQrLayerState(nextState);
    qrControls.syncModuleFill(nextState);
  }

  function updateDesktopUnifiedQrFillSettings(patches: UnifiedQrFillPatches) {
    applyDesktopPatternPatchToControls(patches.pattern);
    applyDesktopCornersPatchToControls(patches.corners);
    applyDesktopUnifiedLogoPatchToControls(patches.logo);

    let nextState = resolveLiveQrPersistState();
    nextState = applyPatternSettingsPatchToQraftyState(nextState, patches.pattern);
    nextState = applyCornersSettingsPatchToQraftyState(nextState, patches.corners);
    nextState = applyLogoSettingsPatchToQraftyState(nextState, patches.logo);

    // A preset logo stores its rendered SVG in `logo.value`. Updating only
    // `presetColor` leaves that SVG painted with its previous color.
    if (patches.logo.solidColor) {
      const brandIcon = findBrandIconById(nextState.logo.presetId);
      if (brandIcon) {
        nextState = applyLogoPresetColor(
          nextState,
          createBrandIconDataUrl(brandIcon, patches.logo.solidColor),
          patches.logo.solidColor,
        );
      }
    }

    clearQrEncodeMarkupCache();
    clearCanvasQrMarkupCache();
    persistActiveQrLayerState(nextState);
    qrControls.syncModuleFill(nextState);
    qrControls.syncLogo(nextState);
  }

  function resetDesktopPatternSettings() {
    setSelectedDotType(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.type);
    setSelectedDotsColorMode(DEFAULT_DRAFTING_STUDIO_STATE.dotsColorMode);
    setSelectedDotColor(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.color);
    setSelectedDotsGradient(structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesGradient));
    setSelectedDotsPalette([...DEFAULT_DRAFTING_STUDIO_STATE.dotsPalette]);
    setSelectedDotsPalettePreset("Signal");
    setSelectedModuleFillImageUrl("");
    setSelectedModuleFillRemoteUrl("");
    setSelectedModuleFillImageSourceMode("upload");
    setSelectedModuleRoundSize(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.roundSize);
    setSelectedModuleSize(undefined);
    setSelectedModuleLineWidth(undefined);
    setSelectedGradientLinkMode(DEFAULT_DRAFTING_STUDIO_STATE.gradientLinkMode);
  }

  function updateDesktopLogoSettings(patch: LogoSettingsPatch) {
    if (patch.uploadedFile) {
      const uploadValue = replaceTrackedObjectUrl(
        logoUploadObjectUrlRef,
        patch.uploadedFile,
        setLogoUploadObjectUrl,
      );
      const nextState = applyAssetUploadValue(canvasQraftyState, "logo", uploadValue);
      commitActiveQraftyState(nextState);
    }
    if (patch.uploadedImageUrl !== undefined) {
      commitActiveQraftyState(
        patch.uploadedImageUrl
          ? applyAssetUploadValue(canvasQraftyState, "logo", patch.uploadedImageUrl)
          : applyAssetNoneSelection(canvasQraftyState, "logo"),
      );
    }
    if (patch.sourceMode) {
      if (patch.sourceMode === "none") {
        commitActiveQraftyState(applyAssetNoneSelection(canvasQraftyState, "logo"));
      } else if (patch.sourceMode === "brand") {
        setSelectedLogoSourceMode("preset");
      } else if (patch.sourceMode === "url") {
        const nextState = applyAssetUrlValue(canvasQraftyState, "logo", selectedLogoRemoteUrl);
        commitActiveQraftyState(nextState);
      } else {
        logoActions.clearLogoPreset("upload");
      }
    }
    if (patch.uploadMode) {
      if (patch.uploadMode === "url") {
        const nextState = applyAssetUrlValue(canvasQraftyState, "logo", selectedLogoRemoteUrl);
        commitActiveQraftyState(nextState);
      } else {
        logoActions.clearLogoPreset("upload");
      }
    }
    if (patch.remoteUrl !== undefined) {
      const nextState = applyAssetUrlValue(canvasQraftyState, "logo", patch.remoteUrl);
      commitActiveQraftyState(nextState);
    }
    if (patch.selectedBrandIconId) {
      if (parseIconstackSelectionId(patch.selectedBrandIconId)) {
        void logoActions.selectIconstackIcon(patch.selectedBrandIconId);
      } else {
        const brandIcon = findBrandIconById(patch.selectedBrandIconId);
        if (brandIcon) logoActions.selectBrandIcon(brandIcon);
      }
    }
    if (patch.colorMode) setSelectedLogoColorMode(patch.colorMode);
    if (patch.solidColor) void logoActions.changeLogoColor(patch.solidColor);
    if (patch.gradient) void logoActions.changeLogoGradient({ ...patch.gradient, enabled: true });
    logoActions.patchLogoImageOptions(patch);
  }

  function resetDesktopLogoSettings() {
    qrControls.applyQrState(createDefaultCanvasWorkspaceQrState());
  }

  function updateDesktopCornersSettings(patch: Partial<CornersSettings>) {
    applyDesktopCornersPatchToControls(patch);

    const nextState = applyCornersSettingsPatchToQraftyState(resolveLiveQrPersistState(), patch);
    clearQrEncodeMarkupCache();
    clearCanvasQrMarkupCache();
    persistActiveQrLayerState(nextState);
  }

  function mergeCardStateFromShapePatch(patch: Partial<ShapeSettings>) {
    const nextCornerRadius = patch.cardRadius ?? selectedCardState.cornerRadius;

    return {
      ...selectedCardState,
      bottomSpace: patch.bottomSpace ?? selectedCardState.bottomSpace,
      cornerRadius: nextCornerRadius,
      cornerRadii:
        patch.cardRadius !== undefined
          ? createUniformCornerRadii(nextCornerRadius)
          : selectedCardState.cornerRadii,
      enabled:
        patch.sizeMode === "fixed" ||
        patch.cardWidth !== undefined ||
        patch.cardHeight !== undefined ||
        patch.sizePresetId !== undefined
          ? true
          : selectedCardState.enabled,
      fill: patch.cardFill ?? selectedCardState.fill,
      height: patch.cardHeight ?? selectedCardState.height,
      lockAspectRatio: patch.lockAspectRatio ?? selectedCardState.lockAspectRatio,
      shadow: cardShadowFromPatch(patch),
      sizeMode: patch.sizeMode ?? selectedCardState.sizeMode,
      sizePresetId:
        patch.sizePresetId !== undefined ? patch.sizePresetId : selectedCardState.sizePresetId,
      styleMode: patch.cardFill !== undefined ? "solid" : selectedCardState.styleMode,
      width: patch.cardWidth ?? selectedCardState.width,
    };
  }

  function cardShadowFromPatch(patch: Partial<ShapeSettings>) {
    return {
      ...selectedCardState.shadow,
      blur: patch.shadowBlur ?? selectedCardState.shadow.blur,
      color: patch.shadowColor ?? selectedCardState.shadow.color,
      offsetX: patch.shadowOffsetX ?? selectedCardState.shadow.offsetX,
      offsetY: patch.shadowOffsetY ?? selectedCardState.shadow.offsetY,
      opacity: patch.shadowOpacity ?? selectedCardState.shadow.opacity,
    };
  }

  function relayoutCardInset(normalizedCardState: ReturnType<typeof normalizeCanvasCardState>) {
    const baseQrState = resolveLiveQrPersistState();
    const fittedQr = fitQrSizeInCard(baseQrState, normalizedCardState);
    const nextQrState = {
      ...baseQrState,
      height: fittedQr.height,
      width: fittedQr.width,
    };

    if (normalizedCardState.sizeMode === "fixed") {
      setSelectedQrSize(fittedQr.width);
    }

    setLayerStateByNodeId((layerState) => {
      const layers =
        layerState[activeQrNodeId] ??
        createDefaultCanvasLayers(activeQrNodeId, nextQrState, normalizedCardState);

      return {
        ...layerState,
        [activeQrNodeId]: layoutCanvasCardInsetLayers(
          layers.map(cloneCanvasLayer),
          nextQrState,
          normalizedCardState,
        ),
      };
    });
  }

  function updateDesktopShapeSettings(patch: Partial<ShapeSettings>) {
    if (patch.backgroundShapeId !== undefined)
      setSelectedBackgroundShapeId(patch.backgroundShapeId);
    if (patch.shapeColorMode) setSelectedBackgroundColorMode(patch.shapeColorMode);
    if (patch.shapeSolidColor) {
      setSelectedBackgroundColorMode("solid");
      setSelectedBackgroundColor(patch.shapeSolidColor);
      setSelectedBackgroundTransparent(false);
    }
    if (patch.shapeGradient) {
      setSelectedBackgroundColorMode("gradient");
      setSelectedBackgroundGradient({ ...patch.shapeGradient, enabled: true });
      setSelectedBackgroundTransparent(false);
    }
    if (patch.shapePadding !== undefined) {
      const paddingPx = patch.shapePadding;
      setSelectedBackgroundShapeOptions((current) => ({ ...current, paddingPx }));
    }

    const qrShadowPatch = Object.fromEntries(
      (
        [
          ["blur", patch.shapeShadowBlur],
          ["color", patch.shapeShadowColor],
          ["offsetX", patch.shapeShadowOffsetX],
          ["offsetY", patch.shapeShadowOffsetY],
          ["opacity", patch.shapeShadowOpacity],
        ] as const
      ).filter(([, value]) => value !== undefined),
    );

    if (Object.keys(qrShadowPatch).length > 0) {
      const qrLayerId = getCanvasQrLayerId(activeQrNodeId);
      const currentQrLayer = findCanvasLayerById(activeCanvasLayers, qrLayerId);
      if (currentQrLayer) {
        handleLayerChange(activeQrNodeId, qrLayerId, {
          shadow: { ...currentQrLayer.shadow, ...qrShadowPatch },
        });
      }
    }

    const normalizedCardState = normalizeCanvasCardState(mergeCardStateFromShapePatch(patch));
    setSelectedCardState(normalizedCardState);

    const shouldRelayoutCardInset =
      patch.bottomSpace !== undefined ||
      patch.cardHeight !== undefined ||
      patch.cardWidth !== undefined ||
      patch.sizeMode !== undefined ||
      patch.sizePresetId !== undefined;

    if (shouldRelayoutCardInset) {
      relayoutCardInset(normalizedCardState);
    }

    if (
      patch.shadowBlur !== undefined ||
      patch.shadowColor !== undefined ||
      patch.shadowOffsetX !== undefined ||
      patch.shadowOffsetY !== undefined ||
      patch.shadowOpacity !== undefined
    ) {
      handleLayerChange(activeQrNodeId, getCanvasCardLayerId(activeQrNodeId), {
        shadow: cardShadowFromPatch(patch),
      });
    }
  }

  function updateDesktopImageSettings(patch: Partial<ImageSettings>) {
    setSelectedCardState((current) => {
      if (patch.remoteUrl === "") {
        return {
          ...current,
          cardImage: {
            ...current.cardImage,
            opacity: patch.opacity ?? current.cardImage.opacity,
            source: "none",
            value: undefined,
          },
          styleMode: "paper-shader",
        };
      }

      const nextRemoteUrl =
        patch.remoteUrl !== undefined ? patch.remoteUrl : current.cardImage.value;

      return {
        ...current,
        cardImage: {
          ...current.cardImage,
          fit: patch.fit ?? current.cardImage.fit,
          opacity: patch.opacity ?? current.cardImage.opacity,
          source:
            patch.sourceMode === "url"
              ? "url"
              : patch.sourceMode === "upload"
                ? "upload"
                : current.cardImage.source,
          value: nextRemoteUrl,
        },
        styleMode: nextRemoteUrl ? "image" : current.styleMode,
      };
    });
  }

  function resetDesktopShapeSettings() {
    const defaultCard = createDefaultCanvasCardState();
    setSelectedCardState(defaultCard);
    setSelectedBackgroundColor(DEFAULT_DRAFTING_STUDIO_STATE.backgroundOptions.color);
    setSelectedBackgroundColorMode(
      DEFAULT_DRAFTING_STUDIO_STATE.backgroundGradient.enabled ? "gradient" : "solid",
    );
    setSelectedBackgroundGradient(
      structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.backgroundGradient),
    );
    setSelectedBackgroundShapeId(DEFAULT_DRAFTING_STUDIO_STATE.backgroundShapeId);
    setSelectedBackgroundShapeOptions({ ...DEFAULT_DRAFTING_STUDIO_STATE.backgroundShapeOptions });
  }

  function updateDesktopMotionSettings(patch: Parameters<typeof setDotMatrixAnimationOptions>[1]) {
    if (patch.enabled !== undefined) {
      clearQrEncodeMarkupCache();
      clearCanvasQrMarkupCache();
    }

    setSelectedDotMatrixAnimation(
      (current) =>
        setDotMatrixAnimationOptions(
          { ...DEFAULT_DRAFTING_STUDIO_STATE, dotMatrixAnimation: current },
          patch,
        ).dotMatrixAnimation,
    );
  }

  function updateDesktopEncodingSettings(patch: Partial<EncodingSettings>) {
    if (patch.typeNumber !== undefined) setSelectedQrTypeNumber(patch.typeNumber);
    if (patch.errorCorrectionLevel) setSelectedQrErrorCorrectionLevel(patch.errorCorrectionLevel);
    if (patch.boostLevel !== undefined) setSelectedBoostLevel(patch.boostLevel);
    if (patch.valueSegmentsText !== undefined)
      setSelectedValueSegmentsText(patch.valueSegmentsText);
  }

  function updateDesktopAccessibilitySettings(patch: Partial<AccessibilitySettings>) {
    if (patch.ariaLabel !== undefined) setSelectedAriaLabel(patch.ariaLabel);
  }

  function updateDesktopTextSettings(patch: Partial<TextSettings>) {
    if (selectedTextLayer?.kind === "text") {
      handleLayerChange(activeQrNodeId, selectedTextLayer.id, patch);
      return;
    }
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultCanvasLayers(activeQrNodeId, canvasQraftyState, selectedCardState);
    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1);
    const textLayer = createCanvasTextLayer(activeQrNodeId, {
      ...patch,
      id: `${activeQrNodeId}:text:${Date.now()}`,
      zIndex: maxZIndex + 1,
    });
    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: [...layers.map(cloneCanvasLayer), textLayer],
    }));
    selectSingleLayer(textLayer.id);
  }

  function updateDesktopLayersSettings(patch: Partial<LayersSettings>) {
    if (patch.selectedLayerId !== undefined) {
      handleLayerSelect(activeQrNodeId, patch.selectedLayerId, { preserveActiveTool: true });
    }
    if (patch.layers) {
      const mergedRows = ensureMandatoryLayerRows(patch.layers, activeCanvasLayers);
      const currentLayersById = new Map(activeCanvasLayers.map((layer) => [layer.id, layer]));
      const nextLayers = mergedRows.map((row) => {
        const layer =
          currentLayersById.get(row.id) ?? createCanvasTextLayer(activeQrNodeId, { id: row.id });

        return patchCanvasLayer(layer, {
          blur: row.blur,
          height: row.height,
          isVisible: true,
          name: row.name,
          opacity: row.opacity / 100,
          shadow: {
            ...layer.shadow,
            blur: row.shadowBlur,
            color: row.shadowColor,
            offsetX: row.shadowOffsetX,
            offsetY: row.shadowOffsetY,
            opacity: row.shadowOpacity,
          },
          tiltX: row.tiltX,
          tiltY: row.tiltY,
          width: row.width,
          x: row.x,
          y: row.y,
        });
      });
      setLayerStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: nextLayers,
      }));
    }
  }

  function updateDesktopExportSettings(patch: Partial<ExportSettings>) {
    if (patch.extension) setSelectedDownloadExtension(patch.extension as CanvasDownloadExtension);
    if (patch.photoLongEdge) setSelectedPhotoLongEdge(patch.photoLongEdge);
    if (patch.target) setSelectedDownloadTarget(getCanvasDownloadTarget(patch.target));
    if (patch.mediaKind) setSelectedExportMediaKind(patch.mediaKind);
    if (patch.videoDurationSeconds) setSelectedVideoDurationSeconds(patch.videoDurationSeconds);
    if (patch.videoFormat) setSelectedVideoFormat(patch.videoFormat);
    if (patch.videoFrameRate) setSelectedVideoFrameRate(patch.videoFrameRate);
    if (patch.videoLongEdge) setSelectedVideoLongEdge(patch.videoLongEdge);
  }

  return {
    handleDesktopAppearancePatch,
    resetDesktopContent,
    applyDesktopPatternPatchToControls,
    applyDesktopCornersPatchToControls,
    applyDesktopUnifiedLogoPatchToControls,
    updateDesktopPatternSettings,
    updateDesktopUnifiedQrFillSettings,
    resetDesktopPatternSettings,
    updateDesktopLogoSettings,
    resetDesktopLogoSettings,
    updateDesktopCornersSettings,
    mergeCardStateFromShapePatch,
    cardShadowFromPatch,
    relayoutCardInset,
    updateDesktopShapeSettings,
    updateDesktopImageSettings,
    resetDesktopShapeSettings,
    updateDesktopMotionSettings,
    updateDesktopEncodingSettings,
    updateDesktopAccessibilitySettings,
    updateDesktopTextSettings,
    updateDesktopLayersSettings,
    updateDesktopExportSettings,
  };
}
