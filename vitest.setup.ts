// Polyfills for browser APIs jsdom does not implement.
// Keeps DOM-environment component tests from crashing on unhandled errors
// (e.g. window.matchMedia in features/shell/audio/cuelume.ts).

import { createElement, forwardRef, type ReactNode } from "react"
import { vi } from "vitest"
import type * as GlimmNext from "glimm/next"

// `useRouter()` from next/navigation throws "invariant expected app router to
// be mounted" outside a Next runtime. Component tests render islands that pull
// it in transitively (glimm's TransitionLink, the brand mark), so stub the
// navigation surface for every test file.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
}))

// The real TransitionLink needs <GlimmProvider>, which only the root layout
// mounts. Tests render subtrees, so swap it for a plain anchor and keep the
// rest of the module (EASINGS, PALETTES, useGlimm) intact.
vi.mock("glimm/next", async (importOriginal) => {
  const actual = await importOriginal<typeof GlimmNext>()

  return {
    ...actual,
    GlimmProvider: ({ children }: { children?: ReactNode }) => children ?? null,
    TransitionLink: forwardRef<HTMLAnchorElement, Record<string, unknown>>(
      function TransitionLink(props, ref) {
        return createElement("a", { ...props, ref })
      },
    ),
  }
})

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia
  }

  if (!("ResizeObserver" in window)) {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(window, "ResizeObserver", {
      writable: true,
      configurable: true,
      value: ResizeObserverStub,
    })
    Object.defineProperty(globalThis, "ResizeObserver", {
      writable: true,
      configurable: true,
      value: ResizeObserverStub,
    })
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }

  if (!("IntersectionObserver" in window)) {
    class IntersectionObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    }
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      configurable: true,
      value: IntersectionObserverStub,
    })
    Object.defineProperty(globalThis, "IntersectionObserver", {
      writable: true,
      configurable: true,
      value: IntersectionObserverStub,
    })
  }
}
