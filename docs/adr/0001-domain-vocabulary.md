# ADR 0001: Canonical domain vocabulary

## Status

Accepted — 2026-09-22

## Context

The codebase grew three overlapping vocabularies for the same concepts:

- The editing surface: `WorkspaceSurface`, `DraftingPaneSurface`, `canvas`, `surface`
- Settings UI: `desktopnew-*` (13 files), `settings-sections`, `FloatingToolbar`, `inspector/`
- "Pane" used for both persistable documents and generic panels/views
- The "new" desktop UI shipped but its `desktopnew-` prefix remains on 13 files,
  so every new contributor must learn a dead codename

Names became load-bearing lies: `WorkspaceSurface.tsx` is a 3,750-line component
that is actually the canvas; `desktopnew-fill-picker` is just the fill picker.

## Decision

Adopt the glossary in `CONTEXT.md` as the single vocabulary. Key renames:

| Old                                                     | New                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| `WorkspaceSurface` / `DraftingPaneSurface`              | `DraftingCanvas` (component), `features/workspace/canvas/` (dir)  |
| `desktopnew-*`                                          | `inspector-*` (files already inside `inspector/` drop the prefix) |
| `Pane`                                                  | kept — only for persistable workspace documents                   |
| `cardFill` / `dotsColorMode` / `fill-picker` vocabulary | `Fill` on a target (layer, qr part, background)                   |

Rules: new code uses glossary terms only; `New`/`Surface`/`Chrome`/`Manager`/
`Util`/`Helper` are banned in new identifiers; existing identifiers are renamed
when their file is next touched (boy-scout rule), not in a repo-wide sweep —
except `desktopnew-*`, which is renamed outright because the codename is dead.

## Consequences

- Renames ride along with the Phase 2–3 file splits; no rename-only megadiffs
  beyond the `desktopnew-*` strip.
- AGENTS.md paths that mention `desktopnew-*` / `WorkspaceSurface` get updated
  in the same PRs.
- Tests that name old components rename with them (`WorkspaceSurface.test.tsx`
  → `DraftingCanvas.test.tsx`).
