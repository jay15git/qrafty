import type { SVGProps } from "react"

import { ReactQRCode } from "@new-qr/qr-internal/react-qr-code"

import {
  buildCustomCornerDotTransform,
  getCustomCornerDotShapeGeometry,
  isCustomCornerDotShape,
  type CustomCornerDotShape,
} from "@/features/qr-code/styles/custom-corner-dot-shapes"
import {
  getModuleStylePreviewViewBox,
  getStylePreviewQrModuleCount,
  STYLE_PREVIEW_ERROR_CORRECTION_LEVEL,
  STYLE_PREVIEW_SAMPLE_DATA,
} from "@/features/qr-code/styles/style-preview"

export type StylePreviewKind = "corner-dot" | "corner-square" | "dots"

const PREVIEW_ICON_CLASS_NAME = "size-[5.5rem] text-foreground/80 dark:text-white"
const FINDER_FRAME_PREVIEW_VIEW_BOX = "0 0 7 7"
// The library draws several inner styles larger than the 3x3 finder cell (star at
// 1.2x, diamond as a rotated inset square). A strict 2 2 3 3 crop clips their
// tips and reads as blunt corners in the option tiles.
const FINDER_DOT_PREVIEW_VIEW_BOX = "1.65 1.65 3.7 3.7"
const FINDER_PREVIEW_SIZE = 64
// Matches @new-qr/qr-internal/react-qr-code inner finder placement with marginSize={0}.
const FINDER_DOT_PREVIEW_ORIGIN = 2

export function StylePreview({
  color,
  frameColor,
  frameStyle,
  previewKind,
  value,
}: {
  color?: string
  frameColor?: string
  frameStyle?: string
  previewKind: StylePreviewKind
  value: string
}) {
  if (previewKind === "corner-dot") {
    return <CornerDotStylePreview color={color} value={value} />
  }

  if (previewKind === "corner-square") {
    return <CornerFrameStylePreview color={color} value={value} />
  }

  return <ModuleStylePreview color={color} value={value} />
}

function ModuleStylePreview({
  color,
  value,
}: {
  color?: string
  value: string
}) {
  const previewColor = color ?? "currentColor"
  const moduleCount = getStylePreviewQrModuleCount()

  return (
    <ReactQRCode
      background="transparent"
      boostLevel
      dataModulesSettings={{ color: previewColor, style: value as never }}
      finderPatternInnerSettings={{ color: "transparent", style: "square" }}
      finderPatternOuterSettings={{ color: "transparent", style: "square" }}
      level={STYLE_PREVIEW_ERROR_CORRECTION_LEVEL}
      marginSize={0}
      minVersion={1}
      size={moduleCount}
      value={STYLE_PREVIEW_SAMPLE_DATA}
      svgProps={
        {
          "aria-hidden": "true",
          className: PREVIEW_ICON_CLASS_NAME,
          "data-preview-kind": "dots",
          "data-preview-renderer": "real-qr",
          "data-preview-style": value,
          "data-slot": "style-preview-fragment",
          viewBox: getModuleStylePreviewViewBox(),
        } as SVGProps<SVGSVGElement>
      }
    />
  )
}

function FinderPatternPreview({
  finderPatternInnerSettings,
  finderPatternOuterSettings,
  previewKind,
  rendererDataAttribute,
  slotName,
  style,
  viewBox,
}: {
  finderPatternInnerSettings: { color: string; style: never }
  finderPatternOuterSettings: { color: string; style: never }
  previewKind: "corner-dot" | "corner-square"
  rendererDataAttribute: "data-corner-dot-renderer" | "data-corner-frame-renderer"
  slotName: "style-preview-corner-dot" | "style-preview-corner-square"
  style: string
  viewBox: string
}) {
  return (
    <ReactQRCode
      background="transparent"
      boostLevel
      finderPatternInnerSettings={finderPatternInnerSettings}
      finderPatternOuterSettings={finderPatternOuterSettings}
      level="L"
      marginSize={0}
      minVersion={1}
      size={FINDER_PREVIEW_SIZE}
      svgProps={
        {
          "aria-hidden": "true",
          className: PREVIEW_ICON_CLASS_NAME,
          [rendererDataAttribute]: "real-qr",
          "data-preview-kind": previewKind,
          "data-preview-style": style,
          "data-slot": slotName,
          viewBox,
        } as SVGProps<SVGSVGElement>
      }
      value="hi"
    />
  )
}

function CornerDotStylePreview({
  color,
  value,
}: {
  color?: string
  value: string
}) {
  const previewColor = color ?? "currentColor"

  if (isCustomCornerDotShape(value)) {
    return (
      <CustomCornerDotStylePreview
        color={previewColor}
        shape={value}
        value={value}
      />
    )
  }

  return (
    <FinderPatternPreview
      finderPatternInnerSettings={{ color: previewColor, style: value as never }}
      finderPatternOuterSettings={{ color: "transparent", style: "square" as never }}
      previewKind="corner-dot"
      rendererDataAttribute="data-corner-dot-renderer"
      slotName="style-preview-corner-dot"
      style={value}
      viewBox={FINDER_DOT_PREVIEW_VIEW_BOX}
    />
  )
}

function CustomCornerDotStylePreview({
  color,
  shape,
  value,
}: {
  color: string
  shape: CustomCornerDotShape
  value: string
}) {
  const geometry = getCustomCornerDotShapeGeometry(
    shape,
    FINDER_DOT_PREVIEW_ORIGIN,
    FINDER_DOT_PREVIEW_ORIGIN,
    3,
  )

  return (
    <svg
      aria-hidden="true"
      className={PREVIEW_ICON_CLASS_NAME}
      data-corner-dot-renderer="custom-path"
      data-preview-kind="corner-dot"
      data-preview-style={value}
      data-slot="style-preview-corner-dot"
      fill="none"
      viewBox={FINDER_DOT_PREVIEW_VIEW_BOX}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={geometry.d}
        fill={color}
        fillRule={geometry.fillRule}
        transform={buildCustomCornerDotTransform(geometry)}
      />
    </svg>
  )
}

function CornerFrameStylePreview({
  color,
  value,
}: {
  color?: string
  value: string
}) {
  const previewColor = color ?? "currentColor"

  return (
    <FinderPatternPreview
      finderPatternInnerSettings={{ color: "transparent", style: "square" as never }}
      finderPatternOuterSettings={{ color: previewColor, style: value as never }}
      previewKind="corner-square"
      rendererDataAttribute="data-corner-frame-renderer"
      slotName="style-preview-corner-square"
      style={value}
      viewBox={FINDER_FRAME_PREVIEW_VIEW_BOX}
    />
  )
}
