import { useEffect, useMemo, useRef, type Dispatch } from "react";

import {
  type CanvasSurfaceAction,
  type CanvasSurfaceState,
} from "@/features/canvas/components/canvas-reducer";
import { resolveSelectedContentValues } from "@/features/canvas/components/canvas-resolvers";
import { clearCanvasQrMarkupCache } from "@/features/canvas/hooks/use-canvas-qr-markup";
import { createDefaultCanvasWorkspaceQrState } from "@/features/canvas/model/document";
import {
  buildStaticQrPayload,
  validateStaticQrContent,
} from "@/features/qr/content/static-payload";
import type { QrInputType } from "@/features/qr/content/input-options";
import type { QraftyState } from "@/features/qr/model/state";

/**
 * Active-QR access layer.
 *
 * `canvasQraftyState` is the live `QraftyState` the renderer and exporters
 * consume — the active layer's stored state plus the live content payload.
 * Writes go through `SET_ACTIVE_QR` (full commits) or the `setSelected*`
 * setters (draft-field patches), so `qrStateByLayerId`/`qrStateByNodeId`
 * always hold the canonical per-layer QR state. Upload object URLs are
 * revoked on replacement.
 */
export function useActiveQr({
  dispatch,
  state,
}: {
  dispatch: Dispatch<CanvasSurfaceAction>;
  state: CanvasSurfaceState;
}) {
  const {
    activeQrLayerId,
    contentValuesByType,
    logoUploadObjectUrl,
    moduleFillUploadObjectUrl,
    qrStateByLayerId,
    selectedContentType,
  } = state;

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

  const activeQrState = useMemo(
    () => qrStateByLayerId[activeQrLayerId] ?? createDefaultCanvasWorkspaceQrState(),
    [activeQrLayerId, qrStateByLayerId],
  );
  const canvasQraftyState = useMemo<QraftyState>(
    () => ({ ...activeQrState, data: selectedContentValue }),
    [activeQrState, selectedContentValue],
  );

  /** Full-state commit — layer/board activation, resets, external QR updates.
   * Seeds the draft buffers so pickers reflect the incoming state. */
  function setActiveQrState(
    qr: QraftyState,
    target?: { layerId?: string; nodeId?: string; contentType?: QrInputType },
  ) {
    pendingQrPersistStateRef.current = qr;
    dispatch({
      type: "SET_ACTIVE_QR",
      qr,
      layerId: target?.layerId,
      nodeId: target?.nodeId,
      contentType: target?.contentType,
    });
  }

  /** Same-tick accessor — returns the just-committed state when a persist ran
   * earlier in this event (before the reducer view re-rendered). */
  function resolveLiveQrPersistState(): QraftyState {
    return pendingQrPersistStateRef.current ?? canvasQraftyState;
  }

  /** Snapshot the live state into the store without switching layers. */
  function persistActiveQrLayerState(nextState: QraftyState = resolveLiveQrPersistState()) {
    setActiveQrState(nextState);
  }

  /** Logo-flow commit — merges the incoming logo/gradient/image options into
   * the live state, then stamps it. Buffer reseeding happens in the action. */
  function commitActiveQraftyState(nextState: QraftyState) {
    const committed = resolveLiveQrPersistState();
    const merged: QraftyState = {
      ...committed,
      logo: nextState.logo,
      logoGradient: nextState.logoGradient,
      imageOptions: nextState.imageOptions,
    };

    setActiveQrState(merged);
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
    setActiveQrState,
  };
}

export type ActiveQrApi = ReturnType<typeof useActiveQr>;
