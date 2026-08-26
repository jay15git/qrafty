import type { CSSProperties } from "react"

export type PreviewStageSize = {
  height: number
  width: number
}

export function getPreviewStageSize(
  documentWidth: number,
  documentHeight: number,
  scale: number,
): PreviewStageSize {
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1

  return {
    height: Math.max(1, Math.round(documentHeight * safeScale)),
    width: Math.max(1, Math.round(documentWidth * safeScale)),
  }
}

export function getPreviewDisplaySize(documentSize: number, artboardScale: number) {
  const safeScale = Number.isFinite(artboardScale) && artboardScale > 0 ? artboardScale : 1

  return Math.max(1, Math.round(documentSize * safeScale))
}

export function getPreviewCameraStyle(
  documentWidth: number,
  documentHeight: number,
  scale: number,
): CSSProperties {
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1

  return {
    height: documentHeight,
    transform: safeScale !== 1 ? `scale(${safeScale})` : undefined,
    transformOrigin: "top left",
    width: documentWidth,
  }
}

export function scalePreviewCornerRadius(radiusPx: number, artboardScale: number) {
  const safeScale = Number.isFinite(artboardScale) && artboardScale > 0 ? artboardScale : 1

  return Math.max(0, radiusPx * safeScale)
}

export function scalePreviewCornerRadiiState<T extends {
  bottomLeft: number
  bottomRight: number
  topLeft: number
  topRight: number
}>(cornerRadii: T, artboardScale: number): T {
  return {
    ...cornerRadii,
    bottomLeft: scalePreviewCornerRadius(cornerRadii.bottomLeft, artboardScale),
    bottomRight: scalePreviewCornerRadius(cornerRadii.bottomRight, artboardScale),
    topLeft: scalePreviewCornerRadius(cornerRadii.topLeft, artboardScale),
    topRight: scalePreviewCornerRadius(cornerRadii.topRight, artboardScale),
  }
}
