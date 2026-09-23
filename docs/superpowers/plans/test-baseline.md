# Test baseline — 2026-09-23

`pnpm test`: **942 passed / 0 failed (942)** across 126 files.

The suite is green. This file previously recorded 16 known failures; all are
resolved. What each one was, and which side was wrong:

## Resolved

### Real drift — the code or the contract was wrong

- `app/theme-contract.test.ts` (2) — asserted `--font-heading` and `--primary`
  in `globals.css`. Both were dropped deliberately in `d99b1885` when the file
  was rebuilt around the scoped `--surface-*` token system. The test was stale;
  it now asserts the current contract (neutral palette, no warm drafting
  tokens, workspace tokens scoped to `[data-slot="desktop-workspace"]`).
- `packages/qr/src/scene/shaders/build-props.test.ts` (1) — expected a
  top-level `preserveDrawingBuffer`. The library prop is nested
  (`webGlContextAttributes`), and the source emits it correctly. Test was
  stale; it now asserts the real prop shape.
- `features/canvas/components/Pane.test.tsx` (1 of 7) — preview width. `f4702056`
  deliberately changed `getQrRenderedDimensions` to return the raw state size.
  Test was stale.
- `features/shell/inspector/fill-picker.test.tsx` (2) — asserted
  `[data-slot="gradient-area"]`, a slot that never existed. The real slot is
  `gradient-bar`. Test was stale.

### Test hygiene

- `features/qr/assets/iconstack-curated-fetch.test.ts` (1) — performed a live
  network fetch. Now stubs `fetch` and asserts the request/parse contract.
- `features/marketing/landing/landing-wheel-qr-assets.test.ts` (1) — baked SVG
  assets had not been regenerated after later rendering changes. Regenerated
  with `pnpm render:landing-wheel`; QR module geometry verified byte-identical.

### Harness / jsdom

- `features/canvas/components/Pane.test.tsx` (6 of 7) and
  `features/canvas/components/Canvas.test.tsx` (2) — assertions on values jsdom
  cannot resolve (class-derived computed styles, floating-ui positioning) and
  on class strings that had deliberately changed (`h-12` → `h-9`). Rewritten to
  assert observable behavior, or dropped where they defended nothing.

## Other baselines

- `pnpm typecheck` — clean.
- `pnpm knip` — clean.
- `pnpm exec fallow dead-code` — clean.
- `pnpm lint` — clean (0 errors).
- `npx react-doctor . --json` — see `react-doctor-baseline.json`.
