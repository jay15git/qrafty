// @vitest-environment jsdom

import { act, useState } from "react"
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

  it("keeps visited view instances when they become inactive", async () => {
    function StatefulView() {
      const [count, setCount] = useState(0)

      return (
        <div data-slot="stateful-view">
          <span data-slot="stateful-count">{count}</span>
          <button
            data-slot="stateful-increment"
            type="button"
            onClick={() => setCount((current) => current + 1)}
          >
            Increment
          </button>
        </div>
      )
    }

    const views = {
      default: StatefulView,
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

    await act(async () => {
      surface.container
        .querySelector<HTMLButtonElement>('[data-slot="stateful-increment"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(surface.container.querySelector('[data-slot="stateful-count"]')?.textContent).toBe("1")

    await act(async () => {
      surface.container
        .querySelector<HTMLButtonElement>('[data-slot="switch-to-qr"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(surface.container.querySelector('[data-slot="qr-view"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="stateful-count"]')?.textContent).toBe("1")
  })

  it("renders a newly visited view on the first paint", async () => {
    const views = {
      default: () => <ViewProbe slot="default-view" />,
      background: () => <ViewProbe slot="background-view" />,
    }

    function BackgroundSwitcher() {
      const { setView } = useFamilyDrawer()

      return (
        <button
          data-slot="switch-to-background"
          type="button"
          onClick={() => setView("background")}
        >
          Background
        </button>
      )
    }

    const surface = await renderWithAsyncJsdomRoot(
      <FamilyDrawerRoot defaultOpen defaultView="default" views={views}>
        <FamilyDrawerAnimatedWrapper>
          <FamilyDrawerAnimatedContent />
        </FamilyDrawerAnimatedWrapper>
        <BackgroundSwitcher />
      </FamilyDrawerRoot>,
    )

    await act(async () => {
      surface.container
        .querySelector<HTMLButtonElement>('[data-slot="switch-to-background"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(surface.container.querySelector('[data-slot="background-view"]')).not.toBeNull()
  })

  it("ignores unknown view names", async () => {
    const views = {
      default: () => <ViewProbe slot="default-view" />,
    }

    function UnknownViewSwitcher() {
      const { setView } = useFamilyDrawer()

      return (
        <button
          data-slot="switch-to-unknown"
          type="button"
          onClick={() => setView("missing-view")}
        >
          Missing
        </button>
      )
    }

    const surface = await renderWithAsyncJsdomRoot(
      <FamilyDrawerRoot defaultOpen defaultView="default" views={views}>
        <FamilyDrawerAnimatedWrapper>
          <FamilyDrawerAnimatedContent />
        </FamilyDrawerAnimatedWrapper>
        <UnknownViewSwitcher />
      </FamilyDrawerRoot>,
    )

    await act(async () => {
      surface.container
        .querySelector<HTMLButtonElement>('[data-slot="switch-to-unknown"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(surface.container.querySelector('[data-slot="default-view"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="missing-view"]')).toBeNull()
  })
})
