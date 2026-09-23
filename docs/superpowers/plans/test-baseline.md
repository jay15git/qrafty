# Test baseline — 2026-09-23

`pnpm test`: **16 failed / 925 passed (941)** across 7 files.

Recorded after two suites that had been failing at *collection* time were repaired
(see "Fixed in this pass"). Before that repair the suite reported 16 failed / 896
passed (912) — the same 16 failures, plus two files that contributed no tests at all.

## Fixed in this pass

Both were `Error: Cannot find module '.../next/link' imported from glimm/dist/next.js`
— Node's native ESM loader rejects the extensionless subpath because `next` ships no
`exports` map. `glimm` is now inlined in `vitest.config.ts` so Vite resolves it.

- `features/canvas/components/WorkspaceSurface.test.tsx` — 21 tests recovered.
- `features/shell/components/DesktopElementInspector.test.tsx` — 8 tests recovered.

Repairing them surfaced stale assertions from the top-toolbar restructure
(`desktop-compose-toolbar` / `desktop-history-actions` / `desktop-document-toolbar`
were removed; undo/redo moved to `desktop-settings-panel-header`, shortcuts and the
theme toggle to `desktop-settings-panel-footer`; text/QR insertion moved behind
`desktop-insert-trigger`; the canvas QR renderer is now `buildDraftingQraftyMarkup`,
not `buildDashboardQrNodePayload`). Those tests were updated to the current contract.

## Remaining 16 failures (documented, not skipped)

### Real drift — the code or the contract is wrong

- `app/theme-contract.test.ts` (2) — `globals.css` no longer declares
  `--font-heading: var(--font-display)` or `--primary: oklch(0.18 0 0)`.
  Either the CSS regressed or the contract is stale. Decide, then fix one side.
- `packages/qr/src/scene/shaders/build-props.test.ts` (1) — `preserveDrawingBuffer: true`
  is no longer emitted for `quality: "export"`. Export quality regressed.
- `features/canvas/components/Pane.test.tsx` (1 of 7) — preview width is `240px`,
  the test expects `288px`. Sizing rule changed or the test is stale.
- `features/shell/inspector/fill-picker.test.tsx` (2) — asserts the popover class list
  contains `h-12`; the class is gone. Pins a class string, not behaviour — rewrite or drop.

### Environment / harness

- `features/canvas/components/Pane.test.tsx` (6 of 7) — jsdom does not resolve
  class-derived computed styles, so inline-style and `drop-shadow` assertions read `''`,
  and `querySelector` misses nodes that only exist after layout.
- `features/canvas/components/Canvas.test.tsx` (2) — same class: `''` instead of
  `120px` / `translate3d(40px, 25px, 0)`.

### Test hygiene

- `features/qr/assets/iconstack-curated-fetch.test.ts` (1) — performs a live network
  fetch to the iconstack API. Mock it or make it opt-in.
- `features/marketing/landing/landing-wheel-qr-assets.test.ts` (1) — baked SVG assets
  no longer match the generator. Re-run `pnpm render:landing-wheel`.

## Other baselines (same run)

- `pnpm typecheck` — clean.
- `pnpm knip` — clean.
- `pnpm exec fallow dead-code` — clean. `pnpm check` exits 0.
- `pnpm lint` — 332 problems (106 errors, 226 warnings). Mostly `react-hooks/*` from
  `eslint-config-next` 16 in client components; `app/` is lint-clean.
- `npx react-doctor . --json` — **83/100** ("Needs work"), 2 errors + 2 warnings in 4 files
  (`react-doctor-baseline.json`):
  - error `no-layout-property-animation` — `DesktopSettingsToolbarShell.tsx:130` (width),
    `unlumen-ui/motion-faqs-accordion.tsx:120` (height)
  - warning `no-high-complexity-react-function` — `DesktopAppearanceIsland.tsx:61`
    (`useDesktopIslandItems`, cyclomatic 18), `MobileLayerToolbar.tsx:228`
    (`MobileLayerPanelTools`, cyclomatic 29)
