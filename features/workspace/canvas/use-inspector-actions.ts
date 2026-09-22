"use client"

import type { MutableRefObject } from "react"

import {
  applyAssetNoneSelection,
  applyAssetUploadValue,
  applyAssetUrlValue,
  applyLogoPresetColor,
} from "@/features/qr-code/model/actions"
import { findBrandIconById } from "@/features/qr-code/assets/brand-icons"
import { createBrandIconDataUrl } from "@/features/qr-code/assets/brand-icon-svg"
import { parseIconstackSelectionId } from "@/features/qr-code/assets/iconstack-api"
import { getDefaultStaticQrValues } from "@/features/qr-code/content/static-payload"
import {
  setDotMatrixAnimationOptions,
  type QraftyState,
} from "@/features/qr-code/model/state"
import { createUniformCornerRadii } from "@/features/workspace/model/corner-radius"
import {
  cloneDraftingCanvasLayer,
  createDefaultDraftingLayers,
  createDraftingTextLayer,
  fitQrSizeInCard,
  getDraftingCardLayerId,
  getDraftingQrLayerId,
  layoutDraftingCardInsetLayers,
  patchDraftingCanvasLayer,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import {
  createDefaultDraftingCardState,
  normalizeDraftingCardState,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import { createDefaultDraftingWorkspaceQrState } from "@/features/workspace/model/document"
import type {
  DesktopAccessibilitySettings,
  DesktopEncodingSettings,
  DesktopExportSettings,
  DesktopImageSettings,
  DesktopLayersSettings,
  DesktopLogoSettings,
  DesktopLogoSettingsPatch,
  DesktopMotionSettings,
  DesktopPatternSettingsPatch,
  DesktopShapeSettings,
  DesktopTextSettings,
} from "@/features/desktop-shell/model/desktop-toolbar-types"
import type { DesktopCornersSettings } from "@/features/desktop-shell/model/desktop-toolbar-types"
import type { UnifiedQrFillPatches } from "@/features/desktop-shell/inspector/settings-bridge"
import {
  applyCornersSettingsPatchToQraftyState,
  applyLogoSettingsPatchToQraftyState,
  applyPatternSettingsPatchToQraftyState,
} from "@/features/workspace/components/workspace-qr-settings-patch"
import {
  buildDesktopAppearancePatch,
  type DesktopAppearancePatch,
} from "@/features/desktop-shell/model/appearance"
import {
  ensureMandatoryDesktopLayerRows,
  findDraftingLayerById,
  getDraftingDownloadTarget,
} from "@/features/workspace/components/workspace-surface-helpers"
import { replaceTrackedObjectUrl } from "@/features/workspace/components/workspace-surface.constants"
import { clearDraftingQrMarkupCache } from "@/features/workspace/hooks/use-drafting-qr-markup"
import { clearQrEncodeMarkupCache } from "@/features/qr-code/rendering/qr-encode-cache"
import type {
  WorkspaceSurfaceSetters,
  WorkspaceSurfaceState,
} from "@/features/workspace/components/workspace-surface-reducer"
import type { createQrControls } from "@/features/workspace/canvas/qr-controls"
import type { useQrLogoActions } from "@/features/workspace/canvas/use-qr-logo-actions"
import type { DraftingLayerMenuAction } from "@/features/workspace/components/Pane"
import { DEFAULT_QR_INPUT_TYPE } from "@/features/qr-code/content/input-options"
import {
  DEFAULT_DRAFTING_STUDIO_STATE,
  type DraftingDownloadExtension,
} from "@/features/workspace/components/workspace-surface.constants"

type InspectorState = Pick<
  WorkspaceSurfaceState,
  | "activeQrNodeId"
  | "layerStateByNodeId"
  | "selectedCardState"
  | "selectedLayerId"
  | "selectedLogoRemoteUrl"
  | "selectedModuleFillImageSourceMode"
  | "selectedModuleFillImageUrl"
>

type InspectorSetters = Pick<
  WorkspaceSurfaceSetters,
  | "setContentValuesByType"
  | "setLayerStateByNodeId"
  | "setLogoUploadObjectUrl"
  | "setSelectedAriaLabel"
  | "setSelectedBackgroundColor"
  | "setSelectedBackgroundColorMode"
  | "setSelectedBackgroundGradient"
  | "setSelectedBackgroundShapeId"
  | "setSelectedBackgroundShapeOptions"
  | "setSelectedBackgroundTransparent"
  | "setSelectedBoostLevel"
  | "setSelectedCardState"
  | "setSelectedContentType"
  | "setSelectedCornerDotColor"
  | "setSelectedCornerDotColorMode"
  | "setSelectedCornerDotGradient"
  | "setSelectedCornerSquareColor"
  | "setSelectedCornerSquareColorMode"
  | "setSelectedCornerSquareGradient"
  | "setSelectedDotColor"
  | "setSelectedDotMatrixAnimation"
  | "setSelectedDotType"
  | "setSelectedDotsColorMode"
  | "setSelectedDotsGradient"
  | "setSelectedDotsPalette"
  | "setSelectedDotsPalettePreset"
  | "setSelectedDownloadExtension"
  | "setSelectedDownloadTarget"
  | "setSelectedExportMediaKind"
  | "setSelectedGradientLinkMode"
  | "setSelectedLogoColor"
  | "setSelectedLogoColorMode"
  | "setSelectedLogoGradient"
  | "setSelectedLogoSourceMode"
  | "setSelectedModuleFillImageSourceMode"
  | "setSelectedModuleFillImageUrl"
  | "setSelectedModuleFillRemoteUrl"
  | "setSelectedModuleLineWidth"
  | "setSelectedModuleRoundSize"
  | "setSelectedModuleSize"
  | "setSelectedPhotoLongEdge"
  | "setSelectedQrErrorCorrectionLevel"
  | "setSelectedQrFinderPatternInnerStyle"
  | "setSelectedQrFinderPatternOuterStyle"
  | "setSelectedQrSize"
  | "setSelectedQrTypeNumber"
  | "setSelectedValueSegmentsText"
  | "setSelectedVideoDurationSeconds"
  | "setSelectedVideoFormat"
  | "setSelectedVideoFrameRate"
  | "setSelectedVideoLongEdge"
>

export function useInspectorActions({
  activeCanvasLayers,
  activeQrNodeId,
  appearanceTargetLayer,
  commitActiveQraftyState,
  draftingQraftyState,
  handleLayerChange,
  handleLayerSelect,
  layerStateByNodeId,
  logoActions,
  logoUploadObjectUrlRef,
  persistActiveQrLayerState,
  qrBackgroundSurfaceVisible,
  qrControls,
  resolveLiveQrPersistState,
  selectedCardState,
  selectedLayerId,
  selectedLogoRemoteUrl,
  selectedModuleFillImageSourceMode,
  selectedModuleFillImageUrl,
  selectedTextLayer,
  selectSingleLayer,
  setContentValuesByType,
  setLayerStateByNodeId,
  setLogoUploadObjectUrl,
  setSelectedAriaLabel,
  setSelectedBackgroundColor,
  setSelectedBackgroundColorMode,
  setSelectedBackgroundGradient,
  setSelectedBackgroundShapeId,
  setSelectedBackgroundShapeOptions,
  setSelectedBackgroundTransparent,
  setSelectedBoostLevel,
  setSelectedCardState,
  setSelectedContentType,
  setSelectedCornerDotColor,
  setSelectedCornerDotColorMode,
  setSelectedCornerDotGradient,
  setSelectedCornerSquareColor,
  setSelectedCornerSquareColorMode,
  setSelectedCornerSquareGradient,
  setSelectedDotColor,
  setSelectedDotMatrixAnimation,
  setSelectedDotType,
  setSelectedDotsColorMode,
  setSelectedDotsGradient,
  setSelectedDotsPalette,
  setSelectedDotsPalettePreset,
  setSelectedDownloadExtension,
  setSelectedDownloadTarget,
  setSelectedExportMediaKind,
  setSelectedGradientLinkMode,
  setSelectedLogoColor,
  setSelectedLogoColorMode,
  setSelectedLogoGradient,
  setSelectedLogoSourceMode,
  setSelectedModuleFillImageSourceMode,
  setSelectedModuleFillImageUrl,
  setSelectedModuleFillRemoteUrl,
  setSelectedModuleLineWidth,
  setSelectedModuleRoundSize,
  setSelectedModuleSize,
  setSelectedPhotoLongEdge,
  setSelectedQrErrorCorrectionLevel,
  setSelectedQrFinderPatternInnerStyle,
  setSelectedQrFinderPatternOuterStyle,
  setSelectedQrSize,
  setSelectedQrTypeNumber,
  setSelectedValueSegmentsText,
  setSelectedVideoDurationSeconds,
  setSelectedVideoFormat,
  setSelectedVideoFrameRate,
  setSelectedVideoLongEdge,
}: InspectorState &
  InspectorSetters & {
    activeCanvasLayers: DraftingCanvasLayer[]
    appearanceTargetLayer: DraftingCanvasLayer | null
    commitActiveQraftyState: (nextState: QraftyState) => void
    draftingQraftyState: QraftyState
    handleLayerChange: (
      paneId: string,
      layerId: string,
      patch: Partial<DraftingCanvasLayer>,
    ) => void
    handleLayerSelect: (
      paneId: string,
      layerId: string | null,
      options?: { additive?: boolean; preserveActiveTool?: boolean },
    ) => void
    logoActions: ReturnType<typeof useQrLogoActions>
    logoUploadObjectUrlRef: MutableRefObject<string | null>
    persistActiveQrLayerState: (nextState?: QraftyState) => void
    qrBackgroundSurfaceVisible: boolean
    qrControls: ReturnType<typeof createQrControls>
    resolveLiveQrPersistState: () => QraftyState
    selectedTextLayer: DraftingCanvasLayer | null
    selectSingleLayer: (layerId: string | null) => void
  }) {

  function handleDesktopAppearancePatch(patch: DesktopAppearancePatch) {
    if (!appearanceTargetLayer) {
      return
    }

    const result = buildDesktopAppearancePatch(appearanceTargetLayer, patch, {
      qrBackgroundShapeId:
        appearanceTargetLayer.kind === "qr"
          ? draftingQraftyState.backgroundShapeId
          : undefined,
      qrBackgroundShapeOptions:
        appearanceTargetLayer.kind === "qr"
          ? draftingQraftyState.backgroundShapeOptions
          : undefined,
      qrBackgroundSurfaceVisible:
        appearanceTargetLayer.kind === "qr" ? qrBackgroundSurfaceVisible : undefined,
    })

    if (Object.keys(result.layerPatch).length > 0) {
      handleLayerChange(activeQrNodeId, appearanceTargetLayer.id, result.layerPatch)
    }

    if (result.qrBackgroundShapeOptions) {
      setSelectedBackgroundShapeOptions((current) => ({
        ...current,
        ...result.qrBackgroundShapeOptions,
      }))
    }

    if (
      appearanceTargetLayer.kind === "card" &&
      (result.cardBorder !== undefined ||
        result.cardCornerRadius !== undefined ||
        result.cardCornerRadii !== undefined ||
        result.cardShadow)
    ) {
      setSelectedCardState((current) => ({
        ...current,
        border: result.cardBorder ?? current.border,
        cornerRadius: result.cardCornerRadius ?? current.cornerRadius,
        cornerRadii: result.cardCornerRadii ?? current.cornerRadii,
        shadow: result.cardShadow
          ? {
              ...current.shadow,
              ...result.cardShadow,
            }
          : current.shadow,
      }))
    }
  }

  function resetDesktopContent() {
    setSelectedContentType(DEFAULT_QR_INPUT_TYPE)
    setContentValuesByType((current) => ({
      ...current,
      [DEFAULT_QR_INPUT_TYPE]: {
        ...getDefaultStaticQrValues(DEFAULT_QR_INPUT_TYPE),
        url: DEFAULT_DRAFTING_STUDIO_STATE.data,
      },
    }))
  }

  function applyDesktopPatternPatchToControls(patch: DesktopPatternSettingsPatch) {
    if (patch.qrDotType) setSelectedDotType(patch.qrDotType)
    if (patch.moduleRoundSize !== undefined) setSelectedModuleRoundSize(patch.moduleRoundSize)
    if (patch.moduleSize !== undefined) setSelectedModuleSize(patch.moduleSize)
    if (patch.moduleLineWidth !== undefined) setSelectedModuleLineWidth(patch.moduleLineWidth)
    if (patch.gradientLinkMode) setSelectedGradientLinkMode(patch.gradientLinkMode)
    if (patch.dotsColorMode) {
      setSelectedDotsColorMode(patch.dotsColorMode)
    }
    if (patch.dotsSolidColor) {
      setSelectedDotsColorMode("solid")
      setSelectedDotColor(patch.dotsSolidColor)
    }
    if (patch.dataModulesGradient) {
      setSelectedDotsColorMode("gradient")
      setSelectedDotsGradient({ ...patch.dataModulesGradient, enabled: true })
    }
    if (patch.dotsPalette) {
      setSelectedDotsColorMode("palette")
      setSelectedDotsPalette([...patch.dotsPalette])
    }
    if (patch.dotsPalettePreset !== undefined) {
      setSelectedDotsColorMode("palette")
      setSelectedDotsPalettePreset(patch.dotsPalettePreset)
    }
    if (patch.moduleFillImageUrl !== undefined) {
      setSelectedDotsColorMode("image")
      const sourceMode = patch.moduleFillImageSourceMode ?? selectedModuleFillImageSourceMode
      setSelectedModuleFillImageSourceMode(sourceMode)
      if (!patch.moduleFillImageUrl) {
        setSelectedModuleFillImageUrl("")
        setSelectedModuleFillRemoteUrl("")
      } else if (sourceMode === "url") {
        setSelectedModuleFillRemoteUrl(patch.moduleFillImageUrl)
        setSelectedModuleFillImageUrl("")
      } else {
        setSelectedModuleFillImageUrl(patch.moduleFillImageUrl)
        setSelectedModuleFillRemoteUrl("")
      }
    }
    if (patch.moduleFillImageSourceMode && patch.moduleFillImageUrl === undefined) {
      setSelectedDotsColorMode("image")
      setSelectedModuleFillImageSourceMode(patch.moduleFillImageSourceMode)
    }
  }

  function applyDesktopCornersPatchToControls(patch: Partial<DesktopCornersSettings>) {
    if (patch.cornerSquareType) setSelectedQrFinderPatternOuterStyle(patch.cornerSquareType)
    if (patch.cornerSquareColorMode) setSelectedCornerSquareColorMode(patch.cornerSquareColorMode)
    if (patch.cornerSquareSolidColor) {
      setSelectedCornerSquareColorMode("solid")
      setSelectedCornerSquareColor(patch.cornerSquareSolidColor)
    }
    if (patch.cornerSquareGradient) {
      setSelectedCornerSquareColorMode("gradient")
      setSelectedCornerSquareGradient({ ...patch.cornerSquareGradient, enabled: true })
    }
    if (patch.cornerDotType) setSelectedQrFinderPatternInnerStyle(patch.cornerDotType)
    if (patch.cornerDotColorMode) setSelectedCornerDotColorMode(patch.cornerDotColorMode)
    if (patch.cornerDotSolidColor) {
      setSelectedCornerDotColorMode("solid")
      setSelectedCornerDotColor(patch.cornerDotSolidColor)
    }
    if (patch.cornerDotGradient) {
      setSelectedCornerDotColorMode("gradient")
      setSelectedCornerDotGradient({ ...patch.cornerDotGradient, enabled: true })
    }
  }

  function applyDesktopUnifiedLogoPatchToControls(patch: Partial<DesktopLogoSettings>) {
    if (patch.colorMode) setSelectedLogoColorMode(patch.colorMode)
    if (patch.solidColor) {
      setSelectedLogoColorMode("solid")
      setSelectedLogoColor(patch.solidColor)
    }
    if (patch.gradient) {
      setSelectedLogoColorMode("gradient")
      setSelectedLogoGradient({ ...patch.gradient, enabled: true })
    }
  }

  function updateDesktopPatternSettings(patch: DesktopPatternSettingsPatch) {
    applyDesktopPatternPatchToControls(patch)
    const nextState = applyPatternSettingsPatchToQraftyState(resolveLiveQrPersistState(), patch)

    clearQrEncodeMarkupCache()
    clearDraftingQrMarkupCache()
    persistActiveQrLayerState(nextState)
    qrControls.syncModuleFill(nextState)
  }

  function updateDesktopUnifiedQrFillSettings(patches: UnifiedQrFillPatches) {
    applyDesktopPatternPatchToControls(patches.pattern)
    applyDesktopCornersPatchToControls(patches.corners)
    applyDesktopUnifiedLogoPatchToControls(patches.logo)

    let nextState = resolveLiveQrPersistState()
    nextState = applyPatternSettingsPatchToQraftyState(nextState, patches.pattern)
    nextState = applyCornersSettingsPatchToQraftyState(nextState, patches.corners)
    nextState = applyLogoSettingsPatchToQraftyState(nextState, patches.logo)

    // A preset logo stores its rendered SVG in `logo.value`. Updating only
    // `presetColor` leaves that SVG painted with its previous color.
    if (patches.logo.solidColor) {
      const brandIcon = findBrandIconById(nextState.logo.presetId)
      if (brandIcon) {
        nextState = applyLogoPresetColor(
          nextState,
          createBrandIconDataUrl(brandIcon, patches.logo.solidColor),
          patches.logo.solidColor,
        )
      }
    }

    clearQrEncodeMarkupCache()
    clearDraftingQrMarkupCache()
    persistActiveQrLayerState(nextState)
    qrControls.syncModuleFill(nextState)
    qrControls.syncLogo(nextState)
  }

  function resetDesktopPatternSettings() {
    setSelectedDotType(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.type)
    setSelectedDotsColorMode(DEFAULT_DRAFTING_STUDIO_STATE.dotsColorMode)
    setSelectedDotColor(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.color)
    setSelectedDotsGradient(structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesGradient))
    setSelectedDotsPalette([...DEFAULT_DRAFTING_STUDIO_STATE.dotsPalette])
    setSelectedDotsPalettePreset("Signal")
    setSelectedModuleFillImageUrl("")
    setSelectedModuleFillRemoteUrl("")
    setSelectedModuleFillImageSourceMode("upload")
    setSelectedModuleRoundSize(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.roundSize)
    setSelectedModuleSize(undefined)
    setSelectedModuleLineWidth(undefined)
    setSelectedGradientLinkMode(DEFAULT_DRAFTING_STUDIO_STATE.gradientLinkMode)
  }

  function updateDesktopLogoSettings(patch: DesktopLogoSettingsPatch) {
    if (patch.uploadedFile) {
      const uploadValue = replaceTrackedObjectUrl(
        logoUploadObjectUrlRef,
        patch.uploadedFile,
        setLogoUploadObjectUrl,
      )
      const nextState = applyAssetUploadValue(draftingQraftyState, "logo", uploadValue)
      commitActiveQraftyState(nextState)
    }
    if (patch.uploadedImageUrl !== undefined) {
      commitActiveQraftyState(
        patch.uploadedImageUrl
          ? applyAssetUploadValue(draftingQraftyState, "logo", patch.uploadedImageUrl)
          : applyAssetNoneSelection(draftingQraftyState, "logo"),
      )
    }
    if (patch.sourceMode) {
      if (patch.sourceMode === "none") {
        commitActiveQraftyState(applyAssetNoneSelection(draftingQraftyState, "logo"))
      } else if (patch.sourceMode === "brand") {
        setSelectedLogoSourceMode("preset")
      } else if (patch.sourceMode === "url") {
        const nextState = applyAssetUrlValue(
          draftingQraftyState,
          "logo",
          selectedLogoRemoteUrl,
        )
        commitActiveQraftyState(nextState)
      } else {
        logoActions.clearLogoPreset("upload")
      }
    }
    if (patch.uploadMode) {
      if (patch.uploadMode === "url") {
        const nextState = applyAssetUrlValue(
          draftingQraftyState,
          "logo",
          selectedLogoRemoteUrl,
        )
        commitActiveQraftyState(nextState)
      } else {
        logoActions.clearLogoPreset("upload")
      }
    }
    if (patch.remoteUrl !== undefined) {
      const nextState = applyAssetUrlValue(draftingQraftyState, "logo", patch.remoteUrl)
      commitActiveQraftyState(nextState)
    }
    if (patch.selectedBrandIconId) {
      if (parseIconstackSelectionId(patch.selectedBrandIconId)) {
        void logoActions.selectIconstackIcon(patch.selectedBrandIconId)
      } else {
        const brandIcon = findBrandIconById(patch.selectedBrandIconId)
        if (brandIcon) logoActions.selectBrandIcon(brandIcon)
      }
    }
    if (patch.colorMode) setSelectedLogoColorMode(patch.colorMode)
    if (patch.solidColor) void logoActions.changeLogoColor(patch.solidColor)
    if (patch.gradient) void logoActions.changeLogoGradient({ ...patch.gradient, enabled: true })
    logoActions.patchLogoImageOptions(patch)
  }

  function resetDesktopLogoSettings() {
    qrControls.applyQrState(createDefaultDraftingWorkspaceQrState())
  }

  function updateDesktopCornersSettings(patch: Partial<DesktopCornersSettings>) {
    applyDesktopCornersPatchToControls(patch)

    const nextState = applyCornersSettingsPatchToQraftyState(resolveLiveQrPersistState(), patch)
    clearQrEncodeMarkupCache()
    clearDraftingQrMarkupCache()
    persistActiveQrLayerState(nextState)
  }

  function mergeCardStateFromShapePatch(patch: Partial<DesktopShapeSettings>) {
    const nextCornerRadius = patch.cardRadius ?? selectedCardState.cornerRadius

    return {
      ...selectedCardState,
      bottomSpace: patch.bottomSpace ?? selectedCardState.bottomSpace,
      cornerRadius: nextCornerRadius,
      cornerRadii:
        patch.cardRadius !== undefined
          ? createUniformCornerRadii(nextCornerRadius)
          : selectedCardState.cornerRadii,
      enabled:
        patch.sizeMode === "fixed" ||
        patch.cardWidth !== undefined ||
        patch.cardHeight !== undefined ||
        patch.sizePresetId !== undefined
          ? true
          : selectedCardState.enabled,
      fill: patch.cardFill ?? selectedCardState.fill,
      height: patch.cardHeight ?? selectedCardState.height,
      lockAspectRatio: patch.lockAspectRatio ?? selectedCardState.lockAspectRatio,
      shadow: cardShadowFromPatch(patch),
      sizeMode: patch.sizeMode ?? selectedCardState.sizeMode,
      sizePresetId:
        patch.sizePresetId !== undefined ? patch.sizePresetId : selectedCardState.sizePresetId,
      styleMode:
        patch.cardFill !== undefined
          ? "solid"
          : selectedCardState.styleMode,
      width: patch.cardWidth ?? selectedCardState.width,
    }
  }

  function cardShadowFromPatch(patch: Partial<DesktopShapeSettings>) {
    return {
      ...selectedCardState.shadow,
      blur: patch.shadowBlur ?? selectedCardState.shadow.blur,
      color: patch.shadowColor ?? selectedCardState.shadow.color,
      offsetX: patch.shadowOffsetX ?? selectedCardState.shadow.offsetX,
      offsetY: patch.shadowOffsetY ?? selectedCardState.shadow.offsetY,
      opacity: patch.shadowOpacity ?? selectedCardState.shadow.opacity,
    }
  }

  function relayoutCardInset(normalizedCardState: ReturnType<typeof normalizeDraftingCardState>) {
    const baseQrState = resolveLiveQrPersistState()
    const fittedQr = fitQrSizeInCard(baseQrState, normalizedCardState)
    const nextQrState = {
      ...baseQrState,
      height: fittedQr.height,
      width: fittedQr.width,
    }

    if (normalizedCardState.sizeMode === "fixed") {
      setSelectedQrSize(fittedQr.width)
    }

    setLayerStateByNodeId((layerState) => {
      const layers =
        layerState[activeQrNodeId] ??
        createDefaultDraftingLayers(activeQrNodeId, nextQrState, normalizedCardState)

      return {
        ...layerState,
        [activeQrNodeId]: layoutDraftingCardInsetLayers(
          layers.map(cloneDraftingCanvasLayer),
          nextQrState,
          normalizedCardState,
        ),
      }
    })
  }

  function updateDesktopShapeSettings(patch: Partial<DesktopShapeSettings>) {
    if (patch.backgroundShapeId !== undefined) setSelectedBackgroundShapeId(patch.backgroundShapeId)
    if (patch.shapeColorMode) setSelectedBackgroundColorMode(patch.shapeColorMode)
    if (patch.shapeSolidColor) {
      setSelectedBackgroundColorMode("solid")
      setSelectedBackgroundColor(patch.shapeSolidColor)
      setSelectedBackgroundTransparent(false)
    }
    if (patch.shapeGradient) {
      setSelectedBackgroundColorMode("gradient")
      setSelectedBackgroundGradient({ ...patch.shapeGradient, enabled: true })
      setSelectedBackgroundTransparent(false)
    }
    if (patch.shapePadding !== undefined) {
      const paddingPx = patch.shapePadding
      setSelectedBackgroundShapeOptions((current) => ({ ...current, paddingPx }))
    }

    const qrShadowPatch = Object.fromEntries(
      (
        [
          ["blur", patch.shapeShadowBlur],
          ["color", patch.shapeShadowColor],
          ["offsetX", patch.shapeShadowOffsetX],
          ["offsetY", patch.shapeShadowOffsetY],
          ["opacity", patch.shapeShadowOpacity],
        ] as const
      ).filter(([, value]) => value !== undefined),
    )

    if (Object.keys(qrShadowPatch).length > 0) {
      const qrLayerId = getDraftingQrLayerId(activeQrNodeId)
      const currentQrLayer = findDraftingLayerById(activeCanvasLayers, qrLayerId)
      if (currentQrLayer) {
        handleLayerChange(activeQrNodeId, qrLayerId, {
          shadow: { ...currentQrLayer.shadow, ...qrShadowPatch },
        })
      }
    }

    const normalizedCardState = normalizeDraftingCardState(
      mergeCardStateFromShapePatch(patch),
    )
    setSelectedCardState(normalizedCardState)

    const shouldRelayoutCardInset =
      patch.bottomSpace !== undefined ||
      patch.cardHeight !== undefined ||
      patch.cardWidth !== undefined ||
      patch.sizeMode !== undefined ||
      patch.sizePresetId !== undefined

    if (shouldRelayoutCardInset) {
      relayoutCardInset(normalizedCardState)
    }

    if (
      patch.shadowBlur !== undefined ||
      patch.shadowColor !== undefined ||
      patch.shadowOffsetX !== undefined ||
      patch.shadowOffsetY !== undefined ||
      patch.shadowOpacity !== undefined
    ) {
      handleLayerChange(activeQrNodeId, getDraftingCardLayerId(activeQrNodeId), {
        shadow: cardShadowFromPatch(patch),
      })
    }
  }

  function updateDesktopImageSettings(patch: Partial<DesktopImageSettings>) {
    setSelectedCardState((current) => {
      if (patch.remoteUrl === "") {
        return {
          ...current,
          cardImage: {
            ...current.cardImage,
            opacity: patch.opacity ?? current.cardImage.opacity,
            source: "none",
            value: undefined,
          },
          styleMode: "paper-shader",
        }
      }

      const nextRemoteUrl =
        patch.remoteUrl !== undefined ? patch.remoteUrl : current.cardImage.value

      return {
        ...current,
        cardImage: {
          ...current.cardImage,
          fit: patch.fit ?? current.cardImage.fit,
          opacity: patch.opacity ?? current.cardImage.opacity,
          source:
            patch.sourceMode === "url"
              ? "url"
              : patch.sourceMode === "upload"
                ? "upload"
                : current.cardImage.source,
          value: nextRemoteUrl,
        },
        styleMode: nextRemoteUrl ? "image" : current.styleMode,
      }
    })
  }

  function resetDesktopShapeSettings() {
    const defaultCard = createDefaultDraftingCardState()
    setSelectedCardState(defaultCard)
    setSelectedBackgroundColor(DEFAULT_DRAFTING_STUDIO_STATE.backgroundOptions.color)
    setSelectedBackgroundColorMode(DEFAULT_DRAFTING_STUDIO_STATE.backgroundGradient.enabled ? "gradient" : "solid")
    setSelectedBackgroundGradient(structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.backgroundGradient))
    setSelectedBackgroundShapeId(DEFAULT_DRAFTING_STUDIO_STATE.backgroundShapeId)
    setSelectedBackgroundShapeOptions({ ...DEFAULT_DRAFTING_STUDIO_STATE.backgroundShapeOptions })
  }

  function updateDesktopMotionSettings(patch: Parameters<typeof setDotMatrixAnimationOptions>[1]) {
    if (patch.enabled !== undefined) {
      clearQrEncodeMarkupCache()
      clearDraftingQrMarkupCache()
    }

    setSelectedDotMatrixAnimation((current) =>
      setDotMatrixAnimationOptions(
        { ...DEFAULT_DRAFTING_STUDIO_STATE, dotMatrixAnimation: current },
        patch,
      ).dotMatrixAnimation,
    )
  }

  function updateDesktopEncodingSettings(patch: Partial<DesktopEncodingSettings>) {
    if (patch.typeNumber !== undefined) setSelectedQrTypeNumber(patch.typeNumber)
    if (patch.errorCorrectionLevel) setSelectedQrErrorCorrectionLevel(patch.errorCorrectionLevel)
    if (patch.boostLevel !== undefined) setSelectedBoostLevel(patch.boostLevel)
    if (patch.valueSegmentsText !== undefined) setSelectedValueSegmentsText(patch.valueSegmentsText)
  }

  function updateDesktopAccessibilitySettings(patch: Partial<DesktopAccessibilitySettings>) {
    if (patch.ariaLabel !== undefined) setSelectedAriaLabel(patch.ariaLabel)
  }

  function updateDesktopTextSettings(patch: Partial<DesktopTextSettings>) {
    if (selectedTextLayer?.kind === "text") {
      handleLayerChange(activeQrNodeId, selectedTextLayer.id, patch)
      return
    }
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState)
    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1)
    const textLayer = createDraftingTextLayer(activeQrNodeId, {
      ...patch,
      id: `${activeQrNodeId}:text:${Date.now()}`,
      zIndex: maxZIndex + 1,
    })
    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: [...layers.map(cloneDraftingCanvasLayer), textLayer],
    }))
    selectSingleLayer(textLayer.id)
  }

  function updateDesktopLayersSettings(patch: Partial<DesktopLayersSettings>) {
    if (patch.selectedLayerId !== undefined) {
      handleLayerSelect(activeQrNodeId, patch.selectedLayerId, { preserveActiveTool: true })
    }
    if (patch.layers) {
      const mergedRows = ensureMandatoryDesktopLayerRows(patch.layers, activeCanvasLayers)
      const currentLayersById = new Map(activeCanvasLayers.map((layer) => [layer.id, layer]))
      const nextLayers = mergedRows.map((row) => {
        const layer = currentLayersById.get(row.id) ?? createDraftingTextLayer(activeQrNodeId, { id: row.id })

        return patchDraftingCanvasLayer(layer, {
          blur: row.blur,
          height: row.height,
          isVisible: true,
          name: row.name,
          opacity: row.opacity / 100,
          shadow: {
            ...layer.shadow,
            blur: row.shadowBlur,
            color: row.shadowColor,
            offsetX: row.shadowOffsetX,
            offsetY: row.shadowOffsetY,
            opacity: row.shadowOpacity,
          },
          tiltX: row.tiltX,
          tiltY: row.tiltY,
          width: row.width,
          x: row.x,
          y: row.y,
        })
      })
      setLayerStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: nextLayers,
      }))
    }
  }

  function updateDesktopExportSettings(patch: Partial<DesktopExportSettings>) {
    if (patch.extension) setSelectedDownloadExtension(patch.extension as DraftingDownloadExtension)
    if (patch.photoLongEdge) setSelectedPhotoLongEdge(patch.photoLongEdge)
    if (patch.target) setSelectedDownloadTarget(getDraftingDownloadTarget(patch.target))
    if (patch.mediaKind) setSelectedExportMediaKind(patch.mediaKind)
    if (patch.videoDurationSeconds) setSelectedVideoDurationSeconds(patch.videoDurationSeconds)
    if (patch.videoFormat) setSelectedVideoFormat(patch.videoFormat)
    if (patch.videoFrameRate) setSelectedVideoFrameRate(patch.videoFrameRate)
    if (patch.videoLongEdge) setSelectedVideoLongEdge(patch.videoLongEdge)
  }

  return {
    handleDesktopAppearancePatch,
    resetDesktopContent,
    applyDesktopPatternPatchToControls,
    applyDesktopCornersPatchToControls,
    applyDesktopUnifiedLogoPatchToControls,
    updateDesktopPatternSettings,
    updateDesktopUnifiedQrFillSettings,
    resetDesktopPatternSettings,
    updateDesktopLogoSettings,
    resetDesktopLogoSettings,
    updateDesktopCornersSettings,
    mergeCardStateFromShapePatch,
    cardShadowFromPatch,
    relayoutCardInset,
    updateDesktopShapeSettings,
    updateDesktopImageSettings,
    resetDesktopShapeSettings,
    updateDesktopMotionSettings,
    updateDesktopEncodingSettings,
    updateDesktopAccessibilitySettings,
    updateDesktopTextSettings,
    updateDesktopLayersSettings,
    updateDesktopExportSettings,
  }
}
