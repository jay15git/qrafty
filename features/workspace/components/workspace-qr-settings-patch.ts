import type { DesktopPatternSettingsPatch } from "@/features/desktop-shell/model/desktop-toolbar-types"
import type { DesktopCornersSettings } from "@/features/desktop-shell/model/desktop-toolbar-types"
import type { QraftyState } from "@/features/qr-code/model/state"

export function applyPatternSettingsPatchToQraftyState(
  state: QraftyState,
  patch: DesktopPatternSettingsPatch,
): QraftyState {
  let next = state

  if (patch.qrDotType) {
    next = {
      ...next,
      dataModulesSettings: {
        ...next.dataModulesSettings,
        type: patch.qrDotType,
      },
    }
  }

  if (patch.moduleRoundSize !== undefined) {
    next = {
      ...next,
      dataModulesSettings: {
        ...next.dataModulesSettings,
        roundSize: patch.moduleRoundSize,
      },
    }
  }

  if (patch.moduleSize !== undefined) {
    next = {
      ...next,
      dataModulesSettings: {
        ...next.dataModulesSettings,
        moduleSize: patch.moduleSize,
      },
    }
  }

  if (patch.moduleLineWidth !== undefined) {
    next = {
      ...next,
      dataModulesSettings: {
        ...next.dataModulesSettings,
        lineWidth: patch.moduleLineWidth,
      },
    }
  }

  if (patch.gradientLinkMode) {
    next = {
      ...next,
      gradientLinkMode: patch.gradientLinkMode,
    }
  }

  if (patch.dotsColorMode) {
    next = {
      ...next,
      dotsColorMode: patch.dotsColorMode,
    }
  }

  if (patch.dotsSolidColor) {
    next = {
      ...next,
      dotsColorMode: "solid",
      dataModulesSettings: {
        ...next.dataModulesSettings,
        color: patch.dotsSolidColor,
      },
    }
  }

  if (patch.dataModulesGradient) {
    next = {
      ...next,
      dotsColorMode: "gradient",
      dataModulesGradient: { ...patch.dataModulesGradient, enabled: true },
    }
  }

  if (patch.dotsPalette) {
    next = {
      ...next,
      dotsColorMode: "palette",
      dotsPalette: [...patch.dotsPalette],
    }
  }

  if (patch.moduleFillImageUrl !== undefined) {
    const sourceMode = patch.moduleFillImageSourceMode ?? "upload"
    next = {
      ...next,
      dotsColorMode: "image",
      moduleFillImage: {
        presetColor: undefined,
        presetId: undefined,
        source: sourceMode === "url" ? "url" : "upload",
        value: patch.moduleFillImageUrl || undefined,
      },
    }
  }

  if (patch.moduleFillImageSourceMode && patch.moduleFillImageUrl === undefined) {
    next = {
      ...next,
      dotsColorMode: "image",
      moduleFillImage: {
        ...next.moduleFillImage,
        source: patch.moduleFillImageSourceMode === "url" ? "url" : "upload",
      },
    }
  }

  return next
}

export function applyCornersSettingsPatchToQraftyState(
  state: QraftyState,
  patch: Partial<DesktopCornersSettings>,
): QraftyState {
  let next = state

  if (patch.cornerSquareType) {
    next = {
      ...next,
      finderPatternOuterSettings: {
        ...next.finderPatternOuterSettings,
        type: patch.cornerSquareType,
      },
    }
  }

  if (patch.cornerSquareColorMode) {
    next = {
      ...next,
      finderPatternOuterGradient: {
        ...next.finderPatternOuterGradient,
        enabled: patch.cornerSquareColorMode === "gradient",
      },
    }
  }

  if (patch.cornerSquareSolidColor) {
    next = {
      ...next,
      finderPatternOuterSettings: {
        ...next.finderPatternOuterSettings,
        color: patch.cornerSquareSolidColor,
      },
      finderPatternOuterGradient: {
        ...next.finderPatternOuterGradient,
        enabled: false,
      },
    }
  }

  if (patch.cornerSquareGradient) {
    next = {
      ...next,
      finderPatternOuterGradient: { ...patch.cornerSquareGradient, enabled: true },
    }
  }

  if (patch.cornerDotType) {
    next = {
      ...next,
      finderPatternInnerSettings: {
        ...next.finderPatternInnerSettings,
        type: patch.cornerDotType,
      },
    }
  }

  if (patch.cornerDotColorMode) {
    next = {
      ...next,
      finderPatternInnerGradient: {
        ...next.finderPatternInnerGradient,
        enabled: patch.cornerDotColorMode === "gradient",
      },
    }
  }

  if (patch.cornerDotSolidColor) {
    next = {
      ...next,
      finderPatternInnerSettings: {
        ...next.finderPatternInnerSettings,
        color: patch.cornerDotSolidColor,
      },
      finderPatternInnerGradient: {
        ...next.finderPatternInnerGradient,
        enabled: false,
      },
    }
  }

  if (patch.cornerDotGradient) {
    next = {
      ...next,
      finderPatternInnerGradient: { ...patch.cornerDotGradient, enabled: true },
    }
  }

  return next
}
