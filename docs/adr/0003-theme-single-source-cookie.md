# ADR 0003: Theme persistence is the cookie only — next-themes removed

## Status

Accepted — 2026-09-29. Supersedes the `next-themes` decision noted in ADR 0002.

## Context

The theme stack had six overlapping channels: `THEME_COOKIE` (server-read on
`/design`), `localStorage` (`qrafty:studio-theme`, written by next-themes),
next-themes React context, `SettingsThemeContext`, `data-shell-theme`, and
`.dark` classes on both `<html>` and the workspace section. `Workspace.tsx`
re-seeded next-themes on mount because it distrusted next-themes' default-light
reading when no localStorage value existed — a workaround for two stores
disagreeing. next-themes also required a local patch (`patches/next-themes@0.4.6.patch`).

## Decision

The `qrafty-desktop-theme` **cookie is the single persistence channel**:

- `app/design/page.tsx` (server) reads the cookie → passes `initialTheme` to
  `Workspace`.
- `app/layout.tsx` inlines `THEME_INIT_SCRIPT` (`features/shell/model/theme.ts`)
  in `<body>`; it reads the cookie and toggles `documentElement.classList.dark`
  before paint, so `dark:` variants and `html.dark` token blocks match SSR.
- `Workspace` owns `useState(initialTheme)`; `onThemeChange` updates state,
  toggles `html.dark`, and writes the cookie via `applyThemeToDom`.
- `SettingsThemeContext` + `data-theme`/`data-shell-theme` attributes stay —
  they scope the design-system surfaces and portal targets, not persistence.

Removed: `next-themes` dependency, `ThemeProvider`, `THEME_STORAGE_KEY` /
localStorage channel, the pnpm patch.

## Consequences

- One store, one writer, no re-seed effect.
- Theme changes require no JS before first paint (script + SSR cookie agree).
- Cross-tab sync is lost (cookie isn't reactive); acceptable — the workspace
  was single-tab in practice and a storage event added a second reader anyway.
