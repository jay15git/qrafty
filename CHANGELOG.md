# Changelog

All notable changes to QRafty are documented here. The format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); dates are UTC.

## [Unreleased]

### Removed

- Second dead-code sweep: preview-session/drawer-resize producers, `kind: "shader"` canvas layers, canvas tool chain, unreachable `image-filter` card background mode (7 shader defs + ~776 generated preset LOC), vendored `ReactQRCode` component layer (~1k — emit-markup covers it), `platform-intents` unreachable payload machinery, `domLayers` export half, 40 dead dot-matrix presets, `loader.tsx` dead variants, `use-fluid-hover`, `family-drawer` wrapper, `image-cropper` dead prop surface.
- `next-themes` + localStorage theme channel + its pnpm patch — cookie is the single theme store (see `docs/adr/0003`).
- Brand-icon catalog trimmed 87 → 31 (kept only picker/detectable/landing ids).
- Hookless `"use client"` directives on ~15 files.

### Fixed

- Mobile family drawer: eliminated open/close jank — FLIP scaleY morphing
  replaced by direct height animation, stale `useMeasure` bounds no longer
  paint on reopen, height freezes during the exit slide, and the scroll frame
  is a proper `ScrollArea` with the cap applied at every level.
- Mobile layer toolbar stays visible with no selection and offers the
  background (card) tools — Add, Layout, Border, Effects — matching the
  desktop island.
