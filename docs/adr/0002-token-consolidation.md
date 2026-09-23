# ADR 0002: Consolidate inspector tokens onto the shared `--dn-*` palette

## Status

Accepted — 2026-09-24

## Context

The Inspector grew up as the `desktopnew-*` prototype with its own token layer:
each surface (`.desktopnew-root`, popovers, the floating element inspector, the
mobile rail/drawer) re-declared the same palette under slightly different names,
and light/dark values were scattered across per-surface blocks. Adding or
retuning a color meant editing the same hex in several places, and hardcoded
hexes had leaked into component CSS outside any token.

Meanwhile `app/globals.css` had no shared z-index or popover-sizing scale — each
overlay picked its own `z-index` and width.

## Decision

Collapse the inspector token layer into **one theme-split palette** in
`features/shell/inspector/inspector.css`:

- `--dn-*` tokens (`--dn-bg`, `--dn-surface`, `--dn-control`, `--dn-fg`,
  `--dn-muted`, `--dn-line`, `--dn-mass`, …) are declared **once**, with light
  values under `.inspector-root[data-theme="light"]` and dark values under
  `.inspector-root:not([data-theme="light"])` / `[data-theme="dark"]` — the
  standalone Inspector still defaults to dark.
- Every inspector surface keeps consuming its **legacy scoped names**
  (`--bg`, `--fg`, `--line`, `--settings-control`, `--type-*`, `--radius-*`,
  `--space-*`, `--settings-*`), which are now aliases that map onto `--dn-*`.
  Component CSS did not have to change.
- `.desktopnew-root` is renamed `.inspector-root` (ADR 0001 vocabulary).
- Shared chrome concerns moved to `app/globals.css`: a `--z-*` scale
  (`--z-chrome` … `--z-popover-raised`), popover sizing
  (`--popover-width`, `--popover-width-lg`, `--popover-width-fill`),
  `--inspector-preview-col`, and `--style-preview-*`.
- Hardcoded hexes outside token declarations were eliminated in favor of the
  palette; the mobile rail's button fill is `--settings-rail-button-bg`
  (`#ffffff` light / `#161616` dark on `[data-mobile-inspector]`).

## Consequences

- One place to retune the inspector palette per theme; surfaces can no longer
  drift apart.
- New inspector code should reach for the scoped aliases (`--fg`, `--line`,
  `--settings-control`) — they stay correct on every surface and theme. Use
  `--dn-*` only when declaring or overriding the palette itself.
- z-index and popover width are no longer freehand: pick from the `--z-*` /
  `--popover-*` scale in `globals.css`.
- The rename means any out-of-tree CSS targeting `.desktopnew-root` is dead;
  grep shows zero remaining references.
