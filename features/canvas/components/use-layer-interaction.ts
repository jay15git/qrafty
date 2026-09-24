"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";

import { type CanvasCardState } from "@/features/canvas/model/card-state";
import {
  DEFAULT_DRAFTING_LAYER_SHADOW,
  type CanvasLayer,
} from "@/features/canvas/model/layers/shared";
import { clampLayerGeometryToCanvas } from "@/features/canvas/model/layers/card-qr";
import { DEFAULT_DRAFTING_OUTLINE } from "@/features/canvas/model/effects";
import { RESIZE_SNAP_THRESHOLD_PX } from "@/features/canvas/components/canvas-layer-chrome.constants";
import {
  getLayerRotationLabel,
  normalizeLayerRotation,
  resizeCanvasLayer,
  rotatePoint,
  roundLayerNumber,
  snapLayerMove,
  snapLayerResize,
  snapLayerRotation,
  type ResizeDirection,
  type SnapGuides,
} from "@/features/canvas/components/canvas-layer-geometry";
import {
  isTouchLikePointer,
  lockLayerMoveCursor,
  releasePointerCaptureSafe,
  unlockLayerMoveCursor,
} from "@/features/canvas/components/canvas-interaction-utils";

export type CanvasMultiSelectionPreview = {
  bounds: Pick<CanvasLayer, "height" | "width" | "x" | "y"> & { rotation?: number };
  rotation: number;
};

const ROTATION_LABEL_HIDE_DELAY_MS = 2000;
const SNAP_THRESHOLD_PX = 6;
const INTERACTION_START_THRESHOLD_PX = 3;
const INTERACTION_START_THRESHOLD_TOUCH_PX = 8;

type LayerPointerInteraction = {
  centerClientX?: number;
  centerClientY?: number;
  groupBounds?: Pick<CanvasLayer, "height" | "width" | "x" | "y"> & { rotation?: number };
  groupCenter?: { x: number; y: number };
  layers?: CanvasLayer[];
  layer: CanvasLayer;
  lockedResizeAxis?: "horizontal" | "vertical";
  mode: "move" | "resize" | "rotate";
  pointerId: number;
  pointerType?: string;
  resizeDirection?: ResizeDirection;
  startAngle?: number;
  startRotation?: number;
  startX: number;
  startY: number;
};

export type CanvasLayerInteractionInput = {
  activeSelectedLayerIdSet: Set<string>;
  activeSelectedLayerIds: string[];
  cardState: CanvasCardState;
  combinedLayerBounds:
    (Pick<CanvasLayer, "height" | "width" | "x" | "y"> & { rotation?: number }) | null;
  commitEditingTextDraft: () => void;
  editingTextLayerId: string | null;
  flushDocumentLayerChanges: () => void;
  interactionScale: number;
  onLayerChange?: (layerId: string, patch: Partial<CanvasLayer>) => void;
  onLayerSelect?: (layerId: string | null, options?: { additive?: boolean }) => void;
  onQrClick: () => void;
  queueDocumentLayerChange: (layerId: string, patch: Partial<CanvasLayer>) => void;
  scheduleDocumentLayerFlush: () => void;
  selectedVisibleLayers: CanvasLayer[];
  setLiveLayerGeometryById: (
    geometryByLayerId: Record<string, Partial<CanvasLayer>> | null,
  ) => void;
  snapEnabled: boolean;
  viewFitScale: number;
  visibleLayers: CanvasLayer[];
};

export function useLayerInteraction({
  activeSelectedLayerIdSet,
  activeSelectedLayerIds,
  cardState,
  combinedLayerBounds,
  commitEditingTextDraft,
  editingTextLayerId,
  flushDocumentLayerChanges,
  interactionScale,
  onLayerChange,
  onLayerSelect,
  onQrClick,
  queueDocumentLayerChange,
  scheduleDocumentLayerFlush,
  selectedVisibleLayers,
  setLiveLayerGeometryById,
  snapEnabled,
  viewFitScale,
  visibleLayers,
}: CanvasLayerInteractionInput) {
  const [rotatingLayerId, setRotatingLayerId] = useState<string | null>(null);
  const [isLayerInteracting, setIsLayerInteracting] = useState(false);
  const [isMovingLayers, setIsMovingLayers] = useState(false);
  const [rotationPreviewDegrees, setRotationPreviewDegrees] = useState<number | null>(null);
  const [multiSelectionPreview, setMultiSelectionPreview] =
    useState<CanvasMultiSelectionPreview | null>(null);
  const [snapGuides, setSnapGuides] = useState<SnapGuides>({
    horizontal: [],
    vertical: [],
  });
  const interactionRef = useRef<LayerPointerInteraction | null>(null);
  const rotationLabelTimeoutRef = useRef<number | null>(null);
  const suppressLayerClickRef = useRef(false);

  useEffect(
    () => () => {
      if (rotationLabelTimeoutRef.current !== null) {
        window.clearTimeout(rotationLabelTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isMovingLayers) {
      return;
    }

    lockLayerMoveCursor();

    return () => {
      unlockLayerMoveCursor();
    };
  }, [isMovingLayers]);

  useEffect(() => {
    return () => {
      unlockLayerMoveCursor();
    };
  }, []);

  function constrainLayerPatch(
    layer: CanvasLayer,
    patch: Partial<CanvasLayer>,
  ): Partial<CanvasLayer> {
    if (layer.kind === "card") {
      return patch;
    }

    const constrained = clampLayerGeometryToCanvas({ ...layer, ...patch }, cardState);
    const result = { ...patch };

    for (const key of ["height", "width", "x", "y"] as const) {
      if (key in patch) {
        result[key] = constrained[key];
      }
    }

    return result;
  }

  function publishLiveLayerGeometry(
    geometryByLayerId: Record<string, Partial<CanvasLayer>>,
    guides?: SnapGuides,
  ) {
    setLiveLayerGeometryById(geometryByLayerId);
    if (guides) {
      setSnapGuides(guides);
    }

    for (const [layerId, patch] of Object.entries(geometryByLayerId)) {
      queueDocumentLayerChange(layerId, patch);
    }
    scheduleDocumentLayerFlush();
  }

  function startLayerInteraction(
    event: PointerEvent<HTMLElement>,
    layer: CanvasLayer,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) {
    if (editingTextLayerId && editingTextLayerId !== layer.id) {
      commitEditingTextDraft();
    }

    if (event.metaKey || event.ctrlKey) {
      return;
    }

    if (!onLayerChange) {
      return;
    }

    if (
      mode === "move" &&
      activeSelectedLayerIds.length > 1 &&
      activeSelectedLayerIdSet.has(layer.id)
    ) {
      startMultiLayerInteraction(event, "move");
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const layerElement = event.currentTarget.closest<HTMLElement>("[data-layer-id]");
    const layerRect = layerElement?.getBoundingClientRect();
    const centerClientX = layerRect ? layerRect.left + layerRect.width / 2 : event.clientX;
    const centerClientY = layerRect ? layerRect.top + layerRect.height / 2 : event.clientY;

    interactionRef.current = {
      centerClientX,
      centerClientY,
      layer,
      mode,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      resizeDirection,
      startAngle:
        (Math.atan2(event.clientY - centerClientY, event.clientX - centerClientX) * 180) / Math.PI,
      startRotation: layer.rotation,
      startX: event.clientX,
      startY: event.clientY,
    };
    setIsLayerInteracting(true);
    if (mode === "move") {
      lockLayerMoveCursor();
      setIsMovingLayers(true);
    }
    if (mode === "rotate") {
      if (rotationLabelTimeoutRef.current !== null) {
        window.clearTimeout(rotationLabelTimeoutRef.current);
        rotationLabelTimeoutRef.current = null;
      }
      setRotatingLayerId(layer.id);
      setRotationPreviewDegrees(getLayerRotationLabel(layer.rotation));
    }
    onLayerSelect?.(layer.id);
  }

  function startMultiLayerInteraction(
    event: PointerEvent<HTMLElement>,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) {
    if (!combinedLayerBounds || selectedVisibleLayers.length < 2 || !onLayerChange) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const frameElement =
      event.currentTarget.closest<HTMLElement>("[data-slot='canvas-layer-multi-select-frame']") ??
      event.currentTarget
        .closest<HTMLElement>("[data-slot='canvas']")
        ?.querySelector<HTMLElement>("[data-slot='canvas-layer-multi-select-frame']");
    const frameRect = frameElement?.getBoundingClientRect();
    const centerClientX = frameRect ? frameRect.left + frameRect.width / 2 : event.clientX;
    const centerClientY = frameRect ? frameRect.top + frameRect.height / 2 : event.clientY;

    interactionRef.current = {
      centerClientX,
      centerClientY,
      groupBounds: combinedLayerBounds,
      groupCenter: {
        x: combinedLayerBounds.x + combinedLayerBounds.width / 2,
        y: combinedLayerBounds.y + combinedLayerBounds.height / 2,
      },
      layer: selectedVisibleLayers[0],
      layers: selectedVisibleLayers,
      mode,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      resizeDirection,
      startAngle:
        (Math.atan2(event.clientY - centerClientY, event.clientX - centerClientX) * 180) / Math.PI,
      startRotation: 0,
      startX: event.clientX,
      startY: event.clientY,
    };
    setIsLayerInteracting(true);
    if (mode === "move") {
      lockLayerMoveCursor();
      setIsMovingLayers(true);
    }
    if (mode === "rotate") {
      if (rotationLabelTimeoutRef.current !== null) {
        window.clearTimeout(rotationLabelTimeoutRef.current);
        rotationLabelTimeoutRef.current = null;
      }
      setRotatingLayerId("selection");
      setRotationPreviewDegrees(0);
      setMultiSelectionPreview({
        bounds: combinedLayerBounds,
        rotation: combinedLayerBounds.rotation ?? 0,
      });
    }
  }

  function applyGroupMoveInteraction(
    interaction: LayerPointerInteraction,
    deltaX: number,
    deltaY: number,
  ) {
    const geometryByLayerId: Record<string, Partial<CanvasLayer>> = {};

    for (const selectedLayer of interaction.layers ?? []) {
      if (selectedLayer.kind === "card") {
        continue;
      }

      geometryByLayerId[selectedLayer.id] = constrainLayerPatch(selectedLayer, {
        x: roundLayerNumber(selectedLayer.x + deltaX),
        y: roundLayerNumber(selectedLayer.y + deltaY),
      });
    }

    publishLiveLayerGeometry(geometryByLayerId);
  }

  function applyGroupRotateInteraction(
    interaction: LayerPointerInteraction,
    event: PointerEvent<HTMLElement>,
  ) {
    const groupCenter = interaction.groupCenter;
    if (!groupCenter || !interaction.layers) {
      return;
    }

    const centerClientX = interaction.centerClientX ?? event.clientX;
    const centerClientY = interaction.centerClientY ?? event.clientY;
    const angle =
      (Math.atan2(event.clientY - centerClientY, event.clientX - centerClientX) * 180) / Math.PI;
    const freeRotation = normalizeLayerRotation(angle - (interaction.startAngle ?? angle));
    const rotation = snapEnabled ? snapLayerRotation(freeRotation) : freeRotation;

    setRotationPreviewDegrees(getLayerRotationLabel(rotation));
    setMultiSelectionPreview((current) =>
      current
        ? {
            ...current,
            rotation: getLayerRotationLabel((interaction.groupBounds?.rotation ?? 0) + rotation),
          }
        : current,
    );

    const geometryByLayerId: Record<string, Partial<CanvasLayer>> = {};

    for (const selectedLayer of interaction.layers) {
      if (selectedLayer.kind === "card") {
        continue;
      }

      const center = {
        x: selectedLayer.x + selectedLayer.width / 2,
        y: selectedLayer.y + selectedLayer.height / 2,
      };
      const nextCenter = rotatePoint(center, groupCenter, rotation);
      geometryByLayerId[selectedLayer.id] = constrainLayerPatch(selectedLayer, {
        rotation: normalizeLayerRotation(selectedLayer.rotation + rotation),
        x: roundLayerNumber(nextCenter.x - selectedLayer.width / 2),
        y: roundLayerNumber(nextCenter.y - selectedLayer.height / 2),
      });
    }

    publishLiveLayerGeometry(geometryByLayerId, {
      horizontal: [],
      vertical: snapEnabled && rotation !== freeRotation ? [0] : [],
    });
  }

  function applyGroupResizeInteraction(
    interaction: LayerPointerInteraction,
    deltaX: number,
    deltaY: number,
  ) {
    const groupBounds = interaction.groupBounds;
    if (!groupBounds || !interaction.layers) {
      return;
    }

    const nextBounds = resizeCanvasLayer(
      {
        ...groupBounds,
        blur: 0,
        id: "selection",
        isVisible: true,
        kind: "card",
        layerFilters: [],
        name: "Selection",
        nodeId: "selection",
        opacity: 1,
        outline: { ...DEFAULT_DRAFTING_OUTLINE },
        rotation: 0,
        shadows: [],
        tiltX: 0,
        tiltY: 0,
        shadow: { ...DEFAULT_DRAFTING_LAYER_SHADOW, color: "#000000" },
        zIndex: 0,
      },
      interaction.resizeDirection ?? "se",
      deltaX,
      deltaY,
    );
    const scaleX = groupBounds.width > 0 ? nextBounds.width / groupBounds.width : 1;
    const scaleY = groupBounds.height > 0 ? nextBounds.height / groupBounds.height : 1;
    const geometryByLayerId: Record<string, Partial<CanvasLayer>> = {};

    for (const selectedLayer of interaction.layers) {
      if (selectedLayer.kind === "card") {
        continue;
      }

      geometryByLayerId[selectedLayer.id] = constrainLayerPatch(selectedLayer, {
        height: roundLayerNumber(selectedLayer.height * scaleY),
        width: roundLayerNumber(selectedLayer.width * scaleX),
        x: roundLayerNumber(nextBounds.x + (selectedLayer.x - groupBounds.x) * scaleX),
        y: roundLayerNumber(nextBounds.y + (selectedLayer.y - groupBounds.y) * scaleY),
      });
    }

    publishLiveLayerGeometry(geometryByLayerId);
  }

  function applySingleRotateInteraction(
    interaction: LayerPointerInteraction,
    event: PointerEvent<HTMLElement>,
  ) {
    const layer = interaction.layer;
    const centerClientX = interaction.centerClientX ?? event.clientX;
    const centerClientY = interaction.centerClientY ?? event.clientY;
    const angle =
      (Math.atan2(event.clientY - centerClientY, event.clientX - centerClientX) * 180) / Math.PI;

    const freeRotation = normalizeLayerRotation(
      angle - (interaction.startAngle ?? angle) + (interaction.startRotation ?? layer.rotation),
    );
    const rotation = snapEnabled ? snapLayerRotation(freeRotation) : freeRotation;

    setRotationPreviewDegrees(getLayerRotationLabel(rotation));
    publishLiveLayerGeometry(
      { [layer.id]: { rotation } },
      {
        horizontal: [],
        vertical: snapEnabled && rotation !== freeRotation ? [0] : [],
      },
    );
  }

  function applySingleMoveInteraction(
    interaction: LayerPointerInteraction,
    deltaX: number,
    deltaY: number,
    snapThreshold: number,
  ) {
    const layer = interaction.layer;
    const proposedX = layer.x + deltaX;
    const proposedY = layer.y + deltaY;
    const nextMove = snapEnabled
      ? snapLayerMove({
          layer,
          layers: visibleLayers,
          proposedX,
          proposedY,
          threshold: snapThreshold,
        })
      : { guides: { horizontal: [], vertical: [] }, x: proposedX, y: proposedY };

    publishLiveLayerGeometry(
      {
        [layer.id]: constrainLayerPatch(layer, {
          x: nextMove.x,
          y: nextMove.y,
        }),
      },
      nextMove.guides,
    );
  }

  function applySingleResizeInteraction(
    interaction: LayerPointerInteraction,
    deltaX: number,
    deltaY: number,
    resizeSnapThreshold: number,
    hasStartedInteraction: boolean,
  ) {
    const layer = interaction.layer;
    const resizeDirection = interaction.resizeDirection ?? "se";
    const isCornerResize = resizeDirection.length === 2;

    if (
      isCornerResize &&
      layer.kind === "qr" &&
      interaction.lockedResizeAxis === undefined &&
      hasStartedInteraction
    ) {
      interaction.lockedResizeAxis =
        Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical";
    }

    const nextGeometry = resizeCanvasLayer(
      layer,
      resizeDirection,
      deltaX,
      deltaY,
      interaction.lockedResizeAxis,
    );
    const snappedResize = snapEnabled
      ? snapLayerResize({
          direction: resizeDirection,
          layer,
          layers: visibleLayers,
          geometry: nextGeometry,
          threshold: resizeSnapThreshold,
        })
      : { geometry: nextGeometry, guides: { horizontal: [], vertical: [] } };

    publishLiveLayerGeometry(
      { [layer.id]: constrainLayerPatch(layer, snappedResize.geometry) },
      snappedResize.guides,
    );
  }

  function updateLayerInteraction(event: PointerEvent<HTMLElement>) {
    const interaction = interactionRef.current;

    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    const scale =
      (interactionScale > 0 ? interactionScale : 1) * (viewFitScale > 0 ? viewFitScale : 1);
    const snapThreshold = SNAP_THRESHOLD_PX / scale;
    const resizeSnapThreshold = RESIZE_SNAP_THRESHOLD_PX / scale;
    const deltaX = (event.clientX - interaction.startX) / scale;
    const deltaY = (event.clientY - interaction.startY) / scale;
    const startThreshold = isTouchLikePointer({ pointerType: interaction.pointerType ?? "mouse" })
      ? INTERACTION_START_THRESHOLD_TOUCH_PX
      : INTERACTION_START_THRESHOLD_PX;
    const hasStartedInteraction =
      Math.hypot(event.clientX - interaction.startX, event.clientY - interaction.startY) >=
      startThreshold;

    if (!hasStartedInteraction && interaction.mode !== "rotate") {
      setSnapGuides({ horizontal: [], vertical: [] });
      return;
    }

    if (interaction.layers && interaction.groupBounds && interaction.groupCenter) {
      if (interaction.mode === "move") {
        applyGroupMoveInteraction(interaction, deltaX, deltaY);
        return;
      }

      if (interaction.mode === "rotate") {
        applyGroupRotateInteraction(interaction, event);
        return;
      }

      if (interaction.mode === "resize") {
        applyGroupResizeInteraction(interaction, deltaX, deltaY);
        return;
      }
    }

    if (interaction.mode === "rotate") {
      applySingleRotateInteraction(interaction, event);
      return;
    }

    if (interaction.mode === "move") {
      applySingleMoveInteraction(interaction, deltaX, deltaY, snapThreshold);
      return;
    }

    applySingleResizeInteraction(
      interaction,
      deltaX,
      deltaY,
      resizeSnapThreshold,
      hasStartedInteraction,
    );
  }

  function endLayerInteraction(event: PointerEvent<HTMLElement>) {
    const interaction = interactionRef.current;

    if (interaction?.pointerId === event.pointerId) {
      flushDocumentLayerChanges();
      setLiveLayerGeometryById(null);
      setSnapGuides({ horizontal: [], vertical: [] });
      suppressLayerClickRef.current =
        Math.abs(event.clientX - interaction.startX) > 1 ||
        Math.abs(event.clientY - interaction.startY) > 1;

      if (interaction.mode === "rotate") {
        if (rotationLabelTimeoutRef.current !== null) {
          window.clearTimeout(rotationLabelTimeoutRef.current);
        }
        rotationLabelTimeoutRef.current = window.setTimeout(() => {
          setRotatingLayerId(null);
          setRotationPreviewDegrees(null);
          setMultiSelectionPreview(null);
          rotationLabelTimeoutRef.current = null;
        }, ROTATION_LABEL_HIDE_DELAY_MS);
      }
      setIsLayerInteracting(false);
      setIsMovingLayers(false);
      unlockLayerMoveCursor();
      interactionRef.current = null;
      releasePointerCaptureSafe(event);
    }
  }

  function activateLayerSelection(
    layer: CanvasLayer,
    options?: { additive?: boolean; qr?: boolean },
  ) {
    if (layer.kind === "card") {
      return;
    }

    if (editingTextLayerId && editingTextLayerId !== layer.id) {
      commitEditingTextDraft();
    }

    onLayerSelect?.(layer.id, { additive: options?.additive ?? false });
    if (options?.qr) {
      onQrClick();
    }
  }

  function selectLayerFromClick(
    event: MouseEvent<HTMLElement>,
    layer: CanvasLayer,
    options?: { qr?: boolean },
  ) {
    if (layer.kind === "card") {
      return;
    }

    event.stopPropagation();

    if (suppressLayerClickRef.current) {
      event.preventDefault();
      suppressLayerClickRef.current = false;
      return;
    }

    if (editingTextLayerId && editingTextLayerId !== layer.id) {
      commitEditingTextDraft();
    }

    onLayerSelect?.(layer.id, { additive: event.metaKey || event.ctrlKey });
    if (options?.qr) {
      onQrClick();
    }
  }

  return {
    isLayerInteracting,
    multiSelectionPreview,
    rotatingLayerId,
    rotationPreviewDegrees,
    snapGuides,
    activateLayerSelection,
    endLayerInteraction,
    selectLayerFromClick,
    startLayerInteraction,
    startMultiLayerInteraction,
    updateLayerInteraction,
  };
}
