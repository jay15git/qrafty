"use client"

import {
  applyDraftingCardPaperShaderPreset,
  DEFAULT_DRAFTING_PAPER_SHADER_IMAGE,
  type DraftingCardPaperShaderState,
} from "@/features/workspace/model/card-state"
import {
  addPaperShaderColor,
  DEFAULT_PAPER_SHADER_MAX_COLOR_COUNT,
  DEFAULT_PAPER_SHADER_MIN_COLOR_COUNT,
  removePaperShaderColor,
} from "@/features/workspace/rendering/paper-shader-colors"
import {
  formatPaperShaderParamLabel,
  getPaperShaderDefinition,
  paperShaderHasPlayback,
  type PaperShaderControlDefinition,
  type PaperShaderEnumControl,
  type PaperShaderParamValue,
} from "@/features/workspace/rendering/paper-shader-definitions"
import { cn } from "@/lib/utils"

import { PaperShaderColorGrid } from "@/features/desktop-shell/inspector/paper-shader-color-grid"
import {
  PresetList,
  SettingsFillPopover,
  SettingsLabeledSelect,
  SettingsPrimaryButton,
  SettingsRowPopover,
  SettingsSlider,
  SettingsSwitchRow,
} from "@/features/desktop-shell/inspector/settings-ui"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/fill-picker.utils"

import { ScrollArea } from "@/components/ui/scroll-area"

const PAPER_SHADER_COLOR_FALLBACK = "#000000"
const PAPER_SHADER_NEW_COLOR = "#ffffff"
const HORIZONTAL_OPTION_ROW = "dn-preview-row"
const SECTION_GAP = "dn-section-stack"

function ShaderSettingsSlider({
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
}: {
  label: string
  max: number
  min: number
  onChange?: (value: number) => void
  step?: number
  value: number
}) {
  return (
    <SettingsSlider
      label={label}
      max={max}
      min={min}
      step={step}
      value={value}
      onChange={onChange}
    />
  )
}

function HorizontalShaderOptionRow({
  label,
  items,
  persistKey,
  selected,
  onSelect,
}: {
  label?: string
  items: Array<{ value: string; label: string }>
  persistKey: string
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? <span className="dn-row-label-text">{label}</span> : null}
      <ScrollArea
        className="w-full min-w-0 max-w-full overflow-hidden"
        chevron={false}
        cueSize="tight"
        orientation="horizontal"
        persistKey={persistKey}
        scrollFade
        showScrollbar={false}
        viewportClassName="min-w-0"
      >
        <div className={HORIZONTAL_OPTION_ROW}>
          {items.map((item) => {
            const isSelected = selected === item.value

            return (
              <button
                key={item.value}
                aria-label={item.label}
                aria-pressed={isSelected}
                className={cn(
                  "dn-option-tile dn-control-surface shrink-0 px-3 dn-type-chip dn-squircle-xs",
                  isSelected && "text-[var(--dn-fg)]",
                )}
                type="button"
                onClick={() => onSelect(item.value)}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

function isPaperShaderHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

function DesktopNewPaperShaderParamControl({
  control,
  value,
  onChange,
}: {
  control: PaperShaderControlDefinition
  value: PaperShaderParamValue
  onChange: (value: DraftingCardPaperShaderState["image"] | PaperShaderParamValue) => void
}) {
  const label = formatPaperShaderParamLabel(control.key)

  if (control.type === "image") {
    return (
      <div className="flex flex-col gap-2">
        <SettingsPrimaryButton
          onClick={() =>
            onChange({
              source: "sample",
              value: DEFAULT_DRAFTING_PAPER_SHADER_IMAGE,
            })
          }
        >
          Use sample image
        </SettingsPrimaryButton>
        <label className="dn-settings-row dn-control-surface dn-squircle-sm inline-flex w-full cursor-pointer items-center justify-center px-3 dn-type-chip">
          Upload image
          <input
            accept="image/*"
            className="hidden"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              onChange({
                source: "upload",
                value: URL.createObjectURL(file),
              })
            }}
          />
        </label>
      </div>
    )
  }

  if (control.type === "boolean") {
    return (
      <SettingsSwitchRow
        checked={Boolean(value)}
        label={label}
        onChange={(checked) => onChange(checked)}
      />
    )
  }

  if (control.type === "number" && typeof value === "number") {
    const step = control.step ?? 0.01

    return (
      <ShaderSettingsSlider
        label={label}
        max={control.max}
        min={control.min}
        step={step}
        value={value}
        onChange={onChange}
      />
    )
  }

  if (control.type === "color" && typeof value === "string") {
    return (
      <SettingsFillPopover
        hint={label}
        solidOnly
        title={label}
        value={isPaperShaderHexColor(value) ? value : PAPER_SHADER_COLOR_FALLBACK}
        onValueChange={(_fill, css) => onChange(fillPreviewHex(css))}
      />
    )
  }

  if (control.type === "enum" && typeof value === "string") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="dn-row-label-text">{label}</span>
        <PresetList
          items={control.options.map((option) => formatPaperShaderParamLabel(option))}
          selected={formatPaperShaderParamLabel(value)}
          onSelect={(formatted) => {
            const option =
              control.options.find(
                (entry) => formatPaperShaderParamLabel(entry) === formatted,
              ) ?? value
            onChange(option)
          }}
        />
      </div>
    )
  }

  return null
}

function PaperShaderColorsGrid({
  colorsControl,
  maxColorCount,
  namedColorControls,
  paperShader,
  updateParam,
}: {
  colorsControl: PaperShaderControlDefinition | undefined
  maxColorCount: number
  namedColorControls: PaperShaderControlDefinition[]
  paperShader: DraftingCardPaperShaderState
  updateParam: (key: string, value: PaperShaderParamValue) => void
}) {
  const hasPaletteColors =
    colorsControl != null && Array.isArray(paperShader.params[colorsControl.key])
  const hasColorSettings = hasPaletteColors || namedColorControls.length > 0

  if (!hasColorSettings) {
    return null
  }

  const paletteColors = hasPaletteColors
    ? (paperShader.params[colorsControl!.key] as string[])
    : undefined

  return (
    <PaperShaderColorGrid
      colors={paletteColors}
      maxColorCount={maxColorCount}
      namedColorControls={namedColorControls}
      paperShaderParams={paperShader.params}
      showPalette={hasPaletteColors}
      onAddColor={
        hasPaletteColors
          ? () => {
              const next = addPaperShaderColor(
                paletteColors ?? [],
                maxColorCount,
                PAPER_SHADER_NEW_COLOR,
              )
              if (next && colorsControl) {
                updateParam(colorsControl.key, next)
              }
            }
          : undefined
      }
      onColorsChange={(nextColors) => {
        if (colorsControl) {
          updateParam(colorsControl.key, nextColors)
        }
      }}
      onNamedColorChange={(key, color) => updateParam(key, color)}
      onRemoveColor={(index) => {
        const next = removePaperShaderColor(
          paletteColors ?? [],
          index,
          DEFAULT_PAPER_SHADER_MIN_COLOR_COUNT,
        )
        if (next && colorsControl) {
          updateParam(colorsControl.key, next)
        }
      }}
    />
  )
}

function PaperShaderSettingsPopover({
  advancedControls,
  hasPlayback,
  paperShader,
  shapeControl,
  updatePaperShader,
  updateParam,
}: {
  advancedControls: PaperShaderControlDefinition[]
  hasPlayback: boolean
  paperShader: DraftingCardPaperShaderState
  shapeControl: PaperShaderEnumControl | undefined
  updatePaperShader: (patch: Partial<DraftingCardPaperShaderState>) => void
  updateParam: (key: string, value: PaperShaderParamValue) => void
}) {
  return (
    <SettingsRowPopover
      contentClassName="w-[19rem]"
      hint="Settings"
      title="Shader settings"
      trigger="Options"
    >
      <div className="dn-section-stack">
        {shapeControl ? (
          <HorizontalShaderOptionRow
            label="Shape"
            persistKey={`paper-shader-shape:${paperShader.shaderId}`}
            items={shapeControl.options.map((option) => ({
              value: option,
              label: formatPaperShaderParamLabel(option),
            }))}
            selected={
              typeof paperShader.params.shape === "string"
                ? paperShader.params.shape
                : shapeControl.options[0]
            }
            onSelect={(shape) => updateParam("shape", shape)}
          />
        ) : null}

        {hasPlayback ? (
          <ShaderSettingsSlider
            label="Speed"
            max={100}
            min={1}
            value={Math.round(paperShader.speed * 100)}
            onChange={(value) => updatePaperShader({ speed: value / 100 })}
          />
        ) : null}

        {hasPlayback ? (
          <SettingsSwitchRow
            checked={paperShader.paused}
            label="Pause"
            onChange={(paused) => updatePaperShader({ paused })}
          />
        ) : null}

        {hasPlayback ? (
          <ShaderSettingsSlider
            label="Frame"
            max={10000}
            min={0}
            step={1}
            value={Math.round(paperShader.frame)}
            onChange={(frame) => updatePaperShader({ frame })}
          />
        ) : null}

        {advancedControls.map((control) => (
          <DesktopNewPaperShaderParamControl
            key={control.key}
            control={control}
            value={paperShader.params[control.key]}
            onChange={(nextValue) => {
              if (control.type === "image") {
                updatePaperShader({
                  image: nextValue as DraftingCardPaperShaderState["image"],
                })
                return
              }

              updateParam(control.key, nextValue as PaperShaderParamValue)
            }}
          />
        ))}
      </div>
    </SettingsRowPopover>
  )
}

export function SettingsPaperShaderControls({
  paperShader,
  onPaperShaderChange,
}: {
  paperShader: DraftingCardPaperShaderState
  onPaperShaderChange: (paperShader: DraftingCardPaperShaderState) => void
}) {
  const definition = getPaperShaderDefinition(paperShader.shaderId)
  const hasPlayback = paperShaderHasPlayback(paperShader.shaderId)
  const selectedPreset =
    definition.presets.find((preset) => preset.name === paperShader.presetName) ??
    definition.presets[0]

  const shapeControl = definition.controls.find(
    (control): control is PaperShaderEnumControl =>
      control.type === "enum" && control.key === "shape",
  )

  const advancedControls = definition.controls.filter(
    (control) =>
      control.key !== "speed" &&
      control.key !== "shape" &&
      control.type !== "color" &&
      control.type !== "colors",
  )
  const colorsControl = definition.controls.find((control) => control.type === "colors")
  const namedColorControls = definition.controls.filter((control) => control.type === "color")

  const updatePaperShader = (patch: Partial<DraftingCardPaperShaderState>) => {
    onPaperShaderChange({
      ...paperShader,
      ...patch,
      image: patch.image ? { ...patch.image } : { ...paperShader.image },
      params: patch.params ? structuredClone(patch.params) : structuredClone(paperShader.params),
    })
  }

  const updateParam = (key: string, value: PaperShaderParamValue) => {
    updatePaperShader({
      params: {
        ...paperShader.params,
        [key]: value,
      },
    })
  }

  const hasPresetOptions = definition.presets.length > 0

  const colorsGrid = (
    <PaperShaderColorsGrid
      colorsControl={colorsControl}
      maxColorCount={definition.maxColorCount ?? DEFAULT_PAPER_SHADER_MAX_COLOR_COUNT}
      namedColorControls={namedColorControls}
      paperShader={paperShader}
      updateParam={updateParam}
    />
  )

  const settingsPopover = (
    <PaperShaderSettingsPopover
      advancedControls={advancedControls}
      hasPlayback={hasPlayback}
      paperShader={paperShader}
      shapeControl={shapeControl}
      updatePaperShader={updatePaperShader}
      updateParam={updateParam}
    />
  )

  if (!hasPresetOptions) {
    return (
      <div className={SECTION_GAP}>
        {colorsGrid}
        {settingsPopover}
      </div>
    )
  }

  return (
    <div className={SECTION_GAP}>
      <SettingsLabeledSelect
        items={definition.presets.map((preset) => preset.name)}
        label="Preset"
        placeholder="Preset"
        value={selectedPreset?.name ?? paperShader.presetName}
        onChange={(presetName) =>
          onPaperShaderChange(applyDraftingCardPaperShaderPreset(paperShader, presetName))
        }
      />
      {colorsGrid}
      {settingsPopover}
    </div>
  )
}
