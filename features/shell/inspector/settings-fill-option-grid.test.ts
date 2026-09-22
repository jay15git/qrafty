import { describe, expect, it } from "vitest"

import { parseFill } from "@/components/ui/fill-picker/lib/gradient"
import {
  applyCardFill,
  applyShapeFill,
  readShapeFillCss,
} from "@/features/shell/inspector/settings-bridge"
import { getActiveFillPresetForStoredValue } from "@/features/shell/inspector/settings-fill-preset-match"
import { SETTINGS_FILL_PRESETS } from "@/features/shell/inspector/settings-fill-presets"
import { DEFAULT_DESKTOP_SHAPE_SETTINGS } from "@/features/shell/model/desktop-toolbar-defaults"

function readStoredShapeFillCss(preset: string) {
  const fill = parseFill(preset)
  if (!fill) {
    throw new Error("bad preset")
  }

  const nextSettings = {
    ...DEFAULT_DESKTOP_SHAPE_SETTINGS,
    ...applyShapeFill(fill, DEFAULT_DESKTOP_SHAPE_SETTINGS),
  }

  return readShapeFillCss(nextSettings)
}

describe("settings fill option grid preset matching", () => {
  for (const preset of SETTINGS_FILL_PRESETS) {
    it(`round-trips ${preset.slice(0, 42)}`, () => {
      const stored = readStoredShapeFillCss(preset)
      const active = getActiveFillPresetForStoredValue(stored)

      expect(active).toBe(preset)
    })

    it(`round-trips card fill for ${preset.slice(0, 42)}`, () => {
      const fill = parseFill(preset)
      if (!fill) {
        throw new Error("bad preset")
      }

      const stored = applyCardFill(fill).cardFill
      const active = getActiveFillPresetForStoredValue(stored)

      expect(active).toBe(preset)
    })
  }
})
