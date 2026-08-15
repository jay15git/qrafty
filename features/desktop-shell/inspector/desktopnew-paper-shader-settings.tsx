"use client"

import { PlusIcon } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
  applyDraftingCardPaperShaderPreset,
  DEFAULT_DRAFTING_PAPER_SHADER_IMAGE,
  type DraftingCardPaperShaderState,
} from "@/features/workspace/model/card-state"
import {
  formatPaperShaderParamLabel,
  getPaperShaderDefinition,
  type PaperShaderControlDefinition,
  type PaperShaderEnumControl,
  type PaperShaderParamValue,
} from "@/features/workspace/rendering/paper-shaders"
import { cn } from "@/lib/utils"

import {
  PresetList,
  SettingsFillPopover,
  SettingsPrimaryButton,
  SettingsRowPopover,
  SettingsSlider,
  SettingsSwitchRow,
} from "@/features/desktop-shell/inspector/settings-ui"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"

const PAPER_SHADER_COLOR_FALLBACK = "#000000"
const PAPER_SHADER_NEW_COLOR = "#ffffff"
const HORIZONTAL_OPTION_ROW = "flex min-w-max gap-1.5 px-1 py-1.5"
const SECTION_GAP = "flex flex-col gap-2.5"

function HorizontalShaderOptionRow({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string
  items: Array<{ value: string; label: string }>
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="dn-type-label">{label}</span>
      <ScrollArea
        className="w-full min-w-0 max-w-full overflow-hidden"
        chevron={false}
        cueSize="tight"
        orientation="horizontal"
        scrollFade
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
                  "dn-option-tile h-9 shrink-0 px-3 text-[11px] font-medium tracking-tight dn-squircle-xs",
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
  maxColorCount,
  value,
  onChange,
}: {
  control: PaperShaderControlDefinition
  maxColorCount?: number
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
        <label className="dn-settings-row dn-pressable-press-only dn-squircle-sm inline-flex h-9 cursor-pointer items-center justify-center px-3 text-[11px] font-medium tracking-tight">
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
      <SettingsSlider
        label={label}
        max={control.max}
        min={control.min}
        step={step}
        value={value}
        onChange={onChange}
      />
    )
  }

  if (control.type === "colors" && Array.isArray(value)) {
    const colors = value as string[]

    return (
      <div className="flex flex-col gap-2">
        <span className="dn-type-label">{label}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {colors.map((color, index) => (
            <SettingsFillPopover
              key={`shader-color-${color}`}
              hint={`${index + 1}`}
              solidOnly
              value={isPaperShaderHexColor(color) ? color : PAPER_SHADER_COLOR_FALLBACK}
              onValueChange={(_fill, css) => {
                const nextColors = [...colors]
                nextColors[index] = fillPreviewHex(css)
                onChange(nextColors)
              }}
            />
          ))}
          <button
            aria-label={`Add ${label}`}
            className={cn(
              "dn-pressable-pickable grid size-8 place-items-center border border-dashed border-[color-mix(in_srgb,var(--dn-line)_55%,transparent)] dn-squircle-xs text-[var(--dn-muted)]",
              colors.length >= (maxColorCount ?? 10) && "cursor-not-allowed opacity-40",
            )}
            disabled={colors.length >= (maxColorCount ?? 10)}
            type="button"
            onClick={() => onChange([...colors, PAPER_SHADER_NEW_COLOR])}
          >
            <PlusIcon className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
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
        <span className="dn-type-label">{label}</span>
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

export function SettingsPaperShaderControls({
  paperShader,
  onPaperShaderChange,
}: {
  paperShader: DraftingCardPaperShaderState
  onPaperShaderChange: (paperShader: DraftingCardPaperShaderState) => void
}) {
  const definition = getPaperShaderDefinition(paperShader.shaderId)
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
  const colorControls = definition.controls.filter(
    (control) => control.type === "color" || control.type === "colors",
  )

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

  const settingsPopover = (
    <SettingsRowPopover
      contentClassName="w-[19rem]"
      hint="Settings"
      title="Shader settings"
      trigger="Options"
    >
      <div className="flex flex-col gap-2.5">
        {shapeControl ? (
          <HorizontalShaderOptionRow
            label="Shape"
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

        <SettingsSlider
          label="Speed"
          max={100}
          min={1}
          value={Math.round(paperShader.speed * 100)}
          onChange={(value) => updatePaperShader({ speed: value / 100 })}
        />

        {colorControls.map((control) => (
          <DesktopNewPaperShaderParamControl
            key={control.key}
            control={control}
            maxColorCount={definition.maxColorCount}
            value={paperShader.params[control.key]}
            onChange={(nextValue) => updateParam(control.key, nextValue as PaperShaderParamValue)}
          />
        ))}

        <SettingsSwitchRow
          checked={paperShader.paused}
          label="Pause"
          onChange={(paused) => updatePaperShader({ paused })}
        />

        <SettingsSlider
          label="Frame"
          max={10000}
          min={0}
          step={1}
          value={Math.round(paperShader.frame)}
          onChange={(frame) => updatePaperShader({ frame })}
        />

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

  if (!hasPresetOptions) {
    return settingsPopover
  }

  return (
    <div className={SECTION_GAP}>
      <HorizontalShaderOptionRow
        label="Preset"
        items={definition.presets.map((preset) => ({
          value: preset.name,
          label: preset.name,
        }))}
        selected={selectedPreset?.name ?? paperShader.presetName}
        onSelect={(presetName) =>
          onPaperShaderChange(applyDraftingCardPaperShaderPreset(paperShader, presetName))
        }
      />
      {settingsPopover}
    </div>
  )
}
