"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import FileUpload from "@/components/vendor/kokonutui/file-upload";
import {
  INSPECTOR_CONTROL_CLASS,
  INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
  INSPECTOR_RADIUS_CLASS,
  INSPECTOR_SECTION_GAP_CLASS,
  INSPECTOR_SECTION_HEADING_CLASS,
  INSPECTOR_SELECTED_CLASS,
  INSPECTOR_TYPE_VALUE_CLASS,
} from "@/features/shell/components/inspector-tokens";
import {
  InspectorLabel,
  InspectorSection,
  InspectorTextarea,
  InspectorTextInput,
  InspectorScrubbableNumberInput,
} from "@/features/shell/components/InspectorControls";
import {
  inspectorOptionGridItemClass,
  inspectorOptionStackClass,
} from "@/features/shell/inspector/InspectorOptionGrid.classes";
import {
  SegmentTabs,
  SettingsFillPopover,
  SettingsSlider,
} from "@/features/shell/inspector/settings-ui";
import {
  getShapeLayerFillCssValue,
  getTextLayerFillCssValue,
  patchShapeLayerFillFromPicker,
  patchTextLayerFillFromPicker,
} from "@/features/canvas/rendering/layer-fill";
import {
  InspectorElasticSliderRow,
  InspectorNumberField,
  InspectorScrollArea,
  InspectorValueGrid,
} from "@/features/shell/components/InspectorShell";
import {
  getFontWeightSliderStep,
  getLayerFontWeight,
  getNearestFontWeight,
} from "@/features/shell/model/font-weight";
import { EffectsAccordion } from "@/features/shell/components/EffectsAccordion";
import { ElementShapeOptionGrid } from "@/features/canvas/components/ElementShapeOptionGrid";
import { PaperShaderOptionGrid } from "@/features/canvas/components/PaperShaderOptionGrid";
import { SettingsPaperShaderControls } from "@/features/shell/inspector/PaperShaderSettings";
import {
  DEFAULT_DRAFTING_IMAGE_LAYER,
  DEFAULT_DRAFTING_SHAPE_LAYER,
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
  type DraftingShapeFillMode,
} from "@/features/canvas/model/layers/shared";
import { createDefaultDraftingCardPaperShader } from "@/features/canvas/model/card-state";
import {
  DRAFTING_FONT_CATEGORY_LABELS,
  getDraftingFontCssFamily,
  groupDraftingFonts,
  loadDraftingFont,
  loadDraftingFontPreview,
  resolveDraftingFont,
} from "@/features/canvas/model/fonts";
import type { DraftingFontCategory } from "@/features/canvas/model/font-catalog";
import { useFontPreviewObserver } from "@/features/shell/inspector/use-font-preview-observer";
import { IllustrationInspectorColorSection } from "@/features/canvas/components/IllustrationColorControls";
import { isDraftingIllustrationLayer } from "@/features/canvas/model/layer-floating-settings";
import { cn } from "@/lib/utils";

/** Layer-style categories. Mobile renders one at a time behind a rail; desktop
 *  renders all of them (`category` undefined). */
export type LayerStyleCategory =
  "content" | "type" | "color" | "spacing" | "shape" | "fill" | "image" | "shader" | "options";

function showsCategory(active: LayerStyleCategory | undefined, id: LayerStyleCategory) {
  return active === undefined || active === id;
}

export function LayerStyleInspector({
  category,
  layer,
  onPatch,
}: {
  category?: LayerStyleCategory;
  layer: DraftingCanvasLayer;
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void;
}) {
  return (
    <div data-slot="layer-style-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      {layer.kind === "text" ? (
        <LayerTextInspector category={category} layer={layer} onPatch={onPatch} />
      ) : null}
      {layer.kind === "shape" ? (
        <LayerShapeInspector category={category} layer={layer} onPatch={onPatch} />
      ) : null}
      {layer.kind === "image" ? (
        <LayerImageInspector category={category} layer={layer} onPatch={onPatch} />
      ) : null}
      {layer.kind === "shader" ? (
        <LayerShaderInspector category={category} layer={layer} onPatch={onPatch} />
      ) : null}
    </div>
  );
}

export function ElementInspector({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer;
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void;
}) {
  return (
    <div data-slot="element-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <InspectorScrollArea>
        <LayerStyleInspector layer={layer} onPatch={onPatch} />
        <EffectsAccordion layer={layer} onPatch={onPatch} />
      </InspectorScrollArea>
    </div>
  );
}

export function TransformInspector({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer | null | undefined;
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void;
}) {
  return (
    <div data-slot="transform-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <InspectorScrollArea>
        {layer ? (
          <TransformSection layer={layer} onPatch={onPatch} />
        ) : (
          <InspectorSection>
            <p className="dn-type-value text-center font-semibold text-[var(--settings-fg-muted)]">
              Select a layer to edit position, size, and rotation.
            </p>
          </InspectorSection>
        )}
      </InspectorScrollArea>
    </div>
  );
}

function TransformValueGrid({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer;
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void;
}) {
  const lockAspect =
    layer.kind === "image" ||
    layer.kind === "shape" ||
    layer.kind === "shader" ||
    layer.kind === "qr";

  return (
    <InspectorValueGrid>
      <InspectorNumberField
        label="X"
        value={Math.round(layer.x)}
        onChange={(x) => onPatch({ x })}
      />
      <InspectorNumberField
        label="Y"
        value={Math.round(layer.y)}
        onChange={(y) => onPatch({ y })}
      />
      <InspectorNumberField
        label="W"
        min={1}
        value={Math.round(layer.width)}
        onChange={(width) =>
          onPatch({
            width,
            ...(lockAspect ? { height: width } : {}),
            ...(layer.kind === "qr" ? { height: width } : {}),
          })
        }
      />
      <InspectorNumberField
        disabled={layer.kind === "qr" || lockAspect}
        label="H"
        min={1}
        value={Math.round(layer.height)}
        onChange={(height) => onPatch({ height })}
      />
    </InspectorValueGrid>
  );
}

function TransformSliders({
  flat,
  layer,
  onPatch,
}: {
  flat: boolean;
  layer: DraftingCanvasLayer;
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void;
}) {
  if (flat) {
    return (
      <>
        <SettingsSlider
          label="Rotation"
          max={360}
          min={-360}
          step={1}
          value={Math.round(layer.rotation)}
          onChange={(rotation) => onPatch({ rotation })}
        />
        <SettingsSlider
          label="Horizontal tilt"
          max={60}
          min={-60}
          step={1}
          value={Math.round(layer.tiltX ?? 0)}
          onChange={(tiltX) => onPatch({ tiltX })}
        />
        <SettingsSlider
          label="Vertical tilt"
          max={60}
          min={-60}
          step={1}
          value={Math.round(layer.tiltY ?? 0)}
          onChange={(tiltY) => onPatch({ tiltY })}
        />
      </>
    );
  }

  return (
    <>
      <InspectorElasticSliderRow
        label="Rotation"
        max={360}
        min={-360}
        value={Math.round(layer.rotation)}
        valueLabel={`${Math.round(layer.rotation)}°`}
        onChange={(rotation) => onPatch({ rotation })}
      />
      <InspectorElasticSliderRow
        label="Horizontal tilt"
        max={60}
        min={-60}
        value={layer.tiltX ?? 0}
        valueLabel={`${Math.round(layer.tiltX ?? 0)}°`}
        onChange={(tiltX) => onPatch({ tiltX })}
      />
      <InspectorElasticSliderRow
        label="Vertical tilt"
        max={60}
        min={-60}
        value={layer.tiltY ?? 0}
        valueLabel={`${Math.round(layer.tiltY ?? 0)}°`}
        onChange={(tiltY) => onPatch({ tiltY })}
      />
    </>
  );
}

export function TransformSection({
  layer,
  onPatch,
  variant = "default",
}: {
  layer: DraftingCanvasLayer;
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void;
  variant?: "default" | "flat";
}) {
  const flat = variant === "flat";

  return (
    <InspectorSection className={flat ? "gap-2.5" : undefined} dataSlot="transform-section">
      {flat ? null : <InspectorLabel>Transform</InspectorLabel>}
      {flat ? null : <TransformValueGrid layer={layer} onPatch={onPatch} />}

      <div className={flat ? "grid gap-2" : INSPECTOR_SECTION_GAP_CLASS}>
        <TransformSliders flat={flat} layer={layer} onPatch={onPatch} />
      </div>
    </InspectorSection>
  );
}

type TextFontOption = {
  family: string;
  id: string;
  label: string;
};

type TextFontGroup = {
  category: DraftingFontCategory;
  fonts: TextFontOption[];
};

function TextFontMenu({
  bindFontPreview,
  fontGroups,
  fontQuery,
  selectedFontId,
  onFontQueryChange,
  onSelectFont,
}: {
  bindFontPreview: (fontId: string) => (node: HTMLElement | null) => void;
  fontGroups: TextFontGroup[];
  fontQuery: string;
  selectedFontId: string;
  onFontQueryChange: (query: string) => void;
  onSelectFont: (font: TextFontOption) => void;
}) {
  return (
    <div className="mt-2 flex flex-col gap-1" data-slot="layer-text-font-menu">
      <input
        aria-label="Search fonts"
        autoComplete="off"
        className={cn(
          INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
          "w-full min-w-0 shrink-0 px-2.5 text-left font-semibold",
          INSPECTOR_TYPE_VALUE_CLASS,
          INSPECTOR_CONTROL_CLASS,
        )}
        placeholder="Search fonts…"
        type="search"
        value={fontQuery}
        onChange={(event) => onFontQueryChange(event.currentTarget.value)}
      />
      <div
        id="layer-text-font-listbox"
        aria-label="Text font options"
        className={cn("max-h-56 overflow-y-auto pr-1", inspectorOptionStackClass())}
        data-slot="layer-text-font-listbox"
        role="listbox"
      >
        {fontGroups.map((group) => (
          <div className="flex flex-col" key={group.category}>
            <p className="px-2.5 pt-1.5 pb-0.5 text-[length:var(--type-caption)] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              {DRAFTING_FONT_CATEGORY_LABELS[group.category]}
            </p>
            {group.fonts.map((font) => (
              <button
                key={font.id}
                ref={bindFontPreview(font.id)}
                aria-label={`Use ${font.label} text font`}
                aria-selected={selectedFontId === font.id}
                className={cn(
                  "flex min-w-0 items-center px-2.5 text-left font-semibold",
                  INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
                  INSPECTOR_TYPE_VALUE_CLASS,
                  inspectorOptionGridItemClass(),
                  INSPECTOR_CONTROL_CLASS,
                  selectedFontId === font.id && INSPECTOR_SELECTED_CLASS,
                )}
                role="option"
                style={{ fontFamily: getDraftingFontCssFamily({ fontId: font.id }) }}
                type="button"
                onClick={() => onSelectFont(font)}
                onPointerEnter={() => loadDraftingFontPreview(font.id)}
              >
                <span className="min-w-0 flex-1 truncate">{font.label}</span>
              </button>
            ))}
          </div>
        ))}
        {fontGroups.length === 0 ? (
          <p className="px-2.5 py-3 text-center text-xs text-[var(--muted)]">No matching fonts</p>
        ) : null}
      </div>
    </div>
  );
}

function LayerTextInspector({
  category,
  layer,
  onPatch,
}: {
  category?: LayerStyleCategory;
  layer: DraftingCanvasLayer;
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void;
}) {
  const selectedFont = resolveDraftingFont({
    fontFamily: layer.fontFamily,
    fontId: layer.fontId,
  });
  const supportedWeights = selectedFont.weights;
  const fontWeight = getLayerFontWeight(layer.fontWeight, supportedWeights);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [fontQuery, setFontQuery] = useState("");
  const fontGroups = useMemo(() => groupDraftingFonts(fontQuery), [fontQuery]);
  const bindFontPreview = useFontPreviewObserver();

  useEffect(() => {
    void loadDraftingFont(selectedFont.id);
  }, [selectedFont.id]);

  function patchTextLayer(patch: Partial<DraftingCanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined });
  }

  return (
    <>
      {showsCategory(category, "content") ? (
        <InspectorSection className={INSPECTOR_SECTION_GAP_CLASS} dataSlot="layer-text-content">
          <InspectorLabel>Content</InspectorLabel>
          <InspectorTextarea
            aria-label="Text layer content"
            className="min-h-16 py-2"
            value={layer.text ?? ""}
            onChange={(event) => patchTextLayer({ text: event.currentTarget.value })}
          />
        </InspectorSection>
      ) : null}

      {showsCategory(category, "type") ? (
        <InspectorSection className={INSPECTOR_SECTION_GAP_CLASS} dataSlot="layer-text-inspector">
          <p className={cn("mb-2", INSPECTOR_SECTION_HEADING_CLASS)}>Typography</p>
          <div className="grid grid-cols-[1fr_var(--inspector-preview-col)] gap-1.5">
            <div className="min-w-0" data-slot="layer-text-font-selector">
              <button
                aria-controls="layer-text-font-listbox"
                aria-expanded={fontMenuOpen}
                aria-haspopup="listbox"
                aria-label="Text font"
                className={cn(
                  INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
                  "w-full min-w-0 items-center justify-between gap-[length:var(--space-inline)] px-2.5 text-left font-semibold",
                  INSPECTOR_TYPE_VALUE_CLASS,
                  INSPECTOR_CONTROL_CLASS,
                )}
                style={{ fontFamily: getDraftingFontCssFamily({ fontId: selectedFont.id }) }}
                type="button"
                onClick={() => setFontMenuOpen((open) => !open)}
              >
                <span className="min-w-0 flex-1 truncate">{selectedFont.label}</span>
                <ChevronDownIcon
                  className={cn(
                    "size-3.5 shrink-0 text-current transition-transform",
                    fontMenuOpen && "rotate-180",
                  )}
                />
              </button>
            </div>
            <InspectorScrubbableNumberInput
              aria-label="Text font size"
              className={cn(
                INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
                "px-2 font-semibold",
                INSPECTOR_RADIUS_CLASS,
                INSPECTOR_TYPE_VALUE_CLASS,
              )}
              max={300}
              min={6}
              value={layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize}
              onValueChange={(fontSize) => patchTextLayer({ fontSize })}
            />
          </div>
          {fontMenuOpen ? (
            <TextFontMenu
              bindFontPreview={bindFontPreview}
              fontGroups={fontGroups}
              fontQuery={fontQuery}
              selectedFontId={selectedFont.id}
              onFontQueryChange={setFontQuery}
              onSelectFont={(font) => {
                void loadDraftingFont(font.id);
                patchTextLayer({ fontFamily: font.family, fontId: font.id });
                setFontMenuOpen(false);
                setFontQuery("");
              }}
            />
          ) : null}

          <InspectorElasticSliderRow
            label="Weight"
            max={Math.max(...supportedWeights)}
            min={Math.min(...supportedWeights)}
            step={getFontWeightSliderStep(supportedWeights)}
            value={fontWeight}
            valueLabel={String(Math.round(fontWeight))}
            onChange={(nextWeight) =>
              patchTextLayer({
                fontWeight: getNearestFontWeight(nextWeight, supportedWeights),
              })
            }
          />
        </InspectorSection>
      ) : null}

      {showsCategory(category, "color") ? (
        <InspectorSection className={INSPECTOR_SECTION_GAP_CLASS} dataSlot="layer-text-color">
          <p className={cn("mb-3", INSPECTOR_SECTION_HEADING_CLASS)}>Color</p>
          <SettingsFillPopover
            hint="Text fill"
            title="Text fill"
            value={getTextLayerFillCssValue(layer)}
            onValueChange={(fill, css) =>
              patchTextLayer(patchTextLayerFillFromPicker(layer, fill, css))
            }
          />
        </InspectorSection>
      ) : null}

      {showsCategory(category, "spacing") ? (
        <InspectorSection className={INSPECTOR_SECTION_GAP_CLASS} dataSlot="layer-text-spacing">
          <p className={cn("mb-3", INSPECTOR_SECTION_HEADING_CLASS)}>Spacing</p>
          <div className="grid gap-2">
            <InspectorElasticSliderRow
              label="Letter spacing"
              max={200}
              min={-50}
              value={layer.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing}
              valueLabel={`${Math.round(layer.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing)} px`}
              onChange={(letterSpacing) => patchTextLayer({ letterSpacing })}
            />
            <InspectorElasticSliderRow
              label="Line height"
              max={4}
              min={0.6}
              step={0.05}
              value={layer.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight}
              valueLabel={(layer.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight).toFixed(2)}
              onChange={(lineHeight) => patchTextLayer({ lineHeight })}
            />
          </div>
        </InspectorSection>
      ) : null}
    </>
  );
}

function LayerShapeInspector({
  category,
  layer,
  onPatch,
}: {
  category?: LayerStyleCategory;
  layer: DraftingCanvasLayer;
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void;
}) {
  const shapeId = layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId;
  const fillMode = layer.fillMode ?? DEFAULT_DRAFTING_SHAPE_LAYER.fillMode;

  return (
    <>
      {showsCategory(category, "shape") ? (
        <InspectorSection
          className={INSPECTOR_SECTION_GAP_CLASS}
          dataSlot="layer-shape-inspector"
          resize
        >
          <InspectorLabel>Shape</InspectorLabel>
          <ElementShapeOptionGrid
            selectedShapeId={shapeId}
            variant="inspector"
            onSelect={(nextShapeId) => onPatch({ shapeId: nextShapeId })}
          />
        </InspectorSection>
      ) : null}

      {showsCategory(category, "fill") ? (
        <InspectorSection className={INSPECTOR_SECTION_GAP_CLASS} dataSlot="layer-shape-fill-mode">
          <p className={cn("mb-2", INSPECTOR_SECTION_HEADING_CLASS)}>Fill mode</p>
          <SegmentTabs
            items={["solid", "gradient", "image", "none"]}
            value={fillMode}
            onChange={(mode) => onPatch({ fillMode: mode as DraftingShapeFillMode })}
          />

          {fillMode === "image" ? (
            <div className={cn("mt-2.5 space-y-2", INSPECTOR_SECTION_GAP_CLASS)}>
              <InspectorTextInput
                aria-label="Shape fill image URL"
                placeholder="https://example.com/texture.png"
                value={layer.imageSource === "url" ? (layer.imageValue ?? "") : ""}
                onChange={(event) =>
                  onPatch({
                    imageSource: event.currentTarget.value ? "url" : "none",
                    imageValue: event.currentTarget.value || undefined,
                  })
                }
              />
              <FileUpload
                acceptedFileTypes={["image/*"]}
                className="mx-0 max-w-full"
                onUploadError={() => undefined}
                onUploadSuccess={(file) => {
                  onPatch({
                    imageSource: "upload",
                    imageValue: URL.createObjectURL(file),
                  });
                }}
                uploadDelay={0}
              />
            </div>
          ) : null}
        </InspectorSection>
      ) : null}

      {(fillMode === "solid" || fillMode === "gradient") && showsCategory(category, "fill") ? (
        <InspectorSection className={INSPECTOR_SECTION_GAP_CLASS} dataSlot="layer-shape-fill">
          <p className={INSPECTOR_SECTION_HEADING_CLASS}>Fill</p>
          <SettingsFillPopover
            hint="Fill color"
            solidOnly={fillMode === "solid"}
            title="Fill color"
            value={getShapeLayerFillCssValue(layer)}
            onValueChange={(fill, css) => onPatch(patchShapeLayerFillFromPicker(layer, fill, css))}
          />
        </InspectorSection>
      ) : null}
    </>
  );
}

function LayerImageInspector({
  category,
  layer,
  onPatch,
}: {
  category?: LayerStyleCategory;
  layer: DraftingCanvasLayer;
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void;
}) {
  const isIllustration = isDraftingIllustrationLayer(layer);

  if (!showsCategory(category, "image")) {
    return null;
  }

  return (
    <InspectorSection className={INSPECTOR_SECTION_GAP_CLASS} dataSlot="layer-image-inspector">
      {isIllustration ? (
        <div className={INSPECTOR_SECTION_GAP_CLASS}>
          <p className={cn("mb-3", INSPECTOR_SECTION_HEADING_CLASS)}>Color</p>
          <IllustrationInspectorColorSection layer={layer} onPatch={onPatch} />
        </div>
      ) : (
        <>
          <InspectorLabel>Source</InspectorLabel>
          <InspectorTextInput
            aria-label="Image URL"
            placeholder="https://example.com/photo.png"
            value={layer.imageSource === "url" ? (layer.imageValue ?? "") : ""}
            onChange={(event) =>
              onPatch({
                imageSource: event.currentTarget.value ? "url" : "none",
                imageValue: event.currentTarget.value || undefined,
              })
            }
          />
          <div className={INSPECTOR_SECTION_GAP_CLASS}>
            <FileUpload
              acceptedFileTypes={["image/*"]}
              className="mx-0 max-w-full"
              onUploadError={() => undefined}
              onUploadSuccess={(file) => {
                onPatch({
                  imageSource: "upload",
                  imageValue: URL.createObjectURL(file),
                });
              }}
              uploadDelay={0}
            />
          </div>
        </>
      )}

      <div className={INSPECTOR_SECTION_GAP_CLASS}>
        <p className={cn("mb-2", INSPECTOR_SECTION_HEADING_CLASS)}>Image fit</p>
        <SegmentTabs
          items={["cover", "contain"]}
          value={layer.imageFit ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageFit}
          onChange={(imageFit) => onPatch({ imageFit: imageFit as "cover" | "contain" })}
        />
      </div>
    </InspectorSection>
  );
}

function LayerShaderInspector({
  category,
  layer,
  onPatch,
}: {
  category?: LayerStyleCategory;
  layer: DraftingCanvasLayer;
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void;
}) {
  const paperShader = layer.paperShader ?? createDefaultDraftingCardPaperShader();

  return (
    <>
      {showsCategory(category, "shader") ? (
        <InspectorSection className={INSPECTOR_SECTION_GAP_CLASS}>
          <p className={INSPECTOR_SECTION_HEADING_CLASS}>Shader</p>
          <PaperShaderOptionGrid
            selectedShaderId={paperShader.shaderId}
            variant="inspector"
            onSelect={(shaderId) =>
              onPatch({ paperShader: createDefaultDraftingCardPaperShader(shaderId) })
            }
          />
        </InspectorSection>
      ) : null}
      {showsCategory(category, "options") ? (
        <div className="min-w-0 px-3 pb-3">
          <SettingsPaperShaderControls
            paperShader={paperShader}
            onPaperShaderChange={(nextPaperShader) => onPatch({ paperShader: nextPaperShader })}
          />
        </div>
      ) : null}
    </>
  );
}
