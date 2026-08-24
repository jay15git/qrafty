import type {
  DataModulesStyle,
  FinderPatternInnerStyle,
  FinderPatternOuterStyle,
  GradientSettings,
  ImageSettings,
  ReactQRCodeProps,
} from "../react-qr-code"

import type { NewQrCodeProps, NewQrGradientConfig } from "../types"

function coerceNumber(value: number | undefined, min: number, max: number, fallback: number) {
  if (value === undefined || Number.isNaN(value)) {
    return fallback
  }

  return Math.min(max, Math.max(min, value))
}

function toUpstreamGradient(gradient: NewQrGradientConfig): GradientSettings {
  return {
    rotation: gradient.rotation,
    stops: gradient.stops.map((stop) => ({
      color: stop.color,
      offset: String(stop.offset),
    })),
    type: gradient.type,
  }
}

function resolveModuleStyle(module: NewQrCodeProps["module"]) {
  if (module === ("dots" as QrModuleStyle)) {
    return { randomSizeDefault: true, style: "circle" as DataModulesStyle }
  }

  return {
    randomSizeDefault: undefined,
    style: (module ?? "square") as DataModulesStyle,
  }
}

type QrModuleStyle = NewQrCodeProps["module"]

function resolveBackground(props: NewQrCodeProps): ReactQRCodeProps["background"] {
  if (props.background === "transparent" || !props.background) {
    return "transparent"
  }

  if (props.backgroundGradient && props.backgroundGradient !== "none") {
    return toUpstreamGradient(props.backgroundGradient)
  }

  return props.background
}

function resolveImageSettings(props: NewQrCodeProps, size: number): ImageSettings | undefined {
  const logo = props.logo
  if (!logo?.src) {
    return undefined
  }

  const width = logo.width ?? Math.max(1, Math.round(size * coerceNumber(logo.size, 0, 1, 0.1)))
  const height = logo.height ?? width

  return {
    crossOrigin: logo.crossOrigin ?? "anonymous",
    excavate: logo.excavate ?? true,
    height: Math.max(1, height),
    src: logo.src,
    width: Math.max(1, width),
    ...(logo.opacity !== undefined ? { opacity: logo.opacity } : {}),
    ...(logo.x !== undefined ? { x: logo.x } : {}),
    ...(logo.y !== undefined ? { y: logo.y } : {}),
  }
}

function resolveValue(value: NewQrCodeProps["value"]) {
  if (Array.isArray(value)) {
    return value.map((segment) => segment.trim())
  }

  return value.trim()
}

export function portablePropsToReactQrProps(props: NewQrCodeProps): ReactQRCodeProps {
  const size = coerceNumber(props.size, 120, 1200, 320)
  const margin = coerceNumber(props.margin, 0, 80, 12)
  const { randomSizeDefault, style: moduleStyle } = resolveModuleStyle(props.module)
  const unifiedGradient =
    props.gradientMode === "unified" &&
    props.colorMode === "gradient" &&
    props.gradient !== undefined &&
    props.gradient !== "none"
  const unifiedImage =
    (props.gradientMode === "unified-image" || props.colorMode === "image") &&
    Boolean(props.moduleFillImage)
  const unifiedFill = unifiedGradient || unifiedImage

  const dotsColor =
    !unifiedFill && (props.colorMode === "solid" || !props.colorMode)
      ? props.foreground
      : undefined

  const dataModulesSettings: NonNullable<ReactQRCodeProps["dataModulesSettings"]> = {
    color: dotsColor,
    randomSize:
      props.moduleRoundSize === undefined
        ? randomSizeDefault ?? false
        : !props.moduleRoundSize,
    style: moduleStyle,
  }

  if (props.moduleSize !== undefined) {
    dataModulesSettings.size = props.moduleSize
  }

  if (props.moduleLineWidth !== undefined) {
    dataModulesSettings.lineWidth = props.moduleLineWidth
  }

  const upstreamGradient =
    unifiedGradient && props.gradient !== "none" && props.gradient
      ? toUpstreamGradient(props.gradient)
      : undefined

  return {
    background: resolveBackground(props),
    boostLevel: props.boostLevel ?? true,
    dataModulesSettings,
    finderPatternInnerSettings: {
      color: unifiedFill ? undefined : props.finderInnerColor ?? props.foreground,
      style: (props.finderInner ?? "square") as FinderPatternInnerStyle,
    },
    finderPatternOuterSettings: {
      color: unifiedFill ? undefined : props.finderOuterColor ?? props.foreground,
      style: (props.finderOuter ?? "square") as FinderPatternOuterStyle,
    },
    gradient: upstreamGradient,
    imageSettings: resolveImageSettings(props, size),
    level: props.level ?? "Q",
    marginSize: margin,
    minVersion: props.minVersion ?? 1,
    size,
    svgProps: {
      ...(props.ariaLabel ? { "aria-label": props.ariaLabel } : {}),
      style: {
        display: "block",
        height: "100%",
        width: "100%",
      },
    },
    value: resolveValue(props.value),
  }
}
