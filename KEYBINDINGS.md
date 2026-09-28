# Keyboard shortcuts

All workspace (`/design`) shortcuts. `Cmd` = macOS, `Ctrl` elsewhere.
Canonical source: `DRAFTING_KEYBOARD_SHORTCUT_GROUPS` in
`features/canvas/model/keyboard-shortcuts.ts` — update that file and this
table together. The same list renders in the in-app shortcuts popover.

## Canvas

| Shortcut           | Action                    |
| ------------------ | ------------------------- |
| Arrow keys         | Nudge selected layer 1px  |
| Shift + Arrow      | Nudge selected layer 10px |
| Delete / Backspace | Delete selected layers    |
| Cmd/Ctrl + A       | Select all visible layers |
| Esc                | Clear selection           |

## Edit

| Shortcut             | Action                   |
| -------------------- | ------------------------ |
| Cmd/Ctrl + Z         | Undo                     |
| Cmd/Ctrl + Shift + Z | Redo                     |
| Cmd/Ctrl + Y         | Redo                     |
| Cmd/Ctrl + C         | Copy selected layers     |
| Cmd/Ctrl + V         | Paste copied layers      |
| Cmd/Ctrl + D         | Duplicate selected layer |
| Cmd/Ctrl + G         | Group selected layers    |
| Cmd/Ctrl + Shift + G | Ungroup selected groups  |

## Layer order

| Shortcut             | Action         |
| -------------------- | -------------- |
| Cmd/Ctrl + [         | Send backward  |
| Cmd/Ctrl + ]         | Bring forward  |
| Cmd/Ctrl + Shift + [ | Send to back   |
| Cmd/Ctrl + Shift + ] | Bring to front |

Shortcuts are ignored while a text input, textarea, or editable element has
focus — text editing keeps its own undo/copy/paste.
