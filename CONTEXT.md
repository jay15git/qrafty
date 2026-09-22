# Qrafty Domain Glossary

Canonical vocabulary for the codebase. New names MUST use these terms.
A glossary only — no implementation details (those live in AGENTS.md).

## Canvas

The design surface the user edits on: layers positioned over a QR scene.
Replaces: `WorkspaceSurface`, `DraftingPaneSurface`, `surface`.

## Layer

An object placed on the Canvas. Kinds: `qr`, `text`, `image`, `shape`,
`shader`, `group`, `card`. Replaces: `DraftingCanvasLayer`, `PaneLayer`
when used generically.

## Workspace

The whole editing experience: Canvas + Inspector + toolbar chrome.
A route-level container, not a single widget.

## Pane

A persistable Workspace document/tab the user can switch between.
A real domain object — keep the term, use it only for documents,
never as a synonym for "panel" or "view".

## Inspector

All settings UI: the desktop settings panel AND the mobile settings
rail + drawer are the same Inspector in different presentations.
Replaces: `desktopnew-*`, `settings-sections`, `FloatingToolbar settings`.

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

- `New`, `desktopnew-` — the "new" UI shipped; it is THE Inspector now.
- `Surface` — say Canvas.
- `Chrome` — say what it is (toolbar, rail, top bar).
- `Manager`, `Helper`, `Util` suffixes — name the domain concept.
- `Desktop` as a size qualifier — the shell is `desktop-shell`; inside it,
  names are unqualified (`inspector-*`, not `desktop-inspector-*`).
