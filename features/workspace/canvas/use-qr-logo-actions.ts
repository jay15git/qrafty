"use client"

import { useRef } from "react"

import type { BrandIconEntry } from "@/features/qr-code/assets/brand-icons"
import { findBrandIconById } from "@/features/qr-code/assets/brand-icons"
import {
  fetchIconSvg,
  parseIconstackSelectionId,
} from "@/features/qr-code/assets/iconstack-api"
import {
  createIconstackIconDataUrl,
  createIconstackIconGradientDataUrl,
} from "@/features/qr-code/assets/iconstack-svg"
import {
  createBrandIconDataUrl,
  createBrandIconGradientDataUrl,
} from "@/features/qr-code/assets/brand-icon-svg"
import {
  applyAssetNoneSelection,
  applyIconstackLogoPresetSelection,
  applyLogoPresetColor,
  applyLogoPresetGradient,
  applyLogoPresetSelection,
} from "@/features/qr-code/model/actions"
import type { QraftyGradient, QraftyState } from "@/features/qr-code/model/state"
import type { DesktopLogoSettingsPatch } from "@/features/desktop-shell/model/desktop-toolbar-types"
import type { DraftingAssetSourceMode } from "@/features/workspace/components/workspace-surface-reducer"

export function useQrLogoActions({
  commitState,
  selectedLogoColor,
  selectedLogoColorMode,
  selectedLogoGradient,
  selectedLogoPresetId,
  setLogoAssetSourceMode,
  state,
}: {
  commitState: (nextState: QraftyState) => void
  selectedLogoColor: string
  selectedLogoColorMode: "solid" | "gradient"
  selectedLogoGradient: QraftyGradient
  selectedLogoPresetId: string | undefined
  setLogoAssetSourceMode: (mode: DraftingAssetSourceMode) => void
  state: QraftyState
}) {
  const iconstackSvgCacheRef = useRef<Map<string, string>>(new Map())

  const resolveIconstackSvgMarkup = async (selectionId: string) => {
    const cached = iconstackSvgCacheRef.current.get(selectionId)
    if (cached) {
      return cached
    }

    const parsed = parseIconstackSelectionId(selectionId)
    if (!parsed) {
      return undefined
    }

    const response = await fetchIconSvg({
      library: parsed.library,
      id: parsed.iconId,
    })

    iconstackSvgCacheRef.current.set(selectionId, response.svg)
    return response.svg
  }

  const selectIconstackIcon = async (selectionId: string) => {
    const svg = await resolveIconstackSvgMarkup(selectionId)
    if (!svg) {
      return
    }

    const nextValue =
      selectedLogoColorMode === "gradient"
        ? createIconstackIconGradientDataUrl(svg, {
            ...structuredClone(selectedLogoGradient),
            enabled: true,
          })
        : createIconstackIconDataUrl(svg, selectedLogoColor)
    const nextState = applyIconstackLogoPresetSelection(
      state,
      selectionId,
      nextValue,
      selectedLogoColor,
    )

    commitState(nextState)
  }

  const selectBrandIcon = (brandIcon: BrandIconEntry) => {
    const nextValue =
      selectedLogoColorMode === "gradient"
        ? createBrandIconGradientDataUrl(brandIcon, {
            ...structuredClone(selectedLogoGradient),
            enabled: true,
          })
        : createBrandIconDataUrl(brandIcon, selectedLogoColor)
    const nextState = applyLogoPresetSelection(
      state,
      brandIcon,
      nextValue,
      selectedLogoColor,
    )

    commitState(nextState)
  }

  const changeLogoColor = async (value: string) => {
    const iconstackSelectionId = parseIconstackSelectionId(selectedLogoPresetId)
      ? selectedLogoPresetId
      : undefined

    if (iconstackSelectionId) {
      const svg = await resolveIconstackSvgMarkup(iconstackSelectionId)
      if (!svg) {
        return
      }

      commitState(
        applyLogoPresetColor(state, createIconstackIconDataUrl(svg, value), value),
      )
      return
    }

    const selectedIcon = findBrandIconById(selectedLogoPresetId)

    if (!selectedIcon) {
      return
    }

    commitState(
      applyLogoPresetColor(state, createBrandIconDataUrl(selectedIcon, value), value),
    )
  }

  const changeLogoGradient = async (value: QraftyGradient) => {
    const nextGradient = {
      ...structuredClone(value),
      enabled: true,
    }

    const iconstackSelectionId = parseIconstackSelectionId(selectedLogoPresetId)
      ? selectedLogoPresetId
      : undefined

    if (iconstackSelectionId) {
      const svg = await resolveIconstackSvgMarkup(iconstackSelectionId)
      if (!svg) {
        return
      }

      commitState(
        applyLogoPresetGradient(
          state,
          createIconstackIconGradientDataUrl(svg, nextGradient),
          nextGradient,
        ),
      )
      return
    }

    const selectedIcon = findBrandIconById(selectedLogoPresetId)

    if (!selectedIcon) {
      return
    }

    commitState(
      applyLogoPresetGradient(
        state,
        createBrandIconGradientDataUrl(selectedIcon, nextGradient),
        nextGradient,
      ),
    )
  }

  const clearLogoPreset = (nextSourceMode: DraftingAssetSourceMode) => {
    const clearedState = applyAssetNoneSelection(state, "logo")

    setLogoAssetSourceMode(nextSourceMode)

    if (nextSourceMode === "upload") {
      commitState({
        ...clearedState,
        logo: {
          ...clearedState.logo,
          source: "upload",
          value: undefined,
        },
      })
      return
    }

    commitState(clearedState)
  }

  const patchLogoImageOptions = (
    patch: Pick<
      DesktopLogoSettingsPatch,
      | "size"
      | "margin"
      | "hideBackgroundDots"
      | "opacity"
      | "sizeMode"
      | "widthPx"
      | "heightPx"
      | "lockAspect"
      | "positionMode"
      | "offsetX"
      | "offsetY"
      | "crossOrigin"
    >,
  ) => {
    const nextImageOptions = { ...state.imageOptions }
    let changed = false

    if (patch.size !== undefined) {
      nextImageOptions.imageSize = patch.size / 100
      changed = true
    }
    if (patch.margin !== undefined) {
      nextImageOptions.margin = patch.margin
      changed = true
    }
    if (patch.hideBackgroundDots !== undefined) {
      nextImageOptions.hideBackgroundDots = patch.hideBackgroundDots
      changed = true
    }
    if (patch.opacity !== undefined) {
      nextImageOptions.opacity = patch.opacity / 100
      changed = true
    }
    if (patch.sizeMode) {
      nextImageOptions.sizeMode = patch.sizeMode
      changed = true
    }
    if (patch.widthPx !== undefined) {
      nextImageOptions.widthPx = patch.widthPx
      changed = true
    }
    if (patch.heightPx !== undefined) {
      nextImageOptions.heightPx = patch.heightPx
      changed = true
    }
    if (patch.lockAspect !== undefined) {
      nextImageOptions.lockAspect = patch.lockAspect
      changed = true
    }
    if (patch.positionMode) {
      nextImageOptions.logoPositionMode = patch.positionMode
      changed = true
    }
    if (patch.offsetX !== undefined) {
      nextImageOptions.x = patch.offsetX
      changed = true
    }
    if (patch.offsetY !== undefined) {
      nextImageOptions.y = patch.offsetY
      changed = true
    }
    if (patch.crossOrigin !== undefined) {
      nextImageOptions.crossOrigin = patch.crossOrigin
      changed = true
    }

    if (!changed) {
      return
    }

    commitState({
      ...state,
      imageOptions: nextImageOptions,
    })
  }

  return {
    changeLogoColor,
    changeLogoGradient,
    clearLogoPreset,
    patchLogoImageOptions,
    resolveIconstackSvgMarkup,
    selectBrandIcon,
    selectIconstackIcon,
  }
}
