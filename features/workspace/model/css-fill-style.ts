import type { CSSProperties } from "react"

import { parseFill } from "@/components/ui/fill-picker-base/fill"

export function cssFillToBackgroundStyle(fillCss: string): CSSProperties {
  if (parseFill(fillCss)?.kind === "gradient") {
    return {
      backgroundColor: "transparent",
      backgroundImage: fillCss,
    }
  }

  return { backgroundColor: fillCss }
}
