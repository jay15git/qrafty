"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import FileUpload from "@/components/vendor/kokonutui/file-upload";
import {
  SETTINGS_CONTROL_CLASS,
  SETTINGS_CONTROL_HEIGHT_COMPACT_CLASS,
  SETTINGS_RADIUS_CLASS,
  SETTINGS_SECTION_GAP_CLASS,
  SETTINGS_SECTION_HEADING_CLASS,
  SETTINGS_SELECTED_CLASS,
  SETTINGS_TYPE_VALUE_CLASS,
} from "@/features/shell/components/settings-tokens";
import {
  SettingsLabel,
  SettingsSection,
  SettingsTextarea,
  SettingsTextInput,
  SettingsScrubbableNumberInput,
} from "@/features/shell/components/SettingsControls";
import {
  settingsOptionGridItemClass,
  settingsOptionStackClass,
} from "@/features/shell/settings/SettingsOptionGrid.classes";
import {
  SegmentTabs,
  SettingsFillPopover,
  SettingsSlider,
} from "@/features/shell/settings/settings-ui";
import {
  getShapeLayerFillCssValue,
  getTextLayerFillCssValue,
  patchShapeLayerFillFromPicker,
  patchTextLayerFillFromPicker,
} from "@/features/canvas/rendering/layer-fill";
import {
  SettingsSliderRow,
  SettingsNumberField,
  SettingsScrollArea,
  SettingsValueGrid,
} from "@/features/shell/components/SettingsRows";
import {
  getFontWeightSliderStep,
  getLayerFontWeight,
  getNearestFontWeight,
} from "@/features/shell/model/font-weight";
import { EffectsAccordion } from "@/features/shell/components/EffectsAccordion";
import { ElementShapeOptionGrid } from "@/features/canvas/components/ElementShapeOptionGrid";
import { PaperShaderOptionGrid } from "@/features/canvas/components/PaperShaderOptionGrid";
import { SettingsPaperShaderControls } from "@/features/shell/settings/PaperShaderSettings";
import {
  DEFAULT_DRAFTING_IMAGE_LAYER,
  DEFAULT_DRAFTING_SHAPE_LAYER,
  DEFAULT_DRAFTING_TEXT_LAYER,
  type CanvasLayer,
  type CanvasShapeFillMode,
} from "@/features/canvas/model/layers/shared";
import { createDefaultCanvasCardPaperShader } from "@/features/canvas/model/card-state";
import {
  DRAFTING_FONT_CATEGORY_LABELS,
  getCanvasFontCssFamily,
  groupCanvasFonts,
  loadCanvasFont,
  loadCanvasFontPreview,
  resolveCanvasFont,
} from "@/features/canvas/model/fonts";
import type { CanvasFontCategory } from "@/features/canvas/model/font-catalog";
import { useFontPreviewObserver } from "@/features/shell/settings/use-font-preview-observer";
import { IllustrationSettingsColorSection } from "@/features/canvas/components/IllustrationColorControls";
import { isCanvasIllustrationLayer } from "@/features/canvas/model/layer-floating-settings";
import { cn } from "@/lib/utils";

/** Layer-style categories. Mobile renders one at a time behind a rail; desktop
 *  renders all of them (`category` undefined). */
export type LayerStyleCategory =
  "content" | "type" | "color" | "spacing" | "shape" | "fill" | "image" | "shader" | "options";

function showsCategory(active: LayerStyleCategory | undefined, id: LayerStyleCategory) {
  return active === undefined || active === id;
}

export function LayerStyleSettings({
  category,
  layer,
  onPatch,
}: {
  category?: LayerStyleCategory;
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
}) {
  return (
    <div data-slot="layer-style-settings" className="flex min-h-0 min-w-0 flex-1 flex-col">
      {layer.kind === "text" ? (
        <LayerTextSettings category={category} layer={layer} onPatch={onPatch} />
      ) : null}
      {layer.kind === "shape" ? (
        <LayerShapeSettings category={category} layer={layer} onPatch={onPatch} />
      ) : null}
      {layer.kind === "image" ? (
        <LayerImageSettings category={category} layer={layer} onPatch={onPatch} />
      ) : null}
      {layer.kind === "shader" ? (
        <LayerShaderSettings category={category} layer={layer} onPatch={onPatch} />
      ) : null}
    </div>
  );
}

export function ElementSettingsPanel({
  layer,
  onPatch,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
}) {
  return (
    <div data-slot="element-panel" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SettingsScrollArea>
        <LayerStyleSettings layer={layer} onPatch={onPatch} />
        <EffectsAccordion layer={layer} onPatch={onPatch} />
      </SettingsScrollArea>
    </div>
  );
}

export function TransformPanel({
  layer,
  onPatch,
}: {
  layer: CanvasLayer | null | undefined;
  onPatch: (patch: Partial<CanvasLayer>) => void;
}) {
  return (
    <div data-slot="transform-panel" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SettingsScrollArea>
        {layer ? (
          <TransformSection layer={layer} onPatch={onPatch} />
        ) : (
          <SettingsSection>
            <p className="ds-type-value text-center font-semibold text-[var(--fg-muted)]">
              Select a layer to edit position, size, and rotation.
            </p>
          </SettingsSection>
        )}
      </SettingsScrollArea>
    </div>
  );
}

function TransformValueGrid({
  layer,
  onPatch,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
}) {
  const lockAspect =
    layer.kind === "image" ||
    layer.kind === "shape" ||
    layer.kind === "shader" ||
    layer.kind === "qr";

  return (
    <SettingsValueGrid>
      <SettingsNumberField label="X" value={Math.round(layer.x)} onChange={(x) => onPatch({ x })} />
      <SettingsNumberField label="Y" value={Math.round(layer.y)} onChange={(y) => onPatch({ y })} />
      <SettingsNumberField
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
      <SettingsNumberField
        disabled={layer.kind === "qr" || lockAspect}
        label="H"
        min={1}
        value={Math.round(layer.height)}
        onChange={(height) => onPatch({ height })}
      />
    </SettingsValueGrid>
  );
}

function TransformSliders({
  flat,
  layer,
  onPatch,
}: {
  flat: boolean;
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
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
      <SettingsSliderRow
        label="Rotation"
        max={360}
        min={-360}
        value={Math.round(layer.rotation)}
        valueLabel={`${Math.round(layer.rotation)}°`}
        onChange={(rotation) => onPatch({ rotation })}
      />
      <SettingsSliderRow
        label="Horizontal tilt"
        max={60}
        min={-60}
        value={layer.tiltX ?? 0}
        valueLabel={`${Math.round(layer.tiltX ?? 0)}°`}
        onChange={(tiltX) => onPatch({ tiltX })}
      />
      <SettingsSliderRow
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
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
  variant?: "default" | "flat";
}) {
  const flat = variant === "flat";

  return (
    <SettingsSection className={flat ? "gap-2.5" : undefined} dataSlot="transform-section">
      {flat ? null : <SettingsLabel>Transform</SettingsLabel>}
      {flat ? null : <TransformValueGrid layer={layer} onPatch={onPatch} />}

      <div className={flat ? "grid gap-2" : SETTINGS_SECTION_GAP_CLASS}>
        <TransformSliders flat={flat} layer={layer} onPatch={onPatch} />
      </div>
    </SettingsSection>
  );
}

type TextFontOption = {
  family: string;
  id: string;
  label: string;
};

type TextFontGroup = {
  category: CanvasFontCategory;
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
          SETTINGS_CONTROL_HEIGHT_COMPACT_CLASS,
          "w-full min-w-0 shrink-0 px-2.5 text-left font-semibold",
          SETTINGS_TYPE_VALUE_CLASS,
          SETTINGS_CONTROL_CLASS,
        )}
        placeholder="Search fonts…"
        type="search"
        value={fontQuery}
        onChange={(event) => onFontQueryChange(event.currentTarget.value)}
      />
      <div
        id="layer-text-font-listbox"
        aria-label="Text font options"
        className={cn("max-h-56 overflow-y-auto pr-1", settingsOptionStackClass())}
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
                  SETTINGS_CONTROL_HEIGHT_COMPACT_CLASS,
                  SETTINGS_TYPE_VALUE_CLASS,
                  settingsOptionGridItemClass(),
                  SETTINGS_CONTROL_CLASS,
                  selectedFontId === font.id && SETTINGS_SELECTED_CLASS,
                )}
                role="option"
                style={{ fontFamily: getCanvasFontCssFamily({ fontId: font.id }) }}
                type="button"
                onClick={() => onSelectFont(font)}
                onPointerEnter={() => loadCanvasFontPreview(font.id)}
              >
                <span className="min-w-0 flex-1 truncate">{font.label}</span>
              </button>
            ))}
          </div>
        ))}
        {fontGroups.length === 0 ? (
          <p className="px-2.5 py-3 ds-type-meta text-center text-[var(--muted)]">
            No matching fonts
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LayerTextSettings({
  category,
  layer,
  onPatch,
}: {
  category?: LayerStyleCategory;
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
}) {
  const selectedFont = resolveCanvasFont({
    fontFamily: layer.fontFamily,
    fontId: layer.fontId,
  });
  const supportedWeights = selectedFont.weights;
  const fontWeight = getLayerFontWeight(layer.fontWeight, supportedWeights);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [fontQuery, setFontQuery] = useState("");
  const fontGroups = useMemo(() => groupCanvasFonts(fontQuery), [fontQuery]);
  const bindFontPreview = useFontPreviewObserver();

  useEffect(() => {
    void loadCanvasFont(selectedFont.id);
  }, [selectedFont.id]);

  function patchTextLayer(patch: Partial<CanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined });
  }

  return (
    <>
      {showsCategory(category, "content") ? (
        <SettingsSection className={SETTINGS_SECTION_GAP_CLASS} dataSlot="layer-text-content">
          <SettingsLabel>Content</SettingsLabel>
          <SettingsTextarea
            aria-label="Text layer content"
            className="min-h-16 py-2"
            value={layer.text ?? ""}
            onChange={(event) => patchTextLayer({ text: event.currentTarget.value })}
          />
        </SettingsSection>
      ) : null}

      {showsCategory(category, "type") ? (
        <SettingsSection className={SETTINGS_SECTION_GAP_CLASS} dataSlot="layer-text-settings">
          <p className={cn("mb-2", SETTINGS_SECTION_HEADING_CLASS)}>Typography</p>
          <div className="grid grid-cols-[1fr_var(--settings-preview-col)] gap-1.5">
            <div className="min-w-0" data-slot="layer-text-font-selector">
              <button
                aria-controls="layer-text-font-listbox"
                aria-expanded={fontMenuOpen}
                aria-haspopup="listbox"
                aria-label="Text font"
                className={cn(
                  SETTINGS_CONTROL_HEIGHT_COMPACT_CLASS,
                  "w-full min-w-0 items-center justify-between gap-[length:var(--space-inline)] px-2.5 text-left font-semibold",
                  SETTINGS_TYPE_VALUE_CLASS,
                  SETTINGS_CONTROL_CLASS,
                )}
                style={{ fontFamily: getCanvasFontCssFamily({ fontId: selectedFont.id }) }}
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
            <SettingsScrubbableNumberInput
              aria-label="Text font size"
              className={cn(
                SETTINGS_CONTROL_HEIGHT_COMPACT_CLASS,
                "px-2 font-semibold",
                SETTINGS_RADIUS_CLASS,
                SETTINGS_TYPE_VALUE_CLASS,
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
                void loadCanvasFont(font.id);
                patchTextLayer({ fontFamily: font.family, fontId: font.id });
                setFontMenuOpen(false);
                setFontQuery("");
              }}
            />
          ) : null}

          <SettingsSliderRow
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
        </SettingsSection>
      ) : null}

      {showsCategory(category, "color") ? (
        <SettingsSection className={SETTINGS_SECTION_GAP_CLASS} dataSlot="layer-text-color">
          <p className={cn("mb-3", SETTINGS_SECTION_HEADING_CLASS)}>Color</p>
          <SettingsFillPopover
            hint="Text fill"
            title="Text fill"
            value={getTextLayerFillCssValue(layer)}
            onValueChange={(fill, css) =>
              patchTextLayer(patchTextLayerFillFromPicker(layer, fill, css))
            }
          />
        </SettingsSection>
      ) : null}

      {showsCategory(category, "spacing") ? (
        <SettingsSection className={SETTINGS_SECTION_GAP_CLASS} dataSlot="layer-text-spacing">
          <p className={cn("mb-3", SETTINGS_SECTION_HEADING_CLASS)}>Spacing</p>
          <div className="grid gap-2">
            <SettingsSliderRow
              label="Letter spacing"
              max={200}
              min={-50}
              value={layer.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing}
              valueLabel={`${Math.round(layer.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing)} px`}
              onChange={(letterSpacing) => patchTextLayer({ letterSpacing })}
            />
            <SettingsSliderRow
              label="Line height"
              max={4}
              min={0.6}
              step={0.05}
              value={layer.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight}
              valueLabel={(layer.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight).toFixed(2)}
              onChange={(lineHeight) => patchTextLayer({ lineHeight })}
            />
          </div>
        </SettingsSection>
      ) : null}
    </>
  );
}

function LayerShapeSettings({
  category,
  layer,
  onPatch,
}: {
  category?: LayerStyleCategory;
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
}) {
  const shapeId = layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId;
  const fillMode = layer.fillMode ?? DEFAULT_DRAFTING_SHAPE_LAYER.fillMode;

  return (
    <>
      {showsCategory(category, "shape") ? (
        <SettingsSection
          className={SETTINGS_SECTION_GAP_CLASS}
          dataSlot="layer-shape-settings"
          resize
        >
          <SettingsLabel>Shape</SettingsLabel>
          <ElementShapeOptionGrid
            selectedShapeId={shapeId}
            variant="settings"
            onSelect={(nextShapeId) => onPatch({ shapeId: nextShapeId })}
          />
        </SettingsSection>
      ) : null}

      {showsCategory(category, "fill") ? (
        <SettingsSection className={SETTINGS_SECTION_GAP_CLASS} dataSlot="layer-shape-fill-mode">
          <p className={cn("mb-2", SETTINGS_SECTION_HEADING_CLASS)}>Fill mode</p>
          <SegmentTabs
            items={["solid", "gradient", "image", "none"]}
            value={fillMode}
            onChange={(mode) => onPatch({ fillMode: mode as CanvasShapeFillMode })}
          />

          {fillMode === "image" ? (
            <div className={cn("mt-2.5 space-y-2", SETTINGS_SECTION_GAP_CLASS)}>
              <SettingsTextInput
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
        </SettingsSection>
      ) : null}

      {(fillMode === "solid" || fillMode === "gradient") && showsCategory(category, "fill") ? (
        <SettingsSection className={SETTINGS_SECTION_GAP_CLASS} dataSlot="layer-shape-fill">
          <p className={SETTINGS_SECTION_HEADING_CLASS}>Fill</p>
          <SettingsFillPopover
            hint="Fill color"
            solidOnly={fillMode === "solid"}
            title="Fill color"
            value={getShapeLayerFillCssValue(layer)}
            onValueChange={(fill, css) => onPatch(patchShapeLayerFillFromPicker(layer, fill, css))}
          />
        </SettingsSection>
      ) : null}
    </>
  );
}

function LayerImageSettings({
  category,
  layer,
  onPatch,
}: {
  category?: LayerStyleCategory;
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
}) {
  const isIllustration = isCanvasIllustrationLayer(layer);

  if (!showsCategory(category, "image")) {
    return null;
  }

  return (
    <SettingsSection className={SETTINGS_SECTION_GAP_CLASS} dataSlot="layer-image-settings">
      {isIllustration ? (
        <div className={SETTINGS_SECTION_GAP_CLASS}>
          <p className={cn("mb-3", SETTINGS_SECTION_HEADING_CLASS)}>Color</p>
          <IllustrationSettingsColorSection layer={layer} onPatch={onPatch} />
        </div>
      ) : (
        <>
          <SettingsLabel>Source</SettingsLabel>
          <SettingsTextInput
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
          <div className={SETTINGS_SECTION_GAP_CLASS}>
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

      <div className={SETTINGS_SECTION_GAP_CLASS}>
        <p className={cn("mb-2", SETTINGS_SECTION_HEADING_CLASS)}>Image fit</p>
        <SegmentTabs
          items={["cover", "contain"]}
          value={layer.imageFit ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageFit}
          onChange={(imageFit) => onPatch({ imageFit: imageFit as "cover" | "contain" })}
        />
      </div>
    </SettingsSection>
  );
}

function LayerShaderSettings({
  category,
  layer,
  onPatch,
}: {
  category?: LayerStyleCategory;
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
}) {
  const paperShader = layer.paperShader ?? createDefaultCanvasCardPaperShader();

  return (
    <>
      {showsCategory(category, "shader") ? (
        <SettingsSection className={SETTINGS_SECTION_GAP_CLASS}>
          <p className={SETTINGS_SECTION_HEADING_CLASS}>Shader</p>
          <PaperShaderOptionGrid
            selectedShaderId={paperShader.shaderId}
            variant="settings"
            onSelect={(shaderId) =>
              onPatch({ paperShader: createDefaultCanvasCardPaperShader(shaderId) })
            }
          />
        </SettingsSection>
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
