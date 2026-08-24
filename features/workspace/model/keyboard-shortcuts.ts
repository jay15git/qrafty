export const DRAFTING_KEYBOARD_SHORTCUT_GROUPS = [
  {
    title: "Canvas",
    shortcuts: [
      ["Arrow keys", "Nudge selected layer 1px"],
      ["Shift + Arrow", "Nudge selected layer 10px"],
      ["Delete / Backspace", "Delete selected layers"],
      ["Cmd/Ctrl + A", "Select all visible layers"],
      ["Esc", "Clear selection"],
    ],
  },
  {
    title: "Edit",
    shortcuts: [
      ["Cmd/Ctrl + Z", "Undo"],
      ["Cmd/Ctrl + Shift + Z", "Redo"],
      ["Cmd/Ctrl + Y", "Redo"],
      ["Cmd/Ctrl + C", "Copy selected layers"],
      ["Cmd/Ctrl + V", "Paste copied layers"],
      ["Cmd/Ctrl + D", "Duplicate selected layer"],
      ["Cmd/Ctrl + G", "Group selected layers"],
      ["Cmd/Ctrl + Shift + G", "Ungroup selected groups"],
    ],
  },
  {
    title: "Layers",
    shortcuts: [
      ["Cmd/Ctrl + [", "Send backward"],
      ["Cmd/Ctrl + ]", "Bring forward"],
      ["Cmd/Ctrl + Shift + [", "Send to back"],
      ["Cmd/Ctrl + Shift + ]", "Bring to front"],
      ["Cmd/Ctrl + Shift + H", "Hide/show selected layers"],
    ],
  },
] as const
