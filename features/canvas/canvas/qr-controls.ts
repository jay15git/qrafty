import { DEFAULT_BRAND_ICON_COLOR } from "@/features/qr/assets/brand-icon-svg"
import {
  clampQrBackgroundRound,
  getAssetValue,
  type QraftyState,
} from "@/features/qr/model/state"
import { DEFAULT_DRAFTING_STUDIO_STATE } from "@/features/canvas/components/drafting-canvas.constants"
import type { DraftingCanvasSetters } from "@/features/canvas/components/drafting-canvas-reducer"
import { formatValueSegmentsText } from "@/features/canvas/components/drafting-canvas-operations"

/**
 * The control-sync interface for QR state: given a `QraftyState`, push every
 * derived value into the reducer-backed control setters. Pure — no React.
 */
export type QrControls = Pick<
  DraftingCanvasSetters,
  | "setSelectedAriaLabel"
  | "setSelectedBackgroundAssetSourceMode"
  | "setSelectedBackgroundColor"
  | "setSelectedBackgroundColorMode"
  | "setSelectedBackgroundGradient"
  | "setSelectedBackgroundRemoteUrl"
  | "setSelectedBackgroundShapeId"
  | "setSelectedBackgroundShapeOptions"
  | "setSelectedBackgroundTransparent"
  | "setSelectedBoostLevel"
  | "setSelectedCornerDotColor"
  | "setSelectedCornerDotColorMode"
  | "setSelectedCornerDotGradient"
  | "setSelectedCornerSquareColor"
  | "setSelectedCornerSquareColorMode"
  | "setSelectedCornerSquareGradient"
  | "setSelectedDotColor"
  | "setSelectedDotMatrixAnimation"
  | "setSelectedDotsColorMode"
  | "setSelectedDotsGradient"
  | "setSelectedDotsPalette"
  | "setSelectedDotType"
  | "setSelectedGradientLinkMode"
  | "setSelectedHideBackgroundDots"
  | "setSelectedLogoAssetSourceMode"
  | "setSelectedLogoColor"
  | "setSelectedLogoColorMode"
  | "setSelectedLogoCrossOrigin"
  | "setSelectedLogoGradient"
  | "setSelectedLogoHeightPx"
  | "setSelectedLogoLockAspect"
  | "setSelectedLogoMargin"
  | "setSelectedLogoOffsetX"
  | "setSelectedLogoOffsetY"
  | "setSelectedLogoOpacity"
  | "setSelectedLogoPositionMode"
  | "setSelectedLogoPresetId"
  | "setSelectedLogoPresetValue"
  | "setSelectedLogoRemoteUrl"
  | "setSelectedLogoSize"
  | "setSelectedLogoSizeMode"
  | "setSelectedLogoSourceMode"
  | "setSelectedLogoUploadValue"
  | "setSelectedLogoWidthPx"
  | "setSelectedModuleFillImageSourceMode"
  | "setSelectedModuleFillImageUrl"
  | "setSelectedModuleFillRemoteUrl"
  | "setSelectedModuleLineWidth"
  | "setSelectedModuleRoundSize"
  | "setSelectedModuleSize"
  | "setSelectedQrErrorCorrectionLevel"
  | "setSelectedQrFinderPatternInnerStyle"
  | "setSelectedQrFinderPatternOuterStyle"
  | "setSelectedQrMargin"
  | "setSelectedQrMode"
  | "setSelectedQrRadius"
  | "setSelectedQrSize"
  | "setSelectedQrTypeNumber"
  | "setSelectedRasterExportQualityPercent"
  | "setSelectedValueSegmentsText"
>

export function createQrControls(controls: QrControls) {
  const syncLogoAsset = (nextState: QraftyState) => {
    controls.setSelectedLogoSourceMode(nextState.logo.source)
    controls.setSelectedLogoPresetId(nextState.logo.presetId)
    controls.setSelectedLogoPresetValue(
      nextState.logo.source === "preset" ? nextState.logo.value : undefined,
    )

    if (nextState.logo.source === "url") {
      controls.setSelectedLogoAssetSourceMode("url")
      controls.setSelectedLogoRemoteUrl(nextState.logo.value ?? "")
      controls.setSelectedLogoUploadValue("")
    } else if (nextState.logo.source === "upload") {
      controls.setSelectedLogoAssetSourceMode("upload")
      controls.setSelectedLogoUploadValue(nextState.logo.value ?? "")
      controls.setSelectedLogoRemoteUrl("")
    }
  }

  const syncLogo = (nextState: QraftyState) => {
    syncLogoAsset(nextState)
    controls.setSelectedLogoColor(
      nextState.logo.presetColor ?? DEFAULT_BRAND_ICON_COLOR,
    )
    controls.setSelectedLogoColorMode(
      nextState.logoGradient.enabled ? "gradient" : "solid",
    )
    controls.setSelectedLogoGradient(structuredClone(nextState.logoGradient))
    controls.setSelectedLogoSize(
      Math.round(nextState.imageOptions.imageSize * 100),
    )
    controls.setSelectedLogoMargin(nextState.imageOptions.margin)
    controls.setSelectedHideBackgroundDots(
      nextState.imageOptions.hideBackgroundDots,
    )
    controls.setSelectedLogoOpacity(nextState.imageOptions.opacity * 100)
    controls.setSelectedLogoSizeMode(nextState.imageOptions.sizeMode)
    controls.setSelectedLogoWidthPx(nextState.imageOptions.widthPx)
    controls.setSelectedLogoHeightPx(nextState.imageOptions.heightPx)
    controls.setSelectedLogoLockAspect(nextState.imageOptions.lockAspect)
    controls.setSelectedLogoPositionMode(nextState.imageOptions.logoPositionMode)
    controls.setSelectedLogoOffsetX(nextState.imageOptions.x ?? 0)
    controls.setSelectedLogoOffsetY(nextState.imageOptions.y ?? 0)
    controls.setSelectedLogoCrossOrigin(nextState.imageOptions.crossOrigin)
  }

  const syncModuleFill = (nextState: QraftyState) => {
    if (nextState.dotsColorMode !== "image") {
      return
    }

    const fillValue = getAssetValue(nextState.moduleFillImage) ?? ""
    const source =
      nextState.moduleFillImage.source === "url"
        ? "url"
        : nextState.moduleFillImage.source === "upload"
          ? "upload"
          : "upload"

    if (source === "url") {
      controls.setSelectedModuleFillImageSourceMode("url")
      controls.setSelectedModuleFillRemoteUrl(fillValue)
      controls.setSelectedModuleFillImageUrl("")
      return
    }

    controls.setSelectedModuleFillImageSourceMode("upload")
    controls.setSelectedModuleFillImageUrl(fillValue)
    controls.setSelectedModuleFillRemoteUrl("")
  }

  const syncDots = (nextState: QraftyState) => {
    controls.setSelectedDotType(nextState.dataModulesSettings.type)
    controls.setSelectedDotsColorMode(nextState.dotsColorMode)
    controls.setSelectedDotsPalette([...nextState.dotsPalette])
    controls.setSelectedDotColor(nextState.dataModulesSettings.color)
    controls.setSelectedDotsGradient(
      structuredClone(nextState.dataModulesGradient),
    )
    controls.setSelectedDotMatrixAnimation({ ...nextState.dotMatrixAnimation })
  }

  const syncCorners = (nextState: QraftyState) => {
    controls.setSelectedQrFinderPatternOuterStyle(
      nextState.finderPatternOuterSettings.type,
    )
    controls.setSelectedCornerSquareColorMode(
      nextState.finderPatternOuterGradient.enabled ? "gradient" : "solid",
    )
    controls.setSelectedCornerSquareColor(
      nextState.finderPatternOuterSettings.color,
    )
    controls.setSelectedCornerSquareGradient(
      structuredClone(nextState.finderPatternOuterGradient),
    )
    controls.setSelectedQrFinderPatternInnerStyle(
      nextState.finderPatternInnerSettings.type,
    )
    controls.setSelectedCornerDotColorMode(
      nextState.finderPatternInnerGradient.enabled ? "gradient" : "solid",
    )
    controls.setSelectedCornerDotColor(nextState.finderPatternInnerSettings.color)
    controls.setSelectedCornerDotGradient(
      structuredClone(nextState.finderPatternInnerGradient),
    )
  }

  const syncBackground = (nextState: QraftyState) => {
    controls.setSelectedBackgroundColorMode(
      nextState.backgroundGradient.enabled ? "gradient" : "solid",
    )
    controls.setSelectedBackgroundColor(nextState.backgroundOptions.color)
    controls.setSelectedBackgroundTransparent(
      nextState.backgroundOptions.transparent,
    )
    controls.setSelectedBackgroundGradient(
      structuredClone(nextState.backgroundGradient),
    )
    controls.setSelectedBackgroundShapeId(nextState.backgroundShapeId)
    controls.setSelectedBackgroundShapeOptions({
      ...DEFAULT_DRAFTING_STUDIO_STATE.backgroundShapeOptions,
      ...nextState.backgroundShapeOptions,
    })
    controls.setSelectedBackgroundAssetSourceMode(
      nextState.backgroundImage.source === "url" ? "url" : "upload",
    )
    controls.setSelectedBackgroundRemoteUrl(
      nextState.backgroundImage.source === "url"
        ? (nextState.backgroundImage.value ?? "")
        : "",
    )
  }

  const applyQrState = (nextState: QraftyState) => {
    controls.setSelectedQrMargin(nextState.margin)
    controls.setSelectedQrRadius(
      clampQrBackgroundRound(nextState.backgroundOptions.round),
    )
    controls.setSelectedRasterExportQualityPercent(
      nextState.rasterExportQualityPercent,
    )
    controls.setSelectedQrSize(nextState.width)
    syncDots(nextState)
    syncCorners(nextState)
    syncBackground(nextState)
    syncLogo(nextState)
    controls.setSelectedQrTypeNumber(nextState.qrOptions.typeNumber)
    controls.setSelectedQrErrorCorrectionLevel(
      nextState.qrOptions.errorCorrectionLevel,
    )
    controls.setSelectedBoostLevel(nextState.qrOptions.boostLevel)
    controls.setSelectedQrMode(nextState.qrOptions.mode)
    controls.setSelectedValueSegmentsText(
      formatValueSegmentsText(nextState.valueSegments),
    )
    controls.setSelectedAriaLabel(nextState.ariaLabel ?? "")
    controls.setSelectedModuleRoundSize(nextState.dataModulesSettings.roundSize)
    controls.setSelectedModuleSize(nextState.dataModulesSettings.moduleSize)
    controls.setSelectedModuleLineWidth(nextState.dataModulesSettings.lineWidth)
    controls.setSelectedGradientLinkMode(nextState.gradientLinkMode)
    syncModuleFill(nextState)
  }

  return {
    applyQrState,
    syncBackground,
    syncCorners,
    syncDots,
    syncLogo,
    syncLogoAsset,
    syncModuleFill,
  }
}
