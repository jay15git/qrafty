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
  formatPaperShaderNumberValue,
  formatPaperShaderParamLabel,
  getPaperShaderDefinition,
  paperShaderHasPlayback,
  type PaperShaderControlDefinition,
  type PaperShaderEnumControl,
  type PaperShaderParamValue,
} from "@/features/workspace/rendering/paper-shaders"
import { cn } from "@/lib/utils"

import { DesktopInspectorElasticSliderRow } from "@/features/desktop-shell/components/DesktopInspectorShell"
import { PaletteColorStopList } from "@/features/desktop-shell/inspector/palette-color-stop-list"
import {
  DesktopInspectorSettingsPopover,
  PresetList,
  SettingsFillPopover,
  SettingsPrimaryButton,
  SettingsRowPopover,
  SettingsSlider,
  SettingsSwitchRow,
} from "@/features/desktop-shell/inspector/settings-ui"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"

import { ScrollArea } from "@/components/ui/scroll-area"

const PAPER_SHADER_COLOR_FALLBACK = "#000000"
const PAPER_SHADER_NEW_COLOR = "#ffffff"
const HORIZONTAL_OPTION_ROW = "dn-preview-row"
const SECTION_GAP = "dn-section-stack"
const DESKTOP_SHADER_LIST_GAP = "flex flex-col gap-2.5"

type PaperShaderSettingsSurface = "settings" | "desktop"

function ShaderSettingsPopover({
  children,
  contentClassName,
  hint,
  leading,
  surface,
  title,
  trigger,
}: {
  children: React.ReactNode
  contentClassName?: string
  hint?: string
  leading?: React.ReactNode
  surface: PaperShaderSettingsSurface
  title?: string
  trigger: React.ReactNode
}) {
  if (surface === "desktop") {
    return (
      <DesktopInspectorSettingsPopover
        contentClassName={contentClassName}
        dataSlot="desktop-shader-settings-popover"
        hint={hint}
        leading={leading}
        title={title}
        trigger={trigger}
      >
        {children}
      </DesktopInspectorSettingsPopover>
    )
  }

  return (
    <SettingsRowPopover
      contentClassName={contentClassName}
      hint={hint}
      leading={leading}
      title={title}
      trigger={trigger}
    >
      {children}
    </SettingsRowPopover>
  )
}

function ShaderSettingsSlider({
  label,
  max,
  min,
  onChange,
  paramKey,
  step = 1,
  surface,
  value,
  valueLabel,
}: {
  label: string
  max: number
  min: number
  onChange?: (value: number) => void
  paramKey?: string
  step?: number
  surface: PaperShaderSettingsSurface
  value: number
  valueLabel?: string
}) {
  if (surface === "desktop") {
    return (
      <DesktopInspectorElasticSliderRow
        label={label}
        max={max}
        min={min}
        step={step}
        value={value}
        valueLabel={valueLabel ?? formatPaperShaderNumberValue(paramKey ?? label, value)}
        onChange={onChange ?? (() => undefined)}
      />
    )
  }

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
      {label ? <span className="dn-type-label">{label}</span> : null}
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

function PaperShaderColorsSwatch({ colors }: { colors: string[] }) {
  return (
    <span
      aria-hidden
      className="grid size-[length:var(--dn-icon-hit)] grid-cols-2 gap-px overflow-hidden dn-squircle-xs border border-[color-mix(in_srgb,var(--dn-line)_40%,transparent)]"
    >
      {colors.slice(0, 4).map((color, index) => (
        <span
          key={`${color}-${index}`}
          className="size-full min-h-0 min-w-0"
          style={{
            backgroundColor: isPaperShaderHexColor(color)
              ? color
              : PAPER_SHADER_COLOR_FALLBACK,
          }}
        />
      ))}
    </span>
  )
}

function PaperShaderColorsControl({
  colors,
  maxColorCount,
  onChange,
  surface,
}: {
  colors: string[]
  maxColorCount?: number
  onChange: (colors: string[]) => void
  surface: PaperShaderSettingsSurface
}) {
  const maxCount = maxColorCount ?? DEFAULT_PAPER_SHADER_MAX_COLOR_COUNT
  const minCount = DEFAULT_PAPER_SHADER_MIN_COLOR_COUNT

  return (
    <ShaderSettingsPopover
      contentClassName="w-[19rem]"
      hint={`${colors.length}`}
      leading={<PaperShaderColorsSwatch colors={colors} />}
      surface={surface}
      title="Colors"
      trigger="Colors"
    >
      <PaletteColorStopList
        colors={colors}
        maxCount={maxCount}
        minCount={minCount}
        onAdd={() => {
          const next = addPaperShaderColor(colors, maxCount, PAPER_SHADER_NEW_COLOR)
          if (next) {
            onChange(next)
          }
        }}
        onPaletteColorChange={(index, color) => {
          const next = [...colors]
          next[index] = color
          onChange(next)
        }}
        onRemove={(index) => {
          const next = removePaperShaderColor(colors, index, minCount)
          if (next) {
            onChange(next)
          }
        }}
      />
    </ShaderSettingsPopover>
  )
}

function DesktopNewPaperShaderParamControl({
  control,
  surface,
  value,
  onChange,
}: {
  control: PaperShaderControlDefinition
  surface: PaperShaderSettingsSurface
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
        paramKey={control.key}
        step={step}
        surface={surface}
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
  surface = "desktop",
}: {
  paperShader: DraftingCardPaperShaderState
  onPaperShaderChange: (paperShader: DraftingCardPaperShaderState) => void
  surface?: PaperShaderSettingsSurface
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

  const settingsListClassName =
    surface === "desktop" ? DESKTOP_SHADER_LIST_GAP : "dn-section-stack"

  const settingsPopover = (
    <ShaderSettingsPopover
      contentClassName="w-[19rem]"
      hint="Settings"
      surface={surface}
      title="Shader settings"
      trigger="Options"
    >
      <div className={settingsListClassName}>
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
            surface={surface}
            value={Math.round(paperShader.speed * 100)}
            valueLabel={`${Math.round(paperShader.speed * 100)}`}
            onChange={(value) => updatePaperShader({ speed: value / 100 })}
          />
        ) : null}

        {colorsControl && Array.isArray(paperShader.params[colorsControl.key]) ? (
          <PaperShaderColorsControl
            colors={paperShader.params[colorsControl.key] as string[]}
            maxColorCount={definition.maxColorCount}
            surface={surface}
            onChange={(nextColors) => updateParam(colorsControl.key, nextColors)}
          />
        ) : null}

        {namedColorControls.map((control) => (
          <DesktopNewPaperShaderParamControl
            key={control.key}
            control={control}
            surface={surface}
            value={paperShader.params[control.key]}
            onChange={(nextValue) => updateParam(control.key, nextValue as PaperShaderParamValue)}
          />
        ))}

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
            paramKey="frame"
            step={1}
            surface={surface}
            value={Math.round(paperShader.frame)}
            onChange={(frame) => updatePaperShader({ frame })}
          />
        ) : null}

        {advancedControls.map((control) => (
          <DesktopNewPaperShaderParamControl
            key={control.key}
            control={control}
            surface={surface}
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
    </ShaderSettingsPopover>
  )

  if (!hasPresetOptions) {
    return settingsPopover
  }

  return (
    <div className={SECTION_GAP}>
      <HorizontalShaderOptionRow
        persistKey={`paper-shader-presets:${paperShader.shaderId}`}
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
