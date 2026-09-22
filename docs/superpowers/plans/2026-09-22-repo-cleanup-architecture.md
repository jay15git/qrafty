# Repo Cleanup & Architecture Fix — Implementation Plan

> **For agentic workers:** Execute task-by-task in order. Steps use checkbox (`- [ ]`) syntax. Never reorder phases: each phase is the safety net for the next.

**Goal:** Turn qrafty from a god-file codebase (47/100 react-doctor, one 3,750-line component, three overlapping vocabularies) into a deep-module codebase with one domain language, small interfaces, and enforced boundaries.

**Architecture:** Deep modules per codebase-design: few-method interfaces, complexity hidden inside. One canonical domain vocabulary per domain-modeling (CONTEXT.md). God files split along their *already-visible* seams (hooks + pure helpers), not invented layers. Boundaries enforced by tooling, not convention.

**Tech Stack:** Next.js 16.2.3, React 19, Tailwind 4, Vitest 4, pnpm. Tools already in repo: `pnpm knip`, `fallow dead-code`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `npx react-doctor`.

**Evidence baseline (2026-09-22):**
- react-doctor: 47/100 — 143 issues (1 security error, 15 bug errors, 14 perf errors, 42 maintainability, 12 a11y)
- knip: clean · fallow: 2 issues (1 unused type, 1 duplicate `GradientStop` export)
- lint: 214 errors baseline (mostly `packages/qr/vendor/`, `.agents/skills/`) — do not count as regression
- tests: 62 failing across 11 files (browser-dependent UI tests) — quarantine, don't fix blindly
- God files: `svg-extension.ts` 4148 · `WorkspaceSurface.tsx` 4009 (single function, ~40 nested fns, 30 refs) · `layers.ts` 2029 · `MobileSettingsRail.tsx` 1904 · `PaneWorkspace.tsx` 1719 · `settings-ui.tsx` 1603 · `platform-intents.ts` 1397

## Global Constraints

- Behavior-preserving only. No feature changes, no visual changes.
- `pnpm` only. `@/*` import alias. Follow `AGENTS.md` — it is the source of truth; update it when the plan contradicts it.
- After every task: `pnpm typecheck` must pass. After every phase: `pnpm test` must not regress vs the recorded baseline, `npx react-doctor . --verbose` score must not drop.
- Never hand-write `DraftingCanvasLayer` literals — use the `createDrafting*Layer` factories (AGENTS.md rule).
- `public/` is off-limits for this plan (692 asset files, knip-clean).
- No changes under `/new`, `/dashboard`, `/settings` (removed routes — dead, leave dead).

---

## Phase 0 — Verification baseline (before any refactor)

**Why:** 62 failing tests + no CI means every later change is unverifiable. Record the baseline so regressions are detectable.

### Task 0.1: Record baselines

- [ ] Run `pnpm test 2>&1 | tee /tmp/test-baseline.txt`; write the failing-file list into `docs/superpowers/plans/test-baseline.md`.
- [ ] Run `npx react-doctor . --json > docs/superpowers/plans/react-doctor-baseline.json`.
- [ ] Run `pnpm lint 2>&1 | tail -5 > docs/superpowers/plans/lint-baseline.txt` (record error count only).
- [ ] Commit: `chore: record refactor baseline (tests, react-doctor, lint)`

### Task 0.2: Quarantine browser-dependent tests

The 62 failures are `environment: "node"` mismatches (AGENTS.md). Do NOT fix assertions — mark them so the suite is green-able.

- [ ] For each failing UI test file, add at top of the failing `describe`:
```ts
import { describe } from "vitest";
// Quarantined: requires browser env (jsdom/happy-dom not configured). See test-baseline.md
describe.skipIf(typeof window === "undefined")("ComponentName", () => { ... })
```
- [ ] `pnpm test` → expected: only the quarantined files skip; previously-passing 851 still pass.
- [ ] If any failure is NOT env-related (node-env logic bug), file it in `test-baseline.md` under "real failures" — do not skip it.
- [ ] Commit: `test: quarantine browser-dependent tests pending jsdom setup`

---

## Phase 1 — Domain vocabulary (fixes the "wtf is WorkspaceSurface" problem)

**Why:** `Pane`, `Workspace`, `Surface`, `Desktop`, `New` are used interchangeably for the same things. Renames before splits would churn twice; vocabulary first, then splits adopt it.

### Task 1.1: Write CONTEXT.md glossary

Create `/CONTEXT.md` (domain glossary only — no implementation details). Draft terms; user approves before Phase 2+ renames anything:

```markdown
# Qrafty Domain Glossary

## Canvas — THE design surface the user edits on. (was: WorkspaceSurface, DraftingPaneSurface, canvas)
## Layer — an object on a Canvas: qr | text | image | shape | shader | group. (was: DraftingCanvasLayer, PaneLayer)
## Workspace — the whole editing experience = Canvas + Inspector + toolbar chrome.
## Pane — a named, persistable Workspace document/tab. (keep: it is a real domain object, see PaneWorkspace)
## Inspector — the settings UI column (desktop panel / mobile rail+drawer). (was: desktopnew-*, settings-sections, FloatingToolbar settings)
## QR — the QR element and its style state (QraftyState).
## Fill — a color/gradient/image/pattern value applied to a Layer or QR part. (was: fill-picker, gradient fill, cardFill, dotsColorMode)
## Scene — rendered background composition behind the QR (paper shader, wallpaper). (was: scene composition, card background)
## Banned in new names: New/desktopnew (it shipped), Surface, Chrome, Shell-except-desktop-shell (existing feature folder), Generic suffixes: Manager/Helper/Util (except lib/utils cn())
```

- [ ] Write CONTEXT.md, get user sign-off on terms.
- [ ] Commit: `docs: add domain glossary`

### Task 1.2: ADR for naming rules

- [ ] `docs/adr/0001-domain-vocabulary.md`: decision = canonical terms above + rename mapping table (`WorkspaceSurface→DraftingCanvas`, `desktopnew-*→inspector-*`, `PaneWorkspace→WorkspaceDocumentView` — final names decided in Task 1.1). Hard-to-reverse + surprising-without-context + real trade-off = ADR-worthy.
- [ ] Commit: `docs: ADR 0001 domain vocabulary`

---

## Phase 2 — Split WorkspaceSurface.tsx (4009 → target <500)

**Why:** react-doctor's #1 offender (giant component, high complexity, 4 missing effect deps at :1617/:3614/:3876). It is the pilot that sets the extraction convention for Phases 3–4.

**Natural seams already in the file** (nested function groups — each becomes a hook):
- History/undo: `draftingWorkspaceHistoryRef`, `draftingWorkspaceHistoryIndexRef`, `setDraftingHistoryStack`, `restoreDraftingHistorySnapshot`, `handleUndo/Redo`, `buildDraftingWorkspaceDocument`, `applyDraftingWorkspaceDocumentToControls` → `useDraftingHistory`
- QR state sync: `syncDrafting*ControlsFromState` (×6), `resolveLiveQrPersistState`, `commitActiveQraftyState`, `persistActiveQrLayerState`, `pendingQrPersistStateRef` → `useQrStateSync`
- Layer selection: `selectSingleLayer`, `applyLayerSelection`, `activateQrLayer`, `draftingLayerClipboardRef` → `useLayerSelection`
- Export: `exportInProgress`, `exportProgress*`, `exportAbortControllerRef`, `canDownload`, `canExportVideo` → `useWorkspaceExport`
- Logo/brand-icon: `handleDraftingBrandIconSelection`, `syncDraftingLogoAsset`, `clearDraftingLogoPreset`, `logoUploadObjectUrlRef`, `brandIcon*Ref` → `useLogoAsset`
- Everything `ensure*ItemExpanded` (7 fns + 7 lazyRefs) → `useExpandedSettingsItems`

**File map:**
```
features/workspace/components/WorkspaceSurface.tsx      → features/workspace/canvas/DraftingCanvas.tsx
  ├─ canvas/use-drafting-history.ts
  ├─ canvas/use-qr-state-sync.ts
  ├─ canvas/use-layer-selection.ts
  ├─ canvas/use-workspace-export.ts
  ├─ canvas/use-logo-asset.ts
  ├─ canvas/use-expanded-settings-items.ts
  └─ DraftingCanvas.tsx keeps: JSX tree + wiring only
```

### Task 2.1–2.7: One task per seam extraction. Per task:

- [ ] Move the nested functions + their refs into the hook file verbatim first (no renames yet — git tracks the move).
- [ ] Hook returns `{ state, handlers }` object; component destructures.
- [ ] `pnpm typecheck` + `pnpm exec vitest run features/workspace/components/WorkspaceSurface.test.tsx` (1216 lines of tests exist — the seam is tested through the component; do not add hook tests yet).
- [ ] Fix any `exhaustive-deps` the move surfaces (the 4 react-doctor missing-deps warnings) — read the code first, do not blanket-add deps.
- [ ] Commit per seam: `refactor: extract useDraftingHistory from WorkspaceSurface`

### Task 2.8: Rename + move

- [ ] `git mv features/workspace/components/WorkspaceSurface.tsx features/workspace/canvas/DraftingCanvas.tsx`; rename component + `WorkspaceSurfaceProps`.
- [ ] Update the ~176 import sites (graph shows it bridges 27 communities — use `rg -l "WorkspaceSurface"`; mechanical rename via `pnpm exec tsc` errors as checklist).
- [ ] Keep a temporary `export { DraftingCanvas as WorkspaceSurface }` shim ONLY if import sites exceed ~50; delete shim in the same PR once imports are migrated — do not leave it.
- [ ] `pnpm typecheck && pnpm test && npx react-doctor features/workspace/canvas --verbose`.
- [ ] Commit: `refactor: WorkspaceSurface → canvas/DraftingCanvas`

---

## Phase 3 — Split remaining god files

Same recipe: extract pure helpers → sibling modules, hook-ize stateful clusters. Order by pain:

### Task 3.1: `features/qr-code/rendering/svg-extension.ts` (4148)
- [ ] Split: `svg-extension/dot-matrix-animation.ts` (createDotMatrixAnimationStyle, createClassCellAnimation, createDotMatrixLoaderSpec), `svg-extension/background-shape-layout.ts` (backgroundShapeLayout, chevronDistance, clampDotMatrixUnit), `svg-extension/render-metrics.ts` (backgroundRenderMetrics). Pure functions — trivially testable, tests already exist in `svg-extension.test.ts` (1215 lines).
- [ ] Commit: `refactor: split svg-extension by concern`

### Task 3.2: `features/desktop-shell/components/MobileSettingsRail.tsx` (1904)
- [ ] Extract each `MOBILE_FAMILY_ROWS` component to `mobile-settings-rail/rows/<family>.tsx`. Extract the side-effect-in-state-updater block at :649–:705 into a reducer or `useRailViewState`. Fixes react-doctor `no-side-effect-in-state-updater-function` ×7.
- [ ] `FloatingToolbar.test.tsx` covers the rail — must stay green.

### Task 3.3: `features/workspace/components/PaneWorkspace.tsx` (1719) + `PaneLayerViews.tsx` (970)
- [ ] Rename per CONTEXT.md (likely `WorkspaceDocumentView` / `LayerView`). Extract pane-layer geometry already in `pane-layer-geometry.ts` — extend it, don't duplicate.

### Task 3.4: `features/workspace/model/layers.ts` (2029) + `settings-ui.tsx` (1603) + `platform-intents.ts` (1397)
- [ ] `layers.ts` → `model/layers/{shape,text,image,shader,group}.ts` behind one `layers/index.ts` barrel.
- [ ] `settings-ui.tsx` → split section components.
- [ ] `platform-intents.ts` → `content/intents/{social,contact,location,commerce}.ts` behind barrel.

---

## Phase 4 — react-doctor error classes (bugs, not style)

- [ ] `dangerous-html-sink` `DraftingQrLayerContent.tsx:148` — audit what HTML is injected (QR SVG markup?); sanitize or prove it's static-generated.
- [ ] `nextjs-no-side-effect-in-get-handler` `app/api/icons/search/route.ts:81` — move the side effect (likely cache-write/telemetry) to POST or `after()`.
- [ ] `effect-needs-cleanup` `hooks/use-fluid-hover.ts:370` — return cleanup for the subscription/timer.
- [ ] `no-ref-current-in-render` ×12 — family-drawer:92/97/250, reorder-list:48-52, drawer-nav-context:80-81, settings-segment-tabs:64. Pattern: move ref read into `useEffect`/event handler.
- [ ] `no-layout-property-animation` ×14 — select.tsx, family-drawer, switch, adaptive-slider: animate transform/opacity not width/height.
- [ ] `async-await-in-loop` ×7 — export/pipeline: `Promise.all` where independent (assets.ts:66, shader-snapshots.ts); keep serial only where order matters.
- [ ] `use-lazy-motion` ×4 — `LazyMotion`+`domAnimation` in fluid-hover-highlight, range-slider-inline, select, adaptive-slider.
- [ ] Fix the `GradientStop` duplicate export (fallow): keep canonical in `features/qr-code/model/state.ts`, re-export from fill-picker.

---

## Phase 5 — Folder boundaries

- [ ] `components/` audit: `components/ui/` = design system, stays. `components/{bento,landing,home,motion,watermelon,interior,unlumen-ui,effects}` = marketing/app features → `features/marketing/` (bento+landing+home) or nearest feature. `components/vendor/` stays (vendored).
- [ ] `hooks/` (7 files) → fold into owning feature (`use-fluid-hover` → wherever fluid-hover-highlight lives).
- [ ] `desktopnew-*` (13 files) → rename to `inspector-*` (they're already inside `inspector/` — drop the prefix entirely).
- [ ] `test-utils/` → verify it only holds test helpers (knip-clean, but check exports).
- [ ] After each move: `pnpm knip && pnpm typecheck` — knip is authoritative for this repo (AGENTS.md).

---

## Phase 6 — Guardrails (keep it clean permanently)

- [ ] ESLint `no-restricted-imports`: ban cross-feature deep imports (`features/*/internal` pattern or explicit per-feature rules). `app/` may only import feature barrels.
- [ ] `doctor.config.ts` in root; `npx react-doctor ci` or a `pnpm doctor` script; fail on NEW errors vs baseline JSON.
- [ ] `pnpm lint` ratchet: fix the ~30 non-vendor lint errors; add `packages/qr/vendor`, `.agents` to ignore list so signal is visible.
- [ ] Optional: jsdom/happy-dom env for the quarantined tests — unskip progressively.
- [ ] Update `AGENTS.md`: new structure map, vocabulary pointer to CONTEXT.md, react-doctor baseline procedure.

## Self-review notes

- Spec coverage: cleanup (P0,P5), complexity (P2,P3,P4), architecture (P5,P6), naming (P1). ✔
- Known risk: Phase 2 Task 2.8 touches ~176 importers — biggest single diff; keep it mechanical (rename only, no logic edits in the same commit).
- Deferred: `public/` asset audit, vendor (`packages/qr/vendor`, `components/vendor`) lint, visual/UX changes — all out of scope.
