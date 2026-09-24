"use client";

import {
  memo,
  useMemo,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

import { CardBackgroundLayers } from "@/features/canvas/components/CardBackgroundLayers";
import { cardBackgroundStyle } from "@/features/canvas/components/card-background-style";
import { DraftingCardPaperShaderLayer } from "@/features/canvas/components/CardPaperShaderLayer";
import { CanvasLayerTiltShell } from "@/features/canvas/components/CanvasLayerTiltShell";
import { CanvasQrLayerContent } from "@/features/canvas/components/CanvasQrLayerContent";
import {
  createDefaultDraftingCardPaperShader,
  type DraftingCardPaperShaderState,
  type DraftingCardState,
} from "@/features/canvas/model/card-state";
import { cornerRadiiToCss, resolveLayerCornerRadii } from "@/features/canvas/model/corner-radius";
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type CanvasLayer,
  type DraftingTextRun,
} from "@/features/canvas/model/layers/shared";
import {
  getDraftingCardBorderStyle,
  getLayerPlacementStyle,
  getTextLayerStyle,
  getTextRunStyle,
} from "@/features/canvas/rendering/layer-dom-styles";
import { isDraftingEmojiLayer } from "@/features/canvas/model/layer-floating-settings";
import {
  getBackgroundShapeTiltInnerStyle,
  getBackgroundShapeTiltPerspectiveStyle,
} from "@/features/canvas/rendering/layer-transform";
import { layoutDraftingText } from "@/features/canvas/rendering/text-layout";
import {
  DraftingImageLayerContent,
  DraftingShapeLayerContent,
} from "@/features/canvas/rendering/shape-layer";
import type { QraftyState } from "@/features/qr/model/state";
import { getContentValidationOverlayMessage } from "@/features/qr/content/static-payload";
import type { StaticQrValidationResult } from "@/features/qr/content/static-payload";
import { getDraftingQrLayerLayout } from "@/features/qr/rendering/svg-extension";
import { useCanvasQrMarkup } from "@/features/canvas/hooks/use-canvas-qr-markup";
import type { DraftingQrStateByLayerId } from "@/features/canvas/model/document";
import { usePreviewInteraction } from "@/features/canvas/preview/preview-context";
import {
  useCanvasLayerEffectStyle,
  usePreviewShaderDisplaySize,
} from "@/features/canvas/preview/use-preview-layer-effects";
import { scaleNestedSvgMarkup } from "@/features/canvas/rendering/qr-artwork";
import { cn } from "@/lib/utils";
import type { ResizeDirection } from "@/features/canvas/components/canvas-layer-geometry";
import { CanvasLayerInteractive } from "@/features/canvas/components/canvas-layer-a11y";

const LAYER_MOVE_CURSOR_CLASS = "cursor-all-scroll";

function layerExportAttrs(kind: CanvasLayer["kind"]) {
  return {
    "data-export-kind": kind,
    "data-export-layer": "true",
  } as const;
}

function buildCanvasDocumentCardStyle(
  cardState: DraftingCardState,
  isImageFilterMode: boolean,
  isImageMode: boolean,
  isPaperShaderMode: boolean,
): CSSProperties {
  return {
    ...cardBackgroundStyle(cardState, isImageFilterMode, isImageMode, isPaperShaderMode),
    borderRadius: cornerRadiiToCss(cardState.cornerRadii),
  };
}

function buildCanvasDocumentCardBorderOverlayStyle(
  cardState: DraftingCardState,
): CSSProperties | undefined {
  const borderStyle = getDraftingCardBorderStyle(cardState);

  if (!borderStyle || Object.keys(borderStyle).length === 0) {
    return undefined;
  }

  return {
    ...borderStyle,
    borderRadius: cornerRadiiToCss(cardState.cornerRadii),
  };
}

type CanvasDocumentCardLayerProps = {
  cardState: DraftingCardState;
  isImageFilterMode: boolean;
  isImageMode: boolean;
  isPaperShaderMode: boolean;
  isLayerSelected: boolean;
  layer: CanvasLayer;
  nested?: boolean;
};

export const CanvasDocumentCardLayer = memo(function CanvasDocumentCardLayer({
  cardState,
  isImageFilterMode,
  isImageMode,
  isPaperShaderMode,
  isLayerSelected,
  layer,
  nested = false,
}: CanvasDocumentCardLayerProps) {
  const layerEffectStyle = useCanvasLayerEffectStyle(layer);
  const shaderDisplaySize = usePreviewShaderDisplaySize(layer.width, layer.height);
  const isInteracting = usePreviewInteraction();
  const imageFilterShader = useMemo(
    () => ({
      ...cardState.imageFilter,
      image: {
        ...cardState.imageFilter.image,
        source:
          cardState.cardImage.source === "none"
            ? cardState.imageFilter.image.source
            : cardState.cardImage.source,
        value: cardState.cardImage.value ?? cardState.imageFilter.image.value,
      },
    }),
    [cardState.cardImage.source, cardState.cardImage.value, cardState.imageFilter],
  );
  const cardStyle = useMemo(
    () =>
      buildCanvasDocumentCardStyle(cardState, isImageFilterMode, isImageMode, isPaperShaderMode),
    [cardState, isImageFilterMode, isImageMode, isPaperShaderMode],
  );
  const borderOverlayStyle = useMemo(
    () => buildCanvasDocumentCardBorderOverlayStyle(cardState),
    [cardState],
  );

  if (nested) {
    return (
      <div
        key={layer.id}
        data-slot="canvas-card"
        data-layer-id={layer.id}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("card")}
        className="absolute max-h-none max-w-none overflow-visible"
        style={{
          ...cardStyle,
          ...getLayerPlacementStyle(layer, true),
          ...layerEffectStyle,
        }}
      >
        <CardBackgroundLayers
          animateTransitions={!isInteracting}
          cardState={cardState}
          imageFilterShader={imageFilterShader}
          isImageFilterMode={isImageFilterMode}
          isImageMode={isImageMode}
          isPaperShaderMode={isPaperShaderMode}
          layoutHeight={layer.height}
          layoutWidth={layer.width}
          shaderDisplayHeight={shaderDisplaySize.displayHeight}
          shaderDisplayWidth={shaderDisplaySize.displayWidth}
        />
        {borderOverlayStyle ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[3]"
            data-slot="canvas-card-border"
            style={borderOverlayStyle}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      key={layer.id}
      data-slot="canvas-card"
      data-layer-id={layer.id}
      data-card-paper-shader={
        isPaperShaderMode
          ? cardState.paperShader.shaderId
          : isImageFilterMode
            ? cardState.imageFilter.shaderId
            : "none"
      }
      data-card-shadow-blur={layer.shadow.blur}
      data-card-shadow-offset-x={layer.shadow.offsetX}
      data-card-shadow-offset-y={layer.shadow.offsetY}
      data-card-style-mode={cardState.styleMode}
      data-card-enabled={layer.isVisible ? "true" : "false"}
      data-card-border-width={cardState.border.width}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("card")}
      className={cn(
        "pointer-events-none absolute max-h-none max-w-none overflow-hidden",
        !isInteracting && "transition-[filter,background-color,border-radius] duration-150",
      )}
      style={{
        ...cardStyle,
        ...getLayerPlacementStyle(layer),
        ...layerEffectStyle,
      }}
    >
      <CanvasLayerTiltShell layer={layer}>
        <CardBackgroundLayers
          animateTransitions={!isInteracting}
          cardState={cardState}
          imageFilterShader={imageFilterShader}
          isImageFilterMode={isImageFilterMode}
          isImageMode={isImageMode}
          isPaperShaderMode={isPaperShaderMode}
          layoutHeight={layer.height}
          layoutWidth={layer.width}
          shaderDisplayHeight={shaderDisplaySize.displayHeight}
          shaderDisplayWidth={shaderDisplaySize.displayWidth}
        />
        {borderOverlayStyle ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[3]"
            data-slot="canvas-card-border"
            style={borderOverlayStyle}
          />
        ) : null}
      </CanvasLayerTiltShell>
    </div>
  );
}, canvasDocumentCardLayerPropsAreEqual);

function canvasDocumentCardLayerPropsAreEqual(
  previous: CanvasDocumentCardLayerProps,
  next: CanvasDocumentCardLayerProps,
) {
  return (
    previous.layer === next.layer &&
    previous.cardState === next.cardState &&
    previous.isImageFilterMode === next.isImageFilterMode &&
    previous.isImageMode === next.isImageMode &&
    previous.isPaperShaderMode === next.isPaperShaderMode &&
    previous.isLayerSelected === next.isLayerSelected &&
    previous.nested === next.nested
  );
}

function getTextLayerRuns(layer: CanvasLayer): DraftingTextRun[] {
  const text = layer.text ?? "";
  const runs = layer.textRuns;

  if (!runs?.length || runs.map((run) => run.text).join("") !== text) {
    return text ? [{ text }] : [];
  }

  return runs;
}

function hasValidTextRuns(layer: CanvasLayer) {
  return (
    Boolean(layer.textRuns?.length) &&
    layer.textRuns?.map((run) => run.text).join("") === (layer.text ?? "")
  );
}

function getTextRunKey(layerId: string, run: DraftingTextRun, index: number) {
  return `${layerId}:run:${index}:${run.text.length}`;
}

function renderTextLayerContent(layer: CanvasLayer) {
  if (hasValidTextRuns(layer)) {
    return getTextLayerRuns(layer).map((run, index) => (
      <span
        data-slot="canvas-text-run"
        key={getTextRunKey(layer.id, run, index)}
        style={getTextRunStyle(layer, run)}
      >
        {run.text}
      </span>
    ));
  }

  const layout = layoutDraftingText(layer);

  return layout.lines.map((line, index) => (
    <div
      data-slot="canvas-text-line"
      key={`${layer.id}:line:${index}`}
      style={{ minHeight: layout.lineHeight }}
    >
      {line || "\u00a0"}
      {line && index < layout.lines.length - 1 ? " " : null}
    </div>
  ));
}

function resolveQrLayerState(
  layerId: string,
  qrStateByLayerId: DraftingQrStateByLayerId,
  fallbackState: QraftyState,
) {
  return qrStateByLayerId[layerId] ?? fallbackState;
}

function CanvasQrLayerCanvas({
  activeQrLayerId,
  contentValidation,
  layer,
  qrOverlayScale,
  qrState,
}: {
  activeQrLayerId?: string;
  contentValidation?: StaticQrValidationResult;
  layer: CanvasLayer;
  qrOverlayScale?: number;
  qrState: QraftyState;
}) {
  const layout = useMemo(
    () => getDraftingQrLayerLayout(layer.width, qrState, layer.height),
    [layer.height, layer.width, qrState],
  );
  const { markup } = useCanvasQrMarkup(qrState);
  const displayMarkup = useMemo(() => {
    if (!markup) {
      return "";
    }

    return scaleNestedSvgMarkup(markup, layout.innerWidth, layout.innerHeight);
  }, [layout.innerHeight, layout.innerWidth, markup]);
  const shapeTiltPerspectiveStyle = getBackgroundShapeTiltPerspectiveStyle(
    qrState.backgroundShapeOptions,
  );
  const shapeTiltInnerStyle = getBackgroundShapeTiltInnerStyle(qrState.backgroundShapeOptions);
  const overlayMessage =
    activeQrLayerId && contentValidation && layer.id === activeQrLayerId
      ? getContentValidationOverlayMessage(contentValidation, qrState.data)
      : null;

  return (
    <CanvasQrLayerContent
      canvasSvgMarkup={markup}
      layer={layer}
      overlayMessage={overlayMessage}
      overlayScale={qrOverlayScale}
      sanitizedQrMarkup={displayMarkup}
      shapeTiltInnerStyle={shapeTiltInnerStyle}
      shapeTiltPerspectiveStyle={shapeTiltPerspectiveStyle}
      state={qrState}
    />
  );
}

export type CanvasLayerViewSharedProps = {
  activeQrLayerId?: string;
  activeSelectedLayerIdSet: Set<string>;
  cardImageStyle: CSSProperties | undefined;
  cardState: DraftingCardState;
  cardStyle: CSSProperties;
  contentValidation?: StaticQrValidationResult;
  imageFilterShader: DraftingCardPaperShaderState;
  isImageFilterMode: boolean;
  isImageMode: boolean;
  isPaperShaderMode: boolean;
  qrOverlayScale?: number;
  qrStateByLayerId: DraftingQrStateByLayerId;
  state: QraftyState;
};

type CanvasNestedLayerViewProps = CanvasLayerViewSharedProps & {
  layer: CanvasLayer;
};

type CanvasNestedLayerKindProps = CanvasNestedLayerViewProps & {
  isLayerSelected: boolean;
  layerEffectStyle: CSSProperties;
  shaderDisplaySize: { displayHeight: number; displayWidth: number };
};

function CanvasNestedGroupLayerView({
  activeQrLayerId,
  activeSelectedLayerIdSet,
  cardImageStyle,
  cardState,
  cardStyle,
  contentValidation,
  imageFilterShader,
  isImageFilterMode,
  isImageMode,
  isPaperShaderMode,
  isLayerSelected,
  layer,
  layerEffectStyle,
  qrOverlayScale,
  qrStateByLayerId,
  state,
}: CanvasNestedLayerKindProps) {
  return (
    <div
      key={layer.id}
      data-slot="canvas-layer-group"
      data-layer-id={layer.id}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("group")}
      className="absolute max-h-none max-w-none"
      style={{
        ...getLayerPlacementStyle(layer, true),
        ...layerEffectStyle,
      }}
    >
      {(layer.children ?? [])
        .filter((child) => child.isVisible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((child) => (
          <CanvasNestedLayerView
            key={child.id}
            activeQrLayerId={activeQrLayerId}
            activeSelectedLayerIdSet={activeSelectedLayerIdSet}
            cardImageStyle={cardImageStyle}
            cardState={cardState}
            cardStyle={cardStyle}
            contentValidation={contentValidation}
            imageFilterShader={imageFilterShader}
            isImageFilterMode={isImageFilterMode}
            isImageMode={isImageMode}
            isPaperShaderMode={isPaperShaderMode}
            layer={child}
            qrOverlayScale={qrOverlayScale}
            qrStateByLayerId={qrStateByLayerId}
            state={state}
          />
        ))}
    </div>
  );
}

function CanvasNestedQrLayerView({
  activeQrLayerId,
  contentValidation,
  isLayerSelected,
  layer,
  layerEffectStyle,
  qrOverlayScale,
  qrStateByLayerId,
  state,
}: CanvasNestedLayerKindProps) {
  const qrState = resolveQrLayerState(layer.id, qrStateByLayerId, state);

  return (
    <div
      key={layer.id}
      data-slot="canvas-node"
      data-layer-id={layer.id}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("qr")}
      className="absolute max-h-none max-w-none"
      style={{
        ...getLayerPlacementStyle(layer, true),
        ...layerEffectStyle,
      }}
    >
      <CanvasQrLayerCanvas
        activeQrLayerId={activeQrLayerId}
        contentValidation={contentValidation}
        layer={layer}
        qrOverlayScale={qrOverlayScale}
        qrState={qrState}
      />
    </div>
  );
}

function CanvasNestedTextLayerView({
  isLayerSelected,
  layer,
  layerEffectStyle,
}: CanvasNestedLayerKindProps) {
  const isEmojiLayer = isDraftingEmojiLayer(layer);

  return (
    <div
      key={layer.id}
      data-slot="canvas-text-layer"
      data-layer-id={layer.id}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("text")}
      className="absolute max-h-none max-w-none overflow-hidden"
      style={{
        ...getLayerPlacementStyle(layer, true),
        ...layerEffectStyle,
      }}
    >
      <div
        className={cn("h-full w-full", isEmojiLayer && "flex items-center justify-center")}
        data-slot="canvas-text-content"
        style={getTextLayerStyle(layer)}
      >
        {renderTextLayerContent(layer)}
      </div>
    </div>
  );
}

function CanvasNestedImageLayerView({
  isLayerSelected,
  layer,
  layerEffectStyle,
}: CanvasNestedLayerKindProps) {
  return (
    <div
      key={layer.id}
      data-slot="canvas-image-layer"
      data-layer-id={layer.id}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("image")}
      className="absolute max-h-none max-w-none overflow-hidden"
      style={{
        ...getLayerPlacementStyle(layer, true),
        ...layerEffectStyle,
      }}
    >
      <DraftingImageLayerContent layer={layer} />
    </div>
  );
}

function CanvasNestedShapeLayerView({
  isLayerSelected,
  layer,
  layerEffectStyle,
}: CanvasNestedLayerKindProps) {
  return (
    <div
      key={layer.id}
      data-shape-id={layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId}
      data-slot="canvas-shape-layer"
      data-layer-id={layer.id}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("shape")}
      className="absolute max-h-none max-w-none overflow-visible"
      style={{
        ...getLayerPlacementStyle(layer, true),
        ...layerEffectStyle,
      }}
    >
      <DraftingShapeLayerContent layer={layer} />
    </div>
  );
}

function CanvasNestedShaderLayerView({
  isLayerSelected,
  layer,
  layerEffectStyle,
  shaderDisplaySize,
}: CanvasNestedLayerKindProps) {
  const paperShader = layer.paperShader ?? createDefaultDraftingCardPaperShader();

  return (
    <div
      key={layer.id}
      data-slot="canvas-shader-layer"
      data-layer-id={layer.id}
      data-paper-shader-id={paperShader.shaderId}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("shader")}
      className="absolute max-h-none max-w-none overflow-hidden"
      style={{
        ...getLayerPlacementStyle(layer, true),
        borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
        ...layerEffectStyle,
      }}
    >
      <DraftingCardPaperShaderLayer
        displayHeight={shaderDisplaySize.displayHeight}
        displayWidth={shaderDisplaySize.displayWidth}
        layoutHeight={layer.height}
        layoutWidth={layer.width}
        paperShader={paperShader}
      />
    </div>
  );
}

function CanvasNestedLayerView({
  activeQrLayerId,
  activeSelectedLayerIdSet,
  cardImageStyle,
  cardState,
  cardStyle,
  contentValidation,
  imageFilterShader,
  isImageFilterMode,
  isImageMode,
  isPaperShaderMode,
  layer,
  qrOverlayScale,
  qrStateByLayerId,
  state,
}: CanvasNestedLayerViewProps) {
  const isLayerSelected = activeSelectedLayerIdSet.has(layer.id);
  const layerEffectStyle = useCanvasLayerEffectStyle(layer);
  const shaderDisplaySize = usePreviewShaderDisplaySize(layer.width, layer.height);
  const kindProps: CanvasNestedLayerKindProps = {
    activeQrLayerId,
    activeSelectedLayerIdSet,
    cardImageStyle,
    cardState,
    cardStyle,
    contentValidation,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isPaperShaderMode,
    isLayerSelected,
    layer,
    layerEffectStyle,
    qrOverlayScale,
    qrStateByLayerId,
    shaderDisplaySize,
    state,
  };

  if (layer.kind === "group") {
    return <CanvasNestedGroupLayerView {...kindProps} />;
  }

  if (layer.kind === "qr") {
    return <CanvasNestedQrLayerView {...kindProps} />;
  }

  if (layer.kind === "text") {
    return <CanvasNestedTextLayerView {...kindProps} />;
  }

  if (layer.kind === "image") {
    return <CanvasNestedImageLayerView {...kindProps} />;
  }

  if (layer.kind === "shape") {
    return <CanvasNestedShapeLayerView {...kindProps} />;
  }

  if (layer.kind === "shader") {
    return <CanvasNestedShaderLayerView {...kindProps} />;
  }

  return (
    <CanvasDocumentCardLayer
      cardState={cardState}
      isImageFilterMode={isImageFilterMode}
      isImageMode={isImageMode}
      isPaperShaderMode={isPaperShaderMode}
      isLayerSelected={isLayerSelected}
      layer={layer}
      nested
    />
  );
}

type CanvasLayerViewProps = CanvasLayerViewSharedProps & {
  editingTextDraft: string;
  editingTextLayerId: string | null;
  layer: CanvasLayer;
  onActivateLayerSelection: (
    layer: CanvasLayer,
    options?: { additive?: boolean; qr?: boolean },
  ) => void;
  onCommitEditingTextDraft: () => void;
  onEndLayerInteraction: (event: PointerEvent<HTMLElement>) => void;
  onHandleTextEditorInput: (event: FormEvent<HTMLTextAreaElement>) => void;
  onOpenLayerContextMenu: (event: MouseEvent<HTMLElement>, layerIds: string[]) => void;
  onSelectLayerFromClick: (
    event: MouseEvent<HTMLElement>,
    layer: CanvasLayer,
    options?: { qr?: boolean },
  ) => void;
  onStartLayerInteraction: (
    event: PointerEvent<HTMLElement>,
    layer: CanvasLayer,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) => void;
  onStartTextEditing: (event: MouseEvent<HTMLElement>, layer: CanvasLayer) => void;
  onUpdateLayerInteraction: (event: PointerEvent<HTMLElement>) => void;
  onRegisterTextEditor: (layerId: string, element: HTMLTextAreaElement | null) => void;
};

function areCanvasLayerViewPropsEqual(previous: CanvasLayerViewProps, next: CanvasLayerViewProps) {
  const alwaysComparedKeys = [
    "layer",
    "cardState",
    "cardStyle",
    "cardImageStyle",
    "imageFilterShader",
    "isImageFilterMode",
    "isImageMode",
    "isPaperShaderMode",
    "onRegisterTextEditor",
  ] as const;
  if (alwaysComparedKeys.some((key) => previous[key] !== next[key])) {
    return false;
  }

  if (previous.layer.kind === "qr" || next.layer.kind === "qr") {
    const qrKeys = ["state", "contentValidation", "activeQrLayerId", "qrOverlayScale"] as const;
    if (qrKeys.some((key) => previous[key] !== next[key])) {
      return false;
    }

    if (previous.qrStateByLayerId[previous.layer.id] !== next.qrStateByLayerId[next.layer.id]) {
      return false;
    }
  }

  const wasSelected = previous.activeSelectedLayerIdSet.has(previous.layer.id);
  const isSelected = next.activeSelectedLayerIdSet.has(next.layer.id);
  if (wasSelected !== isSelected) {
    return false;
  }

  const wasEditing = previous.editingTextLayerId === previous.layer.id;
  const isEditing = next.editingTextLayerId === next.layer.id;
  if (wasEditing !== isEditing) {
    return false;
  }
  if (isEditing && previous.editingTextDraft !== next.editingTextDraft) {
    return false;
  }

  return true;
}

type CanvasLayerKindViewProps = CanvasLayerViewProps & {
  isLayerSelected: boolean;
  layerEffectStyle: CSSProperties;
  shaderDisplaySize: { displayHeight: number; displayWidth: number };
};

function CanvasGroupLayerView({
  activeQrLayerId,
  activeSelectedLayerIdSet,
  cardImageStyle,
  cardState,
  cardStyle,
  contentValidation,
  imageFilterShader,
  isImageFilterMode,
  isImageMode,
  isPaperShaderMode,
  isLayerSelected,
  layer,
  layerEffectStyle,
  onActivateLayerSelection,
  onEndLayerInteraction,
  onOpenLayerContextMenu,
  onSelectLayerFromClick,
  onStartLayerInteraction,
  onUpdateLayerInteraction,
  qrOverlayScale,
  qrStateByLayerId,
  state,
}: CanvasLayerKindViewProps) {
  return (
    <CanvasLayerInteractive
      key={layer.id}
      layer={layer}
      isSelected={isLayerSelected}
      onActivate={(additive) => onActivateLayerSelection(layer, { additive })}
      data-slot="canvas-layer-group"
      data-layer-id={layer.id}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("group")}
      className={cn("absolute max-h-none max-w-none touch-none", LAYER_MOVE_CURSOR_CLASS)}
      style={{
        ...getLayerPlacementStyle(layer),
        ...layerEffectStyle,
      }}
      onClick={(event) => onSelectLayerFromClick(event, layer)}
      onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
      onPointerMove={onUpdateLayerInteraction}
      onPointerUp={onEndLayerInteraction}
      onPointerCancel={onEndLayerInteraction}
      onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
    >
      <CanvasLayerTiltShell layer={layer}>
        {(layer.children ?? [])
          .filter((child) => child.isVisible)
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((child) => (
            <CanvasNestedLayerView
              key={child.id}
              activeQrLayerId={activeQrLayerId}
              activeSelectedLayerIdSet={activeSelectedLayerIdSet}
              cardImageStyle={cardImageStyle}
              cardState={cardState}
              cardStyle={cardStyle}
              contentValidation={contentValidation}
              imageFilterShader={imageFilterShader}
              isImageFilterMode={isImageFilterMode}
              isImageMode={isImageMode}
              isPaperShaderMode={isPaperShaderMode}
              layer={child}
              qrOverlayScale={qrOverlayScale}
              qrStateByLayerId={qrStateByLayerId}
              state={state}
            />
          ))}
      </CanvasLayerTiltShell>
    </CanvasLayerInteractive>
  );
}

function CanvasQrLayerView({
  activeQrLayerId,
  contentValidation,
  isLayerSelected,
  layer,
  layerEffectStyle,
  onActivateLayerSelection,
  onEndLayerInteraction,
  onOpenLayerContextMenu,
  onSelectLayerFromClick,
  onStartLayerInteraction,
  onUpdateLayerInteraction,
  qrOverlayScale,
  qrStateByLayerId,
  state,
}: CanvasLayerKindViewProps) {
  const qrState = resolveQrLayerState(layer.id, qrStateByLayerId, state);

  return (
    <CanvasLayerInteractive
      key={layer.id}
      layer={layer}
      isSelected={isLayerSelected}
      onActivate={(additive) => onActivateLayerSelection(layer, { additive, qr: true })}
      data-slot="canvas-node"
      data-layer-id={layer.id}
      data-node-id={qrState.data}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("qr")}
      className={cn("absolute max-h-none max-w-none touch-none", LAYER_MOVE_CURSOR_CLASS)}
      style={{
        ...getLayerPlacementStyle(layer),
        ...layerEffectStyle,
      }}
      onClick={(event) => onSelectLayerFromClick(event, layer, { qr: true })}
      onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
      onPointerMove={onUpdateLayerInteraction}
      onPointerUp={onEndLayerInteraction}
      onPointerCancel={onEndLayerInteraction}
      onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
    >
      <CanvasLayerTiltShell layer={layer}>
        <CanvasQrLayerCanvas
          activeQrLayerId={activeQrLayerId}
          contentValidation={contentValidation}
          layer={layer}
          qrOverlayScale={qrOverlayScale}
          qrState={qrState}
        />
      </CanvasLayerTiltShell>
    </CanvasLayerInteractive>
  );
}

function CanvasTextLayerView({
  editingTextDraft,
  editingTextLayerId,
  isLayerSelected,
  layer,
  layerEffectStyle,
  onActivateLayerSelection,
  onCommitEditingTextDraft,
  onEndLayerInteraction,
  onHandleTextEditorInput,
  onOpenLayerContextMenu,
  onSelectLayerFromClick,
  onStartLayerInteraction,
  onStartTextEditing,
  onUpdateLayerInteraction,
  onRegisterTextEditor,
}: CanvasLayerKindViewProps) {
  const isEditing = editingTextLayerId === layer.id;

  return (
    <CanvasLayerInteractive
      key={layer.id}
      layer={layer}
      isSelected={isLayerSelected}
      onActivate={(additive) => onActivateLayerSelection(layer, { additive })}
      data-slot="canvas-text-layer"
      data-layer-id={layer.id}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("text")}
      className={cn(
        "absolute max-h-none max-w-none touch-none overflow-hidden",
        isEditing ? "cursor-text" : LAYER_MOVE_CURSOR_CLASS,
      )}
      style={{
        ...getLayerPlacementStyle(layer),
        ...layerEffectStyle,
      }}
      onClick={(event) => onSelectLayerFromClick(event, layer)}
      onDoubleClick={(event) => onStartTextEditing(event, layer)}
      onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
      onPointerMove={onUpdateLayerInteraction}
      onPointerUp={onEndLayerInteraction}
      onPointerCancel={onEndLayerInteraction}
      onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
    >
      <CanvasLayerTiltShell layer={layer}>
        {isEditing ? (
          <textarea
            aria-label="Edit text layer"
            className="h-full w-full resize-none cursor-text overflow-hidden border-0 bg-transparent p-0 outline-none"
            data-slot="canvas-text-editor"
            ref={(element) => {
              onRegisterTextEditor(layer.id, element);
            }}
            spellCheck={false}
            style={getTextLayerStyle(layer)}
            value={editingTextDraft}
            onBlur={onCommitEditingTextDraft}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
            onInput={onHandleTextEditorInput}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Escape") {
                event.preventDefault();
                onCommitEditingTextDraft();
              }
            }}
            onPointerDown={(event) => event.stopPropagation()}
          />
        ) : (
          <div
            className="h-full w-full"
            data-slot="canvas-text-content"
            style={getTextLayerStyle(layer)}
          >
            {renderTextLayerContent(layer)}
          </div>
        )}
      </CanvasLayerTiltShell>
    </CanvasLayerInteractive>
  );
}

function CanvasImageLayerView({
  isLayerSelected,
  layer,
  layerEffectStyle,
  onActivateLayerSelection,
  onEndLayerInteraction,
  onOpenLayerContextMenu,
  onSelectLayerFromClick,
  onStartLayerInteraction,
  onUpdateLayerInteraction,
}: CanvasLayerKindViewProps) {
  return (
    <CanvasLayerInteractive
      key={layer.id}
      layer={layer}
      isSelected={isLayerSelected}
      onActivate={(additive) => onActivateLayerSelection(layer, { additive })}
      data-slot="canvas-image-layer"
      data-layer-id={layer.id}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("image")}
      className={cn(
        "absolute max-h-none max-w-none touch-none overflow-hidden",
        LAYER_MOVE_CURSOR_CLASS,
      )}
      style={{
        ...getLayerPlacementStyle(layer),
        borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
        ...layerEffectStyle,
      }}
      onClick={(event) => onSelectLayerFromClick(event, layer)}
      onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
      onPointerMove={onUpdateLayerInteraction}
      onPointerUp={onEndLayerInteraction}
      onPointerCancel={onEndLayerInteraction}
      onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
    >
      <CanvasLayerTiltShell layer={layer}>
        <DraftingImageLayerContent layer={layer} />
      </CanvasLayerTiltShell>
    </CanvasLayerInteractive>
  );
}

function CanvasShapeLayerView({
  isLayerSelected,
  layer,
  layerEffectStyle,
  onActivateLayerSelection,
  onEndLayerInteraction,
  onOpenLayerContextMenu,
  onSelectLayerFromClick,
  onStartLayerInteraction,
  onUpdateLayerInteraction,
}: CanvasLayerKindViewProps) {
  return (
    <CanvasLayerInteractive
      key={layer.id}
      layer={layer}
      isSelected={isLayerSelected}
      onActivate={(additive) => onActivateLayerSelection(layer, { additive })}
      data-shape-id={layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId}
      data-slot="canvas-shape-layer"
      data-layer-id={layer.id}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("shape")}
      className={cn(
        "absolute max-h-none max-w-none touch-none overflow-visible",
        LAYER_MOVE_CURSOR_CLASS,
      )}
      style={{
        ...getLayerPlacementStyle(layer),
        ...layerEffectStyle,
      }}
      onClick={(event) => onSelectLayerFromClick(event, layer)}
      onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
      onPointerMove={onUpdateLayerInteraction}
      onPointerUp={onEndLayerInteraction}
      onPointerCancel={onEndLayerInteraction}
      onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
    >
      <CanvasLayerTiltShell layer={layer}>
        <DraftingShapeLayerContent layer={layer} />
      </CanvasLayerTiltShell>
    </CanvasLayerInteractive>
  );
}

function CanvasShaderLayerView({
  isLayerSelected,
  layer,
  layerEffectStyle,
  onActivateLayerSelection,
  onEndLayerInteraction,
  onOpenLayerContextMenu,
  onSelectLayerFromClick,
  onStartLayerInteraction,
  onUpdateLayerInteraction,
  shaderDisplaySize,
}: CanvasLayerKindViewProps) {
  const paperShader = layer.paperShader ?? createDefaultDraftingCardPaperShader();

  return (
    <CanvasLayerInteractive
      key={layer.id}
      layer={layer}
      isSelected={isLayerSelected}
      onActivate={(additive) => onActivateLayerSelection(layer, { additive })}
      data-slot="canvas-shader-layer"
      data-layer-id={layer.id}
      data-paper-shader-id={paperShader.shaderId}
      data-selected={isLayerSelected ? "true" : "false"}
      {...layerExportAttrs("shader")}
      className={cn(
        "absolute max-h-none max-w-none touch-none overflow-hidden",
        LAYER_MOVE_CURSOR_CLASS,
      )}
      style={{
        ...getLayerPlacementStyle(layer),
        borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
        ...layerEffectStyle,
      }}
      onClick={(event) => onSelectLayerFromClick(event, layer)}
      onPointerDown={(event) => onStartLayerInteraction(event, layer, "move")}
      onPointerMove={onUpdateLayerInteraction}
      onPointerUp={onEndLayerInteraction}
      onPointerCancel={onEndLayerInteraction}
      onContextMenu={(event) => onOpenLayerContextMenu(event, [layer.id])}
    >
      <CanvasLayerTiltShell layer={layer}>
        <DraftingCardPaperShaderLayer
          displayHeight={shaderDisplaySize.displayHeight}
          displayWidth={shaderDisplaySize.displayWidth}
          layoutHeight={layer.height}
          layoutWidth={layer.width}
          paperShader={paperShader}
        />
      </CanvasLayerTiltShell>
    </CanvasLayerInteractive>
  );
}

export const CanvasLayerView = memo(function CanvasLayerView({
  activeQrLayerId,
  activeSelectedLayerIdSet,
  cardImageStyle,
  cardState,
  cardStyle,
  contentValidation,
  editingTextDraft,
  editingTextLayerId,
  imageFilterShader,
  isImageFilterMode,
  isImageMode,
  isPaperShaderMode,
  layer,
  qrStateByLayerId,
  onActivateLayerSelection,
  onCommitEditingTextDraft,
  onEndLayerInteraction,
  onHandleTextEditorInput,
  onOpenLayerContextMenu,
  onSelectLayerFromClick,
  onStartLayerInteraction,
  onStartTextEditing,
  onUpdateLayerInteraction,
  qrOverlayScale,
  state,
  onRegisterTextEditor,
}: CanvasLayerViewProps) {
  const isLayerSelected = activeSelectedLayerIdSet.has(layer.id);
  const layerEffectStyle = useCanvasLayerEffectStyle(layer);
  const shaderDisplaySize = usePreviewShaderDisplaySize(layer.width, layer.height);
  const kindProps: CanvasLayerKindViewProps = {
    activeQrLayerId,
    activeSelectedLayerIdSet,
    cardImageStyle,
    cardState,
    cardStyle,
    contentValidation,
    editingTextDraft,
    editingTextLayerId,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isPaperShaderMode,
    isLayerSelected,
    layer,
    layerEffectStyle,
    onActivateLayerSelection,
    onCommitEditingTextDraft,
    onEndLayerInteraction,
    onHandleTextEditorInput,
    onOpenLayerContextMenu,
    onSelectLayerFromClick,
    onStartLayerInteraction,
    onStartTextEditing,
    onUpdateLayerInteraction,
    qrOverlayScale,
    qrStateByLayerId,
    shaderDisplaySize,
    state,
    onRegisterTextEditor,
  };

  if (layer.kind === "group") {
    return <CanvasGroupLayerView {...kindProps} />;
  }

  if (layer.kind === "qr") {
    return <CanvasQrLayerView {...kindProps} />;
  }

  if (layer.kind === "text") {
    return <CanvasTextLayerView {...kindProps} />;
  }

  if (layer.kind === "image") {
    return <CanvasImageLayerView {...kindProps} />;
  }

  if (layer.kind === "shape") {
    return <CanvasShapeLayerView {...kindProps} />;
  }

  if (layer.kind === "shader") {
    return <CanvasShaderLayerView {...kindProps} />;
  }

  return (
    <CanvasDocumentCardLayer
      cardState={cardState}
      isImageFilterMode={isImageFilterMode}
      isImageMode={isImageMode}
      isPaperShaderMode={isPaperShaderMode}
      isLayerSelected={isLayerSelected}
      layer={layer}
    />
  );
}, areCanvasLayerViewPropsEqual);
