import { useMemo, useReducer, type Dispatch } from "react";

import {
  applyQrDraftFieldPatch,
  isQrDraftBufferField,
  qrStateToDraftBuffers,
  qrStateToDraftFields,
  type QrDraftBuffers,
  type QrDraftDocumentFields,
  type QrDraftField,
  type QrDraftFields,
} from "@/features/canvas/canvas/qr-draft";
import {
  createDefaultCanvasCardState,
  type CanvasCardState,
} from "@/features/canvas/model/card-state";
import {
  getCanvasQrLayerId,
  type CanvasLayerStateByNodeId,
} from "@/features/canvas/model/layers/shared";
import { createDefaultCanvasLayers } from "@/features/canvas/model/layers/card-qr";
import {
  cloneCanvasQrState,
  createDefaultCanvasWorkspaceQrState,
  type CanvasCardStateByNodeId,
  type CanvasContentValuesByType,
  type CanvasQrStateByLayerId,
  type CanvasQrStateByNodeId,
} from "@/features/canvas/model/document";
import {
  DEFAULT_DRAFTING_STUDIO_STATE,
  type CanvasDownloadExtension,
} from "@/features/canvas/components/canvas.constants";
import type { CanvasBoardTool } from "@/features/canvas/components/Canvas";
import type {
  ToolbarToolId,
  ComposeSidebarPanel,
} from "@/features/shell/components/WorkspaceChrome";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import { getDefaultStaticQrValues } from "@/features/qr/content/static-payload";
import type { VideoExportLongEdge } from "@/features/qr/export/video-export";
import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr/content/input-options";
import type { AssetSourceMode } from "@/features/qr/model/state";
import type { ExportMediaKind } from "@/features/shell/model/toolbar-types";
import { DEFAULT_DESKTOP_EXPORT_SETTINGS } from "@/features/shell/model/toolbar-defaults";
import type { CanvasDownloadTarget } from "@/features/canvas/components/canvas-operations";
import type { QraftyState } from "@/features/qr/model/state";

/**
 * The workspace surface state is a single store: QR edits live in
 * `qrStateByLayerId[activeQrLayerId]` (mirrored per board in
 * `qrStateByNodeId[activeQrNodeId]`), the card lives in
 * `cardStateByNodeId[activeQrNodeId]`, and everything else is UI state or a
 * per-source asset buffer. The `selected*` QR fields are a derived view over
 * the active QR — `useCanvasSurfaceReducer` merges them back in for
 * consumers, and `setSelected*` setters translate to QR patches.
 */
export type CanvasSurfaceState = QrDraftFields & {
  desktopRailTool: ToolbarToolId | null;
  composeSidebarPanel: ComposeSidebarPanel;
  selectedContentType: QrInputType;
  contentValuesByType: CanvasContentValuesByType;
  contentTypeByNodeId: Record<string, QrInputType>;
  contentTypeByLayerId: Record<string, QrInputType>;
  /** Derived view of `cardStateByNodeId[activeQrNodeId]`. */
  selectedCardState: CanvasCardState;
  activeQrLayerId: string;
  activeQrNodeId: string;
  qrStateByLayerId: CanvasQrStateByLayerId;
  qrStateByNodeId: CanvasQrStateByNodeId;
  cardStateByNodeId: CanvasCardStateByNodeId;
  layerStateByNodeId: CanvasLayerStateByNodeId;
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  desktopCanvasTool: CanvasBoardTool | null;
  selectedDownloadExtension: CanvasDownloadExtension;
  selectedDownloadTarget: CanvasDownloadTarget;
  exportDownloadError: string | null;
  selectedPhotoLongEdge: VideoExportLongEdge;
  selectedExportMediaKind: ExportMediaKind;
  selectedVideoDurationSeconds: number;
  selectedVideoFormat: "mp4" | "webm";
  selectedVideoFrameRate: 30 | 60;
  selectedVideoLongEdge: VideoExportLongEdge;
  logoUploadObjectUrl: string | null;
  moduleFillUploadObjectUrl: string | null;
};

type StoredCanvasSurfaceState = Omit<
  CanvasSurfaceState,
  keyof QrDraftDocumentFields | "selectedCardState"
>;

export type CanvasAssetSourceMode = Extract<AssetSourceMode, "upload" | "url">;

type CanvasSurfaceField = keyof StoredCanvasSurfaceState;

type FieldValue<K extends keyof CanvasSurfaceState> = CanvasSurfaceState[K];
type FieldUpdater<K extends keyof CanvasSurfaceState> =
  FieldValue<K> | ((prev: FieldValue<K>) => FieldValue<K>);

export type SetCanvasSurfaceFieldAction<K extends CanvasSurfaceField = CanvasSurfaceField> = {
  type: "SET_FIELD";
  field: K;
  value: FieldUpdater<K>;
};

/** Card edits write through to `cardStateByNodeId[activeQrNodeId]` — the
 * field rides the draft path so `setSelectedCardState` stays atomic. */
export type QrDraftWriteField = QrDraftField | "selectedCardState";

export type UpdateQrDraftAction<K extends QrDraftWriteField = QrDraftWriteField> = {
  type: "UPDATE_QR_DRAFT";
  field: K;
  value: FieldUpdater<K>;
};

/** Write a full `QraftyState` to the store — layer activation, resets, and
 * external commits (logo flows). Also seeds the asset buffers and optionally
 * switches the active layer/board/content type. */
export type SetActiveQrAction = {
  type: "SET_ACTIVE_QR";
  qr: QraftyState;
  layerId?: string;
  nodeId?: string;
  contentType?: QrInputType;
};

export type CanvasSurfaceAction =
  SetCanvasSurfaceFieldAction | UpdateQrDraftAction | SetActiveQrAction;

export type CanvasSurfaceSetter<K extends keyof CanvasSurfaceState> = (
  value: FieldUpdater<K>,
) => void;

export type CanvasSurfaceSetters = {
  [K in keyof CanvasSurfaceState as `set${Capitalize<string & K>}`]: CanvasSurfaceSetter<K>;
};

export function createInitialCanvasSurfaceState(
  initialActiveTool?: ToolbarToolId,
): StoredCanvasSurfaceState {
  const defaultQrState = createDefaultCanvasWorkspaceQrState();
  const defaultCardState = createDefaultCanvasCardState();
  const primaryQrLayerId = getCanvasQrLayerId(DASHBOARD_QR_NODE_ID);

  return {
    desktopRailTool: initialActiveTool ?? "content",
    composeSidebarPanel: null,
    selectedContentType: DEFAULT_QR_INPUT_TYPE,
    contentValuesByType: {
      [DEFAULT_QR_INPUT_TYPE]: {
        ...getDefaultStaticQrValues(DEFAULT_QR_INPUT_TYPE),
        url: DEFAULT_DRAFTING_STUDIO_STATE.data,
      },
    },
    contentTypeByNodeId: {
      [DASHBOARD_QR_NODE_ID]: DEFAULT_QR_INPUT_TYPE,
    },
    contentTypeByLayerId: {
      [primaryQrLayerId]: DEFAULT_QR_INPUT_TYPE,
    },
    selectedDotsPalettePreset: "Signal",
    selectedModuleFillImageUrl: "",
    selectedModuleFillImageSourceMode: "upload",
    selectedModuleFillRemoteUrl: "",
    selectedBackgroundAssetSourceMode:
      DEFAULT_DRAFTING_STUDIO_STATE.backgroundImage.source === "url" ? "url" : "upload",
    selectedBackgroundRemoteUrl:
      DEFAULT_DRAFTING_STUDIO_STATE.backgroundImage.source === "url"
        ? (DEFAULT_DRAFTING_STUDIO_STATE.backgroundImage.value ?? "")
        : "",
    selectedLogoPresetValue: DEFAULT_DRAFTING_STUDIO_STATE.logo.value,
    selectedLogoAssetSourceMode:
      DEFAULT_DRAFTING_STUDIO_STATE.logo.source === "url" ? "url" : "upload",
    selectedLogoRemoteUrl:
      DEFAULT_DRAFTING_STUDIO_STATE.logo.source === "url"
        ? (DEFAULT_DRAFTING_STUDIO_STATE.logo.value ?? "")
        : "",
    selectedLogoUploadValue:
      DEFAULT_DRAFTING_STUDIO_STATE.logo.source === "upload"
        ? (DEFAULT_DRAFTING_STUDIO_STATE.logo.value ?? "")
        : "",
    selectedValueSegmentsText: "",
    ...qrStateToDraftBuffers(defaultQrState),
    activeQrLayerId: primaryQrLayerId,
    activeQrNodeId: DASHBOARD_QR_NODE_ID,
    qrStateByLayerId: {
      [primaryQrLayerId]: defaultQrState,
    },
    qrStateByNodeId: {
      [DASHBOARD_QR_NODE_ID]: defaultQrState,
    },
    cardStateByNodeId: {
      [DASHBOARD_QR_NODE_ID]: defaultCardState,
    },
    layerStateByNodeId: {
      [DASHBOARD_QR_NODE_ID]: createDefaultCanvasLayers(
        DASHBOARD_QR_NODE_ID,
        defaultQrState,
        defaultCardState,
      ),
    },
    selectedLayerId: primaryQrLayerId,
    selectedLayerIds: [primaryQrLayerId],
    desktopCanvasTool: "select",
    selectedDownloadExtension: "png",
    selectedDownloadTarget: "surface",
    exportDownloadError: null,
    selectedPhotoLongEdge: DEFAULT_DESKTOP_EXPORT_SETTINGS.photoLongEdge,
    selectedExportMediaKind: DEFAULT_DESKTOP_EXPORT_SETTINGS.mediaKind,
    selectedVideoDurationSeconds: DEFAULT_DESKTOP_EXPORT_SETTINGS.videoDurationSeconds,
    selectedVideoFormat: DEFAULT_DESKTOP_EXPORT_SETTINGS.videoFormat,
    selectedVideoFrameRate: DEFAULT_DESKTOP_EXPORT_SETTINGS.videoFrameRate,
    selectedVideoLongEdge: DEFAULT_DESKTOP_EXPORT_SETTINGS.videoLongEdge,
    logoUploadObjectUrl: null,
    moduleFillUploadObjectUrl: null,
  };
}

function activeQrState(state: StoredCanvasSurfaceState): QraftyState {
  return state.qrStateByLayerId[state.activeQrLayerId] ?? createDefaultCanvasWorkspaceQrState();
}

export function canvasReducer(
  state: StoredCanvasSurfaceState,
  action: CanvasSurfaceAction,
): StoredCanvasSurfaceState {
  switch (action.type) {
    case "SET_FIELD": {
      const { field, value } = action;
      const currentValue = state[field];
      const nextValue =
        typeof value === "function"
          ? (value as (prev: typeof currentValue) => typeof currentValue)(currentValue)
          : value;

      if (Object.is(nextValue, currentValue)) {
        return state;
      }

      return {
        ...state,
        [field]: nextValue,
      };
    }
    case "UPDATE_QR_DRAFT": {
      const { field, value } = action;

      if (field === "selectedCardState") {
        const current =
          state.cardStateByNodeId[state.activeQrNodeId] ?? createDefaultCanvasCardState();
        const nextValue: CanvasCardState =
          typeof value === "function"
            ? (value as (prev: CanvasCardState) => CanvasCardState)(current)
            : (value as CanvasCardState);

        if (Object.is(nextValue, current)) {
          return state;
        }

        return {
          ...state,
          cardStateByNodeId: {
            ...state.cardStateByNodeId,
            [state.activeQrNodeId]: nextValue,
          },
        };
      }

      const qr = activeQrState(state);
      const previousValue = isQrDraftBufferField(field)
        ? state[field]
        : qrStateToDraftFields(qr)[field];
      const nextValue =
        typeof value === "function"
          ? (value as (prev: typeof previousValue) => typeof previousValue)(previousValue)
          : value;

      if (Object.is(nextValue, previousValue) && !isQrDraftBufferField(field)) {
        return state;
      }

      // Buffer fields write first so document patchers see the new value.
      const withBuffer = isQrDraftBufferField(field) ? { ...state, [field]: nextValue } : state;
      const patchedQr = applyQrDraftFieldPatch(
        qr,
        field,
        nextValue as QrDraftFields[QrDraftField],
        withBuffer as QrDraftBuffers,
      );

      if (patchedQr === qr) {
        return withBuffer === state ? state : withBuffer;
      }

      return {
        ...withBuffer,
        qrStateByLayerId: {
          ...withBuffer.qrStateByLayerId,
          [state.activeQrLayerId]: patchedQr,
        },
        qrStateByNodeId: {
          ...withBuffer.qrStateByNodeId,
          [state.activeQrNodeId]: patchedQr,
        },
      };
    }
    case "SET_ACTIVE_QR": {
      // A board switch without an explicit layer activates that board's QR
      // layer — `qrStateByLayerId[activeQrLayerId]` must point at the QR the
      // caller is switching to, not the previous layer.
      const nodeId = action.nodeId ?? state.activeQrNodeId;
      const layerId =
        action.layerId ??
        (action.nodeId !== undefined ? getCanvasQrLayerId(nodeId) : state.activeQrLayerId);
      const qr = cloneCanvasQrState(action.qr);
      const contentType = action.contentType ?? state.selectedContentType;

      return {
        ...state,
        ...qrStateToDraftBuffers(qr),
        activeQrLayerId: layerId,
        activeQrNodeId: nodeId,
        selectedContentType: contentType,
        contentTypeByLayerId: {
          ...state.contentTypeByLayerId,
          [layerId]: contentType,
        },
        contentTypeByNodeId: {
          ...state.contentTypeByNodeId,
          [nodeId]: contentType,
        },
        qrStateByLayerId: {
          ...state.qrStateByLayerId,
          [layerId]: qr,
        },
        qrStateByNodeId: {
          ...state.qrStateByNodeId,
          [nodeId]: qr,
        },
      };
    }
    default:
      return state;
  }
}

const QR_DRAFT_FIELD_SET = new Set<QrDraftWriteField>([
  "selectedAriaLabel",
  "selectedBackgroundAssetSourceMode",
  "selectedBackgroundColor",
  "selectedBackgroundColorMode",
  "selectedBackgroundGradient",
  "selectedBackgroundRemoteUrl",
  "selectedBackgroundShapeId",
  "selectedBackgroundShapeOptions",
  "selectedBackgroundTransparent",
  "selectedBoostLevel",
  "selectedCornerDotColor",
  "selectedCornerDotColorMode",
  "selectedCornerDotGradient",
  "selectedCornerSquareColor",
  "selectedCornerSquareColorMode",
  "selectedCornerSquareGradient",
  "selectedDotColor",
  "selectedDotMatrixAnimation",
  "selectedDotsColorMode",
  "selectedDotsGradient",
  "selectedDotsPalette",
  "selectedDotsPalettePreset",
  "selectedDotType",
  "selectedGradientLinkMode",
  "selectedHideBackgroundDots",
  "selectedLogoAssetSourceMode",
  "selectedLogoColor",
  "selectedLogoColorMode",
  "selectedLogoCrossOrigin",
  "selectedLogoGradient",
  "selectedLogoHeightPx",
  "selectedLogoLockAspect",
  "selectedLogoMargin",
  "selectedLogoOffsetX",
  "selectedLogoOffsetY",
  "selectedLogoOpacity",
  "selectedLogoPositionMode",
  "selectedLogoPresetId",
  "selectedLogoPresetValue",
  "selectedLogoRemoteUrl",
  "selectedLogoSize",
  "selectedLogoSizeMode",
  "selectedLogoSourceMode",
  "selectedLogoUploadValue",
  "selectedLogoWidthPx",
  "selectedModuleFillImageSourceMode",
  "selectedModuleFillImageUrl",
  "selectedModuleFillRemoteUrl",
  "selectedModuleLineWidth",
  "selectedModuleRoundSize",
  "selectedModuleSize",
  "selectedQrErrorCorrectionLevel",
  "selectedQrFinderPatternInnerStyle",
  "selectedQrFinderPatternOuterStyle",
  "selectedQrMargin",
  "selectedQrMode",
  "selectedQrRadius",
  "selectedQrSize",
  "selectedQrTypeNumber",
  "selectedRasterExportQualityPercent",
  "selectedValueSegmentsText",
  "selectedCardState",
]);

function createCanvasSurfaceSetters(dispatch: Dispatch<CanvasSurfaceAction>): CanvasSurfaceSetters {
  const setField = <K extends keyof CanvasSurfaceState>(field: K, value: FieldUpdater<K>) => {
    if (QR_DRAFT_FIELD_SET.has(field as QrDraftWriteField)) {
      dispatch({
        type: "UPDATE_QR_DRAFT",
        field: field as QrDraftWriteField,
        value,
      } as CanvasSurfaceAction);
    } else {
      dispatch({
        type: "SET_FIELD",
        field: field as CanvasSurfaceField,
        value,
      } as CanvasSurfaceAction);
    }
  };

  return {
    setDesktopRailTool: (value) => setField("desktopRailTool", value),
    setComposeSidebarPanel: (value) => setField("composeSidebarPanel", value),
    setSelectedContentType: (value) => setField("selectedContentType", value),
    setContentValuesByType: (value) => setField("contentValuesByType", value),
    setContentTypeByNodeId: (value) => setField("contentTypeByNodeId", value),
    setContentTypeByLayerId: (value) => setField("contentTypeByLayerId", value),
    setSelectedQrMargin: (value) => setField("selectedQrMargin", value),
    setSelectedQrRadius: (value) => setField("selectedQrRadius", value),
    setSelectedRasterExportQualityPercent: (value) =>
      setField("selectedRasterExportQualityPercent", value),
    setSelectedQrSize: (value) => setField("selectedQrSize", value),
    setSelectedDotType: (value) => setField("selectedDotType", value),
    setSelectedDotsColorMode: (value) => setField("selectedDotsColorMode", value),
    setSelectedDotColor: (value) => setField("selectedDotColor", value),
    setSelectedDotsGradient: (value) => setField("selectedDotsGradient", value),
    setSelectedDotsPalette: (value) => setField("selectedDotsPalette", value),
    setSelectedDotsPalettePreset: (value) => setField("selectedDotsPalettePreset", value),
    setSelectedModuleFillImageUrl: (value) => setField("selectedModuleFillImageUrl", value),
    setSelectedModuleFillImageSourceMode: (value) =>
      setField("selectedModuleFillImageSourceMode", value),
    setSelectedModuleFillRemoteUrl: (value) => setField("selectedModuleFillRemoteUrl", value),
    setSelectedDotMatrixAnimation: (value) => setField("selectedDotMatrixAnimation", value),
    setSelectedQrFinderPatternOuterStyle: (value) =>
      setField("selectedQrFinderPatternOuterStyle", value),
    setSelectedCornerSquareColorMode: (value) => setField("selectedCornerSquareColorMode", value),
    setSelectedCornerSquareColor: (value) => setField("selectedCornerSquareColor", value),
    setSelectedCornerSquareGradient: (value) => setField("selectedCornerSquareGradient", value),
    setSelectedQrFinderPatternInnerStyle: (value) =>
      setField("selectedQrFinderPatternInnerStyle", value),
    setSelectedCornerDotColorMode: (value) => setField("selectedCornerDotColorMode", value),
    setSelectedCornerDotColor: (value) => setField("selectedCornerDotColor", value),
    setSelectedCornerDotGradient: (value) => setField("selectedCornerDotGradient", value),
    setSelectedBackgroundColorMode: (value) => setField("selectedBackgroundColorMode", value),
    setSelectedBackgroundColor: (value) => setField("selectedBackgroundColor", value),
    setSelectedBackgroundTransparent: (value) => setField("selectedBackgroundTransparent", value),
    setSelectedBackgroundGradient: (value) => setField("selectedBackgroundGradient", value),
    setSelectedBackgroundShapeId: (value) => setField("selectedBackgroundShapeId", value),
    setSelectedBackgroundShapeOptions: (value) => setField("selectedBackgroundShapeOptions", value),
    setSelectedBackgroundAssetSourceMode: (value) =>
      setField("selectedBackgroundAssetSourceMode", value),
    setSelectedBackgroundRemoteUrl: (value) => setField("selectedBackgroundRemoteUrl", value),
    setSelectedLogoColorMode: (value) => setField("selectedLogoColorMode", value),
    setSelectedLogoSourceMode: (value) => setField("selectedLogoSourceMode", value),
    setSelectedLogoColor: (value) => setField("selectedLogoColor", value),
    setSelectedLogoGradient: (value) => setField("selectedLogoGradient", value),
    setSelectedLogoPresetId: (value) => setField("selectedLogoPresetId", value),
    setSelectedLogoPresetValue: (value) => setField("selectedLogoPresetValue", value),
    setSelectedLogoAssetSourceMode: (value) => setField("selectedLogoAssetSourceMode", value),
    setSelectedLogoRemoteUrl: (value) => setField("selectedLogoRemoteUrl", value),
    setSelectedLogoUploadValue: (value) => setField("selectedLogoUploadValue", value),
    setSelectedLogoSize: (value) => setField("selectedLogoSize", value),
    setSelectedLogoMargin: (value) => setField("selectedLogoMargin", value),
    setSelectedHideBackgroundDots: (value) => setField("selectedHideBackgroundDots", value),
    setSelectedQrTypeNumber: (value) => setField("selectedQrTypeNumber", value),
    setSelectedQrErrorCorrectionLevel: (value) => setField("selectedQrErrorCorrectionLevel", value),
    setSelectedBoostLevel: (value) => setField("selectedBoostLevel", value),
    setSelectedQrMode: (value) => setField("selectedQrMode", value),
    setSelectedValueSegmentsText: (value) => setField("selectedValueSegmentsText", value),
    setSelectedAriaLabel: (value) => setField("selectedAriaLabel", value),
    setSelectedModuleRoundSize: (value) => setField("selectedModuleRoundSize", value),
    setSelectedModuleSize: (value) => setField("selectedModuleSize", value),
    setSelectedModuleLineWidth: (value) => setField("selectedModuleLineWidth", value),
    setSelectedGradientLinkMode: (value) => setField("selectedGradientLinkMode", value),
    setSelectedLogoOpacity: (value) => setField("selectedLogoOpacity", value),
    setSelectedLogoSizeMode: (value) => setField("selectedLogoSizeMode", value),
    setSelectedLogoWidthPx: (value) => setField("selectedLogoWidthPx", value),
    setSelectedLogoHeightPx: (value) => setField("selectedLogoHeightPx", value),
    setSelectedLogoLockAspect: (value) => setField("selectedLogoLockAspect", value),
    setSelectedLogoPositionMode: (value) => setField("selectedLogoPositionMode", value),
    setSelectedLogoOffsetX: (value) => setField("selectedLogoOffsetX", value),
    setSelectedLogoOffsetY: (value) => setField("selectedLogoOffsetY", value),
    setSelectedLogoCrossOrigin: (value) => setField("selectedLogoCrossOrigin", value),
    setActiveQrLayerId: (value) => setField("activeQrLayerId", value),
    setActiveQrNodeId: (value) => setField("activeQrNodeId", value),
    setQrStateByLayerId: (value) => setField("qrStateByLayerId", value),
    setQrStateByNodeId: (value) => setField("qrStateByNodeId", value),
    setSelectedCardState: (value) => setField("selectedCardState", value),
    setCardStateByNodeId: (value) => setField("cardStateByNodeId", value),
    setLayerStateByNodeId: (value) => setField("layerStateByNodeId", value),
    setSelectedLayerId: (value) => setField("selectedLayerId", value),
    setSelectedLayerIds: (value) => setField("selectedLayerIds", value),
    setDesktopCanvasTool: (value) => setField("desktopCanvasTool", value),
    setSelectedDownloadExtension: (value) => setField("selectedDownloadExtension", value),
    setSelectedDownloadTarget: (value) => setField("selectedDownloadTarget", value),
    setExportDownloadError: (value) => setField("exportDownloadError", value),
    setSelectedPhotoLongEdge: (value) => setField("selectedPhotoLongEdge", value),
    setSelectedExportMediaKind: (value) => setField("selectedExportMediaKind", value),
    setSelectedVideoDurationSeconds: (value) => setField("selectedVideoDurationSeconds", value),
    setSelectedVideoFormat: (value) => setField("selectedVideoFormat", value),
    setSelectedVideoFrameRate: (value) => setField("selectedVideoFrameRate", value),
    setSelectedVideoLongEdge: (value) => setField("selectedVideoLongEdge", value),
    setLogoUploadObjectUrl: (value) => setField("logoUploadObjectUrl", value),
    setModuleFillUploadObjectUrl: (value) => setField("moduleFillUploadObjectUrl", value),
  };
}

export function useCanvasSurfaceReducer(
  initialActiveTool?: ToolbarToolId,
): [CanvasSurfaceState, Dispatch<CanvasSurfaceAction>, CanvasSurfaceSetters] {
  const [state, dispatch] = useReducer(
    canvasReducer,
    initialActiveTool,
    createInitialCanvasSurfaceState,
  );

  const setters = useMemo(() => createCanvasSurfaceSetters(dispatch), [dispatch]);

  // QR draft fields and the card are read-only projections over the active
  // layer/board maps — merged here so consumers keep reading `state.selected*`.
  const view = useMemo<CanvasSurfaceState>(() => {
    const qr = activeQrState(state);
    return {
      ...state,
      ...qrStateToDraftFields(qr),
      selectedCardState:
        state.cardStateByNodeId[state.activeQrNodeId] ?? createDefaultCanvasCardState(),
    };
  }, [state]);

  return [view, dispatch, setters];
}
