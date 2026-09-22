"use client";

import { Area } from "@/components/ui/fill-picker/parts/area";

import { Hue } from "./parts/hue";
import { Alpha } from "./parts/alpha";
import { ChannelInput } from "./parts/channel-input";

export {
  parseColor,
  formatColor,
} from "@/components/ui/fill-picker/lib/color";

const ColorPickerBase = {
  Area,
  Hue,
  Alpha,
  ChannelInput,
};

// Alias so consuming code reads the same as the Radix variant — only the
// import path differs (`.../fill-picker-base/color-picker`).
export const ColorPicker = ColorPickerBase;
