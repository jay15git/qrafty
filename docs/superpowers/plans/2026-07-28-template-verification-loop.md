# Template Verification Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make it possible to *see* and *machine-check* every QR card template, so design regressions and silent no-op layers fail a test instead of shipping.

**Architecture:** Three additions, no changes to existing renderers. (1) A single template registry that enumerates every template document in the app. (2) Two render surfaces over that registry — a dev route for human eyeballing and a Node script that writes PNGs for agents/CI. (3) A pure validator that walks a `DraftingWorkspaceDocumentV1` and returns structured issues (occluded layers, layers that render nothing, contrast failures, QR collisions, legacy/modern field desync), wired into `pnpm test`.

**Tech Stack:** TypeScript, Next.js 16 App Router, Vitest 4 (`environment: "node"`), `culori` (already a dependency, used for WCAG contrast), `@resvg/resvg-js` (new dev dependency, SVG→PNG in Node).

## Global Constraints

- Package manager is `pnpm`. Never invoke `npm` or `yarn`.
- Import via the `@/*` alias from `tsconfig.json`. No deep relative paths across features.
- Vitest runs with `environment: "node"`. Validator and registry code must not import React components or touch `window`/`document`.
- Do not modify `features/workspace/model/layers.ts` field semantics, `features/workspace/rendering/layer-dom-styles.ts`, or `features/workspace/export/layered-svg-parts.ts` in this plan. This plan only *observes*.
- `/new`, `/dashboard`, and `/settings` are removed routes. Do not add anything there.
- Verify locally with `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm test` before claiming a task complete. There is no CI workflow in this repo.
- Every new module gets a colocated `*.test.ts` next to it, matching the existing convention (e.g. `features/workspace/model/corner-radius.test.ts`).

## Correction to earlier analysis (read before Task 4)

`patchDraftingCanvasLayer` in `features/workspace/model/layers.ts:558` **already** syncs the dual-represented fields in both directions:

```558:598:features/workspace/model/layers.ts
export function patchDraftingCanvasLayer(
  layer: DraftingCanvasLayer,
  patch: Partial<DraftingCanvasLayer>,
): DraftingCanvasLayer {
  const merged = { ...layer, ...patch }

  if (patch.shadow && !patch.shadows) {
```

Every factory (`createDraftingShapeLayer`, `createDraftingTextLayer`, `createDraftingImageLayer`, `createDraftingShaderLayer`) routes through it. So the desync hazard exists **only when a raw `DraftingCanvasLayer` object literal is written by hand**, bypassing the factories — which is exactly what an agent does, because `DraftingCanvasLayer` is exported and looks like the public API.

Consequence: do **not** write a new normalizer. Instead, Task 4 detects desync as a validator rule, and the authoring plan (`2026-07-28-template-authoring-layer.md`) closes the hole by giving authors a narrower input type so raw literals are never needed.

---

### Task 1: Template registry

**Files:**
- Create: `features/studio-hub/model/template-registry.ts`
- Create: `features/studio-hub/model/template-registry.test.ts`

**Interfaces:**
- Consumes: `SOCIAL_CARD_TEMPLATE_BUILDERS` from `@/features/studio-hub/model/social-card-templates`, `QR_DESIGN_TEMPLATES` from `@/features/studio-hub/model/templates`, `DraftingWorkspaceDocumentV1` from `@/features/workspace/model/document`.
- Produces:
  - `type TemplateRegistryEntry = { buildDocument: () => DraftingWorkspaceDocumentV1; id: string; source: "social" | "hub" }`
  - `const TEMPLATE_REGISTRY: TemplateRegistryEntry[]`
  - `function getTemplateRegistryEntry(id: string): TemplateRegistryEntry | undefined`

- [ ] **Step 1: Write the failing test**

Create `features/studio-hub/model/template-registry.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import {
  TEMPLATE_REGISTRY,
  getTemplateRegistryEntry,
} from "@/features/studio-hub/model/template-registry"

describe("template registry", () => {
  it("includes every social template", () => {
    const ids = TEMPLATE_REGISTRY.map((entry) => entry.id)

    expect(ids).toContain("social-mint-cta")
    expect(ids).toContain("social-studio-index")
    expect(ids).toContain("social-course-drop")
    expect(ids).toContain("social-editorial-link")
  })

  it("has no duplicate ids", () => {
    const ids = TEMPLATE_REGISTRY.map((entry) => entry.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it("builds a usable document for every entry", () => {
    for (const entry of TEMPLATE_REGISTRY) {
      const document = entry.buildDocument()
      const nodeId = document.activeQrNodeId

      expect(document.cardStateByNodeId[nodeId], entry.id).toBeDefined()
      expect(document.qrStateByNodeId[nodeId], entry.id).toBeDefined()
      expect(document.layerStateByNodeId[nodeId]?.length, entry.id).toBeGreaterThan(0)
    }
  })

  it("looks entries up by id", () => {
    expect(getTemplateRegistryEntry("social-mint-cta")?.source).toBe("social")
    expect(getTemplateRegistryEntry("does-not-exist")).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run features/studio-hub/model/template-registry.test.ts`
Expected: FAIL — `Failed to resolve import "@/features/studio-hub/model/template-registry"`.

- [ ] **Step 3: Write the implementation**

Create `features/studio-hub/model/template-registry.ts`:

```ts
import {
  SOCIAL_CARD_TEMPLATE_BUILDERS,
  buildSocialCardTemplateDocument,
} from "@/features/studio-hub/model/social-card-templates"
import { QR_DESIGN_TEMPLATES } from "@/features/studio-hub/model/templates"
import {
  cloneDraftingWorkspaceDocument,
  type DraftingWorkspaceDocumentV1,
} from "@/features/workspace/model/document"

export type TemplateRegistryEntry = {
  buildDocument: () => DraftingWorkspaceDocumentV1
  id: string
  source: "social" | "hub"
}

const socialEntries: TemplateRegistryEntry[] = Object.keys(SOCIAL_CARD_TEMPLATE_BUILDERS).map(
  (id) => ({
    buildDocument: () => buildSocialCardTemplateDocument(id),
    id,
    source: "social",
  }),
)

const socialIds = new Set(socialEntries.map((entry) => entry.id))

const hubEntries: TemplateRegistryEntry[] = QR_DESIGN_TEMPLATES.filter(
  (template) => !socialIds.has(template.id),
).map((template) => ({
  buildDocument: () => cloneDraftingWorkspaceDocument(template.document),
  id: template.id,
  source: "hub",
}))

export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = [...socialEntries, ...hubEntries]

export function getTemplateRegistryEntry(id: string): TemplateRegistryEntry | undefined {
  return TEMPLATE_REGISTRY.find((entry) => entry.id === id)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run features/studio-hub/model/template-registry.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm exec tsc --noEmit 2>&1 | rg template-registry` — expect no output.
Run: `pnpm exec eslint features/studio-hub/model/template-registry.ts` — expect no output.

- [ ] **Step 6: Commit**

```bash
git add features/studio-hub/model/template-registry.ts features/studio-hub/model/template-registry.test.ts
git commit -m "feat(templates): add single registry enumerating every template document"
```

---

### Task 2: PNG render script

**Files:**
- Create: `scripts/render-templates.mts`
- Modify: `package.json:5-14` (add `render:templates` script)
- Modify: `.gitignore` (ignore the output directory)

**Interfaces:**
- Consumes: `TEMPLATE_REGISTRY` from Task 1; `buildDocumentPreviewMarkup(document, options?): Promise<string | null>` from `@/features/qr-code/rendering/document-preview`.
- Produces: `.render/templates/<id>.png` plus `.render/templates/index.html` on disk. No exported symbols.

**Why `.mts` run through Vitest:** the script must resolve the `@/*` alias and TypeScript sources. The repo has no `tsx`/`ts-node`. Vitest already resolves both, so the script is executed by `vitest run` against a thin runner file rather than by `node` directly.

- [ ] **Step 1: Add the rasterizer dependency**

Run: `pnpm add -D @resvg/resvg-js`
Expected: `pnpm-lock.yaml` updated, `@resvg/resvg-js` in `devDependencies`.

- [ ] **Step 2: Write the render script**

Create `scripts/render-templates.mts`:

```ts
import { mkdirSync, rmSync, writeFileSync } from "node:fs"

import { Resvg } from "@resvg/resvg-js"

import { buildDocumentPreviewMarkup } from "@/features/qr-code/rendering/document-preview"
import { TEMPLATE_REGISTRY } from "@/features/studio-hub/model/template-registry"

const OUT_DIR = ".render/templates"
const PNG_WIDTH = 720

export async function renderAllTemplates(): Promise<string[]> {
  rmSync(OUT_DIR, { force: true, recursive: true })
  mkdirSync(OUT_DIR, { recursive: true })

  const rendered: string[] = []
  const cards: string[] = []

  for (const entry of TEMPLATE_REGISTRY) {
    const markup = await buildDocumentPreviewMarkup(entry.buildDocument())

    if (!markup) {
      console.warn(`skipped ${entry.id}: preview markup was null`)
      continue
    }

    const png = new Resvg(markup, {
      fitTo: { mode: "width", value: PNG_WIDTH },
      font: { loadSystemFonts: true },
    })
      .render()
      .asPng()

    writeFileSync(`${OUT_DIR}/${entry.id}.png`, png)
    rendered.push(entry.id)
    cards.push(
      `<figure><figcaption>${entry.id}</figcaption><img src="./${entry.id}.png" alt="${entry.id}"></figure>`,
    )
  }

  writeFileSync(
    `${OUT_DIR}/index.html`,
    `<!doctype html><meta charset="utf-8"><title>Template renders</title>
<style>
  body{margin:0;padding:24px;background:#e9e9ec;font:12px ui-sans-serif,system-ui;
       display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;align-items:start}
  figure{margin:0}
  figcaption{margin-bottom:8px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#52525b}
  img{display:block;width:100%;height:auto;box-shadow:0 2px 12px rgba(0,0,0,.12)}
</style>
${cards.join("\n")}`,
  )

  return rendered
}
```

- [ ] **Step 3: Write the runner that executes it**

Create `scripts/render-templates.test.mts`:

```ts
import { existsSync } from "node:fs"
import { expect, it } from "vitest"

import { renderAllTemplates } from "./render-templates.mts"

it("renders every registered template to png", async () => {
  const rendered = await renderAllTemplates()

  expect(rendered.length).toBeGreaterThan(0)

  for (const id of rendered) {
    expect(existsSync(`.render/templates/${id}.png`), id).toBe(true)
  }

  expect(existsSync(".render/templates/index.html")).toBe(true)
}, 120_000)
```

- [ ] **Step 4: Add the package script**

In `package.json`, inside `"scripts"`, after `"test": "vitest run"`:

```json
    "render:templates": "vitest run scripts/render-templates.test.mts",
```

- [ ] **Step 5: Ignore the output directory**

Append to `.gitignore`:

```
.render/
```

- [ ] **Step 6: Run it**

Run: `pnpm render:templates`
Expected: PASS. Then `ls .render/templates` lists one `.png` per registry id plus `index.html`. Open `.render/templates/index.html` in a browser and confirm the cards look like cards (not blank, not clipped).

- [ ] **Step 7: Commit**

```bash
git add scripts/render-templates.mts scripts/render-templates.test.mts package.json pnpm-lock.yaml .gitignore
git commit -m "feat(templates): add pnpm render:templates for png output of every template"
```

---

### Task 3: Dev route for eyeballing

**Files:**
- Create: `app/dev/templates/page.tsx`

**Interfaces:**
- Consumes: `TEMPLATE_REGISTRY` from Task 1; `buildDocumentPreviewMarkup` from `@/features/qr-code/rendering/document-preview`.
- Produces: the `/dev/templates` route. No exported symbols beyond the default page component.

**Note:** this is a Server Component that renders the same SVG markup the export path produces, so it needs no client JS. Real fonts load because it renders inside the app shell from `app/layout.tsx`.

- [ ] **Step 1: Write the page**

Create `app/dev/templates/page.tsx`:

```tsx
import { buildDocumentPreviewMarkup } from "@/features/qr-code/rendering/document-preview"
import { TEMPLATE_REGISTRY } from "@/features/studio-hub/model/template-registry"

export default async function DevTemplatesPage() {
  const entries = await Promise.all(
    TEMPLATE_REGISTRY.map(async (entry) => ({
      id: entry.id,
      markup: await buildDocumentPreviewMarkup(entry.buildDocument()),
      source: entry.source,
    })),
  )

  return (
    <main className="min-h-dvh bg-[oklch(0.92_0.004_260)] p-6">
      <h1 className="mb-6 text-xs font-semibold tracking-[0.16em] text-[oklch(0.45_0.02_260)] uppercase">
        Template renders · {entries.length}
      </h1>

      <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
        {entries.map((entry) => (
          <figure key={entry.id} className="m-0">
            <figcaption className="mb-2 text-[0.65rem] font-semibold tracking-[0.08em] text-[oklch(0.45_0.02_260)] uppercase">
              {entry.id}
              <span className="ml-2 font-normal opacity-60">{entry.source}</span>
            </figcaption>
            {entry.markup ? (
              <div
                className="overflow-hidden bg-white shadow-[0_2px_12px_oklch(0_0_0_/_0.12)] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: entry.markup }}
              />
            ) : (
              <div className="grid h-40 place-items-center bg-white text-[0.7rem] text-red-600">
                preview markup was null
              </div>
            )}
          </figure>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify it renders**

Run: `pnpm dev` (note the port it prints; 3000 may be taken).
Open `http://localhost:<port>/dev/templates`.
Expected: one card per registry entry, no "preview markup was null" tiles.

- [ ] **Step 3: Lint**

Run: `pnpm exec eslint app/dev/templates/page.tsx`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add app/dev/templates/page.tsx
git commit -m "feat(dev): add /dev/templates route rendering every registered template"
```

---

### Task 4: Validator core — geometry, no-op layers, field desync

**Files:**
- Create: `features/workspace/model/validate-template.ts`
- Create: `features/workspace/model/validate-template.test.ts`

**Interfaces:**
- Consumes: `DraftingCanvasLayer` from `@/features/workspace/model/layers`; `DraftingWorkspaceDocumentV1` from `@/features/workspace/model/document`; `cornerRadiiToLegacyRadius` from `@/features/workspace/model/corner-radius`.
- Produces:
  - `type TemplateIssueCode = "bounds-overflow" | "contrast-too-low" | "field-desync" | "layer-occluded" | "layer-renders-nothing" | "qr-quiet-zone-collision" | "qr-too-small"`
  - `type TemplateIssue = { code: TemplateIssueCode; layerId?: string; message: string; severity: "error" | "warning" }`
  - `type ValidateTemplateOptions = { minQrRatio?: number }`
  - `function validateTemplateDocument(document: DraftingWorkspaceDocumentV1, options?: ValidateTemplateOptions): TemplateIssue[]`
  - `function layerRect(layer: DraftingCanvasLayer): { bottom: number; left: number; right: number; top: number }`

Task 5 adds the contrast rule and Task 6 adds the QR rules to this same file; `TemplateIssueCode` already lists their codes so the union does not change later.

- [ ] **Step 1: Write the failing test**

Create `features/workspace/model/validate-template.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { createDefaultDraftingWorkspaceDocument } from "@/features/workspace/model/document"
import {
  createDraftingShapeLayer,
  createDraftingTextLayer,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import { validateTemplateDocument } from "@/features/workspace/model/validate-template"

function documentWithLayers(extra: DraftingCanvasLayer[]) {
  const document = createDefaultDraftingWorkspaceDocument()
  const nodeId = document.activeQrNodeId
  const existing = document.layerStateByNodeId[nodeId] ?? []

  return {
    ...document,
    layerStateByNodeId: { [nodeId]: [...existing, ...extra] },
  }
}

const NODE = "node-1"

describe("validateTemplateDocument", () => {
  it("passes a default document", () => {
    const issues = validateTemplateDocument(createDefaultDraftingWorkspaceDocument())

    expect(issues.filter((issue) => issue.severity === "error")).toEqual([])
  })

  it("flags a shape with no fill and no stroke as rendering nothing", () => {
    const layer = createDraftingShapeLayer(NODE, "heart", {
      fillMode: "none",
      height: 52,
      id: "ghost-heart",
      strokeWidth: 0,
      width: 52,
      x: 0,
      y: 0,
      zIndex: 5,
    })

    const issues = validateTemplateDocument(documentWithLayers([layer]))

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "layer-renders-nothing", layerId: "ghost-heart" }),
    )
  })

  it("flags text hidden behind a later opaque shape", () => {
    const watermark = createDraftingTextLayer(NODE, {
      fill: "#9fd4bc",
      fontSize: 220,
      height: 240,
      id: "watermark",
      text: "Paris",
      width: 600,
      x: -300,
      y: -120,
      zIndex: 1,
    })
    const cover = createDraftingShapeLayer(NODE, "rect", {
      fill: "#ffffff",
      fillMode: "solid",
      height: 400,
      id: "cover",
      opacity: 1,
      width: 700,
      x: -350,
      y: -200,
      zIndex: 2,
    })

    const issues = validateTemplateDocument(documentWithLayers([watermark, cover]))

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "layer-occluded", layerId: "watermark" }),
    )
  })

  it("flags a layer positioned outside the canvas", () => {
    const layer = createDraftingShapeLayer(NODE, "rect", {
      fill: "#000000",
      fillMode: "solid",
      height: 40,
      id: "off-canvas",
      width: 40,
      x: 5_000,
      y: 5_000,
      zIndex: 4,
    })

    const issues = validateTemplateDocument(documentWithLayers([layer]))

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "bounds-overflow", layerId: "off-canvas" }),
    )
  })

  it("flags a raw layer whose legacy and modern fields disagree", () => {
    const base = createDraftingShapeLayer(NODE, "rect", {
      fill: "#000000",
      fillMode: "solid",
      height: 40,
      id: "desynced",
      width: 40,
      x: 0,
      y: 0,
      zIndex: 4,
    })
    const desynced: DraftingCanvasLayer = { ...base, cornerRadius: 24, shadows: [] }

    const issues = validateTemplateDocument(documentWithLayers([desynced]))

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "field-desync", layerId: "desynced" }),
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run features/workspace/model/validate-template.test.ts`
Expected: FAIL — cannot resolve `@/features/workspace/model/validate-template`.

- [ ] **Step 3: Write the implementation**

Create `features/workspace/model/validate-template.ts`:

```ts
import { cornerRadiiToLegacyRadius } from "@/features/workspace/model/corner-radius"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

export type TemplateIssueCode =
  | "bounds-overflow"
  | "contrast-too-low"
  | "field-desync"
  | "layer-occluded"
  | "layer-renders-nothing"
  | "qr-quiet-zone-collision"
  | "qr-too-small"

export type TemplateIssue = {
  code: TemplateIssueCode
  layerId?: string
  message: string
  severity: "error" | "warning"
}

export type ValidateTemplateOptions = {
  minQrRatio?: number
}

export type LayerRect = {
  bottom: number
  left: number
  right: number
  top: number
}

export function layerRect(layer: DraftingCanvasLayer): LayerRect {
  return {
    bottom: layer.y + layer.height,
    left: layer.x,
    right: layer.x + layer.width,
    top: layer.y,
  }
}

function contains(outer: LayerRect, inner: LayerRect) {
  return (
    outer.left <= inner.left &&
    outer.top <= inner.top &&
    outer.right >= inner.right &&
    outer.bottom >= inner.bottom
  )
}

function intersects(a: LayerRect, b: LayerRect) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

function isOpaqueCover(layer: DraftingCanvasLayer) {
  if (!layer.isVisible || layer.opacity < 1 || layer.rotation !== 0) {
    return false
  }

  if (layer.kind === "image" || layer.kind === "card" || layer.kind === "shader") {
    return true
  }

  if (layer.kind !== "shape") {
    return false
  }

  const isRectangular = (layer.shapeId ?? "rounded-square") === "rect"
  const radius = layer.cornerRadii
    ? cornerRadiiToLegacyRadius(layer.cornerRadii)
    : (layer.cornerRadius ?? 0)

  return isRectangular && radius <= 8 && layer.fillMode === "solid" && Boolean(layer.fill)
}

function rendersNothing(layer: DraftingCanvasLayer): string | null {
  if (!layer.isVisible) {
    return "layer is hidden"
  }

  if (layer.opacity <= 0) {
    return "opacity is 0"
  }

  if (layer.width <= 0 || layer.height <= 0) {
    return "width or height is 0"
  }

  if (layer.kind === "text" && !layer.text?.trim()) {
    return "text is empty"
  }

  if (layer.kind === "image" && !layer.imageValue) {
    return "image has no source"
  }

  if (layer.kind === "shape") {
    const hasFill = layer.fillMode === "solid" || layer.fillMode === "gradient" || layer.fillMode === "image"
    const hasStroke = (layer.strokeWidth ?? 0) > 0

    if (!hasFill && !hasStroke) {
      return "shape has neither fill nor stroke"
    }
  }

  return null
}

function fieldDesync(layer: DraftingCanvasLayer): string | null {
  if (layer.cornerRadii && layer.cornerRadius !== undefined) {
    const modern = cornerRadiiToLegacyRadius(layer.cornerRadii)

    if (modern !== layer.cornerRadius) {
      return `cornerRadius ${layer.cornerRadius} disagrees with cornerRadii ${modern}; the renderer reads cornerRadii`
    }
  }

  if (layer.shadow?.visible && (layer.shadows ?? []).length === 0) {
    return "shadow is visible but shadows[] is empty; the renderer reads shadows[]"
  }

  if (layer.blur > 0 && !(layer.layerFilters ?? []).some((filter) => filter.type === "blur")) {
    return "blur is set but layerFilters has no blur entry; the renderer reads layerFilters"
  }

  return null
}

export function validateTemplateDocument(
  document: DraftingWorkspaceDocumentV1,
  options: ValidateTemplateOptions = {},
): TemplateIssue[] {
  const nodeId = document.activeQrNodeId
  const cardState = document.cardStateByNodeId[nodeId]
  const layers = document.layerStateByNodeId[nodeId] ?? []
  const issues: TemplateIssue[] = []

  if (!cardState) {
    return [
      {
        code: "bounds-overflow",
        message: `document has no card state for node ${nodeId}`,
        severity: "error",
      },
    ]
  }

  const canvas: LayerRect = {
    bottom: cardState.height / 2,
    left: -cardState.width / 2,
    right: cardState.width / 2,
    top: -cardState.height / 2,
  }

  const ordered = [...layers].sort((left, right) => left.zIndex - right.zIndex)

  for (const [index, layer] of ordered.entries()) {
    const noop = rendersNothing(layer)
    if (noop) {
      issues.push({
        code: "layer-renders-nothing",
        layerId: layer.id,
        message: `${layer.name}: ${noop}`,
        severity: "warning",
      })
      continue
    }

    const desync = fieldDesync(layer)
    if (desync) {
      issues.push({
        code: "field-desync",
        layerId: layer.id,
        message: `${layer.name}: ${desync}`,
        severity: "error",
      })
    }

    const rect = layerRect(layer)

    if (!intersects(canvas, rect)) {
      issues.push({
        code: "bounds-overflow",
        layerId: layer.id,
        message: `${layer.name} is entirely outside the canvas`,
        severity: "error",
      })
    } else if (!contains(canvas, rect) && layer.kind !== "card") {
      issues.push({
        code: "bounds-overflow",
        layerId: layer.id,
        message: `${layer.name} extends past the canvas edge`,
        severity: "warning",
      })
    }

    if (layer.kind === "card") {
      continue
    }

    const covered = ordered
      .slice(index + 1)
      .some((above) => isOpaqueCover(above) && contains(layerRect(above), rect))

    if (covered) {
      issues.push({
        code: "layer-occluded",
        layerId: layer.id,
        message: `${layer.name} is completely hidden behind a later opaque layer`,
        severity: "error",
      })
    }
  }

  void options

  return issues
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run features/workspace/model/validate-template.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm exec tsc --noEmit 2>&1 | rg validate-template` — expect no output.
Run: `pnpm exec eslint features/workspace/model/validate-template.ts` — expect no output.

- [ ] **Step 6: Commit**

```bash
git add features/workspace/model/validate-template.ts features/workspace/model/validate-template.test.ts
git commit -m "feat(workspace): add template validator for geometry, no-op layers and field desync"
```

---

### Task 5: Contrast rule

**Files:**
- Modify: `features/workspace/model/validate-template.ts`
- Modify: `features/workspace/model/validate-template.test.ts`

**Interfaces:**
- Consumes: `wcagContrast` from `culori` (verified present: `node -e "console.log(typeof require('culori').wcagContrast)"` prints `function`); `layerRect` and the `LayerRect` helpers from Task 4.
- Produces: issues with `code: "contrast-too-low"`. No new exported symbols.

**Rule:** for each visible text layer, resolve the backdrop as the topmost lower-`zIndex` opaque layer whose rect contains the text rect, falling back to `cardState.fill`. Compare with `wcagContrast`. Threshold is 3:1 when `fontSize >= 24`, otherwise 4.5:1 (WCAG AA large-text allowance).

- [ ] **Step 1: Add the failing test**

Append inside the existing `describe("validateTemplateDocument", ...)` block in `features/workspace/model/validate-template.test.ts`:

```ts
  it("flags white body text on a mint surface", () => {
    const surface = createDraftingShapeLayer(NODE, "rect", {
      fill: "#d4f2e4",
      fillMode: "solid",
      height: 200,
      id: "mint-surface",
      width: 600,
      x: -300,
      y: -100,
      zIndex: 2,
    })
    const label = createDraftingTextLayer(NODE, {
      fill: "#ffffff",
      fontSize: 28,
      height: 40,
      id: "cta-label",
      text: "Book a trip to paris",
      width: 400,
      x: -200,
      y: -20,
      zIndex: 3,
    })

    const issues = validateTemplateDocument(documentWithLayers([surface, label]))

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "contrast-too-low", layerId: "cta-label" }),
    )
  })

  it("accepts dark text on a mint surface", () => {
    const surface = createDraftingShapeLayer(NODE, "rect", {
      fill: "#d4f2e4",
      fillMode: "solid",
      height: 200,
      id: "mint-surface",
      width: 600,
      x: -300,
      y: -100,
      zIndex: 2,
    })
    const label = createDraftingTextLayer(NODE, {
      fill: "#12241a",
      fontSize: 28,
      height: 40,
      id: "cta-label",
      text: "Book a trip to paris",
      width: 400,
      x: -200,
      y: -20,
      zIndex: 3,
    })

    const issues = validateTemplateDocument(documentWithLayers([surface, label]))

    expect(issues.filter((issue) => issue.code === "contrast-too-low")).toEqual([])
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run features/workspace/model/validate-template.test.ts -t "flags white body text"`
Expected: FAIL — no `contrast-too-low` issue is produced.

- [ ] **Step 3: Implement the rule**

In `features/workspace/model/validate-template.ts`, add the import at the top:

```ts
import { wcagContrast } from "culori"
```

Add these helpers above `validateTemplateDocument`:

```ts
function resolveBackdropFill(
  layer: DraftingCanvasLayer,
  below: DraftingCanvasLayer[],
  cardFill: string,
): string {
  const rect = layerRect(layer)

  for (const candidate of [...below].reverse()) {
    if (!isOpaqueCover(candidate) || candidate.fillMode === "image") {
      continue
    }

    if (candidate.fill && contains(layerRect(candidate), rect)) {
      return candidate.fill
    }
  }

  return cardFill
}

function contrastIssue(
  layer: DraftingCanvasLayer,
  below: DraftingCanvasLayer[],
  cardFill: string,
): TemplateIssue | null {
  if (layer.kind !== "text" || !layer.fill) {
    return null
  }

  const backdrop = resolveBackdropFill(layer, below, cardFill)
  const ratio = wcagContrast(layer.fill, backdrop)

  if (!Number.isFinite(ratio)) {
    return null
  }

  const minimum = (layer.fontSize ?? 16) >= 24 ? 3 : 4.5

  if (ratio >= minimum) {
    return null
  }

  return {
    code: "contrast-too-low",
    layerId: layer.id,
    message: `${layer.name}: ${layer.fill} on ${backdrop} is ${ratio.toFixed(2)}:1, below the ${minimum}:1 minimum`,
    severity: "error",
  }
}
```

Then, inside the `for (const [index, layer] of ordered.entries())` loop in `validateTemplateDocument`, immediately after the `bounds-overflow` checks and before `if (layer.kind === "card")`:

```ts
    const contrast = contrastIssue(layer, ordered.slice(0, index), cardState.fill)
    if (contrast) {
      issues.push(contrast)
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run features/workspace/model/validate-template.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm exec tsc --noEmit 2>&1 | rg validate-template` — expect no output.
Run: `pnpm exec eslint features/workspace/model/validate-template.ts` — expect no output.

- [ ] **Step 6: Commit**

```bash
git add features/workspace/model/validate-template.ts features/workspace/model/validate-template.test.ts
git commit -m "feat(workspace): fail template validation on text below WCAG AA contrast"
```

---

### Task 6: QR subject rules

**Files:**
- Modify: `features/workspace/model/validate-template.ts`
- Modify: `features/workspace/model/validate-template.test.ts`

**Interfaces:**
- Consumes: `ValidateTemplateOptions.minQrRatio` declared in Task 4 (currently unused via `void options`).
- Produces: issues with codes `qr-quiet-zone-collision` and `qr-too-small`. No new exported symbols.

**Rules:**
1. `qr-quiet-zone-collision` (error): any visible layer with a higher `zIndex` than the QR layer that intersects the QR rect grown by `qrState.margin` on every side.
2. `qr-too-small`: the QR's shorter side divided by the canvas's shorter side, compared against `minQrRatio` (default `0.28`). Below half the ratio is an error, below the ratio is a warning.

- [ ] **Step 1: Add the failing test**

Append inside `describe("validateTemplateDocument", ...)`:

```ts
  it("flags a layer sitting on top of the qr quiet zone", () => {
    const document = createDefaultDraftingWorkspaceDocument()
    const nodeId = document.activeQrNodeId
    const existing = document.layerStateByNodeId[nodeId] ?? []
    const qrLayer = existing.find((layer) => layer.kind === "qr")!
    const sticker = createDraftingShapeLayer(NODE, "ellipse", {
      fill: "#ffffff",
      fillMode: "solid",
      height: 80,
      id: "sticker",
      width: 80,
      x: qrLayer.x + 10,
      y: qrLayer.y + 10,
      zIndex: qrLayer.zIndex + 5,
    })

    const issues = validateTemplateDocument({
      ...document,
      layerStateByNodeId: { [nodeId]: [...existing, sticker] },
    })

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "qr-quiet-zone-collision", layerId: "sticker" }),
    )
  })

  it("flags a qr that is a corner sticker rather than the subject", () => {
    const document = createDefaultDraftingWorkspaceDocument()
    const nodeId = document.activeQrNodeId
    const existing = document.layerStateByNodeId[nodeId] ?? []
    const shrunk = existing.map((layer) =>
      layer.kind === "qr" ? { ...layer, height: 148, width: 148 } : layer,
    )

    const issues = validateTemplateDocument({
      ...document,
      cardStateByNodeId: {
        [nodeId]: { ...document.cardStateByNodeId[nodeId]!, height: 1080, width: 1080 },
      },
      layerStateByNodeId: { [nodeId]: shrunk },
    })

    expect(issues).toContainEqual(expect.objectContaining({ code: "qr-too-small" }))
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run features/workspace/model/validate-template.test.ts -t "quiet zone"`
Expected: FAIL — no `qr-quiet-zone-collision` issue is produced.

- [ ] **Step 3: Implement the rules**

In `features/workspace/model/validate-template.ts`, replace the `void options` line near the end of `validateTemplateDocument` with:

```ts
  const qrLayer = ordered.find((layer) => layer.kind === "qr" && layer.isVisible)

  if (qrLayer) {
    const margin = document.qrStateByNodeId[nodeId]?.margin ?? 0
    const qrRect = layerRect(qrLayer)
    const quietZone: LayerRect = {
      bottom: qrRect.bottom + margin,
      left: qrRect.left - margin,
      right: qrRect.right + margin,
      top: qrRect.top - margin,
    }

    for (const layer of ordered) {
      if (layer.kind === "qr" || layer.kind === "card" || !layer.isVisible) {
        continue
      }

      if (layer.zIndex > qrLayer.zIndex && layer.opacity > 0 && intersects(quietZone, layerRect(layer))) {
        issues.push({
          code: "qr-quiet-zone-collision",
          layerId: layer.id,
          message: `${layer.name} overlaps the QR quiet zone and can break scanning`,
          severity: "error",
        })
      }
    }

    const minQrRatio = options.minQrRatio ?? 0.28
    const ratio =
      Math.min(qrLayer.width, qrLayer.height) / Math.max(1, Math.min(cardState.width, cardState.height))

    if (ratio < minQrRatio) {
      issues.push({
        code: "qr-too-small",
        layerId: qrLayer.id,
        message: `QR occupies ${(ratio * 100).toFixed(1)}% of the shorter canvas side, below the ${(minQrRatio * 100).toFixed(0)}% minimum`,
        severity: ratio < minQrRatio / 2 ? "error" : "warning",
      })
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run features/workspace/model/validate-template.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm exec tsc --noEmit 2>&1 | rg validate-template` — expect no output.
Run: `pnpm exec eslint features/workspace/model/validate-template.ts` — expect no output.

- [ ] **Step 6: Commit**

```bash
git add features/workspace/model/validate-template.ts features/workspace/model/validate-template.test.ts
git commit -m "feat(workspace): validate qr quiet zone and qr-as-subject sizing"
```

---

### Task 7: Run the validator over every template and lock in the baseline

**Files:**
- Create: `features/studio-hub/model/template-validation.test.ts`

**Interfaces:**
- Consumes: `TEMPLATE_REGISTRY` (Task 1); `validateTemplateDocument`, `TemplateIssue` (Tasks 4–6).
- Produces: `STRICT_TEMPLATE_IDS` — an exported array in the test file that the authoring plan appends to as each template is fixed.

**Why a baseline:** the four existing templates currently fail these rules (that's the point — those are real bugs found by hand). A test that simply demands zero errors would be red from day one and get ignored. Instead: every template must produce **no new** issue codes beyond a recorded baseline, and any id listed in `STRICT_TEMPLATE_IDS` must be completely clean. The authoring plan moves ids into the strict list as it fixes them, and shrinks the baseline. When the baseline reaches empty, delete it.

- [ ] **Step 1: Print the current issues so the baseline is real, not guessed**

Run:

```bash
pnpm exec vitest run --reporter=basic features/studio-hub/model/template-validation.test.ts 2>&1 | rg -N "ISSUE"
```

This fails first (the file does not exist yet). Create a throwaway probe instead — `features/studio-hub/model/__probe.test.ts`:

```ts
import { it } from "vitest"

import { TEMPLATE_REGISTRY } from "@/features/studio-hub/model/template-registry"
import { validateTemplateDocument } from "@/features/workspace/model/validate-template"

it("prints issues", () => {
  for (const entry of TEMPLATE_REGISTRY) {
    for (const issue of validateTemplateDocument(entry.buildDocument())) {
      console.log(`ISSUE ${entry.id} ${issue.severity} ${issue.code} ${issue.layerId ?? "-"}`)
    }
  }
})
```

Run: `pnpm exec vitest run features/studio-hub/model/__probe.test.ts 2>&1 | rg ISSUE`
Record the output. Then delete the probe: `rm features/studio-hub/model/__probe.test.ts`

- [ ] **Step 2: Write the test using the recorded output**

Create `features/studio-hub/model/template-validation.test.ts`. Replace the `KNOWN_ISSUE_CODES` values with the codes actually printed in Step 1 — the entries below are the expected shape, and each template's array must be edited to match reality:

```ts
import { describe, expect, it } from "vitest"

import { TEMPLATE_REGISTRY } from "@/features/studio-hub/model/template-registry"
import {
  validateTemplateDocument,
  type TemplateIssueCode,
} from "@/features/workspace/model/validate-template"

/** Templates that must be completely clean. Add ids here as they are re-authored. */
export const STRICT_TEMPLATE_IDS: string[] = []

/**
 * Issue codes each legacy template is currently allowed to produce.
 * Shrink this as templates are fixed; delete it once every id is strict.
 */
const KNOWN_ISSUE_CODES: Record<string, TemplateIssueCode[]> = {
  "social-mint-cta": ["contrast-too-low", "layer-occluded"],
  "social-studio-index": ["qr-too-small"],
  "social-course-drop": ["qr-quiet-zone-collision", "qr-too-small"],
  "social-editorial-link": ["layer-renders-nothing", "qr-quiet-zone-collision", "qr-too-small"],
}

describe("template validation", () => {
  it.each(TEMPLATE_REGISTRY.map((entry) => entry.id))("%s introduces no new issues", (id) => {
    const entry = TEMPLATE_REGISTRY.find((candidate) => candidate.id === id)!
    const issues = validateTemplateDocument(entry.buildDocument())
    const allowed = new Set(KNOWN_ISSUE_CODES[id] ?? [])
    const unexpected = issues.filter((issue) => !allowed.has(issue.code))

    expect(
      unexpected.map((issue) => `${issue.code} ${issue.layerId ?? "-"}: ${issue.message}`),
    ).toEqual([])
  })

  it.each(STRICT_TEMPLATE_IDS.length > 0 ? STRICT_TEMPLATE_IDS : ["__none__"])(
    "%s is completely clean",
    (id) => {
      if (id === "__none__") {
        expect(STRICT_TEMPLATE_IDS).toEqual([])
        return
      }

      const entry = TEMPLATE_REGISTRY.find((candidate) => candidate.id === id)!
      const issues = validateTemplateDocument(entry.buildDocument())

      expect(issues.map((issue) => `${issue.code}: ${issue.message}`)).toEqual([])
    },
  )
})
```

- [ ] **Step 3: Run the test**

Run: `pnpm exec vitest run features/studio-hub/model/template-validation.test.ts`
Expected: PASS. If a template reports a code not in its `KNOWN_ISSUE_CODES` array, either the validator found a genuine extra bug (add the code to the baseline and note it) or a rule is over-firing (fix the rule).

- [ ] **Step 4: Confirm the whole suite still passes**

Run: `pnpm test`
Expected: no new failures beyond those already failing on `main` before this plan started. Record any pre-existing failures so they are not attributed to this work.

- [ ] **Step 5: Commit**

```bash
git add features/studio-hub/model/template-validation.test.ts
git commit -m "test(templates): validate every registered template against a recorded baseline"
```

---

### Task 8: Document the loop for humans and agents

**Files:**
- Modify: `AGENTS.md` (append a section after the existing `## Testing Notes` section)

**Interfaces:**
- Consumes: everything above.
- Produces: no code. This is the contract future agents read before touching templates.

- [ ] **Step 1: Append the section**

Add to `AGENTS.md`:

```markdown
## QR Card Templates

- Every template document is enumerated by `TEMPLATE_REGISTRY` in `features/studio-hub/model/template-registry.ts`. Register new templates there or they are invisible to tooling.
- **Look at your output before claiming a template works.** Two ways:
  - `pnpm render:templates` writes `.render/templates/<id>.png` plus an `index.html` contact sheet.
  - `/dev/templates` renders every template in the running dev server with real fonts.
- `validateTemplateDocument` in `features/workspace/model/validate-template.ts` machine-checks a document. `features/studio-hub/model/template-validation.test.ts` runs it over the whole registry.
- The validator catches what review misses: layers hidden behind opaque layers, shapes with no fill and no stroke, text below WCAG AA contrast, layers off-canvas, anything covering the QR quiet zone, and a QR too small to be the subject.
- **Never hand-write a `DraftingCanvasLayer` object literal.** Use `createDraftingShapeLayer`, `createDraftingTextLayer`, `createDraftingImageLayer`, or `createDraftingShaderLayer`. They route through `patchDraftingCanvasLayer`, which keeps the legacy and modern representations in sync (`cornerRadius`↔`cornerRadii`, `shadow`↔`shadows[]`, `blur`↔`layerFilters[]`). Raw literals silently desync, the renderer reads the modern field, and your styling disappears. The validator reports this as `field-desync`.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: document the template render and validation loop"
```

---

## Self-Review

**Spec coverage:** Render loop → Tasks 2 (PNG/agents) and 3 (dev route/human). Validator → Tasks 4, 5, 6. Wired into `pnpm test` → Task 7. Dual-representation concern → reframed in the "Correction" section, implemented as the `field-desync` rule in Task 4 and the hard rule in Task 8's docs. Registry prerequisite → Task 1.

**Placeholders:** none. Task 7 Step 1 deliberately derives the baseline from real output rather than guessing, and states exactly how to produce it.

**Type consistency:** `TemplateIssueCode` is declared once in Task 4 with all seven codes, including the ones Tasks 5 and 6 emit, so the union never changes. `layerRect`/`LayerRect`, `contains`, `intersects`, and `isOpaqueCover` are defined in Task 4 and reused by name in Tasks 5 and 6. `ValidateTemplateOptions.minQrRatio` is declared in Task 4 and consumed in Task 6. `TEMPLATE_REGISTRY` and `TemplateRegistryEntry` keep the same names in Tasks 1, 2, 3, 7.

**Known gap, intentional:** this plan does not fix any template. It only makes failure visible. Fixing is `2026-07-28-template-authoring-layer.md`.
