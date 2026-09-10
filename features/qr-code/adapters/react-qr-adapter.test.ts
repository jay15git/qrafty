import { describe, expect, it } from "vitest"

import { toReactQrCodeProps } from "@/features/qr-code/adapters/react-qr-adapter"
import { createDefaultQraftyState } from "@/features/qr-code/model/state"

describe("toReactQrCodeProps", () => {
  it("strips module and finder colors when module shader fill is active", () => {
    const state = createDefaultQraftyState()
    state.dotsColorMode = "shader"

    const props = toReactQrCodeProps(state)

    expect(props.dataModulesSettings.color).toBeUndefined()
    expect(props.finderPatternInnerSettings.color).toBeUndefined()
    expect(props.finderPatternOuterSettings.color).toBeUndefined()
  })
})
