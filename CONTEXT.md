# Qrafty Domain Glossary

Canonical vocabulary for the codebase. New names MUST use these terms.
A glossary only — no implementation details (those live in AGENTS.md).

## Canvas

The design surface the user edits on: layers positioned over a QR scene.
Component: `CanvasSurface`. Data-slots: `canvas`, `canvas-*`.
Replaced (2026-09-24): `DraftingCanvas`, `DraftingPaneSurface`,
`desktop-compose-*`, `drafting-*`, `WorkspaceSurface`, `surface`.

## Layer

An object placed on the Canvas. Kinds: `qr`, `text`, `image`, `shape`,
`shader`, `group`, `card`. Type: `CanvasLayer`.
Replaces: `DraftingCanvasLayer`, `PaneLayer` when used generically.

## Workspace

The whole editing experience: Canvas + Settings + toolbar chrome.
A route-level container, not a single widget. The floating chrome overlay
component is `WorkspaceChrome` (was `FloatingToolbar`).

## Settings

All settings UI. The desktop settings panel (`DesktopSettingsPanel`,
`DesktopSettingsShell`) and the mobile option rail + drawer
(`MobileOptionRail`, `MobileSettingsDrawer`) are the same Settings domain
in different presentations. Directory: `features/shell/settings/`.
Replaced (2026-09-24): `inspector-*`, `Inspector*`, `desktopnew-*`,
`settings-sections` → `SettingsSections`, `FloatingToolbar settings`.

## Mode

The workspace renders in one of two modes: **desktop** or **mobile**.
Mode-specific chrome is prefixed `Desktop*` / `Mobile*`
(`DesktopSettingsPanel`, `MobileTopBar`, `MobileLayerToolbar`).
Shared canvas internals are unqualified (`canvas-*`, not
`desktop-canvas-*`).

## QR

The QR element and its style state (`QraftyState`). Parts: `module`
(dots), `eye` (finders), `frame` (quiet zone), `logo`.

## Fill

A paint value applied to a Layer or QR part: `solid` | `linear` |
`radial` | `image` | `pattern` | `shader`. Replaces the split
`cardFill` / `dotsColorMode` / `fill-picker` vocabulary — they are
all Fills on different targets.

## Scene

The composed background behind the QR: paper shader, wallpaper,
background Fill. Replaces: `scene composition`, `card background`.

## Export

Producing a downloadable artifact (SVG, PNG, video) from the Canvas.

## Banned in new names

- `New`, `desktopnew-`, `dn-` — the "new" UI shipped; it is THE Settings UI now.
- `Inspector`, `inspector-*` — say Settings.
- `Drafting`, `drafting-*` — say Canvas.
- `Pane` — retired entirely (was persistable documents; those are gone).
- `Surface` — say Canvas.
- `Compose`, `desktop-compose-*` — say Canvas.
- `Manager`, `Helper`, `Util` suffixes — name the domain concept.
- `Desktop`/`Mobile` as a prefix on shared canvas internals — only on
  mode-specific chrome.
