import type { BrandIconEntry } from "@/features/qr/assets/brand-icons";
import type { QraftyState, QraftyGradient } from "@/features/qr/model/state";

export type DashboardAssetKey = "backgroundImage" | "logo";

export function applyAssetNoneSelection(state: QraftyState, assetKey: DashboardAssetKey) {
  return {
    ...state,
    [assetKey]: {
      presetColor: undefined,
      presetId: undefined,
      source: "none",
      value: undefined,
    },
  };
}

export function applyAssetUrlValue(state: QraftyState, assetKey: DashboardAssetKey, value: string) {
  return {
    ...state,
    [assetKey]: {
      presetColor: undefined,
      presetId: undefined,
      source: "url",
      value,
    },
  };
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
  };
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
  };
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
  };
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
  };
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
  };
}
