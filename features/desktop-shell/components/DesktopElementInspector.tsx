"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ChevronDownIcon,
  ItalicIcon,
  UnderlineIcon,
} from "lucide-react"

import FileUpload from "@/components/vendor/kokonutui/file-upload"
import {
  DESKTOP_INSPECTOR_CONTROL_CLASS,
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
  DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
  DESKTOP_INSPECTOR_SELECTED_CLASS,
  DesktopInspectorLabel,
  DesktopInspectorSection,
  DesktopInspectorSegmentedControl,
  DesktopInspectorTextarea,
  DesktopInspectorTextInput,
  DesktopInspectorScrubbableNumberInput,
  desktopInspectorOptionGridClass,
  desktopInspectorOptionGridItemClass,
  desktopInspectorOptionStackClass,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  SettingsFillPopover,
} from "@/features/desktop-shell/inspector/settings-ui"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker"
import {
  DesktopInspectorElasticSliderRow,
  DesktopInspectorNumberField,
  DesktopInspectorScrollArea,
  DesktopInspectorValueGrid,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import {
  getDesktopFontWeightSliderStep,
  getDesktopLayerFontWeight,
  getNearestDesktopFontWeight,
} from "@/features/desktop-shell/model/font-weight"
import { DesktopEffectsAccordion } from "@/features/desktop-shell/components/DesktopEffectsAccordion"
import { ElementShapeOptionGrid } from "@/features/workspace/components/ElementShapeOptionGrid"
import { PaperShaderOptionGrid } from "@/features/workspace/components/PaperShaderOptionGrid"
import {
  SettingsPaperShaderControls,
} from "@/features/desktop-shell/inspector/desktopnew-paper-shader-settings"
import {
  DEFAULT_DRAFTING_IMAGE_LAYER,
  DEFAULT_DRAFTING_SHAPE_LAYER,
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
  type DraftingShapeFillMode,
  type DraftingTextAlign,
} from "@/features/workspace/model/layers"
import { createDefaultDraftingCardPaperShader } from "@/features/workspace/model/card-state"
import {
  DRAFTING_FONT_REGISTRY,
  getDraftingFontCssFamily,
  loadDraftingFont,
  resolveDraftingFont,
} from "@/features/workspace/model/fonts"
import { cn } from "@/lib/utils"

const DESKTOP_TEXT_ALIGN_OPTIONS: Array<{ label: string; value: DraftingTextAlign }> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
]

export function DesktopElementInspector({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  return (
    <div
      data-slot="desktop-element-inspector"
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <DesktopInspectorScrollArea>
        {layer.kind === "text" ? (
          <DesktopLayerTextInspector layer={layer} onPatch={onPatch} />
        ) : null}
        {layer.kind === "shape" ? (
          <DesktopLayerShapeInspector layer={layer} onPatch={onPatch} />
        ) : null}
        {layer.kind === "image" ? (
          <DesktopLayerImageInspector layer={layer} onPatch={onPatch} />
        ) : null}
        {layer.kind === "shader" ? (
          <DesktopLayerShaderInspector layer={layer} onPatch={onPatch} />
        ) : null}
        <DesktopEffectsAccordion layer={layer} onPatch={onPatch} />
      </DesktopInspectorScrollArea>
    </div>
  )
}

export function DesktopTransformInspector({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer | null | undefined
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  return (
    <div
      data-slot="desktop-transform-inspector"
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <DesktopInspectorScrollArea>
        {layer ? (
          <DesktopTransformSection layer={layer} onPatch={onPatch} />
        ) : (
          <DesktopInspectorSection>
            <p className="text-center text-[12px] font-semibold text-[var(--desktop-inspector-fg-muted)]">
              Select a layer to edit position, size, and rotation.
            </p>
          </DesktopInspectorSection>
        )}
      </DesktopInspectorScrollArea>
    </div>
  )
}

export function DesktopTransformSection({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const lockAspect = layer.kind === "image" || layer.kind === "shape" || layer.kind === "shader" || layer.kind === "qr"

  return (
    <DesktopInspectorSection dataSlot="desktop-transform-section">
      <DesktopInspectorLabel>Transform</DesktopInspectorLabel>
      <DesktopInspectorValueGrid>
        <DesktopInspectorNumberField
          label="X"
          value={Math.round(layer.x)}
          onChange={(x) => onPatch({ x })}
        />
        <DesktopInspectorNumberField
          label="Y"
          value={Math.round(layer.y)}
          onChange={(y) => onPatch({ y })}
        />
        <DesktopInspectorNumberField
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
        <DesktopInspectorNumberField
          disabled={layer.kind === "qr" || lockAspect}
          label="H"
          min={1}
          value={Math.round(layer.height)}
          onChange={(height) => onPatch({ height })}
        />
      </DesktopInspectorValueGrid>

      <div className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
        <DesktopInspectorElasticSliderRow
          label="Rotation"
          max={360}
          min={-360}
          value={Math.round(layer.rotation)}
          valueLabel={`${Math.round(layer.rotation)}°`}
          onChange={(rotation) => onPatch({ rotation })}
        />
      </div>

      <div className={cn("mt-2 grid gap-2", DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
        <DesktopInspectorElasticSliderRow
          label="Horizontal tilt"
          max={60}
          min={-60}
          value={layer.tiltX ?? 0}
          valueLabel={`${Math.round(layer.tiltX ?? 0)}°`}
          onChange={(tiltX) => onPatch({ tiltX })}
        />
        <DesktopInspectorElasticSliderRow
          label="Vertical tilt"
          max={60}
          min={-60}
          value={layer.tiltY ?? 0}
          valueLabel={`${Math.round(layer.tiltY ?? 0)}°`}
          onChange={(tiltY) => onPatch({ tiltY })}
        />
      </div>
    </DesktopInspectorSection>
  )
}

function DesktopLayerTextInspector({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const selectedFont = resolveDraftingFont({
    fontFamily: layer.fontFamily,
    fontId: layer.fontId,
  })
  const supportedWeights = selectedFont.weights
  const fontWeight = getDesktopLayerFontWeight(layer.fontWeight, supportedWeights)
  const [fontMenuOpen, setFontMenuOpen] = useState(false)

  useEffect(() => {
    void loadDraftingFont(selectedFont.id)
  }, [selectedFont.id])

  function patchTextLayer(patch: Partial<DraftingCanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined })
  }

  return (
    <>
      <DesktopInspectorSection
        className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}
        dataSlot="desktop-layer-text-content"
      >
        <DesktopInspectorLabel>Content</DesktopInspectorLabel>
        <DesktopInspectorTextarea
          aria-label="Text layer content"
          className="min-h-16 py-2"
          value={layer.text ?? ""}
          onChange={(event) => patchTextLayer({ text: event.currentTarget.value })}
        />
      </DesktopInspectorSection>

      <DesktopInspectorSection
        className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}
        dataSlot="desktop-layer-text-inspector"
      >
        <p className={cn("mb-2", DESKTOP_INSPECTOR_SECTION_HEADING_CLASS)}>Typography</p>
        <div className="grid grid-cols-[1fr_4.75rem] gap-1.5">
          <div className="min-w-0" data-slot="desktop-layer-text-font-selector">
            <button
              aria-controls="desktop-layer-text-font-listbox"
              aria-expanded={fontMenuOpen}
              aria-haspopup="listbox"
              aria-label="Text font"
              className={cn(
                "flex h-8 w-full min-w-0 items-center justify-between gap-2 px-2.5 text-left text-[12px] font-semibold",
                DESKTOP_INSPECTOR_CONTROL_CLASS,
              )}
              style={{ fontFamily: getDraftingFontCssFamily({ fontId: selectedFont.id }) }}
              type="button"
              onClick={() => setFontMenuOpen((open) => !open)}
            >
              <span className="min-w-0 flex-1 truncate">{selectedFont.label}</span>
              <ChevronDownIcon
                className={cn("size-3.5 shrink-0 text-current transition-transform", fontMenuOpen && "rotate-180")}
              />
            </button>
          </div>
          <DesktopInspectorScrubbableNumberInput
            aria-label="Text font size"
            className="h-8 rounded-[6px] px-2 text-[12px] font-semibold"
            max={300}
            min={6}
            value={layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize}
            onValueChange={(fontSize) => patchTextLayer({ fontSize })}
          />
        </div>
        {fontMenuOpen ? (
          <div
            id="desktop-layer-text-font-listbox"
            aria-label="Text font options"
            className={cn("mt-2 max-h-40 overflow-y-auto pr-1", desktopInspectorOptionStackClass())}
            data-slot="desktop-layer-text-font-listbox"
            role="listbox"
          >
            {DRAFTING_FONT_REGISTRY.map((font) => (
              <button
                key={font.id}
                aria-label={`Use ${font.label} text font`}
                aria-selected={selectedFont.id === font.id}
                className={cn(
                  "flex h-8 min-w-0 items-center px-2.5 text-left text-[12px] font-semibold",
                  desktopInspectorOptionGridItemClass(),
                  DESKTOP_INSPECTOR_CONTROL_CLASS,
                  selectedFont.id === font.id && DESKTOP_INSPECTOR_SELECTED_CLASS,
                )}
                role="option"
                style={{ fontFamily: getDraftingFontCssFamily({ fontId: font.id }) }}
                type="button"
                onClick={() => {
                  void loadDraftingFont(font.id)
                  patchTextLayer({ fontFamily: font.family, fontId: font.id })
                  setFontMenuOpen(false)
                }}
              >
                <span className="min-w-0 flex-1 truncate">{font.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        <DesktopInspectorElasticSliderRow
          label="Weight"
          max={Math.max(...supportedWeights)}
          min={Math.min(...supportedWeights)}
          step={getDesktopFontWeightSliderStep(supportedWeights)}
          value={fontWeight}
          valueLabel={String(Math.round(fontWeight))}
          onChange={(nextWeight) =>
            patchTextLayer({
              fontWeight: getNearestDesktopFontWeight(nextWeight, supportedWeights),
            })
          }
        />

        <div className={cn("mt-2", desktopInspectorOptionGridClass(3))} data-slot="desktop-layer-text-emphasis">
          <DesktopIconToggleButton
            active={fontWeight >= 700}
            icon={<BoldIcon className="size-3.5" />}
            label="Bold"
            onClick={() =>
              patchTextLayer({
                fontWeight:
                  fontWeight >= 700
                    ? getNearestDesktopFontWeight(400, supportedWeights)
                    : getNearestDesktopFontWeight(700, supportedWeights),
              })
            }
          />
          <DesktopIconToggleButton
            active={(layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle) === "italic"}
            icon={<ItalicIcon className="size-3.5" />}
            label="Italic"
            onClick={() =>
              patchTextLayer({
                fontStyle:
                  (layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle) === "italic"
                    ? "normal"
                    : "italic",
              })
            }
          />
          <DesktopIconToggleButton
            active={Boolean(layer.underline)}
            icon={<UnderlineIcon className="size-3.5" />}
            label="Underline"
            onClick={() => patchTextLayer({ underline: !layer.underline })}
          />
        </div>
      </DesktopInspectorSection>

      <DesktopInspectorSection
        className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}
        dataSlot="desktop-layer-text-color"
      >
        <p className={cn("mb-3", DESKTOP_INSPECTOR_SECTION_HEADING_CLASS)}>Color</p>
        <SettingsFillPopover
          hint="Text fill"
          solidOnly
          title="Text fill"
          value={layer.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill}
          onValueChange={(_fill, css) => patchTextLayer({ fill: fillPreviewHex(css) })}
        />
      </DesktopInspectorSection>

      <DesktopInspectorSection
        className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}
        dataSlot="desktop-layer-text-alignment"
      >
        <p className={cn("mb-3", DESKTOP_INSPECTOR_SECTION_HEADING_CLASS)}>Alignment</p>
        <div className={desktopInspectorOptionGridClass(3)}>
          {DESKTOP_TEXT_ALIGN_OPTIONS.map((option) => (
            <button
              key={option.value}
              aria-label={`Align text ${option.value}`}
              aria-pressed={(layer.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign) === option.value}
              className={cn(
                "h-8 px-2 text-[11px] font-semibold",
                desktopInspectorOptionGridItemClass(),
                DESKTOP_INSPECTOR_CONTROL_CLASS,
                (layer.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign) === option.value &&
                  DESKTOP_INSPECTOR_SELECTED_CLASS,
              )}
              type="button"
              onClick={() => patchTextLayer({ textAlign: option.value })}
            >
              <DesktopTextAlignIcon value={option.value} />
            </button>
          ))}
        </div>
      </DesktopInspectorSection>

      <DesktopInspectorSection
        className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}
        dataSlot="desktop-layer-text-spacing"
      >
        <p className={cn("mb-3", DESKTOP_INSPECTOR_SECTION_HEADING_CLASS)}>Spacing</p>
        <div className="grid gap-2">
          <DesktopInspectorElasticSliderRow
            label="Letter spacing"
            max={200}
            min={-50}
            value={layer.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing}
            valueLabel={`${Math.round(layer.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing)} px`}
            onChange={(letterSpacing) => patchTextLayer({ letterSpacing })}
          />
          <DesktopInspectorElasticSliderRow
            label="Line height"
            max={4}
            min={0.6}
            step={0.05}
            value={layer.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight}
            valueLabel={(layer.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight).toFixed(2)}
            onChange={(lineHeight) => patchTextLayer({ lineHeight })}
          />
        </div>
      </DesktopInspectorSection>
    </>
  )
}

function DesktopLayerShapeInspector({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const shapeId = layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId
  const fillMode = layer.fillMode ?? DEFAULT_DRAFTING_SHAPE_LAYER.fillMode

  return (
    <>
      <DesktopInspectorSection
        className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}
        dataSlot="desktop-layer-shape-inspector"
        resize
      >
        <DesktopInspectorLabel>Shape</DesktopInspectorLabel>
        <ElementShapeOptionGrid
          selectedShapeId={shapeId}
          variant="inspector"
          onSelect={(nextShapeId) => onPatch({ shapeId: nextShapeId })}
        />
      </DesktopInspectorSection>

      <DesktopInspectorSection
        className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}
        dataSlot="desktop-layer-shape-fill-mode"
      >
        <p className={cn("mb-2", DESKTOP_INSPECTOR_SECTION_HEADING_CLASS)}>Fill mode</p>
        <DesktopInspectorSegmentedControl
          columns={4}
          itemClassName="h-8 px-1 text-[10px] capitalize"
          items={(["solid", "gradient", "image", "none"] as const).map((mode) => ({
            label: mode,
            value: mode,
          }))}
          value={fillMode}
          onValueChange={(mode) => onPatch({ fillMode: mode as DraftingShapeFillMode })}
        />

        {fillMode === "image" ? (
          <div className={cn("mt-2.5 space-y-2", DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
            <DesktopInspectorTextInput
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
                })
              }}
              uploadDelay={0}
            />
          </div>
        ) : null}
      </DesktopInspectorSection>

      {fillMode === "solid" || fillMode === "gradient" ? (
        <DesktopInspectorSection
          className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}
          dataSlot="desktop-layer-shape-fill"
        >
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Fill</p>
          <SettingsFillPopover
            hint="Fill color"
            solidOnly={fillMode === "solid"}
            title="Fill color"
            value={layer.fill ?? DEFAULT_DRAFTING_SHAPE_LAYER.fill}
            onValueChange={(_fill, css) =>
              onPatch({
                fill: fillMode === "solid" ? fillPreviewHex(css) : css,
              })
            }
          />
        </DesktopInspectorSection>
      ) : null}
    </>
  )
}

function DesktopLayerImageInspector({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  return (
    <DesktopInspectorSection
      className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}
      dataSlot="desktop-layer-image-inspector"
    >
      <DesktopInspectorLabel>Source</DesktopInspectorLabel>
      <DesktopInspectorTextInput
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
      <div className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
        <FileUpload
          acceptedFileTypes={["image/*"]}
          className="mx-0 max-w-full"
          onUploadError={() => undefined}
          onUploadSuccess={(file) => {
            onPatch({
              imageSource: "upload",
              imageValue: URL.createObjectURL(file),
            })
          }}
          uploadDelay={0}
        />
      </div>

      <div className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
        <p className={cn("mb-2", DESKTOP_INSPECTOR_SECTION_HEADING_CLASS)}>Image fit</p>
        <DesktopInspectorSegmentedControl
          itemClassName="capitalize"
          items={[
            { label: "cover", value: "cover" },
            { label: "contain", value: "contain" },
          ]}
          value={layer.imageFit ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageFit}
          onValueChange={(imageFit) => onPatch({ imageFit })}
        />
      </div>

    </DesktopInspectorSection>
  )
}

function DesktopLayerShaderInspector({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const paperShader = layer.paperShader ?? createDefaultDraftingCardPaperShader()

  return (
    <>
      <DesktopInspectorSection className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
        <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Shader</p>
        <PaperShaderOptionGrid
          selectedShaderId={paperShader.shaderId}
          variant="inspector"
          onSelect={(shaderId) =>
            onPatch({ paperShader: createDefaultDraftingCardPaperShader(shaderId) })
          }
        />
      </DesktopInspectorSection>
      <div className="min-w-0 px-3 pb-3">
        <SettingsPaperShaderControls
          paperShader={paperShader}
          onPaperShaderChange={(nextPaperShader) => onPatch({ paperShader: nextPaperShader })}
        />
      </div>
    </>
  )
}

function DesktopIconToggleButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid h-8 place-items-center px-2 text-[11px] font-semibold",
        desktopInspectorOptionGridItemClass(),
        DESKTOP_INSPECTOR_CONTROL_CLASS,
        active && DESKTOP_INSPECTOR_SELECTED_CLASS,
      )}
      type="button"
      onClick={onClick}
    >
      {icon}
    </button>
  )
}

function DesktopTextAlignIcon({ value }: { value: DraftingTextAlign }) {
  if (value === "center") {
    return <AlignCenterIcon className="mx-auto size-3.5" />
  }

  if (value === "right") {
    return <AlignRightIcon className="mx-auto size-3.5" />
  }

  return <AlignLeftIcon className="mx-auto size-3.5" />
}
