"use client"

import { useTheme } from "next-themes"
import { useState } from "react"

import { ColorPickerPopover } from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StylePreview, type StylePreviewKind } from "@/features/qr-code/components/StylePreview"
import {
  CORNER_DOT_STYLE_OPTIONS,
  CORNER_SQUARE_STYLE_OPTIONS,
  DOT_STYLE_OPTIONS,
} from "@/features/qr-code/styles/style-options"
import {
  QR_BACKGROUND_SHAPES,
  type QrBackgroundShapeId,
} from "@/features/qr-code/styles/background-shapes"
import { ShapeProvider } from "@/lib/shape-context"
import { cn } from "@/lib/utils"

import {
  IconGrid,
  OptionGrid,
  PresetList,
  SegmentTabs,
  SettingsAccordion,
  SettingsColorPopover,
  SettingsInput,
  SettingsPanelShell,
  SettingsPrimaryButton,
  SettingsRowPopover,
  SettingsScroll,
  SettingsSlider,
  SettingsSwitchRow,
} from "@/features/desktopnew/settings-ui"
import { PaperShaderOptionPreview } from "@/features/workspace/components/PaperShaderOptionPreview"
import {
  DEFAULT_PAPER_SHADER_ID,
  getAllPaperShaderDefinitions,
  type PaperShaderId,
} from "@/features/workspace/rendering/paper-shaders"

const SECTIONS = [
  "Content",
  "QR Style",
  "Colors",
  "Logo",
  "Shape",
  "Background",
  "Motion",
  "Export",
] as const

type SectionId = (typeof SECTIONS)[number]

function ContentSection() {
  const [selectedType, setSelectedType] = useState("Link")

  return (
    <div className="flex flex-col gap-3">
      <SettingsRowPopover hint="Type" title="Type" trigger={selectedType}>
        <Input className="mb-2 h-8 bg-muted/40 text-xs dn-squircle-xs" placeholder="Search" />
        <OptionGrid
          columns={3}
          items={[
            "Link",
            "Text",
            "WiFi",
            "Email",
            "Phone",
            "Instagram",
            "Spotify",
            "GitHub",
            "vCard",
          ]}
          selected={selectedType}
          onSelect={setSelectedType}
        />
      </SettingsRowPopover>
      <SettingsInput value="https://example.com" />
    </div>
  )
}

function QrStylePreviewGrid({
  options,
  previewKind,
  selected,
  onSelect,
}: {
  options: ReadonlyArray<{ label: string; value: string }>
  previewKind: StylePreviewKind
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      scrollFade
      viewportClassName="min-w-0 scroll-fade-x scroll-fade-8"
    >
      <div className="flex min-w-max gap-1.5 px-1.5 py-1.5">
        {options.map((option) => {
          const isSelected = selected === option.value

          return (
            <button
              key={option.value}
              aria-label={option.label}
              aria-pressed={isSelected}
              className={cn(
                "group relative size-14 shrink-0 p-0 text-center transition-shadow duration-200 ease-out dn-squircle-xs",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "focus-visible:ring-offset-background",
                isSelected && "ring-2 ring-foreground ring-offset-2 ring-offset-background shadow-sm",
              )}
              title={option.label}
              type="button"
              onClick={() => onSelect(option.value)}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-full place-items-center overflow-hidden p-0.5 dn-squircle-xs",
                  isSelected
                    ? "bg-transparent text-foreground"
                    : "bg-transparent text-foreground/70 group-hover:text-foreground",
              )}
            >
                <span className="grid size-[90%] place-items-center [&_svg]:size-full [&_svg]:text-current">
                  <StylePreview previewKind={previewKind} value={option.value} />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function QrStyleSection() {
  const [tab, setTab] = useState("Module")
  const [moduleShape, setModuleShape] = useState("rounded")
  const [eyeShape, setEyeShape] = useState("square")
  const [frameShape, setFrameShape] = useState("square")
  const part =
    tab === "Module"
      ? {
          setShape: setModuleShape,
          shape: moduleShape,
          options: DOT_STYLE_OPTIONS,
          previewKind: "dots" as const,
        }
      : tab === "Eye"
        ? {
            setShape: setEyeShape,
            shape: eyeShape,
            options: CORNER_DOT_STYLE_OPTIONS,
            previewKind: "corner-dot" as const,
          }
        : {
            setShape: setFrameShape,
            shape: frameShape,
            options: CORNER_SQUARE_STYLE_OPTIONS,
            previewKind: "corner-square" as const,
          }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden">
      <SegmentTabs items={["Module", "Eye", "Frame"]} value={tab} onChange={setTab} />
      <QrStylePreviewGrid
        options={part.options}
        previewKind={part.previewKind}
        selected={part.shape}
        onSelect={part.setShape}
      />
    </div>
  )
}

function ShapeTypePreviewRow({
  selected,
  onSelect,
}: {
  selected: QrBackgroundShapeId
  onSelect: (shapeId: QrBackgroundShapeId) => void
}) {
  const shapes = QR_BACKGROUND_SHAPES

  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      scrollFade
      viewportClassName="min-w-0 scroll-fade-x scroll-fade-8"
    >
      <div className="flex min-w-max gap-1.5 px-1.5 py-1.5">
        {shapes.map((option) => {
          const isSelected = selected === option.id

          return (
            <button
              key={option.id}
              aria-label={`Use ${option.label} shape`}
              aria-pressed={isSelected}
              className={cn(
                "group relative size-14 shrink-0 p-0 text-foreground/70 transition-shadow duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dn-squircle-xs",
                isSelected && "ring-2 ring-foreground ring-offset-2 ring-offset-background shadow-sm",
              )}
              title={option.label}
              type="button"
              onClick={() => onSelect(option.id)}
            >
              <span className="relative z-10 grid size-full place-items-center p-0.5 text-black dark:text-white">
                <svg
                  aria-hidden="true"
                  className="size-[90%] fill-current"
                  viewBox={`0 0 ${option.viewBox.width} ${option.viewBox.height}`}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d={option.path} />
                </svg>
              </span>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function PaperShaderPreviewRow({
  selected,
  onSelect,
}: {
  selected: PaperShaderId
  onSelect: (shaderId: PaperShaderId) => void
}) {
  const shaders = getAllPaperShaderDefinitions()

  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      scrollFade
      viewportClassName="min-w-0 scroll-fade-x scroll-fade-8"
    >
      <div className="flex min-w-max gap-1.5 px-1.5 py-1.5">
        {shaders.map((option) => {
          const isSelected = selected === option.id

          return (
            <button
              key={option.id}
              aria-label={`Use ${option.label} shader`}
              aria-pressed={isSelected}
              className={cn(
                "group relative size-14 shrink-0 p-0 transition-shadow duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dn-squircle-xs",
                isSelected && "ring-2 ring-foreground ring-offset-2 ring-offset-background shadow-sm",
              )}
              title={option.label}
              type="button"
              onClick={() => onSelect(option.id)}
            >
              <PaperShaderOptionPreview
                className="relative z-10 block size-full overflow-hidden dn-squircle-xs"
                isSelected={isSelected}
                shaderId={option.id}
              />
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function ColorsSection() {
  const [tab, setTab] = useState("Static")
  const [staticMode, setStaticMode] = useState("Solid")
  const [animatedTheme, setAnimatedTheme] = useState("Theme")
  const [staticColor, setStaticColor] = useState("#171717")
  const [animatedColor, setAnimatedColor] = useState("#171717")
  const color = tab === "Static" ? staticColor : animatedColor
  const setColor = tab === "Static" ? setStaticColor : setAnimatedColor

  return (
    <div className="flex flex-col gap-3">
      <SegmentTabs items={["Static", "Animated"]} value={tab} onChange={setTab} />
      <SettingsColorPopover color={color} hint="Colors" title={`${tab} colors`}>
        {tab === "Static" ? (
          <SegmentTabs
            items={["Solid", "Gradient", "Patterns"]}
            value={staticMode}
            onChange={setStaticMode}
          />
        ) : (
          <SegmentTabs
            items={["Theme", "Mint", "Sunset", "Ocean"]}
            value={animatedTheme}
            onChange={setAnimatedTheme}
          />
        )}
        <ColorPickerPopover
          defaultValue={color}
          triggerLabel={tab === "Static" ? "Primary color" : "Theme color"}
          triggerLabelPosition="right"
          onValueChange={setColor}
        />
      </SettingsColorPopover>
    </div>
  )
}

function LogoSection() {
  const [selectedIcon, setSelectedIcon] = useState("G")
  const [logoColor, setLogoColor] = useState("#171717")

  return (
    <div className="flex flex-col gap-3">
      <SettingsRowPopover hint="Icon" title="Choose icon" trigger={selectedIcon}>
        <Input className="h-8 bg-muted/40 text-xs dn-squircle-xs" placeholder="Search icons" />
        <IconGrid
          items={["G", "in", "X", "gh", "f", "ig", "yt", "t"]}
          selectedIndex={["G", "in", "X", "gh", "f", "ig", "yt", "t"].indexOf(selectedIcon)}
          onSelect={(icon) => setSelectedIcon(icon)}
        />
        <SettingsSlider label="SIZE" value={25} />
        <SettingsSlider label="OPACITY" value={100} />
      </SettingsRowPopover>
      <SettingsColorPopover color={logoColor} title="Logo color">
        <ColorPickerPopover
          defaultValue={logoColor}
          triggerLabel="Icon color"
          triggerLabelPosition="right"
          onValueChange={setLogoColor}
        />
      </SettingsColorPopover>
    </div>
  )
}

function CardSection() {
  const [shape, setShape] = useState<QrBackgroundShapeId>("circle")
  const [fillMode, setFillMode] = useState("Solid")
  const [cardColor, setCardColor] = useState("#FFFFFF")

  return (
    <div className="flex flex-col gap-3">
      <ShapeTypePreviewRow selected={shape} onSelect={(nextShape) => setShape(nextShape)} />
      <SettingsColorPopover color={cardColor} title="Card color">
        <SegmentTabs items={["Solid", "Gradient"]} value={fillMode} onChange={setFillMode} />
        <ColorPickerPopover
          defaultValue={cardColor}
          triggerLabel={fillMode === "Solid" ? "Solid color" : "Gradient start"}
          triggerLabelPosition="right"
          onValueChange={setCardColor}
        />
        <SettingsSlider label="CORNER RADIUS" value={24} />
        <SettingsSlider label="PADDING" value={32} />
        <SettingsSlider label="BOTTOM SPACE" value={0} />
      </SettingsColorPopover>
    </div>
  )
}

function SceneSection() {
  const [tab, setTab] = useState("Shader")
  const [shader, setShader] = useState<PaperShaderId>(DEFAULT_PAPER_SHADER_ID)
  const [paused, setPaused] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState("None")
  const [backgroundColor, setBackgroundColor] = useState("#171717")

  return (
    <div className="flex flex-col gap-3">
      <SegmentTabs items={["Shader", "Image", "Color"]} value={tab} onChange={setTab} />
      {tab === "Shader" ? (
        <>
          <PaperShaderPreviewRow selected={shader} onSelect={setShader} />
          <SettingsSwitchRow checked={paused} label="Pause" onChange={setPaused} />
          <SettingsSlider label="SPEED" value={100} />
        </>
      ) : tab === "Image" ? (
        <>
          <SettingsRowPopover hint="Image" title="Background image" trigger={backgroundImage}>
            <PresetList
              items={["None", "Studio", "Paper", "Texture"]}
              selected={backgroundImage}
              onSelect={setBackgroundImage}
            />
          </SettingsRowPopover>
          <SettingsSlider label="OPACITY" value={100} />
        </>
      ) : (
        <SettingsColorPopover color={backgroundColor} title="Background color">
          <ColorPickerPopover
            defaultValue={backgroundColor}
            triggerLabel="Solid color"
            triggerLabelPosition="right"
            onValueChange={setBackgroundColor}
          />
        </SettingsColorPopover>
      )}
    </div>
  )
}

function MotionSection() {
  const [enabled, setEnabled] = useState(true)
  const [preset, setPreset] = useState("Neon Drift")
  const [colorPreset, setColorPreset] = useState("Theme")

  const presets = [
    "Neon Drift",
    "Flux Columns",
    "Echo Ring",
    "Origin Wave",
    "Radial Expand",
    "Radius Ping",
  ]

  return (
    <div className="flex flex-col gap-3">
      <SettingsSwitchRow checked={enabled} label="Enabled" onChange={setEnabled} />
      <SettingsRowPopover hint="Preset" title="Preset" trigger={preset}>
        <PresetList items={presets} selected={preset} onSelect={setPreset} />
      </SettingsRowPopover>
      <SettingsSlider label="SPEED" value={50} />
      {enabled ? (
        <SettingsRowPopover hint="Color" title="Motion color" trigger={colorPreset}>
          <OptionGrid
            columns={4}
            items={["Theme", "Mint", "Sunset", "Ocean"]}
            selected={colorPreset}
            onSelect={setColorPreset}
          />
        </SettingsRowPopover>
      ) : null}
    </div>
  )
}

function ExportSection() {
  const [target, setTarget] = useState("Current QR")
  const [format, setFormat] = useState("PNG")

  return (
    <div className="flex flex-col gap-3">
      <SettingsRowPopover hint="Target" title="Target" trigger={target}>
        <PresetList
          items={["Current QR", "All QR codes", "Full surface"]}
          selected={target}
          onSelect={setTarget}
        />
      </SettingsRowPopover>
      <SettingsRowPopover hint="Format" title="Format" trigger={format}>
        <OptionGrid
          columns={4}
          items={["SVG", "PNG", "WEBP", "JPEG"]}
          selected={format}
          onSelect={setFormat}
        />
      </SettingsRowPopover>
      <SettingsRowPopover hint="Platform size" title="Platform size" trigger="Web & social">
        <PresetList items={["Web & social", "Print", "Custom"]} selected="Web & social" onSelect={() => undefined} />
      </SettingsRowPopover>
      <SettingsRowPopover hint="Quality" title="Quality" trigger="Web & social">
        <PresetList items={["Web & social", "High", "Lossless"]} selected="Web & social" onSelect={() => undefined} />
      </SettingsRowPopover>
      <SettingsPrimaryButton>Download</SettingsPrimaryButton>
    </div>
  )
}

function SectionBody({ id }: { id: SectionId }) {
  switch (id) {
    case "Content":
      return <ContentSection />
    case "QR Style":
      return <QrStyleSection />
    case "Colors":
      return <ColorsSection />
    case "Logo":
      return <LogoSection />
    case "Shape":
      return <CardSection />
    case "Background":
      return <SceneSection />
    case "Motion":
      return <MotionSection />
    case "Export":
      return <ExportSection />
    default:
      return null
  }
}

export function DesktopNewSettingsPanel() {
  const [openSection, setOpenSection] = useState<string | undefined>()

  return (
    <SettingsPanelShell>
      <SettingsScroll>
        <SettingsAccordion
          openSection={openSection}
          renderSection={(section) => <SectionBody id={section as SectionId} />}
          sections={SECTIONS}
          onOpenSectionChange={setOpenSection}
        />
      </SettingsScroll>
    </SettingsPanelShell>
  )
}

export function DesktopNewShell() {
  const { resolvedTheme, setTheme } = useTheme()
  const theme = resolvedTheme === "dark" ? "dark" : "light"

  return (
    <ShapeProvider defaultShape="rounded">
      <div className="desktopnew-root desktopnew-shell" data-theme={theme}>
        <Button
          className="fixed right-4 top-4 h-8 px-3 text-xs dn-squircle-sm"
          type="button"
          variant="outline"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "Light" : "Dark"}
        </Button>
        <DesktopNewSettingsPanel />
      </div>
    </ShapeProvider>
  )
}
