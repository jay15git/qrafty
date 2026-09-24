import { lazy } from "react";

import type { LockedFillPickerMode } from "@/features/shell/settings/FillPicker";

// Heavy detail surfaces load on demand — the rail shouldn't pay for pickers,
// insert menus, and layer tools before a detail page is pushed.
export const LazySettingsFillPicker = lazy(() =>
  import("@/features/shell/settings/FillPicker").then((module) => ({
    default: module.SettingsFillPicker,
  })),
);
// fallow-ignore-next-line unused-type
export type { LockedFillPickerMode };

export const LazyLayersPopoverContent = lazy(() =>
  import("@/features/shell/components/LayersPopoverContent").then((module) => ({
    default: module.LayersPopoverContent,
  })),
);

// The upload tile drags in the image cropper + scene codec — only fetch it when
// an image fill mode is actually browsed.
export const LazySettingsImageUploadTile = lazy(() =>
  import("@/features/shell/settings/SettingsFillOptionGrid").then((module) => ({
    default: module.SettingsImageUploadTile,
  })),
);

// Palette editing drags in the full fill picker — fetch it only when the
// pattern-colors detail page is pushed.
export const LazyPatternColorPickerContent = lazy(() =>
  import("@/features/shell/settings/QrColorFillControls").then((module) => ({
    default: module.PatternColorPickerContent,
  })),
);
