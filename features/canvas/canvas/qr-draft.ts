import { DEFAULT_BRAND_ICON_COLOR } from "@/features/qr/assets/brand-icon-svg";
import {
  formatValueSegmentsText,
  parseValueSegmentsText,
} from "@/features/canvas/components/canvas-operations";
import { clampQrBackgroundRound, getAssetValue, type QraftyState } from "@/features/qr/model/state";

/**
 * QR draft — the single source of truth for the active QR layer.
 *
 * The draft is split in two:
 *
 * - Document fields derive directly from the layer's `QraftyState`
 *   (`qrStateByLayerId[activeQrLayerId]`). They are never stored; reads project
 *   via {@link qrStateToDraftFields} and writes go through
 *   {@link applyQrDraftFieldPatch}.
 * - Buffer fields are UI-only state kept in the surface reducer: per-source
 *   asset inputs (remote URL vs upload vs preset value), the palette preset
 *   label, and the raw value-segments text. They are seeded from the active
 *   QR on selection changes via {@link qrStateToDraftBuffers}.
 */

export type QrDraftDocumentFields = {
  selectedAriaLabel: string;
  selectedBackgroundColor: string;
  selectedBackgroundColorMode: "solid" | "gradient";
  selectedBackgroundGradient: QraftyState["backgroundGradient"];
  selectedBackgroundShapeId: QraftyState["backgroundShapeId"];
  selectedBackgroundShapeOptions: QraftyState["backgroundShapeOptions"];
  selectedBackgroundTransparent: boolean;
  selectedBoostLevel: boolean;
  selectedCornerDotColor: string;
  selectedCornerDotColorMode: "solid" | "gradient";
  selectedCornerDotGradient: QraftyState["finderPatternInnerGradient"];
  selectedCornerSquareColor: string;
  selectedCornerSquareColorMode: "solid" | "gradient";
  selectedCornerSquareGradient: QraftyState["finderPatternOuterGradient"];
  selectedDotColor: string;
  selectedDotMatrixAnimation: QraftyState["dotMatrixAnimation"];
  selectedDotsColorMode: QraftyState["dotsColorMode"];
  selectedDotsGradient: QraftyState["dataModulesGradient"];
  selectedDotsPalette: string[];
  selectedDotType: QraftyState["dataModulesSettings"]["type"];
  selectedGradientLinkMode: QraftyState["gradientLinkMode"];
  selectedHideBackgroundDots: boolean;
  selectedLogoColor: string;
  selectedLogoColorMode: "solid" | "gradient";
  selectedLogoCrossOrigin: QraftyState["imageOptions"]["crossOrigin"];
  selectedLogoGradient: QraftyState["logoGradient"];
  selectedLogoHeightPx: number | undefined;
  selectedLogoLockAspect: boolean;
  selectedLogoMargin: number;
  selectedLogoOffsetX: number;
  selectedLogoOffsetY: number;
  selectedLogoOpacity: number;
  selectedLogoPositionMode: QraftyState["imageOptions"]["logoPositionMode"];
  selectedLogoPresetId: string | undefined;
  selectedLogoSize: number;
  selectedLogoSizeMode: QraftyState["imageOptions"]["sizeMode"];
  selectedLogoSourceMode: QraftyState["logo"]["source"];
  selectedLogoWidthPx: number | undefined;
  selectedModuleLineWidth: number | undefined;
  selectedModuleRoundSize: boolean;
  selectedModuleSize: number | undefined;
  selectedQrErrorCorrectionLevel: QraftyState["qrOptions"]["errorCorrectionLevel"];
  selectedQrFinderPatternInnerStyle: QraftyState["finderPatternInnerSettings"]["type"];
  selectedQrFinderPatternOuterStyle: QraftyState["finderPatternOuterSettings"]["type"];
  selectedQrMargin: number;
  selectedQrMode: QraftyState["qrOptions"]["mode"];
  selectedQrRadius: number;
  selectedQrSize: number;
  selectedQrTypeNumber: QraftyState["qrOptions"]["typeNumber"];
  selectedRasterExportQualityPercent: number;
};

export type QrDraftBufferFields = {
  selectedBackgroundAssetSourceMode: "upload" | "url";
  selectedBackgroundRemoteUrl: string;
  selectedDotsPalettePreset: string | "custom";
  selectedLogoAssetSourceMode: "upload" | "url";
  selectedLogoPresetValue: string | undefined;
  selectedLogoRemoteUrl: string;
  selectedLogoUploadValue: string;
  selectedModuleFillImageSourceMode: "upload" | "url";
  selectedModuleFillImageUrl: string;
  selectedModuleFillRemoteUrl: string;
  selectedValueSegmentsText: string;
};

export type QrDraftFields = QrDraftDocumentFields & QrDraftBufferFields;

export type QrDraftField = keyof QrDraftFields;

const QR_DRAFT_BUFFER_FIELD_SET = new Set<keyof QrDraftBufferFields>([
  "selectedBackgroundAssetSourceMode",
  "selectedBackgroundRemoteUrl",
  "selectedDotsPalettePreset",
  "selectedLogoAssetSourceMode",
  "selectedLogoPresetValue",
  "selectedLogoRemoteUrl",
  "selectedLogoUploadValue",
  "selectedModuleFillImageSourceMode",
  "selectedModuleFillImageUrl",
  "selectedModuleFillRemoteUrl",
  "selectedValueSegmentsText",
]);

export function isQrDraftBufferField(field: QrDraftField): field is keyof QrDraftBufferFields {
  return QR_DRAFT_BUFFER_FIELD_SET.has(field as keyof QrDraftBufferFields);
}

/** Project the persisted QR state into the control-facing draft fields. */
export function qrStateToDraftFields(qr: QraftyState): QrDraftDocumentFields {
  const imageOptions = qr.imageOptions;

  return {
    selectedAriaLabel: qr.ariaLabel ?? "",
    selectedBackgroundColor: qr.backgroundOptions.color,
    selectedBackgroundColorMode: qr.backgroundGradient.enabled ? "gradient" : "solid",
    selectedBackgroundGradient: qr.backgroundGradient,
    selectedBackgroundShapeId: qr.backgroundShapeId,
    selectedBackgroundShapeOptions: qr.backgroundShapeOptions,
    selectedBackgroundTransparent: qr.backgroundOptions.transparent,
    selectedBoostLevel: qr.qrOptions.boostLevel,
    selectedCornerDotColor: qr.finderPatternInnerSettings.color,
    selectedCornerDotColorMode: qr.finderPatternInnerGradient.enabled ? "gradient" : "solid",
    selectedCornerDotGradient: qr.finderPatternInnerGradient,
    selectedCornerSquareColor: qr.finderPatternOuterSettings.color,
    selectedCornerSquareColorMode: qr.finderPatternOuterGradient.enabled ? "gradient" : "solid",
    selectedCornerSquareGradient: qr.finderPatternOuterGradient,
    selectedDotColor: qr.dataModulesSettings.color,
    selectedDotMatrixAnimation: qr.dotMatrixAnimation,
    selectedDotsColorMode: qr.dotsColorMode,
    selectedDotsGradient: qr.dataModulesGradient,
    selectedDotsPalette: qr.dotsPalette,
    selectedDotType: qr.dataModulesSettings.type,
    selectedGradientLinkMode: qr.gradientLinkMode,
    selectedHideBackgroundDots: imageOptions.hideBackgroundDots,
    selectedLogoColor: qr.logo.presetColor ?? DEFAULT_BRAND_ICON_COLOR,
    selectedLogoColorMode: qr.logoGradient.enabled ? "gradient" : "solid",
    selectedLogoCrossOrigin: imageOptions.crossOrigin,
    selectedLogoGradient: qr.logoGradient,
    selectedLogoHeightPx: imageOptions.heightPx,
    selectedLogoLockAspect: imageOptions.lockAspect,
    selectedLogoMargin: imageOptions.margin,
    selectedLogoOffsetX: imageOptions.x ?? 0,
    selectedLogoOffsetY: imageOptions.y ?? 0,
    selectedLogoOpacity: imageOptions.opacity * 100,
    selectedLogoPositionMode: imageOptions.logoPositionMode,
    selectedLogoPresetId: qr.logo.presetId,
    selectedLogoSize: Math.round(imageOptions.imageSize * 100),
    selectedLogoSizeMode: imageOptions.sizeMode,
    selectedLogoSourceMode: qr.logo.source,
    selectedLogoWidthPx: imageOptions.widthPx,
    selectedModuleLineWidth: qr.dataModulesSettings.lineWidth,
    selectedModuleRoundSize: qr.dataModulesSettings.roundSize,
    selectedModuleSize: qr.dataModulesSettings.moduleSize,
    selectedQrErrorCorrectionLevel: qr.qrOptions.errorCorrectionLevel,
    selectedQrFinderPatternInnerStyle: qr.finderPatternInnerSettings.type,
    selectedQrFinderPatternOuterStyle: qr.finderPatternOuterSettings.type,
    selectedQrMargin: qr.margin,
    selectedQrMode: qr.qrOptions.mode,
    selectedQrRadius: clampQrBackgroundRound(qr.backgroundOptions.round),
    selectedQrSize: qr.width,
    selectedQrTypeNumber: qr.qrOptions.typeNumber,
    selectedRasterExportQualityPercent: qr.rasterExportQualityPercent,
  };
}

/** Seed the UI-only draft buffers from a persisted QR state (layer/board
 * switch, reset, external commit). Mirrors the previous `applyQrState` sync.
 * `selectedDotsPalettePreset` is not seeded — it tracks the last preset the
 * user picked, independent of the active layer. */
export function qrStateToDraftBuffers(qr: QraftyState): Partial<QrDraftBufferFields> {
  const buffers: Partial<QrDraftBufferFields> = {
    selectedBackgroundAssetSourceMode: qr.backgroundImage.source === "url" ? "url" : "upload",
    selectedBackgroundRemoteUrl:
      qr.backgroundImage.source === "url" ? (qr.backgroundImage.value ?? "") : "",
    selectedValueSegmentsText: formatValueSegmentsText(qr.valueSegments),
  };

  if (qr.logo.source === "preset") {
    buffers.selectedLogoPresetValue = qr.logo.value;
  } else if (qr.logo.source === "url") {
    buffers.selectedLogoAssetSourceMode = "url";
    buffers.selectedLogoRemoteUrl = qr.logo.value ?? "";
    buffers.selectedLogoUploadValue = "";
  } else if (qr.logo.source === "upload") {
    buffers.selectedLogoAssetSourceMode = "upload";
    buffers.selectedLogoUploadValue = qr.logo.value ?? "";
    buffers.selectedLogoRemoteUrl = "";
  } else {
    buffers.selectedLogoPresetValue = undefined;
  }

  if (qr.dotsColorMode === "image") {
    const fillValue = getAssetValue(qr.moduleFillImage) ?? "";
    if (qr.moduleFillImage.source === "url") {
      buffers.selectedModuleFillImageSourceMode = "url";
      buffers.selectedModuleFillRemoteUrl = fillValue;
      buffers.selectedModuleFillImageUrl = "";
    } else {
      buffers.selectedModuleFillImageSourceMode = "upload";
      buffers.selectedModuleFillImageUrl = fillValue;
      buffers.selectedModuleFillRemoteUrl = "";
    }
  }

  return buffers;
}

export type QrDraftBuffers = Readonly<QrDraftBufferFields>;

function withGradientEnabled(
  gradient: QraftyState["dataModulesGradient"],
  enabled: boolean,
): QraftyState["dataModulesGradient"] {
  return { ...structuredClone(gradient), enabled };
}

function setModuleFillFromBuffers(
  qr: QraftyState,
  buffers: QrDraftBuffers,
): QraftyState["moduleFillImage"] {
  return {
    presetColor: undefined,
    presetId: undefined,
    source: buffers.selectedModuleFillImageSourceMode === "url" ? "url" : "upload",
    value:
      buffers.selectedModuleFillImageSourceMode === "url"
        ? buffers.selectedModuleFillRemoteUrl || undefined
        : buffers.selectedModuleFillImageUrl || undefined,
  };
}

function setLogoValueFromBuffers(qr: QraftyState, buffers: QrDraftBuffers): QraftyState["logo"] {
  const logo = qr.logo;
  return {
    ...logo,
    value:
      logo.source === "preset"
        ? buffers.selectedLogoPresetValue
        : logo.source === "url"
          ? buffers.selectedLogoRemoteUrl || undefined
          : logo.source === "upload"
            ? buffers.selectedLogoUploadValue || undefined
            : undefined,
  };
}

/**
 * Apply one draft-field write to the persisted QR state. Buffer-dependent
 * fields (asset source modes) also read `buffers` — which already reflects the
 * field write when the reducer applies a dual buffer+document update.
 */
export function applyQrDraftFieldPatch<K extends QrDraftField>(
  qr: QraftyState,
  field: K,
  value: QrDraftFields[K],
  buffers: QrDraftBuffers,
): QraftyState {
  switch (field) {
    case "selectedQrMargin":
      return { ...qr, margin: value as number };
    case "selectedQrRadius":
      return { ...qr, backgroundOptions: { ...qr.backgroundOptions, round: value as number } };
    case "selectedRasterExportQualityPercent":
      return { ...qr, rasterExportQualityPercent: value as number };
    case "selectedQrSize":
      return { ...qr, width: value as number, height: value as number };
    case "selectedDotType":
      return { ...qr, dataModulesSettings: { ...qr.dataModulesSettings, type: value as never } };
    case "selectedDotColor":
      return { ...qr, dataModulesSettings: { ...qr.dataModulesSettings, color: value as string } };
    case "selectedModuleRoundSize":
      return {
        ...qr,
        dataModulesSettings: { ...qr.dataModulesSettings, roundSize: value as boolean },
      };
    case "selectedModuleSize":
      return {
        ...qr,
        dataModulesSettings: { ...qr.dataModulesSettings, moduleSize: value as number | undefined },
      };
    case "selectedModuleLineWidth":
      return {
        ...qr,
        dataModulesSettings: { ...qr.dataModulesSettings, lineWidth: value as number | undefined },
      };
    case "selectedDotsColorMode": {
      const mode = value as QraftyState["dotsColorMode"];
      return {
        ...qr,
        dotsColorMode: mode,
        dataModulesGradient: withGradientEnabled(qr.dataModulesGradient, mode === "gradient"),
        moduleFillImage:
          mode === "image" ? setModuleFillFromBuffers(qr, buffers) : { source: "none" },
      };
    }
    case "selectedDotsGradient":
      return {
        ...qr,
        dataModulesGradient: withGradientEnabled(
          value as QraftyState["dataModulesGradient"],
          qr.dotsColorMode === "gradient",
        ),
      };
    case "selectedDotsPalette":
      return { ...qr, dotsPalette: [...(value as string[])] };
    case "selectedDotMatrixAnimation":
      return { ...qr, dotMatrixAnimation: { ...(value as QraftyState["dotMatrixAnimation"]) } };
    case "selectedQrFinderPatternOuterStyle":
      return {
        ...qr,
        finderPatternOuterSettings: { ...qr.finderPatternOuterSettings, type: value as never },
      };
    case "selectedQrFinderPatternInnerStyle":
      return {
        ...qr,
        finderPatternInnerSettings: { ...qr.finderPatternInnerSettings, type: value as never },
      };
    case "selectedCornerSquareColor":
      return {
        ...qr,
        finderPatternOuterSettings: { ...qr.finderPatternOuterSettings, color: value as string },
      };
    case "selectedCornerDotColor":
      return {
        ...qr,
        finderPatternInnerSettings: { ...qr.finderPatternInnerSettings, color: value as string },
      };
    case "selectedCornerSquareColorMode":
      return {
        ...qr,
        finderPatternOuterGradient: withGradientEnabled(
          qr.finderPatternOuterGradient,
          value === "gradient",
        ),
      };
    case "selectedCornerDotColorMode":
      return {
        ...qr,
        finderPatternInnerGradient: withGradientEnabled(
          qr.finderPatternInnerGradient,
          value === "gradient",
        ),
      };
    case "selectedCornerSquareGradient":
      return {
        ...qr,
        finderPatternOuterGradient: withGradientEnabled(
          value as QraftyState["finderPatternOuterGradient"],
          qr.finderPatternOuterGradient.enabled,
        ),
      };
    case "selectedCornerDotGradient":
      return {
        ...qr,
        finderPatternInnerGradient: withGradientEnabled(
          value as QraftyState["finderPatternInnerGradient"],
          qr.finderPatternInnerGradient.enabled,
        ),
      };
    case "selectedBackgroundColorMode":
      return {
        ...qr,
        backgroundGradient: withGradientEnabled(qr.backgroundGradient, value === "gradient"),
      };
    case "selectedBackgroundColor":
      return { ...qr, backgroundOptions: { ...qr.backgroundOptions, color: value as string } };
    case "selectedBackgroundTransparent":
      return {
        ...qr,
        backgroundOptions: { ...qr.backgroundOptions, transparent: value as boolean },
      };
    case "selectedBackgroundGradient":
      return {
        ...qr,
        backgroundGradient: withGradientEnabled(
          value as QraftyState["backgroundGradient"],
          qr.backgroundGradient.enabled,
        ),
      };
    case "selectedBackgroundShapeId":
      return { ...qr, backgroundShapeId: value as QraftyState["backgroundShapeId"] };
    case "selectedBackgroundShapeOptions":
      return {
        ...qr,
        backgroundShapeOptions: {
          ...qr.backgroundShapeOptions,
          ...(value as QraftyState["backgroundShapeOptions"]),
        },
      };
    case "selectedBackgroundAssetSourceMode": {
      const source = (value as "upload" | "url") === "url" ? "url" : "none";
      return {
        ...qr,
        backgroundImage: {
          presetColor: undefined,
          presetId: undefined,
          source,
          value: source === "url" ? buffers.selectedBackgroundRemoteUrl || undefined : undefined,
        },
      };
    }
    case "selectedBackgroundRemoteUrl":
      return qr.backgroundImage.source === "url"
        ? {
            ...qr,
            backgroundImage: { ...qr.backgroundImage, value: (value as string) || undefined },
          }
        : qr;
    case "selectedLogoColorMode":
      return {
        ...qr,
        logoGradient: withGradientEnabled(qr.logoGradient, value === "gradient"),
      };
    case "selectedLogoColor":
      return { ...qr, logo: { ...qr.logo, presetColor: value as string } };
    case "selectedLogoGradient":
      return {
        ...qr,
        logoGradient: withGradientEnabled(
          value as QraftyState["logoGradient"],
          qr.logoGradient.enabled,
        ),
      };
    case "selectedLogoSourceMode":
      return {
        ...qr,
        logo: setLogoValueFromBuffers(
          { ...qr, logo: { ...qr.logo, source: value as QraftyState["logo"]["source"] } },
          buffers,
        ),
      };
    case "selectedLogoPresetId":
      return { ...qr, logo: { ...qr.logo, presetId: value as string | undefined } };
    case "selectedLogoPresetValue":
      return qr.logo.source === "preset"
        ? { ...qr, logo: { ...qr.logo, value: value as string | undefined } }
        : qr;
    case "selectedLogoRemoteUrl":
      return qr.logo.source === "url"
        ? { ...qr, logo: { ...qr.logo, value: (value as string) || undefined } }
        : qr;
    case "selectedLogoUploadValue":
      return qr.logo.source === "upload"
        ? { ...qr, logo: { ...qr.logo, value: (value as string) || undefined } }
        : qr;
    case "selectedLogoSize":
      return { ...qr, imageOptions: { ...qr.imageOptions, imageSize: (value as number) / 100 } };
    case "selectedLogoMargin":
      return { ...qr, imageOptions: { ...qr.imageOptions, margin: value as number } };
    case "selectedHideBackgroundDots":
      return {
        ...qr,
        imageOptions: { ...qr.imageOptions, hideBackgroundDots: value as boolean },
      };
    case "selectedLogoOpacity":
      return { ...qr, imageOptions: { ...qr.imageOptions, opacity: (value as number) / 100 } };
    case "selectedLogoSizeMode":
      return {
        ...qr,
        imageOptions: {
          ...qr.imageOptions,
          sizeMode: value as QraftyState["imageOptions"]["sizeMode"],
        },
      };
    case "selectedLogoWidthPx":
      return { ...qr, imageOptions: { ...qr.imageOptions, widthPx: value as number | undefined } };
    case "selectedLogoHeightPx":
      return { ...qr, imageOptions: { ...qr.imageOptions, heightPx: value as number | undefined } };
    case "selectedLogoLockAspect":
      return { ...qr, imageOptions: { ...qr.imageOptions, lockAspect: value as boolean } };
    case "selectedLogoPositionMode":
      return {
        ...qr,
        imageOptions: {
          ...qr.imageOptions,
          logoPositionMode: value as QraftyState["imageOptions"]["logoPositionMode"],
        },
      };
    case "selectedLogoOffsetX":
      return { ...qr, imageOptions: { ...qr.imageOptions, x: value as number } };
    case "selectedLogoOffsetY":
      return { ...qr, imageOptions: { ...qr.imageOptions, y: value as number } };
    case "selectedLogoCrossOrigin":
      return {
        ...qr,
        imageOptions: {
          ...qr.imageOptions,
          crossOrigin: value as QraftyState["imageOptions"]["crossOrigin"],
        },
      };
    case "selectedModuleFillImageSourceMode":
    case "selectedModuleFillRemoteUrl":
    case "selectedModuleFillImageUrl":
      return qr.dotsColorMode === "image"
        ? { ...qr, moduleFillImage: setModuleFillFromBuffers(qr, buffers) }
        : qr;
    case "selectedLogoAssetSourceMode":
      // Picker tab only — the persisted source changes via `selectedLogoSourceMode`.
      return qr;
    case "selectedQrTypeNumber":
      return { ...qr, qrOptions: { ...qr.qrOptions, typeNumber: value as never } };
    case "selectedQrErrorCorrectionLevel":
      return {
        ...qr,
        qrOptions: { ...qr.qrOptions, errorCorrectionLevel: value as never },
      };
    case "selectedBoostLevel":
      return { ...qr, qrOptions: { ...qr.qrOptions, boostLevel: value as boolean } };
    case "selectedQrMode":
      return { ...qr, qrOptions: { ...qr.qrOptions, mode: value as never } };
    case "selectedValueSegmentsText":
      return { ...qr, valueSegments: parseValueSegmentsText(value as string) };
    case "selectedAriaLabel":
      return { ...qr, ariaLabel: (value as string) || undefined };
    case "selectedGradientLinkMode":
      return { ...qr, gradientLinkMode: value as QraftyState["gradientLinkMode"] };
    case "selectedDotsPalettePreset":
      return qr;
    default:
      return qr;
  }
}
