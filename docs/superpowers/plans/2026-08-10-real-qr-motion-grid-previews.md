# Real QR Motion Grid Previews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render every dot-matrix preset as a real QR code with its actual animation inside the motion preset grid.

**Architecture:** Reuse the existing QR SVG pipeline and dot-matrix animation math. Each tile shows a real version-1 QR SVG with the selected preset visibly running. A shared requestAnimationFrame scheduler drives all thumbnail roots from one clock, instead of starting one loop per tile; preview settings are isolated from the main canvas state, and selecting a tile still updates the real canvas animation.

**Tech Stack:** Next.js 16, React 19, TypeScript, `qrcode.react`, `@new-qr/qr/dot-matrix`, existing QR motion bridge and SVG adapter.

## Global Constraints

- Use `pnpm` for checks.
- Preserve the existing `DesktopMotionPresetTileButton` interaction and accessibility semantics.
- Use the same `adaptExternalQRCodeSVG` + `DotMatrixAnimatedSvg` engine as the canvas; no GIF/video assets.
- Keep preview SVG markup deterministic and memoized.
- Respect `prefers-reduced-motion`.
- Preview animation must not mutate shared studio state or start a second full-size canvas animation.
- Keep all existing unrelated working-tree changes.

### Task 1: Add a deterministic thumbnail QR SVG factory

**Files:**
- Create: `features/desktop-shell/components/dot-matrix-motion-preview.tsx`
- Modify: `features/qr-code/motion/dot-matrix-bridge.ts` (export a small state-independent QR thumbnail helper only if needed)
- Test: `features/desktop-shell/components/dot-matrix-motion-preview.test.tsx`

**Interfaces:**
- Produce `createDotMatrixMotionPreviewSvg(): string`.
- The SVG must encode `https://new-qr-studio.local/preview`, use a fixed QR size/module count, omit logo and artwork, and pass through `adaptExternalQRCodeSVG` so modules have `.module`, `data-row`, and `data-column` annotations required by `runDotMatrixAnimation`.

- [ ] **Step 1: Write failing tests**

```tsx
it("creates an annotated real QR SVG", () => {
  const markup = createDotMatrixMotionPreviewSvg()
  expect(markup).toContain("<svg")
  expect(markup).toContain('class="module"')
  expect(markup).toContain("data-row")
  expect(markup).toContain("data-column")
})
```

- [ ] **Step 2: Run test**

Run: `pnpm exec vitest run features/desktop-shell/components/dot-matrix-motion-preview.test.tsx`
Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement**

Use `renderToStaticMarkup(createElement(QRCodeSVG, { value: "https://new-qr-studio.local/preview", size: 96, marginSize: 1, level: "M" }))`, then call `adaptExternalQRCodeSVG(markup, { moduleColor: "#1f2937", positionCenterColor: "#1f2937", positionRingColor: "#1f2937", squares: false })`. Cache the resulting string at module scope; it never depends on editor state.

- [ ] **Step 4: Run test**

Run the same Vitest command. Expected: PASS.

### Task 2: Build one real animated QR tile component

**Files:**
- Modify: `features/desktop-shell/components/dot-matrix-motion-preview.tsx`
- Test: `features/desktop-shell/components/dot-matrix-motion-preview.test.tsx`

**Interfaces:**
- Export `DotMatrixMotionPreview({ preset }: { preset: QrDotMatrixSquareLoader })`.

- [ ] **Step 1: Write failing component tests**

```tsx
it("renders the real QR animation runtime for each preset", () => {
  const view = render(<DotMatrixMotionPreview preset="radial-expand" />)
  expect(view.container.querySelector('[data-export-animated-qr="true"]')).not.toBeNull()
  expect(view.container.querySelector("svg .module")).not.toBeNull()
})

it("does not create a canvas-sized preview", () => {
  const view = render(<DotMatrixMotionPreview preset="heart-expand" active />)
  expect(view.container.firstElementChild?.getAttribute("style")).toContain("width: 56px")
})
```

- [ ] **Step 2: Implement**

Memoize the cached SVG and render the real annotated QR at `56 × 56` with `preset={preset}`, `respectReducedMotion`, and compact settings. Register the root with a shared preview scheduler that owns one RAF clock and advances all mounted thumbnail roots. Add `contain: strict`, `overflow: hidden`, and `aria-hidden="true"` to the preview wrapper. Reduced motion leaves the real QR static.

- [ ] **Step 3: Run tests**

Run: `pnpm exec vitest run features/desktop-shell/components/dot-matrix-motion-preview.test.tsx`
Expected: PASS.

### Task 3: Integrate previews into the motion preset grid

**Files:**
- Modify: `features/desktop-shell/components/FloatingToolbar.tsx`
- Modify: `app/globals.css`
- Test: `features/desktop-shell/components/FloatingToolbar.test.tsx`

**Interfaces:**
- `DesktopMotionInspector` passes `loader.value` and selection state to each tile.
- `DesktopMotionPresetTileButton` adds `DotMatrixMotionPreview` while retaining its existing label, `aria-label`, `aria-pressed`, and click handler.

- [ ] **Step 1: Add failing integration assertions**

Assert all 15 dot-matrix preset buttons contain an annotated QR preview, and the selected preset has `data-preview-active="true"`.

- [ ] **Step 2: Implement**

Render the preview above the label in the existing 54px tile. Set `active` when selected; add hover/focus activation without React state. Do not render preview QR data into the main canvas or alter the editor state on hover.

- [ ] **Step 3: Run focused test**

Run: `pnpm exec vitest run features/desktop-shell/components/FloatingToolbar.test.tsx`
Expected: PASS (existing act warnings may remain).

### Task 4: Verify performance and accessibility

**Files:**
- Modify: `features/desktop-shell/components/dot-matrix-motion-preview.tsx` only if profiling exposes a real issue.
- Test: `features/desktop-shell/components/dot-matrix-motion-preview.test.tsx`

- [ ] **Step 1: Verify DOM budget**

Assert preview module count is fixed and small (no more than 441 modules per tile), SVG markup is reused, and all mounted previews use the shared scheduler rather than one RAF loop each.

- [ ] **Step 2: Verify reduced motion**

Run the component test with `matchMedia("(prefers-reduced-motion: reduce)")` returning true. Assert no animation loop is started and the QR remains visible.

- [ ] **Step 3: Run final checks**

Run:

```bash
pnpm exec vitest run features/desktop-shell/components/dot-matrix-motion-preview.test.tsx features/desktop-shell/components/FloatingToolbar.test.tsx
pnpm exec tsc --noEmit
pnpm lint
```

Record unrelated pre-existing lint/type errors separately; do not broaden this feature to fix them.
