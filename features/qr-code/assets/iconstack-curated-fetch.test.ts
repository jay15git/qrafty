import { describe, expect, it } from "vitest"

import { fetchIconSvg } from "@/features/qr-code/assets/iconstack-api"
import { ICONSTACK_CURATED_ICONS } from "@/features/qr-code/assets/iconstack-curated"
import { isValidIconstackSvgMarkup } from "@/features/qr-code/assets/iconstack-svg"

describe("iconstack curated fetch", () => {
  it("loads every curated icon from the API", async () => {
    const results = await Promise.all(
      ICONSTACK_CURATED_ICONS.map(async (icon) => {
        try {
          const response = await fetchIconSvg({ library: icon.library, id: icon.id })
          return {
            key: `${icon.library}/${icon.id}`,
            ok: true,
            valid: isValidIconstackSvgMarkup(response.svg),
          }
        } catch (error) {
          return {
            key: `${icon.library}/${icon.id}`,
            ok: false,
            valid: false,
            error: error instanceof Error ? error.message : String(error),
          }
        }
      }),
    )

    for (const result of results) {
      if (!result.ok || !result.valid) {
        console.log(result)
      }
    }

    const failures = results.filter((result) => !result.ok || !result.valid)
    expect(failures).toEqual([])
  }, 60_000)
})
