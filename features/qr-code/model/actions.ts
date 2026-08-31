import type { BrandIconEntry } from "@/features/qr-code/assets/brand-icons"
import type {
  QraftyState,
  QraftyGradient,
} from "@/features/qr-code/model/state"

export type DashboardCornerColorKey = "cornersSquare" | "cornersDot"
export type DashboardAssetKey = "backgroundImage" | "logo"

export function createDashboardAccordionOpenItemIds(selectedItemId: string) {
  return [selectedItemId]
}

export function ensureDashboardAccordionItemExpanded(
  openItemIds: string[],
  selectedItemId: string,
) {
  return openItemIds.includes(selectedItemId)
    ? openItemIds
    : [...openItemIds, selectedItemId]
}

export function applyDotsSolidColor(state: QraftyState, color: string) {
  return {
    ...state,
    dotsColorMode: "solid" as const,
    dataModulesSettings: {
      ...state.dataModulesSettings,
      color,
    },
  }
}

export function applyDotsGradient(state: QraftyState, gradient: QraftyGradient) {
  return {
    ...state,
    dotsColorMode: "gradient" as const,
    dataModulesGradient: {
      ...gradient,
      enabled: true,
    },
  }
}

export function applyDotsPaletteSelection(state: QraftyState) {
  return {
    ...state,
    dotsColorMode: "palette" as const,
  }
}

export function applyCornerSolidColor(
  state: QraftyState,
  cornerKey: DashboardCornerColorKey,
  color: string,
) {
  if (cornerKey === "cornersSquare") {
    return {
      ...state,
      finderPatternOuterSettings: {
        ...state.finderPatternOuterSettings,
        color,
      },
      finderPatternOuterGradient: {
        ...state.finderPatternOuterGradient,
        enabled: false,
      },
    }
  }

  return {
    ...state,
    finderPatternInnerSettings: {
      ...state.finderPatternInnerSettings,
      color,
    },
    finderPatternInnerGradient: {
      ...state.finderPatternInnerGradient,
      enabled: false,
    },
  }
}

export function applyCornerGradient(
  state: QraftyState,
  cornerKey: DashboardCornerColorKey,
  gradient: QraftyGradient,
) {
  if (cornerKey === "cornersSquare") {
    return {
      ...state,
      finderPatternOuterGradient: {
        ...gradient,
        enabled: true,
      },
    }
  }

  return {
    ...state,
    finderPatternInnerGradient: {
      ...gradient,
      enabled: true,
    },
  }
}

export function applyBackgroundSolidColor(state: QraftyState, color: string) {
  return {
    ...state,
    backgroundOptions: {
      ...state.backgroundOptions,
      color,
      transparent: false,
    },
    backgroundGradient: {
      ...state.backgroundGradient,
      enabled: false,
    },
  }
}

export function applyBackgroundGradient(
  state: QraftyState,
  gradient: QraftyGradient,
) {
  return {
    ...state,
    backgroundOptions: {
      ...state.backgroundOptions,
      transparent: false,
    },
    backgroundGradient: {
      ...gradient,
      enabled: true,
    },
  }
}

export function applyBackgroundTransparentSelection(state: QraftyState) {
  return {
    ...state,
    backgroundOptions: {
      ...state.backgroundOptions,
      transparent: true,
    },
    backgroundGradient: {
      ...state.backgroundGradient,
      enabled: false,
    },
  }
}

export function applyAssetNoneSelection(
  state: QraftyState,
  assetKey: DashboardAssetKey,
) {
  return {
    ...state,
    [assetKey]: {
      presetColor: undefined,
      presetId: undefined,
      source: "none",
      value: undefined,
    },
  }
}

export function applyAssetUrlValue(
  state: QraftyState,
  assetKey: DashboardAssetKey,
  value: string,
) {
  return {
    ...state,
    [assetKey]: {
      presetColor: undefined,
      presetId: undefined,
      source: "url",
      value,
    },
  }
}

export function applyAssetUploadValue(
  state: QraftyState,
  assetKey: DashboardAssetKey,
  value: string,
) {
  return {
    ...state,
    [assetKey]: {
      presetColor: undefined,
      presetId: undefined,
      source: "upload" as const,
      value,
    },
  }
}

export function applyIconstackLogoPresetSelection(
  state: QraftyState,
  presetId: string,
  value: string,
  presetColor: string,
) {
  return {
    ...state,
    logo: {
      presetColor,
      presetId,
      source: "preset" as const,
      value,
    },
  }
}

export function applyLogoPresetSelection(
  state: QraftyState,
  brandIcon: BrandIconEntry,
  value: string,
  presetColor: string,
) {
  return {
    ...state,
    logo: {
      presetColor,
      presetId: brandIcon.id as QraftyState["logo"]["presetId"],
      source: "preset" as const,
      value,
    },
  }
}

export function applyLogoPresetColor(
  state: QraftyState,
  value: string | undefined,
  presetColor: string,
) {
  return {
    ...state,
    logo: {
      ...state.logo,
      presetColor,
      source: "preset" as const,
      value,
    },
    logoGradient: {
      ...state.logoGradient,
      enabled: false,
    },
  }
}

export function applyLogoPresetGradient(
  state: QraftyState,
  value: string | undefined,
  gradient: QraftyGradient,
) {
  return {
    ...state,
    logo: {
      ...state.logo,
      source: "preset" as const,
      value,
    },
    logoGradient: {
      ...gradient,
      enabled: true,
    },
  }
}
