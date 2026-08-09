# Template Authoring Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** `docs/superpowers/plans/2026-07-28-template-verification-loop.md` must be complete. This plan calls `validateTemplateDocument`, `TEMPLATE_REGISTRY`, and `pnpm render:templates` from it.

**Goal:** Replace hand-computed absolute-coordinate template authoring with a constrained layer — design tokens, a layout frame, named parts, and archetypes — so a template is ~20 lines of intent that cannot silently produce invisible layers, illegible text, or a QR that isn't the subject.

**Architecture:** A new `features/workspace/authoring/` module with four files layered bottom-up: `tokens.ts` (the only source of colour, spacing, radius, type), `frame.ts` (center-origin layout math returning `Rect`s), `parts.ts` (named multi-layer components built via the existing layer factories), and `define-template.ts` (archetypes that compose parts into a full `DraftingWorkspaceDocumentV1`). Nothing in the existing renderers, editor, or document schema changes; this is a narrower front door onto the same output.

**Tech Stack:** TypeScript, Vitest 4 (`environment: "node"`), `culori` for contrast assertions in tests, existing layer factories in `features/workspace/model/layers.ts`, existing seed builder `buildTemplateDocumentSeed` in `features/studio-hub/model/bootstrap-document.ts`.

## Global Constraints

- Package manager is `pnpm`. Never invoke `npm` or `yarn`.
- Import via the `@/*` alias. No deep relative paths across features.
- Vitest runs with `environment: "node"`. No React imports, no `window`/`document` in any file this plan creates.
- **Never construct a `DraftingCanvasLayer` object literal.** Always go through `createDraftingShapeLayer`, `createDraftingTextLayer`, `createDraftingImageLayer`, or `createDraftingShaderLayer`, which route through `patchDraftingCanvasLayer` and keep `cornerRadius`↔`cornerRadii`, `shadow`↔`shadows[]`, `blur`↔`layerFilters[]` in sync.
- **No raw colour values outside `tokens.ts`.** Every fill in `parts.ts` and `define-template.ts` comes from a `Palette` field.
- **No raw font sizes, spacing, or radii outside `tokens.ts`.** Use the token maps.
- Coordinates are center-origin: the canvas spans `-width/2 … width/2` horizontally and `-height/2 … height/2` vertically. `frame.ts` is the only place allowed to do that arithmetic.
- Every new module gets a colocated `*.test.ts`.
- Verify with `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm test`. There is no CI workflow in this repo.
- Templates authored by this plan must produce **zero** issues from `validateTemplateDocument`, including warnings.

## Scope

In: tokens, frame, parts, three archetypes (`ticket`, `label`, `seal`), porting two existing templates, retiring one, and the agent-facing contract.

Out (deliberate YAGNI): `band` and `stack` archetypes, image/art slots, gradient fills in parts, multi-node documents, and any change to `layers.ts` semantics.

---

### Task 1: Design tokens

**Files:**
- Create: `features/workspace/authoring/tokens.ts`
- Create: `features/workspace/authoring/tokens.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks. `wcagContrast` from `culori` is used in the test only.
- Produces:
  - `const SPACE: { lg: 40; md: 24; sm: 16; xl: 64; xs: 8 }` and `type SpaceToken = keyof typeof SPACE`
  - `const RADIUS: { full: 999; lg: 28; md: 16; none: 0; sm: 8; xl: 40; xs: 4 }` and `type RadiusToken = keyof typeof RADIUS`
  - `const TYPE: Record<TypeToken, { fontSize: number; fontWeight: number; letterSpacing: number; lineHeight: number }>` where `type TypeToken = "body" | "caption" | "display" | "numeral" | "title"`
  - `type Palette = { accent: string; bg: string; ink: string; muted: string; onAccent: string; surface: string }`
  - `const PALETTES: Record<PaletteId, Palette>` and `type PaletteId = "blush" | "ink" | "mint" | "sage" | "sand" | "slate"`
  - `function getPalette(id: PaletteId): Palette`
  - `type PaletteTone = "accent" | "ink" | "muted" | "onAccent"` and `function toneColor(palette: Palette, tone: PaletteTone): string`

- [ ] **Step 1: Write the failing test**

Create `features/workspace/authoring/tokens.test.ts`:

```ts
import { wcagContrast } from "culori"
import { describe, expect, it } from "vitest"

import {
  PALETTES,
  RADIUS,
  SPACE,
  TYPE,
  getPalette,
  toneColor,
  type PaletteId,
} from "@/features/workspace/authoring/tokens"

const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[]

describe("authoring tokens", () => {
  it("exposes an ascending spacing scale", () => {
    expect(Object.values(SPACE)).toEqual([...Object.values(SPACE)].sort((a, b) => a - b))
    expect(SPACE.xs).toBe(8)
    expect(SPACE.xl).toBe(64)
  })

  it("exposes a radius scale with a pill value", () => {
    expect(RADIUS.none).toBe(0)
    expect(RADIUS.full).toBeGreaterThanOrEqual(999)
  })

  it("pairs every type step with a weight and line height", () => {
    for (const [name, step] of Object.entries(TYPE)) {
      expect(step.fontSize, name).toBeGreaterThan(0)
      expect(step.fontWeight, name).toBeGreaterThanOrEqual(400)
      expect(step.lineHeight, name).toBeGreaterThan(0.9)
    }
  })

  it("keeps ink readable on surface and bg in every palette", () => {
    for (const id of PALETTE_IDS) {
      const palette = getPalette(id)

      expect(wcagContrast(palette.ink, palette.surface), `${id} ink/surface`).toBeGreaterThanOrEqual(7)
      expect(wcagContrast(palette.ink, palette.bg), `${id} ink/bg`).toBeGreaterThanOrEqual(7)
    }
  })

  it("keeps onAccent readable on accent in every palette", () => {
    for (const id of PALETTE_IDS) {
      const palette = getPalette(id)

      expect(wcagContrast(palette.onAccent, palette.accent), `${id} onAccent/accent`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("keeps muted readable on surface in every palette", () => {
    for (const id of PALETTE_IDS) {
      const palette = getPalette(id)

      expect(wcagContrast(palette.muted, palette.surface), `${id} muted/surface`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("resolves tones to palette colours", () => {
    const palette = getPalette("mint")

    expect(toneColor(palette, "ink")).toBe(palette.ink)
    expect(toneColor(palette, "onAccent")).toBe(palette.onAccent)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run features/workspace/authoring/tokens.test.ts`
Expected: FAIL — cannot resolve `@/features/workspace/authoring/tokens`.

- [ ] **Step 3: Write the implementation**

Create `features/workspace/authoring/tokens.ts`:

```ts
export const SPACE = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 64,
} as const

export type SpaceToken = keyof typeof SPACE

export const RADIUS = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 28,
  xl: 40,
  full: 999,
} as const

export type RadiusToken = keyof typeof RADIUS

export type TypeToken = "body" | "caption" | "display" | "numeral" | "title"

export type TypeStep = {
  fontSize: number
  fontWeight: number
  letterSpacing: number
  lineHeight: number
}

/** Sized for the 1080px-class canvases used by the ratio-1-1 and ratio-4-5 presets. */
export const TYPE: Record<TypeToken, TypeStep> = {
  caption: { fontSize: 18, fontWeight: 600, letterSpacing: 3.2, lineHeight: 1.2 },
  body: { fontSize: 24, fontWeight: 500, letterSpacing: 0, lineHeight: 1.35 },
  title: { fontSize: 40, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.15 },
  display: { fontSize: 72, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.05 },
  numeral: { fontSize: 108, fontWeight: 700, letterSpacing: -2, lineHeight: 1 },
}

export type Palette = {
  accent: string
  bg: string
  ink: string
  muted: string
  onAccent: string
  surface: string
}

export const PALETTES = {
  mint: {
    accent: "#1d6b45",
    bg: "#dff0e6",
    ink: "#12241a",
    muted: "#4b5f52",
    onAccent: "#ffffff",
    surface: "#ffffff",
  },
  sand: {
    accent: "#b4451f",
    bg: "#f7ece0",
    ink: "#2a1d12",
    muted: "#6b5545",
    onAccent: "#ffffff",
    surface: "#ffffff",
  },
  slate: {
    accent: "#1f2937",
    bg: "#eceef2",
    ink: "#16181d",
    muted: "#565b66",
    onAccent: "#ffffff",
    surface: "#ffffff",
  },
  ink: {
    accent: "#f4f4f5",
    bg: "#101114",
    ink: "#f4f4f5",
    muted: "#a1a1aa",
    onAccent: "#101114",
    surface: "#191b1f",
  },
  blush: {
    accent: "#9d2235",
    bg: "#fbe9ec",
    ink: "#2a1418",
    muted: "#6d4a50",
    onAccent: "#ffffff",
    surface: "#ffffff",
  },
  sage: {
    accent: "#3f5d3a",
    bg: "#e8ece4",
    ink: "#1b241a",
    muted: "#55604f",
    onAccent: "#ffffff",
    surface: "#ffffff",
  },
} as const satisfies Record<string, Palette>

export type PaletteId = keyof typeof PALETTES

export function getPalette(id: PaletteId): Palette {
  return PALETTES[id]
}

export type PaletteTone = "accent" | "ink" | "muted" | "onAccent"

export function toneColor(palette: Palette, tone: PaletteTone): string {
  return palette[tone]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run features/workspace/authoring/tokens.test.ts`
Expected: PASS, 7 tests. If a contrast assertion fails, darken that palette's `ink`/`accent` or lighten its `surface` until it passes — do not lower the threshold.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm exec tsc --noEmit 2>&1 | rg authoring` — expect no output.
Run: `pnpm exec eslint features/workspace/authoring` — expect no output.

- [ ] **Step 6: Commit**

```bash
git add features/workspace/authoring/tokens.ts features/workspace/authoring/tokens.test.ts
git commit -m "feat(authoring): add design tokens with contrast-guaranteed palettes"
```

---

### Task 2: Layout frame

**Files:**
- Create: `features/workspace/authoring/frame.ts`
- Create: `features/workspace/authoring/frame.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Rect = { height: number; width: number; x: number; y: number }`
  - `type TrackSpec = number | "auto"`
  - `type Frame = { canvas: Rect; content: Rect; center(width: number, height: number): Rect; columns(specs: TrackSpec[], gap?: number): Rect[]; inset(by: number): Frame; rows(specs: TrackSpec[], gap?: number): Rect[] }`
  - `function createFrame(options: { height: number; padding?: number; width: number }): Frame`
  - `function subFrame(rect: Rect, padding?: number): Frame`

`Rect.x`/`Rect.y` are absolute center-origin coordinates, directly assignable to a layer's `x`/`y`. This module is the **only** place allowed to compute `-width / 2`.

- [ ] **Step 1: Write the failing test**

Create `features/workspace/authoring/frame.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { createFrame, subFrame } from "@/features/workspace/authoring/frame"

describe("createFrame", () => {
  it("centers the canvas on the origin", () => {
    const frame = createFrame({ height: 1350, width: 1080 })

    expect(frame.canvas).toEqual({ height: 1350, width: 1080, x: -540, y: -675 })
  })

  it("insets content by padding", () => {
    const frame = createFrame({ height: 1000, padding: 40, width: 800 })

    expect(frame.content).toEqual({ height: 920, width: 720, x: -360, y: -460 })
  })

  it("splits rows with fixed and auto tracks", () => {
    const frame = createFrame({ height: 1000, padding: 0, width: 800 })
    const [header, body] = frame.rows([200, "auto"], 24)

    expect(header).toEqual({ height: 200, width: 800, x: -400, y: -500 })
    expect(body).toEqual({ height: 776, width: 800, x: -400, y: -276 })
  })

  it("splits equal auto columns", () => {
    const frame = createFrame({ height: 400, padding: 0, width: 900 })
    const [left, middle, right] = frame.columns(["auto", "auto", "auto"], 0)

    expect(left.width).toBe(300)
    expect(middle.x).toBe(-150)
    expect(right.x).toBe(150)
  })

  it("centers a rect inside content", () => {
    const frame = createFrame({ height: 1000, padding: 50, width: 800 })

    expect(frame.center(400, 400)).toEqual({ height: 400, width: 400, x: -200, y: -200 })
  })

  it("nests via inset without leaving the parent", () => {
    const frame = createFrame({ height: 1000, padding: 40, width: 800 })
    const inner = frame.inset(20).content

    expect(inner.x).toBe(-340)
    expect(inner.width).toBe(680)
  })

  it("builds a frame from an arbitrary rect", () => {
    const frame = subFrame({ height: 300, width: 200, x: 100, y: -50 }, 10)

    expect(frame.content).toEqual({ height: 280, width: 180, x: 110, y: -40 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run features/workspace/authoring/frame.test.ts`
Expected: FAIL — cannot resolve `@/features/workspace/authoring/frame`.

- [ ] **Step 3: Write the implementation**

Create `features/workspace/authoring/frame.ts`:

```ts
export type Rect = {
  height: number
  width: number
  x: number
  y: number
}

export type TrackSpec = number | "auto"

export type Frame = {
  canvas: Rect
  content: Rect
  center(width: number, height: number): Rect
  columns(specs: TrackSpec[], gap?: number): Rect[]
  inset(by: number): Frame
  rows(specs: TrackSpec[], gap?: number): Rect[]
}

function resolveTracks(specs: TrackSpec[], available: number, gap: number): number[] {
  const gaps = gap * Math.max(0, specs.length - 1)
  const fixedTotal = specs.reduce((total, spec) => (spec === "auto" ? total : total + spec), 0)
  const autoCount = specs.filter((spec) => spec === "auto").length
  const remaining = available - gaps - fixedTotal
  const autoSize = autoCount > 0 ? remaining / autoCount : 0

  return specs.map((spec) => (spec === "auto" ? autoSize : spec))
}

function buildFrame(canvas: Rect, content: Rect): Frame {
  return {
    canvas,
    content,

    center(width, height) {
      return {
        height,
        width,
        x: content.x + (content.width - width) / 2,
        y: content.y + (content.height - height) / 2,
      }
    },

    columns(specs, gap = 0) {
      const sizes = resolveTracks(specs, content.width, gap)
      let cursor = content.x

      return sizes.map((width) => {
        const rect: Rect = { height: content.height, width, x: cursor, y: content.y }
        cursor += width + gap
        return rect
      })
    },

    inset(by) {
      return subFrame(content, by)
    },

    rows(specs, gap = 0) {
      const sizes = resolveTracks(specs, content.height, gap)
      let cursor = content.y

      return sizes.map((height) => {
        const rect: Rect = { height, width: content.width, x: content.x, y: cursor }
        cursor += height + gap
        return rect
      })
    },
  }
}

export function subFrame(rect: Rect, padding = 0): Frame {
  const content: Rect = {
    height: rect.height - padding * 2,
    width: rect.width - padding * 2,
    x: rect.x + padding,
    y: rect.y + padding,
  }

  return buildFrame(rect, content)
}

export function createFrame(options: { height: number; padding?: number; width: number }): Frame {
  const canvas: Rect = {
    height: options.height,
    width: options.width,
    x: -options.width / 2,
    y: -options.height / 2,
  }

  return subFrame(canvas, options.padding ?? 0)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run features/workspace/authoring/frame.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm exec tsc --noEmit 2>&1 | rg authoring` — expect no output.
Run: `pnpm exec eslint features/workspace/authoring` — expect no output.

- [ ] **Step 6: Commit**

```bash
git add features/workspace/authoring/frame.ts features/workspace/authoring/frame.test.ts
git commit -m "feat(authoring): add center-origin layout frame with row and column tracks"
```

---

### Task 3: Named parts

**Files:**
- Create: `features/workspace/authoring/parts.ts`
- Create: `features/workspace/authoring/parts.test.ts`

**Interfaces:**
- Consumes: `Palette`, `PaletteTone`, `RADIUS`, `RadiusToken`, `TYPE`, `TypeToken`, `toneColor` (Task 1); `Rect` (Task 2); `createDraftingShapeLayer`, `createDraftingTextLayer`, `DraftingCanvasLayer`, `DraftingElementShapeId` from `@/features/workspace/model/layers`.
- Produces:
  - `type PartContext = { nodeId: string; palette: Palette; zIndex: number }`
  - `function surfacePart(context: PartContext, rect: Rect, options?: { fill?: string; radius?: RadiusToken; shadow?: "lift" | "none" | "soft" }): DraftingCanvasLayer[]`
  - `function shapeFieldPart(context: PartContext, rect: Rect, options: { fill?: string; shapeId: DraftingElementShapeId }): DraftingCanvasLayer[]`
  - `function textPart(context: PartContext, rect: Rect, options: { align?: "center" | "left" | "right"; step: TypeToken; text: string; tone?: PaletteTone; uppercase?: boolean }): DraftingCanvasLayer[]`
  - `function pillButtonPart(context: PartContext, rect: Rect, options: { label: string }): DraftingCanvasLayer[]`
  - `function circleIconPart(context: PartContext, rect: Rect, options: { glyph: string }): DraftingCanvasLayer[]`
  - `function hairlinePart(context: PartContext, rect: Rect, options?: { tone?: PaletteTone }): DraftingCanvasLayer[]`
  - `function centerTextRect(rect: Rect, step: TypeToken): Rect`

`centerTextRect` is the fix for the "Book now rides high in the pill" bug: it returns a text rect whose top and bottom gaps inside `rect` are equal, given the step's `fontSize * lineHeight`.

- [ ] **Step 1: Write the failing test**

Create `features/workspace/authoring/parts.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { centerTextRect, circleIconPart, hairlinePart, pillButtonPart, surfacePart, textPart } from "@/features/workspace/authoring/parts"
import { TYPE, getPalette } from "@/features/workspace/authoring/tokens"
import type { Rect } from "@/features/workspace/authoring/frame"

const CONTEXT = { nodeId: "node-1", palette: getPalette("mint"), zIndex: 10 }
const RECT: Rect = { height: 200, width: 400, x: -200, y: -100 }

describe("authoring parts", () => {
  it("keeps legacy and modern corner fields in sync on surfaces", () => {
    const [surface] = surfacePart(CONTEXT, RECT, { radius: "lg" })

    expect(surface.cornerRadius).toBe(28)
    expect(surface.cornerRadii?.topLeft).toBe(28)
    expect(surface.shadows.length).toBeGreaterThan(0)
  })

  it("gives every surface a visible fill", () => {
    const [surface] = surfacePart(CONTEXT, RECT)

    expect(surface.fillMode).toBe("solid")
    expect(surface.fill).toBe(CONTEXT.palette.surface)
  })

  it("centers text optically inside a box", () => {
    const centered = centerTextRect(RECT, "body")
    const textHeight = TYPE.body.fontSize * TYPE.body.lineHeight
    const topGap = centered.y - RECT.y
    const bottomGap = RECT.y + RECT.height - (centered.y + textHeight)

    expect(centered.height).toBeCloseTo(textHeight, 5)
    expect(topGap).toBeCloseTo(bottomGap, 5)
  })

  it("returns a pill and a label centered within it", () => {
    const [pill, label] = pillButtonPart(CONTEXT, RECT, { label: "Reserve" })
    const textHeight = TYPE.body.fontSize * TYPE.body.lineHeight

    expect(pill.cornerRadius).toBeGreaterThanOrEqual(999)
    expect(pill.fill).toBe(CONTEXT.palette.accent)
    expect(label.text).toBe("Reserve")
    expect(label.fill).toBe(CONTEXT.palette.onAccent)
    expect(label.textAlign).toBe("center")
    expect(label.y - RECT.y).toBeCloseTo(RECT.y + RECT.height - (label.y + textHeight), 5)
    expect(label.zIndex).toBeGreaterThan(pill.zIndex)
  })

  it("returns a circle with its glyph centered", () => {
    const square: Rect = { height: 80, width: 80, x: -40, y: -40 }
    const [circle, glyph] = circleIconPart(CONTEXT, square, { glyph: "→" })

    expect(circle.shapeId).toBe("ellipse")
    expect(glyph.textAlign).toBe("center")
    expect(glyph.x).toBe(square.x)
    expect(glyph.width).toBe(square.width)
    expect(glyph.zIndex).toBeGreaterThan(circle.zIndex)
  })

  it("uppercases caption text when asked", () => {
    const [caption] = textPart(CONTEXT, RECT, { step: "caption", text: "scan to pay", uppercase: true })

    expect(caption.text).toBe("SCAN TO PAY")
    expect(caption.letterSpacing).toBe(TYPE.caption.letterSpacing)
  })

  it("draws a hairline as a thin filled rect", () => {
    const [line] = hairlinePart(CONTEXT, { height: 0, width: 300, x: -150, y: 0 })

    expect(line.height).toBeGreaterThan(0)
    expect(line.fillMode).toBe("solid")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run features/workspace/authoring/parts.test.ts`
Expected: FAIL — cannot resolve `@/features/workspace/authoring/parts`.

- [ ] **Step 3: Write the implementation**

Create `features/workspace/authoring/parts.ts`:

```ts
import type { Rect } from "@/features/workspace/authoring/frame"
import {
  RADIUS,
  TYPE,
  toneColor,
  type Palette,
  type PaletteTone,
  type RadiusToken,
  type TypeToken,
} from "@/features/workspace/authoring/tokens"
import {
  createDraftingShapeLayer,
  createDraftingTextLayer,
  type DraftingCanvasLayer,
  type DraftingElementShapeId,
} from "@/features/workspace/model/layers"

export type PartContext = {
  nodeId: string
  palette: Palette
  zIndex: number
}

const SHADOW_PRESETS = {
  none: { blur: 0, offsetY: 0, opacity: 0, visible: false },
  soft: { blur: 32, offsetY: 12, opacity: 8, visible: true },
  lift: { blur: 48, offsetY: 22, opacity: 14, visible: true },
} as const

export type ShadowPreset = keyof typeof SHADOW_PRESETS

let partCounter = 0

function nextPartId(nodeId: string, name: string) {
  partCounter += 1
  return `${nodeId}:${name}-${partCounter}`
}

export function centerTextRect(rect: Rect, step: TypeToken): Rect {
  const height = TYPE[step].fontSize * TYPE[step].lineHeight

  return {
    height,
    width: rect.width,
    x: rect.x,
    y: rect.y + (rect.height - height) / 2,
  }
}

export function surfacePart(
  context: PartContext,
  rect: Rect,
  options: { fill?: string; radius?: RadiusToken; shadow?: ShadowPreset } = {},
): DraftingCanvasLayer[] {
  const radius = RADIUS[options.radius ?? "none"]
  const preset = SHADOW_PRESETS[options.shadow ?? "none"]

  return [
    createDraftingShapeLayer(context.nodeId, "rect", {
      cornerRadius: radius,
      fill: options.fill ?? context.palette.surface,
      fillMode: "solid",
      height: rect.height,
      id: nextPartId(context.nodeId, "surface"),
      isLocked: true,
      name: "Surface",
      shadow: {
        blur: preset.blur,
        color: context.palette.ink,
        inset: false,
        kind: "drop",
        offsetX: 0,
        offsetY: preset.offsetY,
        opacity: preset.opacity,
        spread: 0,
        visible: preset.visible,
      },
      strokeWidth: 0,
      width: rect.width,
      x: rect.x,
      y: rect.y,
      zIndex: context.zIndex,
    }),
  ]
}

export function shapeFieldPart(
  context: PartContext,
  rect: Rect,
  options: { fill?: string; shapeId: DraftingElementShapeId },
): DraftingCanvasLayer[] {
  return [
    createDraftingShapeLayer(context.nodeId, options.shapeId, {
      fill: options.fill ?? context.palette.accent,
      fillMode: "solid",
      height: rect.height,
      id: nextPartId(context.nodeId, "shape-field"),
      isLocked: true,
      name: "Shape field",
      strokeWidth: 0,
      width: rect.width,
      x: rect.x,
      y: rect.y,
      zIndex: context.zIndex,
    }),
  ]
}

export function textPart(
  context: PartContext,
  rect: Rect,
  options: {
    align?: "center" | "left" | "right"
    step: TypeToken
    text: string
    tone?: PaletteTone
    uppercase?: boolean
  },
): DraftingCanvasLayer[] {
  const step = TYPE[options.step]

  return [
    createDraftingTextLayer(context.nodeId, {
      fill: toneColor(context.palette, options.tone ?? "ink"),
      fontSize: step.fontSize,
      fontWeight: step.fontWeight,
      height: rect.height,
      id: nextPartId(context.nodeId, "text"),
      isLocked: true,
      letterSpacing: step.letterSpacing,
      lineHeight: step.lineHeight,
      name: options.text.slice(0, 24) || "Text",
      text: options.uppercase ? options.text.toUpperCase() : options.text,
      textAlign: options.align ?? "left",
      width: rect.width,
      x: rect.x,
      y: rect.y,
      zIndex: context.zIndex,
    }),
  ]
}

export function pillButtonPart(
  context: PartContext,
  rect: Rect,
  options: { label: string },
): DraftingCanvasLayer[] {
  const labelRect = centerTextRect(rect, "body")

  return [
    ...surfacePart(context, rect, { fill: context.palette.accent, radius: "full" }),
    ...textPart({ ...context, zIndex: context.zIndex + 1 }, labelRect, {
      align: "center",
      step: "body",
      text: options.label,
      tone: "onAccent",
    }),
  ]
}

export function circleIconPart(
  context: PartContext,
  rect: Rect,
  options: { glyph: string },
): DraftingCanvasLayer[] {
  const glyphRect = centerTextRect(rect, "body")

  return [
    createDraftingShapeLayer(context.nodeId, "ellipse", {
      fill: context.palette.accent,
      fillMode: "solid",
      height: rect.height,
      id: nextPartId(context.nodeId, "circle-icon"),
      isLocked: true,
      name: "Icon circle",
      strokeWidth: 0,
      width: rect.width,
      x: rect.x,
      y: rect.y,
      zIndex: context.zIndex,
    }),
    ...textPart({ ...context, zIndex: context.zIndex + 1 }, glyphRect, {
      align: "center",
      step: "body",
      text: options.glyph,
      tone: "onAccent",
    }),
  ]
}

export function hairlinePart(
  context: PartContext,
  rect: Rect,
  options: { tone?: PaletteTone } = {},
): DraftingCanvasLayer[] {
  return [
    createDraftingShapeLayer(context.nodeId, "rect", {
      cornerRadius: RADIUS.none,
      fill: toneColor(context.palette, options.tone ?? "muted"),
      fillMode: "solid",
      height: 2,
      id: nextPartId(context.nodeId, "hairline"),
      isLocked: true,
      name: "Hairline",
      strokeWidth: 0,
      width: rect.width,
      x: rect.x,
      y: rect.y,
      zIndex: context.zIndex,
    }),
  ]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run features/workspace/authoring/parts.test.ts`
Expected: PASS, 7 tests. If `surface.cornerRadius` is `undefined`, the factory dropped the field — pass `cornerRadii: createUniformCornerRadii(radius)` alongside `cornerRadius` and re-run.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm exec tsc --noEmit 2>&1 | rg authoring` — expect no output.
Run: `pnpm exec eslint features/workspace/authoring` — expect no output.

- [ ] **Step 6: Commit**

```bash
git add features/workspace/authoring/parts.ts features/workspace/authoring/parts.test.ts
git commit -m "feat(authoring): add named parts with optically centered button labels"
```

---

### Task 4: defineTemplate and the ticket archetype

**Files:**
- Create: `features/workspace/authoring/define-template.ts`
- Create: `features/workspace/authoring/define-template.test.ts`

**Interfaces:**
- Consumes: `getPalette`, `PaletteId`, `RADIUS`, `SPACE`, `TYPE` (Task 1); `createFrame`, `subFrame`, `Rect` (Task 2); `PartContext`, `centerTextRect`, `circleIconPart`, `pillButtonPart`, `surfacePart`, `textPart` (Task 3); `buildTemplateDocumentSeed`, `TemplateDocumentSeedOptions` from `@/features/studio-hub/model/bootstrap-document`; `getCanvasSizeFromTemplate`, `getSizeTemplate` from `@/features/workspace/model/size-templates`; `getDraftingQrLayerId` from `@/features/workspace/model/layers`; `QrInputType` from `@/features/qr-code/content/input-options`; `QrStudioState` from `@/features/qr-code/model/state`; `DraftingCardState` from `@/features/workspace/model/card-state`.
- Produces:
  - `type TemplateArchetype = "label" | "seal" | "ticket"`
  - `type TemplateSlots = { action?: string; caption?: string; meta?: string; title?: string }`
  - `type TemplateDefinition = { archetype: TemplateArchetype; data: string; inputType?: QrInputType; palette: PaletteId; ratio: "ratio-1-1" | "ratio-4-5"; slots: TemplateSlots }`
  - `type ArchetypeLayout = { layers: DraftingCanvasLayer[]; qr: Rect }`
  - `function defineTemplate(definition: TemplateDefinition): () => DraftingWorkspaceDocumentV1`

Tasks 5 and 6 add the `label` and `seal` branches to the same `buildArchetype` switch. `TemplateArchetype` already lists all three so the union never changes.

**QR sizing rule:** every archetype must give the QR at least 40% of the shorter canvas side, comfortably above the validator's 28% `minQrRatio` floor.

- [ ] **Step 1: Write the failing test**

Create `features/workspace/authoring/define-template.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { defineTemplate } from "@/features/workspace/authoring/define-template"
import { validateTemplateDocument } from "@/features/workspace/model/validate-template"

const buildTicket = defineTemplate({
  archetype: "ticket",
  data: "https://example.com/trip",
  palette: "mint",
  ratio: "ratio-4-5",
  slots: {
    action: "Reserve",
    caption: "Scan to book",
    meta: "5D 6N",
    title: "Trip to Paris",
  },
})

describe("defineTemplate — ticket", () => {
  it("produces a validator-clean document", () => {
    const issues = validateTemplateDocument(buildTicket())

    expect(issues.map((issue) => `${issue.severity} ${issue.code}: ${issue.message}`)).toEqual([])
  })

  it("makes the qr the subject", () => {
    const document = buildTicket()
    const nodeId = document.activeQrNodeId
    const cardState = document.cardStateByNodeId[nodeId]!
    const qrLayer = document.layerStateByNodeId[nodeId]!.find((layer) => layer.kind === "qr")!
    const shorterSide = Math.min(cardState.width, cardState.height)

    expect(qrLayer.width / shorterSide).toBeGreaterThanOrEqual(0.4)
  })

  it("renders every provided slot as text", () => {
    const document = buildTicket()
    const nodeId = document.activeQrNodeId
    const texts = document.layerStateByNodeId[nodeId]!
      .filter((layer) => layer.kind === "text")
      .map((layer) => layer.text)

    expect(texts).toContain("Trip to Paris")
    expect(texts).toContain("SCAN TO BOOK")
    expect(texts).toContain("5D 6N")
    expect(texts).toContain("Reserve")
  })

  it("omits layers for absent slots", () => {
    const minimal = defineTemplate({
      archetype: "ticket",
      data: "https://example.com",
      palette: "slate",
      ratio: "ratio-4-5",
      slots: { title: "Only a title" },
    })()
    const nodeId = minimal.activeQrNodeId
    const texts = minimal.layerStateByNodeId[nodeId]!.filter((layer) => layer.kind === "text")

    expect(texts).toHaveLength(1)
    expect(validateTemplateDocument(minimal)).toEqual([])
  })

  it("is deterministic across builds", () => {
    const first = buildTicket()
    const second = buildTicket()
    const geometry = (document: typeof first) =>
      document.layerStateByNodeId[document.activeQrNodeId]!.map(
        (layer) => `${layer.kind}:${layer.x},${layer.y},${layer.width},${layer.height},${layer.zIndex}`,
      )

    expect(geometry(first)).toEqual(geometry(second))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run features/workspace/authoring/define-template.test.ts`
Expected: FAIL — cannot resolve `@/features/workspace/authoring/define-template`.

- [ ] **Step 3: Write the implementation**

Create `features/workspace/authoring/define-template.ts`:

```ts
import type { QrInputType } from "@/features/qr-code/content/input-options"
import type { QrStudioState } from "@/features/qr-code/model/state"
import { buildTemplateDocumentSeed } from "@/features/studio-hub/model/bootstrap-document"
import { createFrame, subFrame, type Rect } from "@/features/workspace/authoring/frame"
import {
  centerTextRect,
  pillButtonPart,
  surfacePart,
  textPart,
  type PartContext,
} from "@/features/workspace/authoring/parts"
import { SPACE, TYPE, getPalette, type PaletteId } from "@/features/workspace/authoring/tokens"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"
import { type DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  getCanvasSizeFromTemplate,
  getSizeTemplate,
} from "@/features/workspace/model/size-templates"

export type TemplateArchetype = "label" | "seal" | "ticket"

export type TemplateRatio = "ratio-1-1" | "ratio-4-5"

export type TemplateSlots = {
  action?: string
  caption?: string
  meta?: string
  title?: string
}

export type TemplateDefinition = {
  archetype: TemplateArchetype
  data: string
  inputType?: QrInputType
  palette: PaletteId
  ratio: TemplateRatio
  slots: TemplateSlots
}

export type ArchetypeLayout = {
  layers: DraftingCanvasLayer[]
  qr: Rect
}

export type ArchetypeContext = {
  canvas: { height: number; width: number }
  nodeId: string
  palette: ReturnType<typeof getPalette>
  slots: TemplateSlots
}

const TEXT_HEIGHT = {
  caption: TYPE.caption.fontSize * TYPE.caption.lineHeight,
  body: TYPE.body.fontSize * TYPE.body.lineHeight,
  title: TYPE.title.fontSize * TYPE.title.lineHeight,
} as const

const ACTION_HEIGHT = 96

/**
 * Ticket: one surface panel, QR as the hero above a caption/title/meta block,
 * optional full-width action pill at the foot. Strong vertical symmetry axis.
 */
function layoutTicket(context: ArchetypeContext): ArchetypeLayout {
  const { palette, slots } = context
  const frame = createFrame({
    height: context.canvas.height,
    padding: SPACE.xl,
    width: context.canvas.width,
  })
  const panel = frame.content
  const layers: DraftingCanvasLayer[] = []
  let zIndex = 10

  layers.push(
    ...surfacePart({ nodeId: context.nodeId, palette, zIndex }, panel, {
      radius: "lg",
      shadow: "soft",
    }),
  )
  zIndex += 2

  const inner = subFrame(panel, SPACE.lg).content
  const hasAction = Boolean(slots.action)
  const captionHeight = slots.caption ? TEXT_HEIGHT.caption + SPACE.md : 0
  const titleHeight = slots.title ? TEXT_HEIGHT.title + SPACE.xs : 0
  const metaHeight = slots.meta ? TEXT_HEIGHT.body + SPACE.md : 0
  const actionHeight = hasAction ? ACTION_HEIGHT + SPACE.lg : 0
  const qrSide = Math.min(
    inner.width,
    inner.height - captionHeight - titleHeight - metaHeight - actionHeight,
  )

  const qr: Rect = {
    height: qrSide,
    width: qrSide,
    x: inner.x + (inner.width - qrSide) / 2,
    y: inner.y,
  }

  let cursor = qr.y + qr.height

  if (slots.caption) {
    cursor += SPACE.md
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        { height: TEXT_HEIGHT.caption, width: inner.width, x: inner.x, y: cursor },
        { align: "center", step: "caption", text: slots.caption, tone: "muted", uppercase: true },
      ),
    )
    zIndex += 1
    cursor += TEXT_HEIGHT.caption
  }

  if (slots.title) {
    cursor += SPACE.xs
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        { height: TEXT_HEIGHT.title, width: inner.width, x: inner.x, y: cursor },
        { align: "center", step: "title", text: slots.title },
      ),
    )
    zIndex += 1
    cursor += TEXT_HEIGHT.title
  }

  if (slots.meta) {
    cursor += SPACE.xs
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        { height: TEXT_HEIGHT.body, width: inner.width, x: inner.x, y: cursor },
        { align: "center", step: "body", text: slots.meta, tone: "muted" },
      ),
    )
    zIndex += 1
  }

  if (slots.action) {
    layers.push(
      ...pillButtonPart(
        { nodeId: context.nodeId, palette, zIndex },
        {
          height: ACTION_HEIGHT,
          width: inner.width,
          x: inner.x,
          y: inner.y + inner.height - ACTION_HEIGHT,
        },
        { label: slots.action },
      ),
    )
    zIndex += 2
  }

  return { layers, qr }
}

function buildArchetype(context: ArchetypeContext, archetype: TemplateArchetype): ArchetypeLayout {
  switch (archetype) {
    case "ticket":
      return layoutTicket(context)
    default:
      return layoutTicket(context)
  }
}

function authoringCardState(
  base: DraftingCardState,
  options: { fill: string; ratio: TemplateRatio },
): DraftingCardState {
  const size = getCanvasSizeFromTemplate(
    getSizeTemplate(options.ratio) ?? { height: 1080, width: 1080 },
  )

  return {
    ...base,
    bottomSpace: 0,
    cornerRadius: 0,
    enabled: true,
    fill: options.fill,
    height: size.height,
    lockAspectRatio: true,
    padding: 0,
    sizeMode: "fixed",
    sizePresetId: options.ratio,
    width: size.width,
    shadow: { ...base.shadow, opacity: 0, visible: false },
  }
}

function authoringQrState(base: QrStudioState, ink: string, side: number): QrStudioState {
  return {
    ...base,
    backgroundOptions: { color: "#ffffff", round: 0, transparent: true },
    dataModulesSettings: { type: "rounded", color: ink, roundSize: true },
    finderPatternInnerSettings: { type: "circle", color: ink },
    finderPatternOuterSettings: { type: "rounded-lg", color: ink },
    height: side,
    width: side,
  }
}

export function defineTemplate(
  definition: TemplateDefinition,
): () => DraftingWorkspaceDocumentV1 {
  return () => {
    const palette = getPalette(definition.palette)
    const canvas = getCanvasSizeFromTemplate(
      getSizeTemplate(definition.ratio) ?? { height: 1080, width: 1080 },
    )

    return buildTemplateDocumentSeed({
      data: definition.data,
      inputType: definition.inputType ?? "link",
      contentValues: { url: definition.data },
      card: (base) => authoringCardState(base, { fill: palette.bg, ratio: definition.ratio }),
      qr: (base) => {
        const probe = buildArchetype(
          { canvas, nodeId: "probe", palette, slots: definition.slots },
          definition.archetype,
        )

        return authoringQrState(base, palette.ink, Math.round(probe.qr.width))
      },
      layers: ({ defaultLayers, nodeId }) => {
        const layout = buildArchetype(
          { canvas, nodeId, palette, slots: definition.slots },
          definition.archetype,
        )
        const cardLayer = defaultLayers[0]!
        const qrLayer = defaultLayers[1]!

        return [
          cardLayer,
          ...layout.layers,
          {
            ...qrLayer,
            height: layout.qr.height,
            width: layout.qr.width,
            x: layout.qr.x,
            y: layout.qr.y,
            zIndex: 30,
          },
        ].sort((left, right) => left.zIndex - right.zIndex)
      },
    })
  }
}

export { centerTextRect, type PartContext }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run features/workspace/authoring/define-template.test.ts`
Expected: PASS, 5 tests. Common first failures and their fixes:
- `qr-quiet-zone-collision` — the action pill overlaps the QR. Increase `actionHeight`'s reserved space or reduce `qrSide`.
- `bounds-overflow` warning — a text rect runs past `inner`. Reduce the text width to `inner.width`.
- `qr-too-small` — `qrSide` collapsed because too many slots were reserved. Reduce `SPACE` gaps between text blocks, not the QR.

- [ ] **Step 5: Look at it**

Add the ticket to the registry temporarily and render:

```bash
pnpm render:templates
```

Open `.render/templates/index.html`. The QR must dominate, the pill label must sit optically centered, and nothing may crowd the QR. Fix visually before continuing — a validator-clean but ugly card is still a failure.

- [ ] **Step 6: Typecheck, lint, commit**

Run: `pnpm exec tsc --noEmit 2>&1 | rg authoring` — expect no output.
Run: `pnpm exec eslint features/workspace/authoring` — expect no output.

```bash
git add features/workspace/authoring/define-template.ts features/workspace/authoring/define-template.test.ts
git commit -m "feat(authoring): add defineTemplate with the ticket archetype"
```

---

### Task 5: Label archetype

**Files:**
- Modify: `features/workspace/authoring/define-template.ts`
- Modify: `features/workspace/authoring/define-template.test.ts`

**Interfaces:**
- Consumes: `hairlinePart` from Task 3 (new import), `layoutTicket`'s neighbours in the same file.
- Produces: the `"label"` branch of `buildArchetype`. No new exported symbols.

**Design:** museum-label composition — QR hero on the bare `bg` with no panel, a hairline rule beneath it, then caption/title/meta left-aligned in a single block. Asymmetric text, symmetric QR. No pill; `slots.action` is ignored for this archetype and must therefore not be silently dropped — the test asserts it throws.

- [ ] **Step 1: Add the failing test**

Append to `features/workspace/authoring/define-template.test.ts`:

```ts
describe("defineTemplate — label", () => {
  const buildLabel = defineTemplate({
    archetype: "label",
    data: "https://example.com/amsterdam",
    palette: "sand",
    ratio: "ratio-4-5",
    slots: { caption: "Scan to open", meta: "★ 4.61", title: "Trip to Amsterdam" },
  })

  it("produces a validator-clean document", () => {
    expect(validateTemplateDocument(buildLabel())).toEqual([])
  })

  it("keeps the qr as the subject", () => {
    const document = buildLabel()
    const nodeId = document.activeQrNodeId
    const cardState = document.cardStateByNodeId[nodeId]!
    const qrLayer = document.layerStateByNodeId[nodeId]!.find((layer) => layer.kind === "qr")!

    expect(qrLayer.width / Math.min(cardState.width, cardState.height)).toBeGreaterThanOrEqual(0.4)
  })

  it("draws a hairline rule between the qr and the text block", () => {
    const document = buildLabel()
    const nodeId = document.activeQrNodeId
    const layers = document.layerStateByNodeId[nodeId]!
    const qrLayer = layers.find((layer) => layer.kind === "qr")!
    const hairline = layers.find((layer) => layer.name === "Hairline")!

    expect(hairline.height).toBeLessThanOrEqual(4)
    expect(hairline.y).toBeGreaterThan(qrLayer.y + qrLayer.height)
  })

  it("rejects an action slot it cannot render", () => {
    expect(() =>
      defineTemplate({
        archetype: "label",
        data: "https://example.com",
        palette: "sand",
        ratio: "ratio-4-5",
        slots: { action: "Book now", title: "Nope" },
      })(),
    ).toThrow(/label archetype does not support the action slot/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run features/workspace/authoring/define-template.test.ts -t "label"`
Expected: FAIL — the hairline is absent because `buildArchetype` falls through to `layoutTicket`.

- [ ] **Step 3: Implement the archetype**

In `features/workspace/authoring/define-template.ts`, extend the parts import:

```ts
import {
  centerTextRect,
  hairlinePart,
  pillButtonPart,
  surfacePart,
  textPart,
  type PartContext,
} from "@/features/workspace/authoring/parts"
```

Add `layoutLabel` after `layoutTicket`:

```ts
/**
 * Label: no panel. QR hero on the raw background, a hairline rule, then a
 * left-aligned caption/title/meta block. Museum-label restraint.
 */
function layoutLabel(context: ArchetypeContext): ArchetypeLayout {
  const { palette, slots } = context

  if (slots.action) {
    throw new Error("label archetype does not support the action slot; use the ticket archetype")
  }

  const frame = createFrame({
    height: context.canvas.height,
    padding: SPACE.xl,
    width: context.canvas.width,
  })
  const inner = frame.content
  const layers: DraftingCanvasLayer[] = []
  let zIndex = 10

  const captionHeight = slots.caption ? TEXT_HEIGHT.caption + SPACE.sm : 0
  const titleHeight = slots.title ? TEXT_HEIGHT.title + SPACE.xs : 0
  const metaHeight = slots.meta ? TEXT_HEIGHT.body + SPACE.xs : 0
  const textBlockHeight = captionHeight + titleHeight + metaHeight
  const qrSide = Math.min(inner.width, inner.height - textBlockHeight - SPACE.lg * 2)

  const qr: Rect = {
    height: qrSide,
    width: qrSide,
    x: inner.x + (inner.width - qrSide) / 2,
    y: inner.y,
  }

  let cursor = qr.y + qr.height + SPACE.lg

  layers.push(
    ...hairlinePart(
      { nodeId: context.nodeId, palette, zIndex },
      { height: 2, width: inner.width, x: inner.x, y: cursor },
    ),
  )
  zIndex += 1
  cursor += SPACE.lg

  if (slots.caption) {
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        { height: TEXT_HEIGHT.caption, width: inner.width, x: inner.x, y: cursor },
        { step: "caption", text: slots.caption, tone: "muted", uppercase: true },
      ),
    )
    zIndex += 1
    cursor += TEXT_HEIGHT.caption + SPACE.sm
  }

  if (slots.title) {
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        { height: TEXT_HEIGHT.title, width: inner.width, x: inner.x, y: cursor },
        { step: "title", text: slots.title },
      ),
    )
    zIndex += 1
    cursor += TEXT_HEIGHT.title + SPACE.xs
  }

  if (slots.meta) {
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        { height: TEXT_HEIGHT.body, width: inner.width, x: inner.x, y: cursor },
        { step: "body", text: slots.meta, tone: "muted" },
      ),
    )
    zIndex += 1
  }

  return { layers, qr }
}
```

Replace the `buildArchetype` switch body:

```ts
function buildArchetype(context: ArchetypeContext, archetype: TemplateArchetype): ArchetypeLayout {
  switch (archetype) {
    case "label":
      return layoutLabel(context)
    case "ticket":
      return layoutTicket(context)
    default:
      return layoutTicket(context)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run features/workspace/authoring/define-template.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Typecheck, lint, commit**

Run: `pnpm exec tsc --noEmit 2>&1 | rg authoring` — expect no output.
Run: `pnpm exec eslint features/workspace/authoring` — expect no output.

```bash
git add features/workspace/authoring/define-template.ts features/workspace/authoring/define-template.test.ts
git commit -m "feat(authoring): add label archetype with hairline rule and left-aligned block"
```

---

### Task 6: Seal archetype using the shape catalogue

**Files:**
- Modify: `features/workspace/authoring/define-template.ts`
- Modify: `features/workspace/authoring/define-template.test.ts`

**Interfaces:**
- Consumes: `shapeFieldPart` from Task 3 (new import); `QR_BACKGROUND_SHAPES` shape ids from `@/features/qr-code/styles/background-shapes` (used as `DraftingElementShapeId` values).
- Produces: the `"seal"` branch of `buildArchetype`. No new exported symbols.

**Design:** the card *is* an object. A `scallop-seal` silhouette filled with `palette.accent` sits centered on `palette.bg`; the QR is knocked out in `palette.onAccent` inside it; a single uppercase caption sits below the QR, still inside the seal. This is the one archetype that uses the catalogue silhouette, and it uses exactly one.

**QR ink override:** the QR must render in `onAccent`, not `ink`, because it sits on `accent`. `defineTemplate` therefore asks the archetype which ink to use.

- [ ] **Step 1: Add the failing test**

Append to `features/workspace/authoring/define-template.test.ts`:

```ts
describe("defineTemplate — seal", () => {
  const buildSeal = defineTemplate({
    archetype: "seal",
    data: "https://example.com/members",
    palette: "blush",
    ratio: "ratio-1-1",
    slots: { caption: "Members" },
  })

  it("produces a validator-clean document", () => {
    expect(validateTemplateDocument(buildSeal())).toEqual([])
  })

  it("uses exactly one catalogue silhouette", () => {
    const document = buildSeal()
    const nodeId = document.activeQrNodeId
    const shapes = document.layerStateByNodeId[nodeId]!.filter((layer) => layer.kind === "shape")

    expect(shapes).toHaveLength(1)
    expect(shapes[0]?.shapeId).toBe("scallop-seal")
  })

  it("inks the qr in the on-accent colour", () => {
    const document = buildSeal()
    const nodeId = document.activeQrNodeId

    expect(document.qrStateByNodeId[nodeId]?.dataModulesSettings.color).toBe("#ffffff")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run features/workspace/authoring/define-template.test.ts -t "seal"`
Expected: FAIL — no shape layer exists because `buildArchetype` falls through to `layoutTicket`.

- [ ] **Step 3: Implement the archetype and the ink hook**

In `features/workspace/authoring/define-template.ts`, extend the parts import to include `shapeFieldPart`.

Widen `ArchetypeLayout`:

```ts
export type ArchetypeLayout = {
  layers: DraftingCanvasLayer[]
  qr: Rect
  qrInk?: string
}
```

Add `layoutSeal` after `layoutLabel`:

```ts
/**
 * Seal: the card is an object. One scallop-seal silhouette in accent, QR knocked
 * out inside it, one caption below the QR. Radially symmetric.
 */
function layoutSeal(context: ArchetypeContext): ArchetypeLayout {
  const { palette, slots } = context

  if (slots.action || slots.title || slots.meta) {
    throw new Error("seal archetype supports only the caption slot")
  }

  const frame = createFrame({
    height: context.canvas.height,
    padding: SPACE.lg,
    width: context.canvas.width,
  })
  const seal = frame.content
  const layers: DraftingCanvasLayer[] = []
  let zIndex = 10

  layers.push(
    ...shapeFieldPart({ nodeId: context.nodeId, palette, zIndex }, seal, {
      fill: palette.accent,
      shapeId: "scallop-seal",
    }),
  )
  zIndex += 1

  const qrSide = Math.round(seal.width * 0.44)
  const captionHeight = slots.caption ? TEXT_HEIGHT.caption : 0
  const stackHeight = qrSide + (slots.caption ? SPACE.md + captionHeight : 0)
  const stackTop = seal.y + (seal.height - stackHeight) / 2

  const qr: Rect = {
    height: qrSide,
    width: qrSide,
    x: seal.x + (seal.width - qrSide) / 2,
    y: stackTop,
  }

  if (slots.caption) {
    layers.push(
      ...textPart(
        { nodeId: context.nodeId, palette, zIndex },
        {
          height: captionHeight,
          width: seal.width,
          x: seal.x,
          y: qr.y + qr.height + SPACE.md,
        },
        { align: "center", step: "caption", text: slots.caption, tone: "onAccent", uppercase: true },
      ),
    )
    zIndex += 1
  }

  return { layers, qr, qrInk: palette.onAccent }
}
```

Add the case to `buildArchetype`:

```ts
    case "seal":
      return layoutSeal(context)
```

In `defineTemplate`, use the archetype's ink in the `qr` callback:

```ts
      qr: (base) => {
        const probe = buildArchetype(
          { canvas, nodeId: "probe", palette, slots: definition.slots },
          definition.archetype,
        )

        return authoringQrState(base, probe.qrInk ?? palette.ink, Math.round(probe.qr.width))
      },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run features/workspace/authoring/define-template.test.ts`
Expected: PASS, 12 tests.

If `qr-too-small` fires: the seal's usable interior is smaller than its bounding box, so `0.44` may need raising to `0.48`. Do not lower the validator floor.

- [ ] **Step 5: Look at it**

Run: `pnpm render:templates`, open the contact sheet, and confirm the QR sits inside the scalloped edge with even margin on all sides and the caption does not collide with the bottom scallops.

- [ ] **Step 6: Typecheck, lint, commit**

Run: `pnpm exec tsc --noEmit 2>&1 | rg authoring` — expect no output.
Run: `pnpm exec eslint features/workspace/authoring` — expect no output.

```bash
git add features/workspace/authoring/define-template.ts features/workspace/authoring/define-template.test.ts
git commit -m "feat(authoring): add seal archetype built on one catalogue silhouette"
```

---

### Task 7: Move the validation baseline out of the test file

**Files:**
- Create: `features/studio-hub/model/template-validation-baseline.ts`
- Modify: `features/studio-hub/model/template-validation.test.ts`

**Interfaces:**
- Consumes: `TemplateIssueCode` from `@/features/workspace/model/validate-template`.
- Produces:
  - `const STRICT_TEMPLATE_IDS: string[]`
  - `const KNOWN_ISSUE_CODES: Record<string, TemplateIssueCode[]>`

**Why:** Task 8 needs to add ids to the strict list, and importing values from a `*.test.ts` file is fragile. This moves both lists into a normal module.

- [ ] **Step 1: Create the module**

Create `features/studio-hub/model/template-validation-baseline.ts`, copying the arrays from the current `template-validation.test.ts` verbatim:

```ts
import type { TemplateIssueCode } from "@/features/workspace/model/validate-template"

/** Templates that must be completely clean — no errors, no warnings. */
export const STRICT_TEMPLATE_IDS: string[] = []

/**
 * Issue codes each legacy template is currently allowed to produce.
 * Shrink this as templates are re-authored; delete it once every id is strict.
 */
export const KNOWN_ISSUE_CODES: Record<string, TemplateIssueCode[]> = {
  "social-mint-cta": ["contrast-too-low", "layer-occluded"],
  "social-studio-index": ["qr-too-small"],
  "social-course-drop": ["qr-quiet-zone-collision", "qr-too-small"],
  "social-editorial-link": ["layer-renders-nothing", "qr-quiet-zone-collision", "qr-too-small"],
}
```

- [ ] **Step 2: Point the test at it**

In `features/studio-hub/model/template-validation.test.ts`, delete the local `STRICT_TEMPLATE_IDS` and `KNOWN_ISSUE_CODES` declarations and import them instead:

```ts
import {
  KNOWN_ISSUE_CODES,
  STRICT_TEMPLATE_IDS,
} from "@/features/studio-hub/model/template-validation-baseline"
```

- [ ] **Step 3: Run the test**

Run: `pnpm exec vitest run features/studio-hub/model/template-validation.test.ts`
Expected: PASS, unchanged behaviour.

- [ ] **Step 4: Commit**

```bash
git add features/studio-hub/model/template-validation-baseline.ts features/studio-hub/model/template-validation.test.ts
git commit -m "refactor(templates): move validation baseline into a module"
```

---

### Task 8: Port the templates and retire the app-screenshot one

**Files:**
- Create: `features/studio-hub/model/authored-templates.ts`
- Create: `features/studio-hub/model/authored-templates.test.ts`
- Modify: `features/studio-hub/model/template-registry.ts`
- Modify: `features/studio-hub/model/template-validation-baseline.ts`
- Modify: `features/studio-hub/model/social-card-templates.ts` (remove `social-course-drop`)
- Modify: `features/studio-hub/model/social-card-templates.test.ts` (drop `social-course-drop` from `SOCIAL_TEMPLATE_IDS`)

**Interfaces:**
- Consumes: `defineTemplate` (Tasks 4–6); `TemplateRegistryEntry`, `TEMPLATE_REGISTRY` from Plan A Task 1.
- Produces:
  - `const AUTHORED_TEMPLATE_BUILDERS: Record<string, () => DraftingWorkspaceDocumentV1>` with keys `authored-paris-ticket`, `authored-amsterdam-label`, `authored-members-seal`
  - `function buildAuthoredTemplateDocument(id: string): DraftingWorkspaceDocumentV1`

**Decisions, and why:**
- `social-mint-cta` → replaced by `authored-paris-ticket` (ticket archetype). The original had an occluded watermark, an orphan dot, and 1.15:1 CTA text.
- `social-editorial-link` → replaced by `authored-amsterdam-label` (label archetype). The original had a `fill: "none"` heart, a mis-centered button label, and the QR as a corner sticker.
- New `authored-members-seal` (seal archetype). Fills the gap: no template made the QR the subject *with* content.
- `social-course-drop` → **deleted.** 13 layers imitating an app screenshot, fake glass, QR floating over an illustration. Nothing to port.
- `social-studio-index` → **kept as-is.** It is the strongest existing card. Only its baseline entry stays.

- [ ] **Step 1: Write the failing test**

Create `features/studio-hub/model/authored-templates.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import {
  AUTHORED_TEMPLATE_BUILDERS,
  buildAuthoredTemplateDocument,
} from "@/features/studio-hub/model/authored-templates"
import { TEMPLATE_REGISTRY } from "@/features/studio-hub/model/template-registry"
import { validateTemplateDocument } from "@/features/workspace/model/validate-template"

const IDS = Object.keys(AUTHORED_TEMPLATE_BUILDERS)

describe("authored templates", () => {
  it("exposes three authored templates", () => {
    expect(IDS).toEqual([
      "authored-paris-ticket",
      "authored-amsterdam-label",
      "authored-members-seal",
    ])
  })

  it.each(IDS)("%s validates clean", (id) => {
    const issues = validateTemplateDocument(buildAuthoredTemplateDocument(id))

    expect(issues.map((issue) => `${issue.severity} ${issue.code}: ${issue.message}`)).toEqual([])
  })

  it.each(IDS)("%s is in the registry", (id) => {
    expect(TEMPLATE_REGISTRY.map((entry) => entry.id)).toContain(id)
  })

  it("has retired the course drop template", () => {
    expect(TEMPLATE_REGISTRY.map((entry) => entry.id)).not.toContain("social-course-drop")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run features/studio-hub/model/authored-templates.test.ts`
Expected: FAIL — cannot resolve `@/features/studio-hub/model/authored-templates`.

- [ ] **Step 3: Write the authored templates**

Create `features/studio-hub/model/authored-templates.ts`:

```ts
import { defineTemplate } from "@/features/workspace/authoring/define-template"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"

export const AUTHORED_TEMPLATE_BUILDERS: Record<string, () => DraftingWorkspaceDocumentV1> = {
  "authored-paris-ticket": defineTemplate({
    archetype: "ticket",
    data: "https://example.com/trip",
    palette: "mint",
    ratio: "ratio-4-5",
    slots: {
      action: "Reserve",
      caption: "Scan to book",
      meta: "5D 6N",
      title: "Trip to Paris",
    },
  }),

  "authored-amsterdam-label": defineTemplate({
    archetype: "label",
    data: "https://example.com/amsterdam",
    palette: "sand",
    ratio: "ratio-4-5",
    slots: {
      caption: "Scan to open",
      meta: "5D 6N · 4.61",
      title: "Trip to Amsterdam",
    },
  }),

  "authored-members-seal": defineTemplate({
    archetype: "seal",
    data: "https://example.com/members",
    palette: "blush",
    ratio: "ratio-1-1",
    slots: { caption: "Members" },
  }),
}

export function buildAuthoredTemplateDocument(id: string): DraftingWorkspaceDocumentV1 {
  const builder = AUTHORED_TEMPLATE_BUILDERS[id]

  if (!builder) {
    throw new Error(`unknown authored template: ${id}`)
  }

  return builder()
}
```

- [ ] **Step 4: Register them**

In `features/studio-hub/model/template-registry.ts`, add the import:

```ts
import {
  AUTHORED_TEMPLATE_BUILDERS,
  buildAuthoredTemplateDocument,
} from "@/features/studio-hub/model/authored-templates"
```

Add the entries and put them first so they lead the contact sheet:

```ts
const authoredEntries: TemplateRegistryEntry[] = Object.keys(AUTHORED_TEMPLATE_BUILDERS).map(
  (id) => ({
    buildDocument: () => buildAuthoredTemplateDocument(id),
    id,
    source: "authored",
  }),
)
```

Widen the `source` union in `TemplateRegistryEntry`:

```ts
  source: "authored" | "hub" | "social"
```

And change the export:

```ts
export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = [
  ...authoredEntries,
  ...socialEntries,
  ...hubEntries,
]
```

- [ ] **Step 5: Delete the course drop template**

In `features/studio-hub/model/social-card-templates.ts`: delete the whole `buildCourseDropDocument` function and its `"social-course-drop"` entry in `SOCIAL_CARD_TEMPLATE_BUILDERS`. Remove the now-unused `COURSE_HERO_ART` import.

In `features/studio-hub/model/social-card-templates.test.ts`: remove `"social-course-drop"` from the `SOCIAL_TEMPLATE_IDS` array.

Run: `pnpm exec knip 2>&1 | rg COURSE_HERO_ART` — if `COURSE_HERO_ART` is now unused in `features/studio-hub/model/social-card-art.ts`, delete that export too.

- [ ] **Step 6: Update the baseline**

Rewrite `features/studio-hub/model/template-validation-baseline.ts`:

```ts
import type { TemplateIssueCode } from "@/features/workspace/model/validate-template"

/** Templates that must be completely clean — no errors, no warnings. */
export const STRICT_TEMPLATE_IDS: string[] = [
  "authored-paris-ticket",
  "authored-amsterdam-label",
  "authored-members-seal",
]

/**
 * Issue codes each legacy template is currently allowed to produce.
 * Shrink this as templates are re-authored; delete it once every id is strict.
 */
export const KNOWN_ISSUE_CODES: Record<string, TemplateIssueCode[]> = {
  "social-mint-cta": ["contrast-too-low", "layer-occluded"],
  "social-studio-index": ["qr-too-small"],
  "social-editorial-link": ["layer-renders-nothing", "qr-quiet-zone-collision", "qr-too-small"],
}
```

- [ ] **Step 7: Run the full suite**

Run: `pnpm test`
Expected: PASS for `authored-templates`, `template-validation`, `template-registry`, `social-card-templates`, and every `features/workspace/authoring/*` test. Any other failure must match the pre-existing failures recorded in Plan A Task 7 Step 4.

- [ ] **Step 8: Look at all of them side by side**

Run: `pnpm render:templates`, then open `.render/templates/index.html`. The three authored cards lead the sheet. Compare them against `social-studio-index`. If an authored card looks worse than the card it replaced, fix the archetype — do not accept it because the tests are green.

- [ ] **Step 9: Typecheck, lint, commit**

Run: `pnpm exec tsc --noEmit` — expect no new errors.
Run: `pnpm lint` — expect no new errors.

```bash
git add features/studio-hub/model/authored-templates.ts \
  features/studio-hub/model/authored-templates.test.ts \
  features/studio-hub/model/template-registry.ts \
  features/studio-hub/model/template-validation-baseline.ts \
  features/studio-hub/model/social-card-templates.ts \
  features/studio-hub/model/social-card-templates.test.ts
git commit -m "feat(templates): author paris/amsterdam/members on the authoring layer, retire course drop"
```

---

### Task 9: The agent-facing authoring contract

**Files:**
- Create: `features/workspace/authoring/AGENTS.md`
- Modify: `AGENTS.md` (extend the `## QR Card Templates` section added by Plan A Task 8)

**Interfaces:**
- Consumes: everything above.
- Produces: no code.

- [ ] **Step 1: Write the module contract**

Create `features/workspace/authoring/AGENTS.md`:

````markdown
# Authoring QR card templates

A template is a small data declaration. You do not position layers.

```ts
import { defineTemplate } from "@/features/workspace/authoring/define-template"

export const buildParisTicket = defineTemplate({
  archetype: "ticket",
  data: "https://example.com/trip",
  palette: "mint",
  ratio: "ratio-4-5",
  slots: {
    action: "Reserve",
    caption: "Scan to book",
    meta: "5D 6N",
    title: "Trip to Paris",
  },
})
```

Register it in `AUTHORED_TEMPLATE_BUILDERS` (`features/studio-hub/model/authored-templates.ts`), add its id to `STRICT_TEMPLATE_IDS` (`features/studio-hub/model/template-validation-baseline.ts`), then run `pnpm test` and `pnpm render:templates`.

## Archetypes

| archetype | composition | slots |
| --- | --- | --- |
| `ticket` | surface panel, QR hero, centered caption/title/meta, full-width action pill | all four |
| `label` | no panel, QR hero on bare background, hairline rule, left-aligned block | caption, title, meta |
| `seal` | one catalogue silhouette, QR knocked out inside, caption below | caption |

## Hard rules

- **Never write a `DraftingCanvasLayer` object literal.** Compose `parts.ts` functions, which use the layer factories and keep `cornerRadius`↔`cornerRadii`, `shadow`↔`shadows[]`, `blur`↔`layerFilters[]` in sync. Raw literals desync silently and your styling vanishes.
- **Never write a colour, font size, spacing value, or radius.** Import from `tokens.ts`. Palettes are contrast-checked in `tokens.test.ts`.
- **Never compute `-width / 2`.** `frame.ts` owns center-origin math. Use `createFrame`, `rows`, `columns`, `center`, `inset`, `subFrame`.
- **The QR is the subject.** It must occupy at least 40% of the shorter canvas side. `validateTemplateDocument` errors below 14% and warns below 28%.
- **One silhouette per card, doing one job** — hold the QR, mask the art, or be the card outline. Never decoration scattered around a rectangle.
- **A green test is not a finished card.** Run `pnpm render:templates` and look at `.render/templates/index.html` before you claim it works.

## Adding an archetype

Add the id to `TemplateArchetype`, write a `layoutX(context): ArchetypeLayout` function returning `{ layers, qr, qrInk? }`, add its `case` to `buildArchetype`, and throw a descriptive error for slots it cannot render — never drop a slot silently. Add a test asserting `validateTemplateDocument` returns `[]` and that the QR/shorter-side ratio is at least `0.4`.
````

- [ ] **Step 2: Cross-link from the root AGENTS.md**

Append to the `## QR Card Templates` section of `AGENTS.md`:

```markdown
- **Authoring new templates:** read `features/workspace/authoring/AGENTS.md` first. Templates are declared with `defineTemplate` (archetype + palette + ratio + slots), never by positioning layers by hand. Authored templates live in `features/studio-hub/model/authored-templates.ts`.
```

- [ ] **Step 3: Commit**

```bash
git add features/workspace/authoring/AGENTS.md AGENTS.md
git commit -m "docs(authoring): add the template authoring contract for agents"
```

---

## Self-Review

**Spec coverage:** tokens → Task 1. Layout primitives → Task 2. Named parts, including the button-centering fix → Task 3. `defineTemplate` + archetypes → Tasks 4, 5, 6. Baseline refactor needed before ids can be promoted → Task 7. Porting, retiring `course-drop`, keeping `studio-index` → Task 8. Agent contract → Task 9.

**Placeholder scan:** none. Every step has complete code. Failure modes that are genuinely data-dependent (seal interior ratio, ticket slot overflow) name the exact adjustment and forbid weakening the validator.

**Type consistency:**
- `Rect` is defined once in `frame.ts` (Task 2) and imported by `parts.ts` (Task 3) and `define-template.ts` (Task 4).
- `PartContext` is defined in `parts.ts` (Task 3); every part call site passes `{ nodeId, palette, zIndex }`.
- `Palette`, `PaletteId`, `PaletteTone`, `RadiusToken`, `TypeToken`, `SPACE`, `RADIUS`, `TYPE`, `getPalette`, `toneColor` are all declared in Task 1 and used under those exact names later.
- `TemplateArchetype` lists `"label" | "seal" | "ticket"` in Task 4, so Tasks 5 and 6 add cases without changing the union.
- `ArchetypeLayout` gains the optional `qrInk` field in Task 6; Tasks 4 and 5 omit it, and `defineTemplate` reads it as `probe.qrInk ?? palette.ink`, so earlier archetypes stay valid.
- `STRICT_TEMPLATE_IDS` and `KNOWN_ISSUE_CODES` keep the same names when they move from the test file (Plan A Task 7) into the module (Task 7 here) and are edited in Task 8.
- `TemplateRegistryEntry.source` widens from `"hub" | "social"` to `"authored" | "hub" | "social"` in Task 8, which is the only change to a Plan A type; Plan A's `template-registry.test.ts` asserts `source` equals `"social"` for a social id, so it still passes.

**Known limitation, accepted:** `authoringQrState` runs the archetype layout twice (once as a probe to size the QR, once for real) because `buildTemplateDocumentSeed` resolves `qr` before `layers`. Layout functions are pure, so this is correct but does duplicate work. If it ever matters, memoize by definition identity.
