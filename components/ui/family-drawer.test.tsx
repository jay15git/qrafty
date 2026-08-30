// @vitest-environment jsdom

import { act } from "react"
import { beforeEach, describe, expect, it } from "vitest"

import {
  FamilyDrawerAnimatedContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerRoot,
  useFamilyDrawer,
} from "@/components/ui/family-drawer"
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root"

function ViewProbe({ slot }: { slot: string }) {
  return <div data-slot={slot}>{slot}</div>
}

function ViewSwitcher() {
  const { setView } = useFamilyDrawer()

  return (
    <button
      data-slot="switch-to-qr"
      type="button"
      onClick={() => setView("qr")}
    >
      QR
    </button>
  )
}

describe("FamilyDrawerAnimatedContent", () => {
  beforeEach(() => {
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(window, "ResizeObserver", {
      configurable: true,
      writable: true,
      value: MockResizeObserver,
    })
  })

  it("keeps visited views mounted when navigating away", async () => {
    const views = {
      default: () => <ViewProbe slot="default-view" />,
      qr: () => <ViewProbe slot="qr-view" />,
    }

    const surface = await renderWithAsyncJsdomRoot(
      <FamilyDrawerRoot defaultOpen defaultView="default" views={views}>
        <FamilyDrawerAnimatedWrapper>
          <FamilyDrawerAnimatedContent />
        </FamilyDrawerAnimatedWrapper>
        <ViewSwitcher />
      </FamilyDrawerRoot>,
    )

    expect(surface.container.querySelector('[data-slot="default-view"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="qr-view"]')).toBeNull()

    await act(async () => {
      surface.container
        .querySelector<HTMLButtonElement>('[data-slot="switch-to-qr"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(surface.container.querySelector('[data-slot="qr-view"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="default-view"]')).not.toBeNull()
  })
})
