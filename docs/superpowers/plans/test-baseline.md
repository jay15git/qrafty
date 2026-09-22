# Test baseline — 2026-09-22 (updated after polyfill fix)

`pnpm test` before fix: 62 failed / 851 passed (913) across 11 files.
`pnpm test` after vitest.setup.ts: **14 failed / 899 passed** across 9 files.
After the features/ restructure (workspace→canvas, qr-code→qr, desktop-shell→shell):
**13 failed / 898 passed** across 9 files — same failures, new paths; theme-contract
dropped 3→2 after globals.css changes.

## Fix applied (Phase 0)

Created `vitest.setup.ts` (matchMedia, ResizeObserver, IntersectionObserver,
scrollIntoView polyfills) + `setupFiles` in vitest.config.ts. Tests run under
`@vitest-environment jsdom` — the failures were missing-API crashes, not
"needs a real browser". 48 tests rescued.

## Remaining 13 real failures (documented, not skipped)

- app/theme-contract.test.ts (2) — globals.css drifted from theme contract
  (`--font-heading: var(--font-display)` missing; warm drafting palette present).
  Either CSS regressed or the contract is stale — decide in Phase 5/6.
- packages/qr/src/scene/shaders/build-props.test.ts (1) — `preserveDrawingBuffer: true`
  no longer emitted for export quality.
- features/qr/assets/iconstack-curated-fetch.test.ts (1) — live-network fetch
  to iconstack API. Should be mocked or opt-in.
- features/canvas/components/Pane.test.tsx (4) — layout/style assertions
  (240px vs 288px preview, card backgroundColor transparent, drop-shadow missing).
- features/canvas/components/Canvas.test.tsx (2), WorkspaceSurface.test.tsx (1),
  features/shell/components/DesktopElementInspector.test.tsx (1),
  features/shell/inspector/fill-picker.test.tsx (2),
  landing-wheel-qr-assets.test.ts (1) — assertion mismatches; may be jsdom
  measurement quirks or real drift. Re-check after Phase 2 refactor.
