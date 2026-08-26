import { describe, expect, it } from "vitest"

import { createDefaultQrStudioState } from "@/features/qr-code/model/state"
import {
  clearQrEncodeMarkupCache,
  getQrEncodeCacheKey,
  readCachedQrEncodeMarkup,
  writeCachedQrEncodeMarkup,
} from "@/features/qr-code/rendering/qr-encode-cache"

describe("qr encode cache", () => {
  it("changes cache key when data changes but not when only color changes", () => {
    const base = createDefaultQrStudioState()
    const recolored = {
      ...base,
      dataModulesSettings: {
        ...base.dataModulesSettings,
        color: "#ff0000",
      },
    }
    const newData = {
      ...base,
      data: "https://example.com/other",
    }

    expect(getQrEncodeCacheKey(base)).toBe(getQrEncodeCacheKey(recolored))
    expect(getQrEncodeCacheKey(base)).not.toBe(getQrEncodeCacheKey(newData))
  })

  it("stores and reads cached base markup", () => {
    clearQrEncodeMarkupCache()
    const state = createDefaultQrStudioState()
    const key = getQrEncodeCacheKey(state)

    expect(readCachedQrEncodeMarkup(key)).toBeUndefined()
    writeCachedQrEncodeMarkup(key, "<svg></svg>")
    expect(readCachedQrEncodeMarkup(key)).toBe("<svg></svg>")
  })
})
