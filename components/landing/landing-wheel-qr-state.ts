import type { QraftyGradient } from "@/features/qr-code/model/state"
import {
  createDefaultQraftyState,
  type QraftyDataModulesStyle,
  type QraftyState,
} from "@/features/qr-code/model/state"
import type { QrFinderPatternInnerStyle, QrFinderPatternOuterStyle } from "@/features/qr-code/model/types"

import type { LandingWheelCardPreset } from "@/components/landing/landing-card-wheel-presets"

export function buildLandingWheelQrState(
  preset: LandingWheelCardPreset,
  logoSrc?: string,
): QraftyState {
  const state = createDefaultQraftyState()
  const palette = [...preset.palette]

  state.data = preset.url
  state.width = preset.qrSize
  state.height = preset.qrSize
  state.margin = 1
  state.backgroundOptions.transparent = true
  state.backgroundOptions.color = "#ffffff"
  state.dotsColorMode = "palette"
  state.dotsPalette = palette
  state.dataModulesSettings.type = preset.module
  state.dataModulesSettings.color = palette[0]
  state.finderPatternInnerSettings.type = preset.finderInner
  state.finderPatternInnerSettings.color = palette[0]
  state.finderPatternOuterSettings.type = preset.finderOuter
  state.finderPatternOuterSettings.color = palette[1]
  state.dataModulesGradient.enabled = false
  state.finderPatternInnerGradient.enabled = false
  state.finderPatternOuterGradient.enabled = false
  state.gradientLinkMode = "split"
  state.qrOptions.errorCorrectionLevel = "H"
  state.qrOptions.boostLevel = true
  state.imageOptions.imageSize = 0.2
  state.imageOptions.hideBackgroundDots = true

  if (logoSrc) {
    state.logo = {
      presetColor: undefined,
      presetId: undefined,
      source: "url",
      value: logoSrc,
    }
  } else {
    state.logo = {
      presetColor: undefined,
      presetId: undefined,
      source: "none",
      value: undefined,
    }
  }

  return state
}
